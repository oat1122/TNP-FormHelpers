<?php

namespace App\Services\Accounting\Invoice;

use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Invoice;
use App\Services\Support\DocumentNumberService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Invoice status state machine.
 *
 * Manages submit / approve / reject for both deposit sides (before / after),
 * plus terminal flows: sendBack, sendToCustomer, recordPayment,
 * applyReceiptPayment, revertToDraft.
 *
 * Status guards live in Invoice model methods: canSubmitForSide,
 * canApproveForSide, canRejectForSide, getStatusForSide, setStatusForSide.
 *
 * Cross-doc effects (e.g. M3.1 receipt-driven payment rollup) live here
 * because they mutate Invoice state.
 */
class StatusService
{
    public function __construct(
        private DocumentNumberService $documentNumberService,
    ) {}

    /**
     * Apply a receipt payment to an invoice — increments paid_amount and rolls
     * up status to partial_paid / fully_paid. Designed to be called from
     * ReceiptService when a receipt is approved (M3.1).
     *
     * Behavior is controlled by `config('accounting.strict_receipt_payment_guards')`:
     *   - false (default): lenient — anomalies logged but processing continues.
     *   - true: strict — invoice must be in ['sent', 'partial_paid'] and
     *     overflow throws (parity with manual `recordPayment`).
     */
    public function applyReceiptPayment(string $invoiceId, float $paymentAmount, ?string $actorId = null): void
    {
        $strict = (bool) config('accounting.strict_receipt_payment_guards', false);

        DB::transaction(function () use ($invoiceId, $paymentAmount, $actorId, $strict) {
            $invoice = Invoice::findOrFail($invoiceId);
            $previousStatus = $invoice->status;
            $currentPaid = (float) ($invoice->paid_amount ?? 0);
            $newPaidAmount = $currentPaid + $paymentAmount;
            $totalAmount = (float) $invoice->total_amount;

            // Guard 1: invoice status must allow payment
            $allowedStatuses = ['sent', 'partial_paid'];
            if (! in_array($invoice->status, $allowedStatuses, true)) {
                if ($strict) {
                    throw new \Exception(
                        "Cannot apply receipt payment: invoice status '{$invoice->status}' "
                        .'is not in ['.implode(',', $allowedStatuses).']'
                    );
                }
                Log::warning('applyReceiptPayment.status_anomaly', [
                    'invoice_id' => $invoice->id,
                    'invoice_status' => $invoice->status,
                    'allowed_statuses' => $allowedStatuses,
                    'payment_amount' => $paymentAmount,
                    'actor_id' => $actorId,
                ]);
            }

            // Guard 2: total paid must not exceed invoice total
            if ($newPaidAmount > $totalAmount) {
                if ($strict) {
                    throw new \Exception(
                        'Cannot apply receipt payment: would overflow invoice total '
                        .'(paid '.number_format($newPaidAmount, 2)
                        .' > total '.number_format($totalAmount, 2).')'
                    );
                }
                Log::warning('applyReceiptPayment.overflow_anomaly', [
                    'invoice_id' => $invoice->id,
                    'current_paid' => $currentPaid,
                    'payment_amount' => $paymentAmount,
                    'new_paid' => $newPaidAmount,
                    'total_amount' => $totalAmount,
                    'overflow_by' => round($newPaidAmount - $totalAmount, 2),
                    'actor_id' => $actorId,
                ]);
            }

            $invoice->paid_amount = $newPaidAmount;

            if ($newPaidAmount >= $totalAmount) {
                $invoice->status = 'fully_paid';
                $invoice->paid_at = now();
            } else {
                $invoice->status = 'partial_paid';
            }

            $invoice->save();

            DocumentHistory::logStatusChange(
                'invoice',
                $invoice->id,
                $previousStatus,
                $invoice->status,
                $actorId,
                'Receipt payment ฿'.number_format($paymentAmount, 2)
            );
        });
    }

    /**
     * Submit invoice for the 'before' deposit side (alias for submitForSide).
     */
    public function submit(string $invoiceId, ?string $submittedBy = null): Invoice
    {
        return $this->submitForSide($invoiceId, 'before', $submittedBy);
    }

    /**
     * Submit invoice for a specific side (before/after). Idempotent: returns
     * the invoice unchanged when it cannot accept a submit transition.
     */
    public function submitForSide(string $invoiceId, string $side, ?string $submittedBy = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if (! $invoice->canSubmitForSide($side)) {
                DB::commit();

                return $invoice;
            }

            $invoice->setStatusForSide($side, 'pending');

            // Only update submitted metadata for before side (legacy behavior).
            if ($side === 'before') {
                $invoice->submitted_by = $submittedBy;
                $invoice->submitted_at = now();
            }

            $invoice->save();

            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'draft',
                'pending',
                $submittedBy,
                "ส่งขออนุมัติฝั่ง {$side}"
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Invoice\\StatusService::submitForSide({$side}) error: ".$e->getMessage());
            throw $e;
        }
    }

    /**
     * Approve invoice for the 'before' deposit side (alias for approveForSide).
     */
    public function approve(string $invoiceId, ?string $approvedBy = null, ?string $notes = null): Invoice
    {
        return $this->approveForSide($invoiceId, 'before', $approvedBy, $notes);
    }

    /**
     * Approve invoice for a specific side. Auto-submits from draft, assigns
     * canonical invoice numbers (DRAFT-* → real number), and idempotently
     * handles already-approved cases.
     */
    public function approveForSide(string $invoiceId, string $side, ?string $approvedBy = null, ?string $notes = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);
            $currentStatus = $invoice->getStatusForSide($side);

            // Idempotent / benign handling for already-processed invoices.
            if ($currentStatus === 'approved') {
                if ($side === 'after' && empty($invoice->number_after)) {
                    $invoice->number_after = $this->documentNumberService->nextInvoiceNumber($invoice->company_id, 'after');
                    $invoice->number = $invoice->number_after;
                    $invoice->save();

                    DocumentHistory::logAction(
                        'invoice',
                        $invoiceId,
                        'assign_number_after',
                        $approvedBy,
                        "กำหนด number_after สำหรับใบแจ้งหนี้ที่อนุมัติแล้ว: {$invoice->number_after}"
                    );
                } else {
                    DocumentHistory::logAction(
                        'invoice',
                        $invoiceId,
                        "approve_{$side}_noop",
                        $approvedBy,
                        "ข้ามการอนุมัติฝั่ง {$side} เนื่องจากอนุมัติแล้ว"
                    );
                }
                DB::commit();

                return $invoice->fresh();
            }

            if (! $invoice->canApproveForSide($side)) {
                throw new \Exception("Cannot approve invoice for {$side} side in current status: {$currentStatus}");
            }

            // Auto-submit if still draft.
            if ($currentStatus === 'draft') {
                $invoice->setStatusForSide($side, 'pending');
                if ($side === 'before') {
                    $invoice->submitted_by = $approvedBy;
                    $invoice->submitted_at = now();
                }
            }

            $invoice->setStatusForSide($side, 'approved');

            // Generate canonical invoice numbers upon approval (Quotation pattern).
            if (empty($invoice->number) || Str::startsWith($invoice->number, 'DRAFT-')) {
                $invoice->assignInvoiceNumbers();
            } elseif ($side === 'after' && empty($invoice->number_after)) {
                $invoice->number_after = $this->documentNumberService->nextInvoiceNumber($invoice->company_id, 'after');
                $invoice->number = $invoice->number_after;
            }

            $invoice->approved_by = $approvedBy;
            $invoice->approved_at = now();

            $invoice->save();

            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                $currentStatus,
                'approved',
                $approvedBy,
                "อนุมัติฝั่ง {$side}".($notes ? " - {$notes}" : '')
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Invoice\\StatusService::approveForSide({$side}) error: ".$e->getMessage());
            throw $e;
        }
    }

    /**
     * Reject pending-review invoice (Account-side rejection on the before flow).
     */
    public function reject(string $invoiceId, ?string $reason, ?string $rejectedBy = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'pending') {
                throw new \Exception('Invoice must be pending review to reject');
            }

            $invoice->status = 'rejected';
            $invoice->rejected_by = $rejectedBy;
            $invoice->rejected_at = now();
            $invoice->save();

            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'pending',
                'rejected',
                $rejectedBy,
                'ปฏิเสธ'.($reason ? " - {$reason}" : '')
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\StatusService::reject error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Submit after-deposit (special workflow: only valid when
     * deposit_display_order = 'after'). Idempotent for already-submitted.
     */
    public function submitAfterDeposit(string $invoiceId, ?string $submittedBy = null, ?string $notes = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);
            $fromStatus = $invoice->status;

            if (in_array($invoice->status, ['pending_after', 'approved', 'sent', 'partial_paid', 'fully_paid', 'overdue'])) {
                DB::commit();

                return $invoice->fresh();
            }

            if (! in_array($invoice->status, ['draft', 'pending'])) {
                throw new \Exception('Invoice must be draft or pending to submit for after-deposit approval');
            }

            if ($invoice->deposit_display_order !== 'after') {
                throw new \Exception('Invoice must have deposit_display_order = "after" to use this workflow');
            }

            $invoice->status = 'pending_after';
            $invoice->submitted_by = $submittedBy;
            $invoice->submitted_at = now();
            $invoice->save();

            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                $fromStatus,
                'pending_after',
                $submittedBy,
                'ส่งขออนุมัติมัดจำหลัง'.($notes ? " - {$notes}" : '')
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\StatusService::submitAfterDeposit error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Approve after-deposit (pending_after → approved). Auto-submits from
     * draft/pending when deposit_display_order = 'after'. Idempotent for
     * already-processed.
     */
    public function approveAfterDeposit(string $invoiceId, ?string $approvedBy = null, ?string $notes = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);
            $fromStatus = $invoice->status;

            if (in_array($invoice->status, ['approved', 'sent', 'partial_paid', 'fully_paid', 'overdue'])) {
                DocumentHistory::logAction(
                    'invoice',
                    $invoiceId,
                    'approve_after_noop',
                    $approvedBy,
                    'ข้ามการอนุมัติมัดจำหลังเนื่องจากสถานะปัจจุบันคือ '.$invoice->status
                );
                DB::commit();

                return $invoice;
            }

            // Accept direct approval from draft/pending — auto-submit first.
            if (in_array($invoice->status, ['draft', 'pending']) && $invoice->deposit_display_order === 'after') {
                DocumentHistory::logStatusChange(
                    'invoice',
                    $invoiceId,
                    $fromStatus,
                    'pending_after',
                    $approvedBy,
                    'ส่งขออนุมัติมัดจำหลัง (โดย approve-after-deposit)'.($notes ? " - {$notes}" : '')
                );
                $invoice->status = 'pending_after';
                $invoice->submitted_by = $approvedBy;
                $invoice->submitted_at = now();
                $invoice->save();
                $fromStatus = 'pending_after';
            }

            if ($invoice->status !== 'pending_after') {
                throw new \Exception('Invoice must be pending_after to approve after-deposit');
            }

            if ($invoice->deposit_display_order !== 'after') {
                throw new \Exception('Invoice must have deposit_display_order = "after" to use this workflow');
            }

            $invoice->status = 'approved';
            $invoice->approved_by = $approvedBy;
            $invoice->approved_at = now();
            $invoice->save();

            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                $fromStatus,
                'approved',
                $approvedBy,
                'อนุมัติมัดจำหลัง'.($notes ? " - {$notes}" : '')
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\StatusService::approveAfterDeposit error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Send back from pending review to draft (Account → Sales).
     */
    public function sendBack(string $invoiceId, string $reason, ?string $actionBy = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'pending') {
                throw new \Exception('Invoice must be pending review to send back');
            }

            $invoice->status = 'draft';
            $invoice->save();

            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'pending',
                'draft',
                $actionBy,
                'ส่งกลับแก้ไข'.($reason ? " - {$reason}" : '')
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\StatusService::sendBack error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Send approved invoice to the customer (transitions to 'sent').
     *
     * @param  array<string, mixed>  $sendData
     */
    public function sendToCustomer(string $invoiceId, array $sendData, ?string $sentBy = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if ($invoice->status !== 'approved') {
                throw new \Exception('Invoice must be approved before sending to customer');
            }

            $invoice->status = 'sent';
            $invoice->sent_by = $sentBy;
            $invoice->sent_at = now();
            $invoice->save();

            $notes = 'ส่งให้ลูกค้าด้วยวิธี: '.($sendData['delivery_method'] ?? 'อีเมล');
            if (! empty($sendData['recipient_email'])) {
                $notes .= "\nส่งถึง: ".$sendData['recipient_email'];
            }

            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                'approved',
                'sent',
                $sentBy,
                'ส่งให้ลูกค้า - '.$notes
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\StatusService::sendToCustomer error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Manual payment record entry. Strict: invoice must be in
     * ['sent', 'partial_paid']; payment must not overflow invoice total.
     *
     * @param  array<string, mixed>  $paymentData
     */
    public function recordPayment(string $invoiceId, array $paymentData, ?string $recordedBy = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);

            if (! in_array($invoice->status, ['sent', 'partial_paid'])) {
                throw new \Exception('Invoice must be sent before recording payment');
            }

            $paymentAmount = (float) $paymentData['amount'];
            $currentPaid = (float) ($invoice->paid_amount ?? 0);
            $newPaidAmount = $currentPaid + $paymentAmount;

            if ($newPaidAmount > (float) $invoice->total_amount) {
                throw new \Exception('Payment amount cannot exceed invoice total');
            }

            $invoice->paid_amount = $newPaidAmount;

            if ($newPaidAmount >= (float) $invoice->total_amount) {
                $invoice->status = 'fully_paid';
                $invoice->paid_at = now();
            } else {
                $invoice->status = 'partial_paid';
            }

            $invoice->save();

            $notes = 'ชำระเงิน: ฿'.number_format($paymentAmount, 2);
            if (! empty($paymentData['payment_method'])) {
                $notes .= "\nวิธีการชำระ: ".$paymentData['payment_method'];
            }
            if (! empty($paymentData['reference_number'])) {
                $notes .= "\nเลขที่อ้างอิง: ".$paymentData['reference_number'];
            }

            DocumentHistory::logAction(
                'invoice',
                $invoiceId,
                'record_payment',
                $recordedBy,
                $notes
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\StatusService::recordPayment error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Reject invoice for a specific side (before/after). Resets rejected_*
     * metadata only.
     */
    public function rejectForSide(string $invoiceId, string $side, string $reason, ?string $rejectedBy = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);
            $currentStatus = $invoice->getStatusForSide($side);

            if (! $invoice->canRejectForSide($side)) {
                throw new \Exception("Cannot reject invoice for {$side} side in current status: {$currentStatus}");
            }

            $invoice->setStatusForSide($side, 'rejected');
            $invoice->rejected_by = $rejectedBy;
            $invoice->rejected_at = now();
            $invoice->save();

            DocumentHistory::logStatusChange(
                'invoice',
                $invoiceId,
                $currentStatus,
                'rejected',
                $rejectedBy,
                "ปฏิเสธฝั่ง {$side}".($reason ? " - {$reason}" : '')
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Invoice\\StatusService::rejectForSide({$side}) error: ".$e->getMessage());
            throw $e;
        }
    }

    /**
     * Revert approved/rejected invoice back to draft, optionally for a single
     * side. Throws when no side has a revertible status.
     *
     * @param  string|null  $side  ('before'|'after'|null for both)
     */
    public function revertToDraft(string $invoiceId, ?string $side = null, ?string $revertedBy = null, ?string $reason = null): Invoice
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($invoiceId);
            $changes = [];
            $sidesToProcess = $side ? [$side] : ['before', 'after'];

            foreach ($sidesToProcess as $currentSide) {
                $currentStatus = $invoice->getStatusForSide($currentSide);

                if ($currentStatus === 'approved') {
                    $invoice->setStatusForSide($currentSide, 'draft');
                    $changes[$currentSide] = $currentStatus.' -> draft';

                    if ($currentSide === 'before' && $invoice->status === 'approved') {
                        $invoice->approved_by = null;
                        $invoice->approved_at = null;
                    }
                } elseif (in_array($currentStatus, ['draft', 'pending'])) {
                    continue;
                } elseif ($currentStatus === 'rejected') {
                    $invoice->setStatusForSide($currentSide, 'draft');
                    $changes[$currentSide] = $currentStatus.' -> draft';

                    $invoice->rejected_by = null;
                    $invoice->rejected_at = null;
                } else {
                    if ($side === $currentSide) {
                        throw new \Exception("Cannot revert invoice from status '{$currentStatus}' on {$currentSide} side");
                    }

                    continue;
                }
            }

            if (empty($changes)) {
                $message = $side
                    ? "Invoice ฝั่ง {$side} อยู่ในสถานะที่ไม่จำเป็นต้อง revert แล้ว"
                    : 'Invoice อยู่ในสถานะที่ไม่จำเป็นต้อง revert แล้ว';

                DB::rollBack();
                throw new \Exception($message);
            }

            if ($revertedBy) {
                $invoice->updated_by = $revertedBy;
            }

            $invoice->save();

            DocumentHistory::logInvoiceRevert(
                $invoiceId,
                $revertedBy,
                $changes,
                $reason
            );

            DB::commit();

            return $invoice->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice\\StatusService::revertToDraft error: '.$e->getMessage());
            throw $e;
        }
    }
}
