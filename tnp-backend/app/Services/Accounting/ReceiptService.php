<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Receipt;
use App\Services\Accounting\Receipt\Calculator;
use App\Services\Accounting\Receipt\CreationService;
use App\Services\Accounting\Receipt\ManagementService;
use App\Services\Accounting\Receipt\MediaService;
use App\Services\Accounting\Receipt\StatusService as ReceiptStatusService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Facade over the Receipt sub-services. Public methods delegate to the
 * appropriate specialised service (Calculator / Creation / Management /
 * Status / Media). Cross-doc effects (e.g. rolling up receipt payment to
 * the linked invoice) are orchestrated here, not inside sub-services.
 *
 * History (M4 split):
 *   - Calculator         — pure calc + data shape helpers
 *   - CreationService    — create + createFromPayment
 *   - ManagementService  — getList + update
 *   - StatusService      — approve (legacy reject/submit throw)
 *   - MediaService       — uploadEvidence
 *
 * Removed: generatePdf() (M6 — was a text-dummy; real receipt PDFs are
 * served from the invoice-side routes via ReceiptPdfMasterService).
 */
class ReceiptService
{
    public function __construct(
        protected AutofillService $autofillService,
        private CreationService $creationService,
        private ManagementService $managementService,
        private ReceiptStatusService $statusService,
        private MediaService $mediaService,
        private Calculator $calculator,
        private InvoiceService $invoiceService,
    ) {}

    /**
     * @param  array<string, mixed>  $paymentData
     */
    public function createFromPayment($invoiceId, array $paymentData, ?string $createdBy = null): Receipt
    {
        return $this->creationService->createFromPayment((string) $invoiceId, $paymentData, $createdBy);
    }

    /**
     * @param  array<string, mixed>  $receiptData
     */
    public function create(array $receiptData, ?string $createdBy = null): Receipt
    {
        return $this->creationService->create($receiptData, $createdBy);
    }

    /**
     * @param  array<string, mixed>  $updateData
     */
    public function update($receiptId, array $updateData, ?string $updatedBy = null): Receipt
    {
        return $this->managementService->update((string) $receiptId, $updateData, $updatedBy);
    }

    public function submit($receiptId, ?string $submittedBy = null): Receipt
    {
        Receipt::findOrFail($receiptId);

        throw new \Exception('Receipt submit workflow is not available with the legacy receipt schema');
    }

    public function approve($receiptId, ?string $approvedBy = null, ?string $notes = null): Receipt
    {
        // Status transition + DocumentHistory log handled by StatusService.
        $receipt = $this->statusService->approve((string) $receiptId, $approvedBy, $notes);

        // Cross-doc side effect (M3.1): InvoiceService owns invoice state
        // transitions, so we ask it to roll up the payment.
        if ($receipt->invoice_id) {
            $this->invoiceService->applyReceiptPayment(
                $receipt->invoice_id,
                (float) $receipt->total_amount,
                $approvedBy
            );
        }

        return $receipt;
    }

    public function reject($receiptId, $reason, ?string $rejectedBy = null): Receipt
    {
        Receipt::findOrFail($receiptId);

        throw new \Exception('Receipt reject workflow is not available with the legacy receipt schema');
    }

    /**
     * @param  array<int, \Illuminate\Http\UploadedFile>  $files
     * @return array<string, mixed>
     */
    public function uploadEvidence($receiptId, array $files, ?string $description = null, ?string $uploadedBy = null): array
    {
        return $this->mediaService->uploadEvidence((string) $receiptId, $files, $description, $uploadedBy);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function getList(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->managementService->getList($filters, $perPage);
    }
}
