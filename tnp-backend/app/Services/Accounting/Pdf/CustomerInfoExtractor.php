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

        // Name (prefer snapshot: cus_company/customer_company)
        $name = $snap['cus_company']
            ?? $snap['customer_company']
            ?? $q->customer_company
            ?? optional($q->customer)->cus_company
            ?? '';

        // Address + zip (prefer snapshot)
        $address = $snap['cus_address']
            ?? $snap['customer_address']
            ?? $q->customer_address
            ?? optional($q->customer)->cus_address
            ?? '';
        $zip = $snap['cus_zip_code']
            ?? $snap['customer_zip_code']
            ?? $q->customer_zip_code
            ?? optional($q->customer)->cus_zip_code
            ?? '';
        if ($address && $zip) {
            $a = trim((string)$address);
            $z = trim((string)$zip);
            // Append zip only if it's not already present as a standalone token
            $hasZip = preg_match('/\b' . preg_quote($z, '/') . '\b/u', $a) === 1;
            $address = $hasZip ? $a : ($a . ' ' . $z);
        }

        // Tax ID
        $tax = $snap['cus_tax_id']
            ?? $snap['customer_tax_id']
            ?? $q->customer_tax_id
            ?? optional($q->customer)->cus_tax_id
            ?? '';

        // Telephone: explicitly prefer master_customers.cus_tel_1
        $tel = optional($q->customer)->cus_tel_1
            ?? '';
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
                    ?? optional($q->customer)->cus_tel_2
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
