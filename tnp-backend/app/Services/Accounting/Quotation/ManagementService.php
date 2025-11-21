<?php

namespace App\Services\Accounting\Quotation;

use App\Models\Accounting\Quotation;
use App\Models\Accounting\QuotationItem;
use App\Models\Accounting\DocumentHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ManagementService
{
    protected SyncService $syncService;

    public function __construct(SyncService $syncService)
    {
        $this->syncService = $syncService;
    }
    /**
     * อัปเดต Quotation
     * @param mixed $id
     * @param mixed $data
     * @param mixed $updatedBy
     * @param bool $confirmSync
     * @return array|Quotation
     */
    public function update($id, $data, $updatedBy = null, $confirmSync = false)
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            $oldStatus = $quotation->status;
            $oldCompanyId = $quotation->company_id;

            // Preserve primary_pricing_request fields if not explicitly provided
            $preservedPrimaryPrId = $quotation->primary_pricing_request_id;
            $preservedPrimaryPrIds = $quotation->primary_pricing_request_ids;

            $quotation->fill($data);

            // Restore preserved fields if they weren't in the update data
            if (!array_key_exists('primary_pricing_request_id', $data)) {
                $quotation->primary_pricing_request_id = $preservedPrimaryPrId;
            }
            if (!array_key_exists('primary_pricing_request_ids', $data)) {
                $quotation->primary_pricing_request_ids = $preservedPrimaryPrIds;
            }

            // หากเป็นเอกสารที่อนุมัติแล้ว/ส่งแล้ว/เสร็จสิ้น ห้ามเปลี่ยนบริษัท
            if (
                array_key_exists('company_id', $data) &&
                !empty($data['company_id']) &&
                $data['company_id'] !== $oldCompanyId &&
                in_array($quotation->status, ['approved', 'sent', 'completed'])
            ) {
                throw new \Exception('Cannot change company for approved/sent/completed quotation');
            }

            // ถ้าบริษัทถูกเปลี่ยนและยังไม่ Final ให้ตั้งเลขชั่วคราว (DRAFT-xxxx) เพื่อออกใหม่ตอนอนุมัติ
            if (
                array_key_exists('company_id', $data) &&
                !empty($data['company_id']) &&
                $data['company_id'] !== $oldCompanyId &&
                !in_array($quotation->status, ['approved', 'sent', 'completed'])
            ) {
                $suffix = substr(str_replace('-', '', (string)$quotation->id), -8);
                $quotation->number = 'DRAFT-' . $suffix;
            }

            $quotation->save();

            // If frontend sends full items array, replace existing quotation_items accordingly
            if (array_key_exists('items', $data) && is_array($data['items'])) {
                // Remove all existing items first to simplify ordering and grouping logic
                QuotationItem::where('quotation_id', $id)->delete();

                $seqSeen = [];
                foreach ($data['items'] as $index => $item) {
                    // Ensure continuous, unique sequence_order per quotation
                    $seq = isset($item['sequence_order']) && is_numeric($item['sequence_order'])
                        ? intval($item['sequence_order'])
                        : ($index + 1);
                    if (isset($seqSeen[$seq])) {
                        // Bump to next available sequence
                        while (isset($seqSeen[$seq])) { $seq++; }
                    }
                    $seqSeen[$seq] = true;

                    QuotationItem::create([
                        'quotation_id' => $quotation->id,
                        'pricing_request_id' => $item['pricing_request_id'] ?? null,
                        'item_name' => $item['item_name'] ?? 'ไม่ระบุชื่องาน',
                        'item_description' => $item['item_description'] ?? null,
                        'sequence_order' => $seq,
                        'pattern' => $item['pattern'] ?? null,
                        'fabric_type' => $item['fabric_type'] ?? null,
                        'color' => $item['color'] ?? null,
                        'size' => $item['size'] ?? null,
                        'unit_price' => $item['unit_price'] ?? 0,
                        'quantity' => $item['quantity'] ?? 0,
                        'unit' => array_key_exists('unit', $item) ? ($item['unit'] === '' ? null : $item['unit']) : null,
                        'discount_percentage' => $item['discount_percentage'] ?? 0,
                        'discount_amount' => $item['discount_amount'] ?? 0,
                        'notes' => $item['notes'] ?? null,
                        'status' => $item['status'] ?? 'draft',
                        'created_by' => $updatedBy,
                        'updated_by' => $updatedBy,
                    ]);
                }

                // Also sync the quotation's primary_pricing_request_ids to reflect remaining jobs
                try {
                    if (\Illuminate\Support\Facades\Schema::hasColumn('quotations', 'primary_pricing_request_ids')) {
                        $remainingPrIds = collect($data['items'])
                            ->pluck('pricing_request_id')
                            ->filter()
                            ->unique()
                            ->values()
                            ->all();
                        $quotation->primary_pricing_request_ids = $remainingPrIds;
                        $quotation->save();
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to sync primary_pricing_request_ids: ' . $e->getMessage());
                }
            }

            // บันทึก History
            DocumentHistory::logAction('quotation', $quotation->id, 'updated', $updatedBy, 'แก้ไขใบเสนอราคา');

            // ✅ Sync to related invoices if any exist
            $hasInvoices = $quotation->invoices()->exists();
            if ($hasInvoices) {
                try {
                    // Reload quotation with items to ensure we have latest data
                    $quotation->load('items');
                    
                    // Perform immediate sync
                    $syncResult = $this->syncService->syncToInvoicesImmediately($quotation, $updatedBy);
                    
                    Log::info('Quotation updated and synced to invoices', [
                        'quotation_id' => $quotation->id,
                        'sync_job_id' => $syncResult['job_id'] ?? null,
                        'updated_count' => $syncResult['updated_count'] ?? 0
                    ]);
                } catch (\Exception $syncError) {
                    // Log sync error but don't fail the quotation update
                    Log::error('Failed to sync quotation to invoices: ' . $syncError->getMessage(), [
                        'quotation_id' => $quotation->id,
                        'error' => $syncError->getMessage()
                    ]);
                    
                    // Still commit the quotation update
                    // The admin can manually trigger sync later if needed
                }
            }

            DB::commit();

            return $quotation->load(['customer', 'creator', 'items', 'company']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::update error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ลบใบเสนอราคา (Soft Delete)
     * @param mixed $id
     * @param mixed $deletedBy
     * @param mixed $reason
     * @return bool
     */
    public function delete($id, $deletedBy = null, $reason = null): bool
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::findOrFail($id);
            
            // ตรวจสอบว่าสามารถลบได้หรือไม่
            if (in_array($quotation->status, ['approved', 'sent', 'completed'])) {
                throw new \Exception('Cannot delete quotation that has been approved, sent, or completed');
            }

            // Soft delete (ในที่นี้เปลี่ยนสถานะแทนการลบจริง)
            $quotation->status = 'deleted';
            $quotation->save();

            // บันทึก History
            DocumentHistory::logAction('quotation', $quotation->id, 'deleted', $deletedBy, $reason ?? 'ลบใบเสนอราคา');

            DB::commit();

            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::delete error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * ดึงข้อมูล Quotation และ Items สำหรับการทำสำเนา (Duplicate)
     * โดยล้างค่า ID, number, status, และรูปภาพ เพื่อให้พร้อมสำหรับการสร้างใหม่
     *
     * @param string $id ID ของ Quotation ต้นฉบับ
     * @return array<string,mixed> ข้อมูลที่พร้อมสำหรับส่งให้ Frontend
     */
    public function getDataForDuplication(string $id): array
    {
        try {
            // 1. โหลดข้อมูลต้นฉบับ (ต้องแน่ใจว่าโหลด 'items' และ 'customer' มาด้วย)
            $original = Quotation::with(['items', 'customer'])->findOrFail($id);

            // 2. แปลงเป็น array
            $newData = $original->toArray();

            // 3. ล้างข้อมูล ID และสถานะของ Quotation หลัก
            unset($newData['id']);
            // ไม่ลบ number เพื่อให้แสดงเลขเดิมในหน้าจอ (จะถูกสร้างใหม่ตอน save)
            // unset($newData['number']);
            unset($newData['created_at']);
            unset($newData['updated_at']);
            unset($newData['approved_at']);
            unset($newData['approved_by']);
            unset($newData['submitted_at']);
            unset($newData['submitted_by']);
            
            // เก็บ primary_pricing_request_id และ primary_pricing_request_ids ไว้
            // (ไม่ลบ - ให้คัดลอกมาด้วย)
            
            // 4. ล้างข้อมูลรูปภาพและไฟล์แนบ
            $newData['signature_images'] = []; // ไม่คัดลอกรูป signature
            // คงรูป sample_images ไว้ (ถ้าต้องการคัดลอก)
            // $newData['sample_images'] = $newData['sample_images'] ?? [];

            // 5. ตั้งค่าสถานะเริ่มต้น
            $newData['status'] = 'draft'; 
            
            // 6. ลบข้อความ "(สำเนาจาก ...)" ออกจาก notes
            if (!empty($newData['notes'])) {
                $newData['notes'] = preg_replace('/\n*\(\s*สำเนาจาก\s+[^\)]+\)\s*$/u', '', $newData['notes']);
                $newData['notes'] = trim($newData['notes']);
            }
            
            // 7. DEFENSE-IN-DEPTH: Normalize sequence orders (Preprocessing)
            if (isset($newData['items']) && is_array($newData['items'])) {
                // Sort by existing sequence_order first
                usort($newData['items'], function($a, $b) {
                    $seqA = $a['sequence_order'] ?? 999999;
                    $seqB = $b['sequence_order'] ?? 999999;
                    return $seqA <=> $seqB;
                });

                // Re-assign continuous sequence orders and clean up item data
                $newData['items'] = array_values(array_map(function($item, $index) {
                    unset($item['id']);
                    unset($item['quotation_id']);
                    unset($item['created_at']);
                    unset($item['updated_at']);
                    
                    // Assign normalized sequence order (1-based, continuous)
                    $item['sequence_order'] = $index + 1;
                    
                    return $item;
                }, $newData['items'], array_keys($newData['items'])));

                Log::info('QuotationService::getDataForDuplication - Normalized sequence orders', [
                    'original_quotation_id' => $id,
                    'item_count' => count($newData['items']),
                    'sequences' => array_column($newData['items'], 'sequence_order')
                ]);
            }

            return $newData;

        } catch (\Exception $e) {
            Log::error('QuotationService::getDataForDuplication error: ' . $e->getMessage());
            throw $e;
        }
    }
}
