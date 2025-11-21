<?php

namespace App\Services\Accounting\Quotation;

use App\Models\Accounting\Quotation;

class Calculator
{
    /**
     * คำนวณฐานสำหรับมัดจำแบบก่อน VAT (Pre-VAT)
     * ใช้ subtotal หักด้วยส่วนลดพิเศษ ถ้ามีข้อมูลไม่ครบจะ fallback เป็น (total_amount - vat_amount - special_discount_amount)
     * @param array<string,mixed>|null $ref
     */
    public function computeDepositBasePreVat(Quotation $q, ?array $ref = null): float
    {
        $subtotal = (float) ($ref['subtotal'] ?? $q->subtotal ?? 0);
        $special  = (float) ($ref['special_discount_amount'] ?? $q->special_discount_amount ?? 0);
        $base     = max(0.0, round($subtotal - $special, 2));

        if ($base <= 0.0) {
            $total = (float) ($ref['total_amount'] ?? $q->total_amount ?? 0);
            $vat   = (float) ($ref['vat_amount'] ?? $q->vat_amount ?? 0);
            $base  = max(0.0, round(($total - $vat - $special), 2));
        }

        return $base;
    }
}
