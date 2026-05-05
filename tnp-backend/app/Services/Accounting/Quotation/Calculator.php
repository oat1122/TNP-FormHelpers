<?php

namespace App\Services\Accounting\Quotation;

use App\Models\Accounting\Quotation;

class Calculator
{
    /**
     * คำนวณฐานสำหรับมัดจำแบบก่อน VAT (Pre-VAT)
     * ใช้ subtotal หักด้วยส่วนลดพิเศษ ถ้ามีข้อมูลไม่ครบจะ fallback เป็น (total_amount - vat_amount - special_discount_amount)
     *
     * @param  array<string,mixed>|null  $ref
     */
    public function computeDepositBasePreVat(Quotation $q, ?array $ref = null): float
    {
        $subtotal = (float) ($ref['subtotal'] ?? $q->subtotal ?? 0);
        $special = (float) ($ref['special_discount_amount'] ?? $q->special_discount_amount ?? 0);
        $base = max(0.0, round($subtotal - $special, 2));

        if ($base <= 0.0) {
            $total = (float) ($ref['total_amount'] ?? $q->total_amount ?? 0);
            $vat = (float) ($ref['vat_amount'] ?? $q->vat_amount ?? 0);
            $base = max(0.0, round(($total - $vat - $special), 2));
        }

        return $base;
    }

    /**
     * Net amount after special discount (still before withholding tax).
     * = total_amount - special_discount_amount
     */
    public function netAfterDiscount(Quotation $q): float
    {
        return (float) $q->total_amount - (float) $q->special_discount_amount;
    }

    /**
     * Withholding tax amount on the pre-VAT subtotal.
     * ภาษีหัก ณ ที่จ่าย = ยอดก่อนภาษี × อัตราภาษี
     * Returns 0 when withholding tax is disabled or rate is non-positive.
     */
    public function calculatedWithholdingTax(Quotation $q): float
    {
        if (! $q->has_withholding_tax || $q->withholding_tax_percentage <= 0) {
            return 0.0;
        }

        return (float) $q->subtotal * ((float) $q->withholding_tax_percentage / 100);
    }

    /**
     * Final net amount after special discount and withholding tax.
     * ยอดสุทธิสุดท้าย = ยอดหลังหักส่วนลดพิเศษ - ภาษีหัก ณ ที่จ่าย
     */
    public function finalNetAmount(Quotation $q): float
    {
        return $this->netAfterDiscount($q) - $this->calculatedWithholdingTax($q);
    }
}
