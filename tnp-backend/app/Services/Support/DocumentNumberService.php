<?php

namespace App\Services\Support;

use App\Models\DocumentSequence;
use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    /**
     * Generate next document number per company, doc type and month.
     * Ensures consistent numbering across all companies by using global sequences.
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
            'invoice_before' => 'INVB',  // มัดจำก่อน
            'invoice_after' => 'INVA',   // มัดจำหลัง
            'receipt' => 'RCPT',
            'tax_invoice' => 'TAX',
            'full_tax_invoice' => 'FTAX',
            'delivery_note' => 'DN',
        ];

        $prefix = $customPrefix ?? ($prefixMap[$docType] ?? strtoupper(substr($docType, 0, 3)));
        $prefix .= $year . $month;

    // transaction + lock row to avoid race; use global sequence to ensure consistency across companies
    return DB::transaction(function () use ($companyId, $docType, $year, $month, $prefix, $pad) {
            // Find or create sequence record for this company
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

            // Find the global maximum sequence number across all companies for this doc type, year, month
            $globalMaxSeq = DocumentSequence::where([
                'doc_type' => $docType,
                'year' => (int)$year,
                'month' => (int)$month,
            ])->max('last_number') ?? 0;

            // Map docType to model/table for existence check
            $tableMap = [
                'quotation' => 'quotations',
                'invoice' => 'invoices',
                'invoice_before' => 'invoices',  // มัดจำก่อนใช้ตาราง invoices เหมือนกัน
                'invoice_after' => 'invoices',   // มัดจำหลังใช้ตาราง invoices เหมือนกัน
                'receipt' => 'receipts',
                'tax_invoice' => 'receipts',
                'full_tax_invoice' => 'receipts',
                'delivery_note' => 'delivery_notes',
            ];
            $table = $tableMap[$docType] ?? null;

            // Auto-healing: Check if sequences are out of sync with actual data
            if ($table) {
                $actualMaxNumber = DB::table($table)
                    ->where('number', 'like', $prefix . '-%')
                    ->selectRaw('MAX(CAST(SUBSTRING(number, -4) AS UNSIGNED)) as max_num')
                    ->first()->max_num ?? 0;
                
                // If sequence is ahead of actual data, it means documents were deleted
                // Reset sequences to match reality to avoid gaps
                if ($globalMaxSeq > $actualMaxNumber) {
                    \Log::info("DocumentNumberService: Auto-healing sequences for {$docType} {$year}/{$month}", [
                        'old_sequence' => $globalMaxSeq,
                        'actual_max' => $actualMaxNumber,
                        'prefix' => $prefix
                    ]);
                    
                    DocumentSequence::where([
                        'doc_type' => $docType,
                        'year' => (int)$year,
                        'month' => (int)$month,
                    ])->update(['last_number' => $actualMaxNumber]);
                    
                    $globalMaxSeq = $actualMaxNumber;
                }
            }

            // Find next available number starting from global max + 1
            $seqNumber = $globalMaxSeq + 1;
            
            if ($table) {
                // Check across ALL companies to ensure global uniqueness
                $allNumbers = DB::table($table)
                    ->where('number', 'like', $prefix . '-%')
                    ->pluck('number')
                    ->all();

                $used = [];
                foreach ($allNumbers as $num) {
                    if (is_string($num) && preg_match('/-(\d+)$/', $num, $m)) {
                        $used[(int)$m[1]] = true;
                    }
                }

                // Find the smallest positive integer >= seqNumber that is not in $used
                while (isset($used[$seqNumber])) {
                    $seqNumber++;
                    // Hard cap to avoid pathological loops
                    if ($seqNumber > 100000) { break; }
                }
            }

            // Build candidate with padding
            $candidate = $prefix . '-' . str_pad((string)$seqNumber, $pad, '0', STR_PAD_LEFT);

            // Update this company's last_number
            $row->last_number = $seqNumber;
            $row->save();

            // Update all other companies' sequences for this doc_type/year/month to maintain consistency
            DocumentSequence::where([
                'doc_type' => $docType,
                'year' => (int)$year,
                'month' => (int)$month,
            ])->where('company_id', '!=', $companyId)
            ->update(['last_number' => DB::raw("GREATEST(last_number, $seqNumber)")]);

            return $candidate;
        });
    }
}
