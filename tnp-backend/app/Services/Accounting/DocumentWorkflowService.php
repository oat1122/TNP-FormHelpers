<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Quotation;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\DocumentStatusHistory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;

class DocumentWorkflowService
{
    /**
     * Change document status with proper validation and history tracking
     *
     * @param Model $document The document model (Quotation, Invoice, etc.)
     * @param string $newStatus Status to change to
     * @param string|null $userId User ID performing the action
     * @param string|null $remarks Comments or notes for the status change
     * @param string $actionType Type of action (create, update, approve, reject, etc.)
     * @return Model Updated document
     */
    public function changeStatus(
        Model $document,
        string $newStatus,
        ?string $userId = null,
        ?string $remarks = null,
        string $actionType = 'update'
    ): Model {
        // Validate the document type
        if (!$this->isValidDocumentType($document)) {
            throw new \InvalidArgumentException('Invalid document type');
        }

        $userId = $userId ?? Auth::user()?->user_uuid ?? null;
        if (!$userId) {
            throw new \InvalidArgumentException('User ID is required for status change');
        }

        // Get document type name
        $documentType = $this->getDocumentTypeName($document);

        // Validate the status transition
        $currentStatus = $document->status;
        if (!$this->isValidStatusTransition($documentType, $currentStatus, $newStatus)) {
            throw new \InvalidArgumentException("Invalid status transition from {$currentStatus} to {$newStatus}");
        }

        DB::transaction(function () use ($document, $currentStatus, $newStatus, $userId, $remarks, $actionType, $documentType) {
            // Update document status
            $document->status = $newStatus;
            
            // Update approval/rejection fields if applicable
            if ($newStatus === 'approved') {
                $document->approved_by = $userId;
                $document->approved_at = now();
            } elseif ($newStatus === 'rejected') {
                $document->rejected_by = $userId;
                $document->rejected_at = now();
                $document->rejection_reason = $remarks;
            }
            
            $document->updated_by = $userId;
            $document->save();

            // Record status history
            $this->recordStatusHistory(
                $document->id,
                $documentType,
                $currentStatus,
                $newStatus,
                $actionType,
                $remarks,
                $userId
            );
            
            // Trigger appropriate events
            $this->triggerStatusChangeEvents($document, $currentStatus, $newStatus);
        });

        return $document->fresh();
    }

    /**
     * Record status change in history
     */
    public function recordStatusHistory(
        string $documentId,
        string $documentType,
        ?string $statusFrom,
        string $statusTo,
        string $actionType,
        ?string $remarks,
        string $userId
    ): void {
        DocumentStatusHistory::create([
            'id' => Str::uuid(),
            'document_id' => $documentId,
            'document_type' => $documentType,
            'status_from' => $statusFrom,
            'status_to' => $statusTo,
            'action_type' => $actionType,
            'remarks' => $remarks,
            'changed_by' => $userId,
            'changed_at' => now()
        ]);
    }

    /**
     * Validate if model is a supported document type
     */
    private function isValidDocumentType(Model $document): bool
    {
        return ($document instanceof Quotation ||
                $document instanceof Invoice ||
                $document instanceof Receipt ||
                $document instanceof DeliveryNote);
    }

    /**
     * Get document type name for history
     */
    private function getDocumentTypeName(Model $document): string
    {
        if ($document instanceof Quotation) return 'quotation';
        if ($document instanceof Invoice) return 'invoice';
        if ($document instanceof Receipt) return 'receipt';
        if ($document instanceof DeliveryNote) return 'delivery_note';
        
        throw new \InvalidArgumentException('Unknown document type');
    }

    /**
     * Check if status transition is valid
     */
    private function isValidStatusTransition(string $documentType, ?string $currentStatus, string $newStatus): bool
    {
        if ($currentStatus === $newStatus) {
            return true; // No change
        }

        // Define allowed transitions for each document type
        $allowedTransitions = [
            'quotation' => [
                null => ['draft'],
                'draft' => ['pending_review', 'rejected'],
                'pending_review' => ['approved', 'rejected', 'draft'],
                'approved' => ['completed', 'pending_review'],
                'rejected' => ['draft', 'pending_review']
            ],
            'invoice' => [
                null => ['draft'],
                'draft' => ['pending_review', 'rejected'],
                'pending_review' => ['approved', 'rejected', 'draft'],
                'approved' => ['completed', 'pending_review'],
                'rejected' => ['draft', 'pending_review']
            ],
            'receipt' => [
                null => ['draft'],
                'draft' => ['pending_review', 'rejected'],
                'pending_review' => ['approved', 'rejected', 'draft'],
                'approved' => ['completed'],
                'rejected' => ['draft']
            ],
            'delivery_note' => [
                null => ['draft'],
                'draft' => ['pending_review', 'rejected'],
                'pending_review' => ['approved', 'rejected', 'draft'],
                'approved' => ['delivered', 'completed'],
                'rejected' => ['draft'],
                'delivered' => ['completed']
            ]
        ];

        // Check if the transition is allowed
        if (isset($allowedTransitions[$documentType][$currentStatus])) {
            return in_array($newStatus, $allowedTransitions[$documentType][$currentStatus]);
        }

        return false;
    }
    
    /**
     * Trigger appropriate events based on status change
     */
    private function triggerStatusChangeEvents(Model $document, ?string $oldStatus, string $newStatus): void
    {
        $documentType = $this->getDocumentTypeName($document);
        $eventName = 'accounting.' . $documentType . '.status.changed';
        
        Event::dispatch($eventName, [$document, $oldStatus, $newStatus]);
        
        // Specific events
        if ($newStatus === 'approved') {
            Event::dispatch('accounting.' . $documentType . '.approved', [$document]);
        } elseif ($newStatus === 'rejected') {
            Event::dispatch('accounting.' . $documentType . '.rejected', [$document]);
        } elseif ($newStatus === 'completed') {
            Event::dispatch('accounting.' . $documentType . '.completed', [$document]);
        }
    }
}
