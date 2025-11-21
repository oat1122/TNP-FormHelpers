<?php

namespace App\Services\Accounting\Quotation;

use App\Models\Accounting\Quotation;
use App\Models\Accounting\DocumentHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StatusService
{
    /**
     * ส่งใบเสนอราคาเพื่อขออนุมัติ
     * @param mixed $id
     * @param mixed $submittedBy
     * @return Quotation
     */
    public function submitForReview($id, $submittedBy = null): Quotation
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            
            if ($quotation->status !== 'draft') {
                throw new \Exception('Can only submit draft quotations for review');
            }

            $quotation->status = 'pending_review';
            $quotation->save();

            // บันทึก History
            DocumentHistory::logStatusChange('quotation', $quotation->id, 'draft', 'pending_review', $submittedBy, 'ส่งขออนุมัติ');

            DB::commit();

            return $quotation;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::submitForReview error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อนุมัติใบเสนอราคา
     * @param mixed $id
     * @param mixed $approvedBy
     * @param mixed $notes
     * @return Quotation
     */
    public function approve($id, $approvedBy = null, $notes = null): Quotation
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            
            if ($quotation->status !== 'pending_review') {
                throw new \Exception('Can only approve quotations that are pending review');
            }

            // กำหนดเลขที่เอกสารตอนอนุมัติ (ครั้งแรกหรือกรณีเป็นเลขชั่วคราว DRAFT-xxxx)
            if (empty($quotation->number) || \Illuminate\Support\Str::startsWith($quotation->number, 'DRAFT-')) {
                // ใช้ปี/เดือนปัจจุบันในการออกเลข
                $quotation->number = Quotation::generateQuotationNumber($quotation->company_id);
            }

            $quotation->status = 'approved';
            $quotation->approved_by = $approvedBy;
            $quotation->approved_at = now();
            $quotation->save();

            // บันทึก History
            DocumentHistory::logApproval('quotation', $quotation->id, $approvedBy, $notes);

            DB::commit();

            return $quotation;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::approve error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ปฏิเสธใบเสนอราคา
     * @param mixed $id
     * @param mixed $rejectedBy
     * @param mixed $reason
     * @return Quotation
     */
    public function reject($id, $rejectedBy = null, $reason = null): Quotation
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            
            if ($quotation->status !== 'pending_review') {
                throw new \Exception('Can only reject quotations that are pending review');
            }

            $quotation->status = 'rejected';
            $quotation->save();

            // บันทึก History
            DocumentHistory::logRejection('quotation', $quotation->id, $rejectedBy, $reason);

            DB::commit();

            return $quotation;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::reject error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ส่งกลับแก้ไข (Account ส่งกลับให้ Sales)
     * @param mixed $quotationId
     * @param mixed $reason
     * @param mixed $actionBy
     * @return Quotation
     */
    public function sendBackForEdit($quotationId, $reason, $actionBy = null): Quotation
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($quotationId);

            // ตรวจสอบว่าอยู่ในสถานะที่ส่งกลับได้
            if ($quotation->status !== 'pending_review') {
                throw new \Exception('Quotation must be in pending review status to send back');
            }

            $quotation->status = 'draft';
            $quotation->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'quotation', 
                $quotationId, 
                'pending_review', 
                'draft', 
                $actionBy, 
                'ส่งกลับแก้ไข: ' . ($reason ?? '')
            );

            DB::commit();

            return $quotation->load(['customer', 'creator', 'documentHistory', 'company']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::sendBackForEdit error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ยกเลิกการอนุมัติ (Account)
     * @param mixed $quotationId
     * @param mixed $reason
     * @param mixed $actionBy
     * @return Quotation
     */
    public function revokeApproval($quotationId, $reason, $actionBy = null): Quotation
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($quotationId);

            // ตรวจสอบว่าอยู่ในสถานะที่ยกเลิกได้
            if (!in_array($quotation->status, ['approved', 'sent'])) {
                throw new \Exception('Quotation must be in approved or sent status to revoke approval');
            }

            $previousStatus = $quotation->status;
            $quotation->status = 'pending_review';
            $quotation->approved_by = null;
            $quotation->approved_at = null;
            // Free the official number so the sequence can be reused (numbers are assigned only for approved)
            if (!empty($quotation->number) && !\Illuminate\Support\Str::startsWith($quotation->number, 'DRAFT-')) {
                $suffix = substr(str_replace('-', '', (string)$quotation->id), -8);
                $quotation->number = 'DRAFT-' . $suffix;
            }
            $quotation->save();

            // บันทึก History
            DocumentHistory::logStatusChange(
                'quotation', 
                $quotationId, 
                $previousStatus, 
                'pending_review', 
                $actionBy, 
                'ยกเลิกการอนุมัติ: ' . ($reason ?? '')
            );

            DB::commit();

            return $quotation->load(['customer', 'creator', 'documentHistory', 'company']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::revokeApproval error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * มาร์คว่าลูกค้าตอบรับแล้ว
     * @param mixed $quotationId
     * @param mixed $data
     * @param mixed $completedBy
     * @return Quotation
     */
    public function markCompleted($quotationId, $data, $completedBy = null): Quotation
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($quotationId);

            // ตรวจสอบสถานะ
            if ($quotation->status !== 'sent') {
                throw new \Exception('Quotation must be in sent status to mark as completed');
            }

            $quotation->status = 'completed';
            $quotation->save();

            // บันทึก History
            $notes = $data['completion_notes'] ?? 'ลูกค้าตอบรับใบเสนอราคาแล้ว';
            if (!empty($data['customer_response'])) {
                $notes .= "\nข้อความจากลูกค้า: " . $data['customer_response'];
            }

            DocumentHistory::logStatusChange(
                'quotation',
                $quotationId,
                'sent',
                'completed',
                $completedBy,
                'ลูกค้าตอบรับ' . ($notes ? ': ' . $notes : '')
            );

            DB::commit();

            return $quotation->load(['customer', 'creator', 'documentHistory', 'company']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::markCompleted error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * บันทึกการส่งเอกสาร (อัปเดตสถานะเป็น 'sent')
     * @param mixed $quotationId
     * @param mixed $data
     * @param mixed $sentBy
     * @return Quotation
     */
    public function markSent($quotationId, $data, $sentBy = null): Quotation
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($quotationId);

            // ตรวจสอบสถานะ
            if ($quotation->status !== 'approved') {
                throw new \Exception('Quotation must be approved before marking as sent');
            }

            $quotation->status = 'sent';
            $quotation->save();

            // บันทึก History
            $notes = "ส่งเอกสารด้วยวิธี: " . $data['delivery_method'];
            if (!empty($data['recipient_name'])) {
                $notes .= "\nผู้รับ: " . $data['recipient_name'];
            }
            if (!empty($data['delivery_notes'])) {
                $notes .= "\nหมายเหตุ: " . $data['delivery_notes'];
            }

            DocumentHistory::logStatusChange(
                'quotation',
                $quotationId,
                'approved',
                'sent',
                $sentBy,
                'ส่งเอกสาร: ' . $notes
            );

            DB::commit();

            return $quotation->load(['customer', 'creator', 'documentHistory']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::markSent error: ' . $e->getMessage());
            throw $e;
        }
    }
}
