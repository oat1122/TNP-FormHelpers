<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migration ข้อมูลจาก quotations.pricing_request_id เข้า quotation_pricing_requests table
        $quotations = \DB::table('quotations')
            ->whereNotNull('pricing_request_id')
            ->get();

        foreach ($quotations as $quotation) {
            $pricingRequestIds = [];
            
            // ตรวจสอบว่า pricing_request_id ไม่เป็น null
            if (empty($quotation->pricing_request_id)) {
                continue; // ข้าม quotation ที่ไม่มี pricing_request_id
            }
            
            // ตรวจสอบว่าเป็น JSON array หรือ single ID
            if (str_starts_with($quotation->pricing_request_id, '[')) {
                try {
                    $decoded = json_decode($quotation->pricing_request_id, true);
                    if (is_array($decoded)) {
                        $pricingRequestIds = $decoded;
                    } else {
                        $pricingRequestIds = [$quotation->pricing_request_id];
                    }
                } catch (\Exception $e) {
                    // ถ้า decode ไม่ได้ ให้ใช้เป็น single ID
                    $pricingRequestIds = [$quotation->pricing_request_id];
                }
            } else {
                $pricingRequestIds = [$quotation->pricing_request_id];
            }
            
            // ตรวจสอบว่า $pricingRequestIds เป็น array และไม่ว่าง
            if (!is_array($pricingRequestIds) || empty($pricingRequestIds)) {
                continue;
            }
            
            // ใส่ข้อมูลเข้า junction table
            foreach ($pricingRequestIds as $index => $pricingRequestId) {
                // ตรวจสอบว่า pricingRequestId ไม่เป็น null และไม่ว่าง
                if (empty($pricingRequestId)) {
                    continue;
                }
                
                // ตรวจสอบว่า pricing request มีอยู่จริง
                $exists = \DB::table('pricing_requests')
                    ->where('pr_id', $pricingRequestId)
                    ->exists();
                    
                if ($exists) {
                    \DB::table('quotation_pricing_requests')->insert([
                        'id' => \Illuminate\Support\Str::uuid(),
                        'quotation_id' => $quotation->id,
                        'pricing_request_id' => $pricingRequestId,
                        'sequence_order' => $index + 1,
                        'created_at' => $quotation->created_at ?? now(),
                        'updated_at' => $quotation->updated_at ?? now(),
                        'created_by' => $quotation->created_by
                    ]);
                } else {
                    \Illuminate\Support\Facades\Log::warning("Pricing request not found: {$pricingRequestId} for quotation: {$quotation->id}");
                }
            }
        }
        
        \Illuminate\Support\Facades\Log::info('Migrated quotation pricing request relationships', [
            'total_quotations_processed' => $quotations->count()
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // ลบข้อมูลใน junction table (ถ้าต้องการ rollback)
        \DB::table('quotation_pricing_requests')->truncate();
    }
};
