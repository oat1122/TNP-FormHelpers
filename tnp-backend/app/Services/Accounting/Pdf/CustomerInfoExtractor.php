<?php

namespace App\Services\Accounting\Pdf;

use App\Models\Accounting\Quotation;

/**
 * Centralized extractor for customer info used in PDF documents.
 * Keeps field names aligned with AutofillService and avoids duplication.
 */
class CustomerInfoExtractor
{
    /**
     * Extract customer fields from a Quotation model into a normalized array.
     *
     * Returns keys: name, address, tax_id, tel
     */
    public static function fromQuotation(Quotation $q): array
    {
        $snap = is_array($q->customer_snapshot ?? null) ? $q->customer_snapshot : [];

        /*
         * เปลี่ยนลำดับความสำคัญของข้อมูล:
         *  1. ข้อมูลสดจากความสัมพันธ์ master_customers (หลังกดอัปเดตในหน้าจอลูกค้า)
         *  2. คอลัมน์ที่เก็บซ้ำในตาราง quotations (customer_*)
         *  3. snapshot ที่บันทึกไว้ตอนสร้าง/แก้ไข (customer_snapshot)
         * เหตุผล: ผู้ใช้คาดหวังให้ PDF แสดงข้อมูลล่าสุดหลังแก้ไขลูกค้า ไม่ต้องรอสร้างใบใหม่
         * ถ้าภายหลังต้อง “ตรึง” ข้อมูล ณ เวลาที่ออกใบ ให้เพิ่ม flag เช่น use_customer_snapshot = true
         */
        try {
            if ($q->relationLoaded('customer')) {
                // refresh เฉพาะ relation เพื่อดึงค่าที่เพิ่งแก้ใน DB (ถ้ามี)
                $q->getRelation('customer')->refresh();
            } else {
                $q->load('customer');
            }
        } catch (\Throwable $e) {
            // ไม่ต้องโยนต่อ ปล่อยให้ fallback ด้านล่างจัดการ
        }
        $live = optional($q->getRelation('customer') ?? $q->customer);

        // Name (live -> quotation columns -> snapshot)
        $name = $live->cus_company
            ?? $q->customer_company
            ?? $snap['cus_company']
            ?? $snap['customer_company']
            ?? '';

        // Address + zip (live first)
        $address = $live->cus_address
            ?? $q->customer_address
            ?? $snap['cus_address']
            ?? $snap['customer_address']
            ?? '';
        $zip = $live->cus_zip_code
            ?? $q->customer_zip_code
            ?? $snap['cus_zip_code']
            ?? $snap['customer_zip_code']
            ?? '';
        if ($address && $zip) {
            $a = trim((string)$address);
            $z = trim((string)$zip);
            // Append zip only if it's not already present as a standalone token
            $hasZip = preg_match('/\b' . preg_quote($z, '/') . '\b/u', $a) === 1;
            $address = $hasZip ? $a : ($a . ' ' . $z);
        }

        // Tax ID (live first)
        $tax = $live->cus_tax_id
            ?? $q->customer_tax_id
            ?? $snap['cus_tax_id']
            ?? $snap['customer_tax_id']
            ?? '';

        // Telephone: prefer live master customer primary tel
        $tel = $live->cus_tel_1 ?? '';
        // Normalize obvious invalids like '0' or all zeros
        $isInvalid = trim((string)$tel) === '' || preg_match('/^0+$/', (string)$tel) === 1;
        if ($isInvalid) {
            // Fallbacks if primary missing/invalid
            $tel = $snap['cus_tel_1']
                ?? $snap['customer_tel_1']
                ?? $q->customer_tel_1
                ?? '';
            if (trim((string)$tel) === '' || preg_match('/^0+$/', (string)$tel) === 1) {
                $tel = $snap['cus_tel_2']
                    ?? $snap['customer_tel_2']
                    ?? $q->customer_tel_2
                    ?? $live->cus_tel_2
                    ?? '';
            }
        }

        return [
            'name' => (string)$name,
            'address' => (string)$address,
            'tax_id' => (string)$tax,
            'tel' => (string)$tel,
        ];
    }
}
