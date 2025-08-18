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

    // transaction + lock row to avoid race; fill gaps by choosing the smallest unused sequence for this month/company
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

            // Map docType to model/table for existence check
            $tableMap = [
                'quotation' => 'quotations',
                'invoice' => 'invoices',
                'receipt' => 'receipts',
                'tax_invoice' => 'receipts',
                'full_tax_invoice' => 'receipts',
                'delivery_note' => 'delivery_notes',
            ];
            $table = $tableMap[$docType] ?? null;

            // Compute the smallest unused running number for this prefix within the target table (gap filling)
            $seqNumber = 1;
            if ($table) {
                $numbers = DB::table($table)
                    ->where('company_id', $companyId)
                    ->where('number', 'like', $prefix . '-%')
                    ->pluck('number')
                    ->all();

                $used = [];
                foreach ($numbers as $num) {
                    if (is_string($num) && preg_match('/-(\d+)$/', $num, $m)) {
                        $used[(int)$m[1]] = true;
                    }
                }

                // Find the smallest positive integer not in $used
                $seqNumber = 1;
                while (isset($used[$seqNumber])) {
                    $seqNumber++;
                    // Hard cap to avoid pathological loops
                    if ($seqNumber > 100000) { break; }
                }
            }

            // Build candidate with padding
            $candidate = $prefix . '-' . str_pad((string)$seqNumber, $pad, '0', STR_PAD_LEFT);

            // Keep last_number as the max ever issued (do not decrease)
            $row->last_number = max((int)$row->last_number, (int)$seqNumber);
            $row->save();

            return $candidate;
        });
    }
}
