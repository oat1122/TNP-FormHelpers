<?php

namespace App\Services\MaxSupply;

use App\Enums\MaxSupply\ProductionType;
use App\Models\MaxSupply\ActivityLog;
use App\Models\MaxSupply\MaxSupply;
use App\Models\NewWorksheet;
use App\Models\NewWorksheetScreen;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MaxSupplyService
{
    /**
     * Create a new max supply record.
     */
    public function create(array $data): MaxSupply
    {
        return DB::transaction(function () use ($data) {
            // Auto-fill from worksheet
            $worksheet = NewWorksheet::findOrFail($data['worksheet_id']);
            
            // Create max supply
            $maxSupply = MaxSupply::create([
                'code' => $this->generateCode(),
                'worksheet_id' => $data['worksheet_id'],
                'screen_id' => $data['screen_id'] ?? $worksheet->screen_id ?? null,
                'title' => $data['title'],
                'customer_name' => $data['customer_name'],
                'production_type' => $data['production_type'],
                'start_date' => $data['start_date'],
                'expected_completion_date' => $data['expected_completion_date'],
                'due_date' => $data['due_date'],
                'status' => 'pending',
                'priority' => $data['priority'] ?? 'normal',
                'shirt_type' => $data['shirt_type'],
                'total_quantity' => $data['total_quantity'],
                'completed_quantity' => 0,
                'sizes' => $data['sizes'],
                'screen_points' => $this->calculatePoints($data, ProductionType::SCREEN->value),
                'dtf_points' => $this->calculatePoints($data, ProductionType::DTF->value),
                'sublimation_points' => $this->calculatePoints($data, ProductionType::SUBLIMATION->value),
                'notes' => $data['notes'] ?? null,
                'special_instructions' => $data['special_instructions'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Log activity
            $this->logActivity($maxSupply, 'created', 'สร้างงานใหม่');

            return $maxSupply;
        });
    }

    /**
     * Update a max supply record.
     */
    public function update(MaxSupply $maxSupply, array $data): MaxSupply
    {
        return DB::transaction(function () use ($maxSupply, $data) {
            $oldValues = $maxSupply->toArray();

            $updateData = array_merge($data, [
                'updated_by' => Auth::id(),
            ]);

            $maxSupply->update($updateData);

            // Log activity
            $this->logActivity($maxSupply, 'updated', 'แก้ไขข้อมูลงาน', $oldValues, $maxSupply->toArray());

            return $maxSupply;
        });
    }

    /**
     * Update the status of a max supply record.
     */
    public function updateStatus(MaxSupply $maxSupply, string $status, ?int $completedQuantity = null): MaxSupply
    {
        return DB::transaction(function () use ($maxSupply, $status, $completedQuantity) {
            $oldStatus = $maxSupply->status;
            $oldValues = $maxSupply->toArray();

            $updateData = [
                'status' => $status,
                'updated_by' => Auth::id(),
            ];

            if ($completedQuantity !== null) {
                $updateData['completed_quantity'] = $completedQuantity;
            }

            if ($status === 'completed' && $oldStatus !== 'completed') {
                $updateData['actual_completion_date'] = now();
                $updateData['completed_quantity'] = $maxSupply->total_quantity;
            }

            $maxSupply->update($updateData);

            // Log activity
            $this->logActivity(
                $maxSupply, 
                'status_changed', 
                "เปลี่ยนสถานะจาก {$oldStatus} เป็น {$status}", 
                $oldValues, 
                $maxSupply->toArray()
            );

            return $maxSupply;
        });
    }

    /**
     * Delete a max supply record.
     */
    public function delete(MaxSupply $maxSupply): void
    {
        DB::transaction(function () use ($maxSupply) {
            $oldValues = $maxSupply->toArray();
            
            // Log activity before deletion
            $this->logActivity($maxSupply, 'deleted', 'ลบงาน', $oldValues);
            
            $maxSupply->delete();
        });
    }

    /**
     * Generate a unique code for a max supply record.
     */
    private function generateCode(): string
    {
        $today = now()->format('Ymd');
        $count = MaxSupply::whereDate('created_at', now())->count() + 1;
        
        return "MS-{$today}-" . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate points based on production type.
     */
    private function calculatePoints(array $data, string $type): int
    {
        if ($data['production_type'] !== $type) {
            return 0;
        }

        $basePoints = match($type) {
            ProductionType::SCREEN->value => 2,
            ProductionType::DTF->value => 1,
            ProductionType::SUBLIMATION->value => 3,
            default => 1
        };

        // Calculate points based on sizes and complexity
        $sizeCount = count($data['sizes'] ?? []);
        $totalPoints = $basePoints * $sizeCount;

        // Additional points based on screen details if available
        if (!empty($data['screen_id'])) {
            $screen = NewWorksheetScreen::find($data['screen_id']);
            if ($screen) {
                if ($type === ProductionType::SCREEN->value && $screen->screen_point) {
                    $totalPoints += $screen->screen_point;
                } elseif ($type === ProductionType::DTF->value && $screen->screen_dft) {
                    $totalPoints += $screen->screen_dft;
                }
            }
        }

        return $totalPoints;
    }

    /**
     * Log an activity for a max supply record.
     */
    private function logActivity(
        MaxSupply $maxSupply,
        string $action,
        string $description,
        ?array $oldValues = null,
        ?array $newValues = null
    ): void {
        ActivityLog::create([
            'max_supply_id' => $maxSupply->id,
            'user_id' => Auth::id(),
            'action' => $action,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }
}
