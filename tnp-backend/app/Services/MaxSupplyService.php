<?php

namespace App\Services;

use App\Models\MaxSupply;
use App\Models\Worksheet\Worksheet;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class MaxSupplyService
{
    /**
     * สร้างงานใหม่
     */
    public function create(array $data): MaxSupply
    {
        return DB::transaction(function () use ($data) {
            // Auto-fill จาก worksheet
            $worksheet = Worksheet::with(['customer', 'shirtPattern', 'shirtScreen'])
                ->findOrFail($data['worksheet_id']);

            // คำนวณขนาดจาก worksheet
            $sizes = $this->extractSizesFromWorksheet($worksheet);

            // คำนวณจุดพิมพ์จาก worksheet
            $printPoints = $this->calculatePrintPointsFromWorksheet($worksheet);

            $maxSupply = MaxSupply::create([
                'code' => $this->generateCode(),
                'worksheet_id' => $data['worksheet_id'],
                'title' => $data['title'] ?? $worksheet->work_name,
                'customer_name' => $worksheet->customer->cus_name ?? 'Unknown',
                'production_type' => $data['production_type'],
                'start_date' => $data['start_date'] ?? now(),
                'expected_completion_date' => $data['expected_completion_date'],
                'due_date' => $worksheet->due_date,
                'status' => 'pending',
                'priority' => $data['priority'] ?? 'normal',
                'shirt_type' => $this->mapShirtType($worksheet->type_shirt),
                'total_quantity' => $worksheet->total_quantity,
                'completed_quantity' => 0,
                'sizes' => $data['sizes'] ?? $sizes,
                'screen_points' => $printPoints['screen'],
                'dtf_points' => $printPoints['dtf'],
                'sublimation_points' => $printPoints['sublimation'],
                'notes' => $data['notes'] ?? null,
                'special_instructions' => $data['special_instructions'] ?? $worksheet->worksheet_note,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Log activity
            $this->logActivity($maxSupply, 'created', 'สร้างงานใหม่');

            return $maxSupply->fresh(['worksheet', 'creator']);
        });
    }

    /**
     * แก้ไขงาน
     */
    public function update(MaxSupply $maxSupply, array $data): MaxSupply
    {
        return DB::transaction(function () use ($maxSupply, $data) {
            $oldValues = $maxSupply->toArray();

            $maxSupply->update(array_merge($data, [
                'updated_by' => auth()->id(),
            ]));

            // Log activity
            $changes = array_diff_assoc($data, $oldValues);
            if (!empty($changes)) {
                $this->logActivity($maxSupply, 'updated', 'แก้ไขข้อมูลงาน', $oldValues, $data);
            }

            return $maxSupply->fresh(['worksheet', 'creator']);
        });
    }

    /**
     * เปลี่ยนสถานะ
     */
    public function updateStatus(MaxSupply $maxSupply, string $status, ?int $completedQuantity = null): MaxSupply
    {
        return DB::transaction(function () use ($maxSupply, $status, $completedQuantity) {
            $oldStatus = $maxSupply->status;

            $updateData = [
                'status' => $status,
                'updated_by' => auth()->id(),
            ];

            if ($completedQuantity !== null) {
                $updateData['completed_quantity'] = $completedQuantity;
            }

            if ($status === 'completed') {
                $updateData['actual_completion_date'] = now();
                $updateData['completed_quantity'] = $maxSupply->total_quantity;
            }

            $maxSupply->update($updateData);

            // Log activity
            $this->logActivity($maxSupply, 'status_changed', "เปลี่ยนสถานะจาก {$oldStatus} เป็น {$status}");

            return $maxSupply->fresh(['worksheet', 'creator']);
        });
    }

    /**
     * ลบงาน
     */
    public function delete(MaxSupply $maxSupply): bool
    {
        return DB::transaction(function () use ($maxSupply) {
            $this->logActivity($maxSupply, 'deleted', 'ลบงาน');
            return $maxSupply->delete();
        });
    }

    /**
     * สร้างรหัสงาน
     */
    private function generateCode(): string
    {
        $today = now()->format('Ymd');
        $count = MaxSupply::whereDate('created_at', now())->count() + 1;

        return "MS-{$today}-" . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    /**
     * ดึงข้อมูลขนาดจาก worksheet
     */
    private function extractSizesFromWorksheet(Worksheet $worksheet): array
    {
        $sizes = [];

        // ถ้ามี example quantity ให้ใช้
        if ($worksheet->exampleQty->isNotEmpty()) {
            foreach ($worksheet->exampleQty as $example) {
                $sizes[$example->size_name] = $example->quantity;
            }
        } else {
            // ใช้ total quantity แบ่งเท่าๆ กัน
            $defaultSizes = ['S', 'M', 'L', 'XL'];
            $qtyPerSize = intval($worksheet->total_quantity / count($defaultSizes));
            $remainder = $worksheet->total_quantity % count($defaultSizes);

            foreach ($defaultSizes as $index => $size) {
                $sizes[$size] = $qtyPerSize + ($index === 0 ? $remainder : 0);
            }
        }

        return $sizes;
    }

    /**
     * คำนวณจุดพิมพ์จาก worksheet
     */
    private function calculatePrintPointsFromWorksheet(Worksheet $worksheet): array
    {
        $screen = $worksheet->shirtScreen;

        return [
            'screen' => $screen->screen_point ?? 0,
            'dtf' => $screen->screen_dft ?? 0,
            'sublimation' => 0, // ยังไม่มีใน worksheet เดิม
        ];
    }

    /**
     * แปลงประเภทเสื้อ
     */
    private function mapShirtType(string $worksheetType): string
    {
        $mapping = [
            't-shirt' => 't-shirt',
            'polo-shirt' => 'polo',
            'hoodie' => 'hoodie',
            'tank-top' => 'tank-top',
        ];

        return $mapping[$worksheetType] ?? 't-shirt';
    }

    /**
     * บันทึก activity log
     */
    private function logActivity(MaxSupply $maxSupply, string $action, string $description, ?array $oldValues = null, ?array $newValues = null): void
    {
        ActivityLog::create([
            'max_supply_id' => $maxSupply->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }
}
