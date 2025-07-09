<?php

namespace App\Observers\MaxSupply;

use App\Models\MaxSupply\ActivityLog;
use App\Models\MaxSupply\MaxSupply;
use Illuminate\Support\Facades\Auth;

class MaxSupplyObserver
{
    /**
     * Handle the MaxSupply "created" event.
     */
    public function created(MaxSupply $maxSupply): void
    {
        $this->logActivity($maxSupply, 'created', 'สร้างงานใหม่');
    }

    /**
     * Handle the MaxSupply "updated" event.
     */
    public function updated(MaxSupply $maxSupply): void
    {
        $changes = $maxSupply->getChanges();
        
        // Remove timestamps from changes
        unset($changes['updated_at']);
        
        if (!empty($changes)) {
            if (isset($changes['status'])) {
                $originalStatus = $maxSupply->getOriginal('status');
                $newStatus = $changes['status'];
                
                $this->logActivity(
                    $maxSupply, 
                    'status_changed', 
                    "เปลี่ยนสถานะจาก {$originalStatus} เป็น {$newStatus}",
                    ['status' => $originalStatus],
                    ['status' => $newStatus]
                );
            } else {
                $this->logActivity(
                    $maxSupply, 
                    'updated', 
                    'แก้ไขข้อมูลงาน',
                    array_intersect_key($maxSupply->getOriginal(), $changes),
                    $changes
                );
            }
        }
    }

    /**
     * Handle the MaxSupply "deleted" event.
     */
    public function deleted(MaxSupply $maxSupply): void
    {
        $this->logActivity($maxSupply, 'deleted', 'ลบงาน', $maxSupply->getOriginal());
    }

    /**
     * Handle the MaxSupply "restored" event.
     */
    public function restored(MaxSupply $maxSupply): void
    {
        $this->logActivity($maxSupply, 'restored', 'กู้คืนงาน');
    }

    /**
     * Handle the MaxSupply "force deleted" event.
     */
    public function forceDeleted(MaxSupply $maxSupply): void
    {
        $this->logActivity($maxSupply, 'force_deleted', 'ลบงานถาวร', $maxSupply->getOriginal());
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
