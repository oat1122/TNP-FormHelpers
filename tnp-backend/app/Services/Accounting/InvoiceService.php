<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Invoice;
use App\Models\Accounting\Quotation;
use App\Services\Accounting\Invoice\Calculator as InvoiceCalculator;
use App\Services\Accounting\Invoice\CreationService as InvoiceCreationService;
use App\Services\Accounting\Invoice\ManagementService as InvoiceManagementService;
use App\Services\Accounting\Invoice\MediaService as InvoiceMediaService;
use App\Services\Accounting\Invoice\PdfService as InvoicePdfService;
use App\Services\Accounting\Invoice\StatusService as InvoiceStatusService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Facade over the Invoice sub-services. Public methods delegate to the
 * specialised service that owns the concern. The split (M5):
 *
 *   - Calculator         — pure calc + UI-state derivation
 *   - CreationService    — create + createFromQuotation (with item copy)
 *   - ManagementService  — update + getList + getQuotationsAwaiting + deposit mode
 *   - StatusService      — submit / approve / reject (× sides) +
 *                          sendBack / sendToCustomer / recordPayment /
 *                          applyReceiptPayment / revertToDraft
 *   - MediaService       — uploadEvidence + uploadEvidenceByMode
 *   - PdfService         — generatePdf / streamPdf / bundle / system status
 *
 * Public method shape is preserved 1-to-1 with the pre-split surface so
 * controllers / external callers do not need changes.
 */
class InvoiceService
{
    public function __construct(
        protected AutofillService $autofillService,
        private InvoiceCalculator $calculator,
        private InvoiceMediaService $mediaService,
        private InvoicePdfService $pdfService,
        private InvoiceCreationService $creationService,
        private InvoiceManagementService $managementService,
        private InvoiceStatusService $statusService,
    ) {}

    // ---------------------------------------------------------------------
    // Calculator passthroughs
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function calculateBeforeVatFields(array $data): array
    {
        return $this->calculator->calculateBeforeVatFields($data);
    }

    /**
     * @return array<string, mixed>
     */
    public function getInvoiceWithUiStatus(Invoice $invoice): array
    {
        return $this->calculator->getInvoiceWithUiStatus($invoice);
    }

    // ---------------------------------------------------------------------
    // CreationService passthroughs
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $invoiceData
     */
    public function create(array $invoiceData, ?string $createdBy = null): Invoice
    {
        return $this->creationService->create($invoiceData, $createdBy);
    }

    /**
     * @param  array<string, mixed>  $invoiceData
     */
    public function createFromQuotation(string $quotationId, array $invoiceData, ?string $createdBy = null): Invoice
    {
        return $this->creationService->createFromQuotation($quotationId, $invoiceData, $createdBy);
    }

    // ---------------------------------------------------------------------
    // ManagementService passthroughs
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $updateData
     */
    public function update(string $invoiceId, array $updateData, ?string $updatedBy = null): Invoice
    {
        return $this->managementService->update($invoiceId, $updateData, $updatedBy);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<Invoice>
     */
    public function getList(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->managementService->getList($filters, $perPage);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<Quotation>
     */
    public function getQuotationsAwaiting(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->managementService->getQuotationsAwaiting($filters, $perPage);
    }

    public function updateDepositDisplayOrder(string $invoiceId, string $order, ?string $updatedBy = null): Invoice
    {
        return $this->managementService->updateDepositDisplayOrder($invoiceId, $order, $updatedBy);
    }

    public function setDepositMode(string $invoiceId, string $mode, ?string $updatedBy = null): Invoice
    {
        return $this->managementService->setDepositMode($invoiceId, $mode, $updatedBy);
    }

    // ---------------------------------------------------------------------
    // StatusService passthroughs
    // ---------------------------------------------------------------------

    public function applyReceiptPayment(string $invoiceId, float $paymentAmount, ?string $actorId = null): void
    {
        $this->statusService->applyReceiptPayment($invoiceId, $paymentAmount, $actorId);
    }

    public function submit(string $invoiceId, ?string $submittedBy = null): Invoice
    {
        return $this->statusService->submit($invoiceId, $submittedBy);
    }

    public function submitForSide(string $invoiceId, string $side, ?string $submittedBy = null): Invoice
    {
        return $this->statusService->submitForSide($invoiceId, $side, $submittedBy);
    }

    public function submitBefore(string $invoiceId, ?string $submittedBy = null): Invoice
    {
        return $this->statusService->submitForSide($invoiceId, 'before', $submittedBy);
    }

    public function submitAfter(string $invoiceId, ?string $submittedBy = null): Invoice
    {
        return $this->statusService->submitForSide($invoiceId, 'after', $submittedBy);
    }

    public function submitAfterDeposit(string $invoiceId, ?string $submittedBy = null, ?string $notes = null): Invoice
    {
        return $this->statusService->submitAfterDeposit($invoiceId, $submittedBy, $notes);
    }

    public function approve(string $invoiceId, ?string $approvedBy = null, ?string $notes = null): Invoice
    {
        return $this->statusService->approve($invoiceId, $approvedBy, $notes);
    }

    public function approveForSide(string $invoiceId, string $side, ?string $approvedBy = null, ?string $notes = null): Invoice
    {
        return $this->statusService->approveForSide($invoiceId, $side, $approvedBy, $notes);
    }

    public function approveBefore(string $invoiceId, ?string $approvedBy = null, ?string $notes = null): Invoice
    {
        return $this->statusService->approveForSide($invoiceId, 'before', $approvedBy, $notes);
    }

    public function approveAfter(string $invoiceId, ?string $approvedBy = null, ?string $notes = null): Invoice
    {
        return $this->statusService->approveForSide($invoiceId, 'after', $approvedBy, $notes);
    }

    public function approveAfterDeposit(string $invoiceId, ?string $approvedBy = null, ?string $notes = null): Invoice
    {
        return $this->statusService->approveAfterDeposit($invoiceId, $approvedBy, $notes);
    }

    public function reject(string $invoiceId, ?string $reason, ?string $rejectedBy = null): Invoice
    {
        return $this->statusService->reject($invoiceId, $reason, $rejectedBy);
    }

    public function rejectForSide(string $invoiceId, string $side, string $reason, ?string $rejectedBy = null): Invoice
    {
        return $this->statusService->rejectForSide($invoiceId, $side, $reason, $rejectedBy);
    }

    public function rejectBefore(string $invoiceId, string $reason, ?string $rejectedBy = null): Invoice
    {
        return $this->statusService->rejectForSide($invoiceId, 'before', $reason, $rejectedBy);
    }

    public function rejectAfter(string $invoiceId, string $reason, ?string $rejectedBy = null): Invoice
    {
        return $this->statusService->rejectForSide($invoiceId, 'after', $reason, $rejectedBy);
    }

    public function sendBack(string $invoiceId, string $reason, ?string $actionBy = null): Invoice
    {
        return $this->statusService->sendBack($invoiceId, $reason, $actionBy);
    }

    /**
     * @param  array<string, mixed>  $sendData
     */
    public function sendToCustomer(string $invoiceId, array $sendData, ?string $sentBy = null): Invoice
    {
        return $this->statusService->sendToCustomer($invoiceId, $sendData, $sentBy);
    }

    /**
     * @param  array<string, mixed>  $paymentData
     */
    public function recordPayment(string $invoiceId, array $paymentData, ?string $recordedBy = null): Invoice
    {
        return $this->statusService->recordPayment($invoiceId, $paymentData, $recordedBy);
    }

    public function revertToDraft(string $invoiceId, ?string $side = null, ?string $revertedBy = null, ?string $reason = null): Invoice
    {
        return $this->statusService->revertToDraft($invoiceId, $side, $revertedBy, $reason);
    }

    // ---------------------------------------------------------------------
    // MediaService passthroughs
    // ---------------------------------------------------------------------

    /**
     * @param  array<mixed>  $files
     * @return array<mixed>
     */
    public function uploadEvidence(string $invoiceId, array $files, ?string $description = null, ?string $uploadedBy = null): array
    {
        return $this->mediaService->uploadEvidence($invoiceId, $files, $description, $uploadedBy);
    }

    /**
     * @param  array<mixed>  $files
     * @return array<mixed>
     */
    public function uploadEvidenceByMode(string $invoiceId, array $files, string $mode = 'before', ?string $description = null, ?string $uploadedBy = null): array
    {
        return $this->mediaService->uploadEvidenceByMode($invoiceId, $files, $mode, $description, $uploadedBy);
    }

    // ---------------------------------------------------------------------
    // PdfService passthroughs
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function generatePdf(string $invoiceId, array $options = []): array
    {
        return $this->pdfService->generatePdf($invoiceId, $options);
    }

    public function streamPdf(string $invoiceId, mixed $options = []): \Symfony\Component\HttpFoundation\Response
    {
        return $this->pdfService->streamPdf($invoiceId, $options);
    }

    /**
     * @param  array<int, string>  $headerTypes
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function generatePdfBundle(string $invoiceId, array $headerTypes = [], array $options = []): array
    {
        return $this->pdfService->generatePdfBundle($invoiceId, $headerTypes, $options);
    }

    /**
     * @return array<string, mixed>
     */
    public function checkPdfSystemStatus(): array
    {
        return $this->pdfService->checkPdfSystemStatus();
    }
}
