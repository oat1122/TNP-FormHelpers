<?php

namespace App\Services\Support;

use App\Models\DocumentSequence;
use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    /**
     * Generate next document number per company, doc type and month.
     * @param string $companyId
     * @param string $docType one of: quotation, invoice, receipt, delivery_note, tax_invoice
     * @param string|null $date Y-m-d date string (defaults to today)
     * @param string|null $customPrefix override prefix before YYYYMM
     * @param int $pad
     */
    public function next(string $companyId, string $docType, ?string $date = null, ?string $customPrefix = null, int $pad = 4): string
    {
        $date = $date ?: date('Y-m-d');
        $year = date('Y', strtotime($date));
        $month = date('m', strtotime($date));

        $prefixMap = [
            'quotation' => 'QT',
            'invoice' => 'INV',
            'receipt' => 'RCPT',
            'tax_invoice' => 'TAX',
            'full_tax_invoice' => 'FTAX',
            'delivery_note' => 'DN',
        ];

        $prefix = $customPrefix ?? ($prefixMap[$docType] ?? strtoupper(substr($docType, 0, 3)));
        $prefix .= $year . $month;

        // transaction + upsert/lock row to avoid race
        return DB::transaction(function () use ($companyId, $docType, $year, $month, $prefix, $pad) {
            $row = DocumentSequence::where([
                'company_id' => $companyId,
                'doc_type' => $docType,
                'year' => (int)$year,
                'month' => (int)$month,
            ])->lockForUpdate()->first();

            if (!$row) {
                $row = DocumentSequence::create([
                    'company_id' => $companyId,
                    'doc_type' => $docType,
                    'year' => (int)$year,
                    'month' => (int)$month,
                    'last_number' => 0,
                ]);
            }

            $row->last_number = (int)$row->last_number + 1;
            $row->save();

            $seq = str_pad((string)$row->last_number, $pad, '0', STR_PAD_LEFT);
            return $prefix . '-' . $seq;
        });
    }
}
