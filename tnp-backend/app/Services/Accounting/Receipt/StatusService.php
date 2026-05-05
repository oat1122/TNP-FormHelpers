<?php

namespace App\Services\Accounting\Receipt;

use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Receipt;
use Illuminate\Support\Facades\DB;

/**
 * Receipt status state machine.
 *
 * Active status values: draft, approved, sent.
 * Note: pending_review and rejected are NOT supported by the current legacy
 * receipt schema (see CODEX_INDEX.txt and ReceiptLegacySchemaCompatibilityTest).
 */
class StatusService
{
    public function __construct(
        private Calculator $calculator,
    ) {}

    /**
     * Approve a draft receipt.
     *
     * Guards: receipt must currently be in 'draft' status.
     * Side effects: assigns tax invoice number when applicable, logs status
     * change to DocumentHistory.
     */
    public function approve(string $receiptId, ?string $approvedBy = null, ?string $notes = null): Receipt
    {
        return DB::transaction(function () use ($receiptId, $approvedBy, $notes) {
            $receipt = Receipt::findOrFail($receiptId);

            if ($receipt->status !== 'draft') {
                throw new \Exception('Receipt must be draft to approve');
            }

            $previousStatus = $receipt->status;
            $receipt->status = 'approved';
            $receipt->approved_by = $approvedBy;
            $receipt->approved_at = now();

            $this->calculator->assignTaxInvoiceNumberIfNeeded($receipt);
            $receipt->save();

            DocumentHistory::logStatusChange(
                'receipt',
                $receiptId,
                $previousStatus,
                'approved',
                $approvedBy,
                'Approved'.($notes ? ': '.$notes : '')
            );

            return $receipt->fresh();
        });
    }

    // assignTaxInvoiceNumberIfNeeded() moved to Calculator (M4) — single source.
}
