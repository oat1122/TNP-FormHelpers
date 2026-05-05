<?php

namespace App\Services\Accounting;

use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\DocumentAttachment;
use App\Services\Accounting\DeliveryNote\CreationService as DeliveryNoteCreationService;
use App\Services\Accounting\DeliveryNote\ManagementService as DeliveryNoteManagementService;
use App\Services\Accounting\DeliveryNote\MediaService as DeliveryNoteMediaService;
use App\Services\Accounting\DeliveryNote\PdfService as DeliveryNotePdfService;
use App\Services\Accounting\DeliveryNote\StatusService as DeliveryNoteStatusService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Facade over the DeliveryNote sub-services. Public methods delegate to the
 * specialised service that owns the concern. Split (post-audit cleanup):
 *
 *   - CreationService    — create + createFromReceipt
 *   - ManagementService  — getList + getInvoiceItemSources + getInvoiceSources
 *                          + update + getCourierCompanies + getDeliveryMethods
 *                          + getDeliveryTimeline
 *   - StatusService      — startShipping / updateTrackingStatus / markAsDelivered
 *                          / markAsCompleted / markAsFailed
 *   - MediaService       — uploadEvidence
 *   - PdfService         — generatePdf / streamPdf / generatePdfBundle
 *                          (DeliveryNotePdfMasterService injected here, not via app())
 *
 * Public method shape is preserved 1-to-1 so controllers / external callers
 * do not need changes.
 */
class DeliveryNoteService
{
    public function __construct(
        protected AutofillService $autofillService,
        private DeliveryNoteCreationService $creationService,
        private DeliveryNoteManagementService $managementService,
        private DeliveryNoteStatusService $statusService,
        private DeliveryNoteMediaService $mediaService,
        private DeliveryNotePdfService $pdfService,
    ) {}

    // ---------------------------------------------------------------------
    // ManagementService passthroughs (read + update)
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<array<string, mixed>>
     */
    public function getInvoiceItemSources(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->managementService->getInvoiceItemSources($filters, $perPage);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<array<string, mixed>>
     */
    public function getInvoiceSources(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->managementService->getInvoiceSources($filters, $perPage);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<DeliveryNote>
     */
    public function getList(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->managementService->getList($filters, $perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(string $deliveryNoteId, array $data, ?string $updatedBy = null): DeliveryNote
    {
        return $this->managementService->update($deliveryNoteId, $data, $updatedBy);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getCourierCompanies(): array
    {
        return $this->managementService->getCourierCompanies();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getDeliveryMethods(): array
    {
        return $this->managementService->getDeliveryMethods();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getDeliveryTimeline(string $deliveryNoteId): array
    {
        return $this->managementService->getDeliveryTimeline($deliveryNoteId);
    }

    // ---------------------------------------------------------------------
    // CreationService passthroughs
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $deliveryData
     */
    public function createFromReceipt(string $receiptId, array $deliveryData, ?string $createdBy = null): DeliveryNote
    {
        return $this->creationService->createFromReceipt($receiptId, $deliveryData, $createdBy);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?string $createdBy = null): DeliveryNote
    {
        return $this->creationService->create($data, $createdBy);
    }

    // ---------------------------------------------------------------------
    // StatusService passthroughs
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $shippingData
     */
    public function startShipping(string $deliveryNoteId, array $shippingData, ?string $shippedBy = null): DeliveryNote
    {
        return $this->statusService->startShipping($deliveryNoteId, $shippingData, $shippedBy);
    }

    /**
     * @param  array<string, mixed>  $trackingData
     */
    public function updateTrackingStatus(string $deliveryNoteId, array $trackingData, ?string $updatedBy = null): DeliveryNote
    {
        return $this->statusService->updateTrackingStatus($deliveryNoteId, $trackingData, $updatedBy);
    }

    /**
     * @param  array<string, mixed>  $deliveryData
     */
    public function markAsDelivered(string $deliveryNoteId, array $deliveryData, ?string $deliveredBy = null): DeliveryNote
    {
        return $this->statusService->markAsDelivered($deliveryNoteId, $deliveryData, $deliveredBy);
    }

    /**
     * @param  array<string, mixed>  $completionData
     */
    public function markAsCompleted(string $deliveryNoteId, array $completionData, ?string $completedBy = null): DeliveryNote
    {
        return $this->statusService->markAsCompleted($deliveryNoteId, $completionData, $completedBy);
    }

    /**
     * @param  array<string, mixed>  $failureData
     */
    public function markAsFailed(string $deliveryNoteId, array $failureData, ?string $reportedBy = null): DeliveryNote
    {
        return $this->statusService->markAsFailed($deliveryNoteId, $failureData, $reportedBy);
    }

    // ---------------------------------------------------------------------
    // MediaService passthroughs
    // ---------------------------------------------------------------------

    /**
     * @param  array<int, \Illuminate\Http\UploadedFile>  $files
     * @return array<int, DocumentAttachment>
     */
    public function uploadEvidence(string $deliveryNoteId, array $files, ?string $description = null, ?string $uploadedBy = null): array
    {
        return $this->mediaService->uploadEvidence($deliveryNoteId, $files, $description, $uploadedBy);
    }

    // ---------------------------------------------------------------------
    // PdfService passthroughs
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function generatePdf(string $deliveryNoteId, array $options = []): array
    {
        return $this->pdfService->generatePdf($deliveryNoteId, $options);
    }

    /**
     * @param  array<int, string>  $headerTypes
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function generatePdfBundle(string $deliveryNoteId, array $headerTypes = [], array $options = []): array
    {
        return $this->pdfService->generatePdfBundle($deliveryNoteId, $headerTypes, $options);
    }

    /**
     * @param  array<string, mixed>  $options
     */
    public function streamPdf(string $deliveryNoteId, array $options = []): \Symfony\Component\HttpFoundation\Response
    {
        return $this->pdfService->streamPdf($deliveryNoteId, $options);
    }
}
