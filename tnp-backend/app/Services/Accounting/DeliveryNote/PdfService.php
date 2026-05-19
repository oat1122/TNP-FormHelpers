<?php

namespace App\Services\Accounting\DeliveryNote;

use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\DeliveryNoteItem;
use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Invoice;
use App\Services\Accounting\Pdf\DeliveryNotePdfMasterService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Delivery-note PDF orchestration: generate / stream / multi-header bundle
 * (with optional ZIP). Renders are delegated to DeliveryNotePdfMasterService
 * (mPDF) which is constructor-injected (M2 pattern).
 */
class PdfService
{
    public function __construct(
        private DeliveryNotePdfMasterService $pdfMasterService,
    ) {}

    /**
     * Render a single delivery-note PDF and return its metadata.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function generatePdf(string $deliveryNoteId, array $options = []): array
    {
        try {
            $deliveryNote = DeliveryNote::with([
                'company', 'receipt', 'customer', 'creator', 'manager', 'deliveryPerson', 'items',
            ])->findOrFail($deliveryNoteId);

            $result = $this->pdfMasterService->generatePdf($deliveryNote, $options);

            // History log is best-effort — never block PDF return on a log
            // failure (the file was already produced successfully).
            try {
                DocumentHistory::logAction(
                    'delivery_note',
                    $deliveryNote->id,
                    'generate_pdf',
                    auth()->user()->user_uuid ?? null,
                    'สร้าง PDF (mPDF): '.$result['filename'].' ('.$result['type'].')'
                );
            } catch (\Throwable $logE) {
                Log::warning('Invoice\\DeliveryNote\\PdfService::generatePdf history log failed: '.$logE->getMessage());
            }

            return [
                'url' => $result['url'],
                'path' => $result['path'],
                'filename' => $result['filename'],
                'size' => $result['size'],
                'engine' => 'mPDF',
                'type' => $result['type'],
            ];

        } catch (\Exception $e) {
            Log::error('DeliveryNote\\PdfService::generatePdf error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Render one or more PDFs (multi-header) and bundle into a ZIP when more
     * than one. Single-header path returns mode='single' shape.
     *
     * @param  array<int, string>  $headerTypes
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function generatePdfBundle(string $deliveryNoteId, array $headerTypes = [], array $options = []): array
    {
        try {
            $deliveryNote = DeliveryNote::with([
                'company', 'receipt', 'customer', 'creator', 'manager', 'deliveryPerson', 'items',
            ])->findOrFail($deliveryNoteId);

            if (empty($headerTypes)) {
                $headerTypes = ['ต้นฉบับ'];
            }

            $files = [];
            foreach ($headerTypes as $headerType) {
                $pdfOptions = array_merge($options, ['document_header_type' => $headerType]);
                $files[] = $this->pdfMasterService->generatePdf($deliveryNote, $pdfOptions);
            }

            if (count($files) === 1) {
                return [
                    'mode' => 'single',
                    'file' => $files[0],
                ];
            }

            $zipResult = $this->createZipFromFiles($deliveryNote, $files, $options);

            return [
                'mode' => 'zip',
                'zip' => $zipResult,
                'files' => $files,
            ];

        } catch (\Exception $e) {
            Log::error('DeliveryNote\\PdfService::generatePdfBundle error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Stream the rendered PDF for inline display / download.
     *
     * @param  array<string, mixed>  $options
     */
    public function streamPdf(string $deliveryNoteId, array $options = []): Response
    {
        try {
            $deliveryNote = DeliveryNote::with([
                'company', 'receipt', 'customer', 'creator', 'manager', 'deliveryPerson', 'items',
            ])->findOrFail($deliveryNoteId);

            return $this->pdfMasterService->streamPdf($deliveryNote, $options);

        } catch (\Exception $e) {
            Log::error('DeliveryNote\\PdfService::streamPdf error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Stream an ad-hoc delivery-note PDF rendered from invoice data — used when
     * the invoice already has payment evidence uploaded but the customer hasn't
     * issued a formal DeliveryNote record yet. No DB row is persisted.
     *
     * Field mapping (Invoice → DeliveryNote):
     *   company_id, customer_*, customer_snapshot, work_name, notes,
     *   invoice_id, invoice_number; status forced to "shipping" so the PDF
     *   renders as final (no PREVIEW watermark).
     *
     * @param  array<string, mixed>  $options
     */
    public function streamPdfFromInvoice(string $invoiceId, array $options = []): Response
    {
        try {
            $invoice = Invoice::with([
                'company', 'customer', 'creator', 'manager', 'items', 'quotation',
            ])->findOrFail($invoiceId);

            $deliveryNote = $this->buildTransientDeliveryNoteFromInvoice($invoice);

            // mPDF emits PHP E_WARNING ("Uninitialized string offset 0") while
            // resolving CSS custom properties (var(--c-border-light)) but still
            // produces a valid PDF. Laravel's HandleExceptions otherwise promotes
            // those warnings to a 500 response. Install a scoped error handler
            // that swallows mPDF warnings; the PDF output itself is unaffected.
            set_error_handler(function ($severity, $message, $file) {
                if ($severity !== E_WARNING && $severity !== E_NOTICE) {
                    return false;
                }
                if (str_contains($file, 'vendor/mpdf/mpdf') || str_contains($file, 'vendor\\mpdf\\mpdf')) {
                    Log::debug('mPDF warning suppressed', ['message' => $message, 'file' => $file]);

                    return true;
                }

                return false;
            }, E_WARNING | E_NOTICE);

            try {
                return $this->pdfMasterService->streamPdf($deliveryNote, $options);
            } finally {
                restore_error_handler();
            }

        } catch (\Exception $e) {
            Log::error('DeliveryNote\\PdfService::streamPdfFromInvoice error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Derive the delivery-note document number from the parent invoice number
     * so users can pair them at a glance. Examples:
     *   INVB202605-0002 → DN202605-0002
     *   INV202605-0042  → DN202605-0042
     * Falls back to a UUID-suffix slug when the invoice number doesn't match
     * the expected `INV[letters]YYYYMM-####` shape.
     */
    private function deriveDeliveryNoteNumber(?string $invoiceNumber, string $invoiceId): string
    {
        if (is_string($invoiceNumber) && $invoiceNumber !== ''
            && preg_match('/^INV[A-Z]*(\d{6}-\d+)$/i', $invoiceNumber, $m)
        ) {
            return 'DN'.$m[1];
        }

        return 'DN-PREVIEW-'.substr($invoiceId, 0, 8);
    }

    /**
     * Build an in-memory DeliveryNote (with item collection + relations) from
     * an invoice. Intentionally NOT persisted — caller is responsible for
     * passing this object straight to the PDF master service.
     */
    private function buildTransientDeliveryNoteFromInvoice(Invoice $invoice): DeliveryNote
    {
        $dn = new DeliveryNote;
        // ephemeral id so any internal logic that reads ->id has a value;
        // never written to DB.
        $dn->id = (string) Str::uuid();
        $dn->company_id = $invoice->company_id;
        $dn->invoice_id = $invoice->id;
        $dn->invoice_number = $invoice->number;
        $dn->number = $this->deriveDeliveryNoteNumber($invoice->number, $invoice->id);
        $dn->customer_id = $invoice->customer_id;
        $dn->customer_data_source = $invoice->customer_data_source;
        $dn->customer_company = $invoice->customer_company;
        $dn->customer_address = $invoice->customer_address;
        $dn->customer_zip_code = $invoice->customer_zip_code;
        $dn->customer_tel_1 = $invoice->customer_tel_1;
        $dn->customer_tax_id = $invoice->customer_tax_id;
        $dn->customer_firstname = $invoice->customer_firstname;
        $dn->customer_lastname = $invoice->customer_lastname;
        // Skip customer_snapshot: invoice rows commonly store the value
        // double-encoded as a JSON string of a JSON string, which the
        // DeliveryNote extractor cannot parse cleanly. Leaving it null forces
        // the extractor to fall back to the master_customers relation, which
        // is the canonical source anyway.
        $dn->customer_snapshot = null;
        // Intentionally skip work_name so the ad-hoc DN PDF doesn't render the
        // "ชื่องาน:" header row — invoice rows already speak for themselves.
        $dn->work_name = null;
        $dn->notes = $invoice->notes;
        // status=shipping marks the doc as final (per
        // DeliveryNotePdfMasterService::buildViewData) so PDF renders without
        // a "PREVIEW" watermark.
        $dn->status = 'shipping';
        $dn->delivery_method = 'self';
        // Match the senderCompany fallback chain in the header partial — leaving
        // sender_company_id null forces a relation query on an unsaved model
        // which behaves oddly on some Eloquent versions.
        $dn->sender_company_id = $invoice->company_id;
        $dn->created_by = $invoice->created_by;
        // setAttribute bypasses the DeliveryNote property docblock typing
        // (which lists manage_by as int|null); the column actually stores a
        // user UUID string.
        $dn->setAttribute('manage_by', $invoice->inv_manage_by);
        $dn->created_at = $invoice->created_at;
        $dn->updated_at = $invoice->updated_at;

        $items = new Collection;
        foreach ($invoice->items as $idx => $invoiceItem) {
            $dni = new DeliveryNoteItem;
            $dni->id = (string) Str::uuid();
            $dni->delivery_note_id = $dn->id;
            $dni->invoice_id = $invoice->id;
            $dni->invoice_item_id = $invoiceItem->id;
            $dni->sequence_order = $invoiceItem->sequence_order ?? ($idx + 1);
            $dni->item_name = $invoiceItem->item_name;
            // Invoice items carry their line description in `notes`; DN items
            // expose `item_description` on the PDF table, so route the value
            // through the latter to keep the note visible on delivery slips.
            $dni->item_description = $invoiceItem->item_description
                ?: ($invoiceItem->notes ?: null);
            $dni->pattern = $invoiceItem->pattern;
            $dni->fabric_type = $invoiceItem->fabric_type;
            $dni->color = $invoiceItem->color;
            $dni->size = $invoiceItem->size;
            $dni->unit = $invoiceItem->unit ?? 'ชิ้น';
            $dni->delivered_quantity = $invoiceItem->quantity ?? 0;
            // 'ready' matches the DeliveryNoteItem status enum and signals
            // an item that is prepared to ship.
            $dni->status = 'ready';
            $items->push($dni);
        }

        // setRelation skips the DB round-trip; master service calls
        // ->loadMissing() but Eloquent treats already-loaded relations as a
        // no-op, so the transient items are preserved.
        $dn->setRelation('items', $items);
        $dn->setRelation('company', $invoice->company);
        $dn->setRelation('customer', $invoice->customer);
        // Map "ผู้ส่ง" to the sales person (inv_manage_by / manager) instead of
        // the user who issued the invoice (created_by / creator) — the
        // delivery-note header reads $deliveryNote->creator for the "ผู้ส่ง"
        // label, so we point creator at the manager for the ad-hoc flow.
        $dn->setRelation('creator', $invoice->manager ?? $invoice->creator);
        $dn->setRelation('manager', $invoice->manager);
        $dn->setRelation('deliveryPerson', null);
        $dn->setRelation('receipt', null);
        // Pre-populate senderCompany + invoice relations so the master service
        // never has to issue a query on this unsaved model — the relation
        // closures on an unsaved DeliveryNote can produce empty results that
        // mPDF later reads as malformed CSS values (#16724 _setBorderLine).
        $dn->setRelation('senderCompany', $invoice->company);
        $dn->setRelation('invoice', $invoice);

        return $dn;
    }

    /**
     * @param  array<int, array<string, mixed>>  $files
     * @param  array<string, mixed>  $options
     * @return array{path: string, url: string, filename: string, size: int}
     */
    private function createZipFromFiles(DeliveryNote $deliveryNote, array $files, array $options = []): array
    {
        $zipDir = storage_path('app/public/pdfs/delivery-notes/zips');
        if (! is_dir($zipDir)) {
            @mkdir($zipDir, 0755, true);
        }

        $zipName = sprintf(
            'delivery-note-%s-bundle-%s.zip',
            $deliveryNote->number ?? $deliveryNote->id,
            date('YmdHis')
        );

        $zipPath = $zipDir.DIRECTORY_SEPARATOR.$zipName;

        $zip = new \ZipArchive;
        if ($zip->open($zipPath, \ZipArchive::CREATE) !== true) {
            throw new \Exception('ไม่สามารถสร้างไฟล์ ZIP ได้');
        }

        foreach ($files as $file) {
            if (is_file($file['path'])) {
                $zip->addFile($file['path'], $file['filename']);
            }
        }

        $zip->close();

        $relativePath = str_replace(storage_path('app/public/'), '', $zipPath);
        $relativePath = str_replace('\\', '/', $relativePath);
        $zipUrl = url('storage/'.$relativePath);
        $zipSize = is_file($zipPath) ? filesize($zipPath) : 0;

        return [
            'path' => str_replace('\\', '/', $zipPath),
            'url' => $zipUrl,
            'filename' => $zipName,
            'size' => $zipSize,
        ];
    }
}
