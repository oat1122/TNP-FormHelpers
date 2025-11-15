<?php

namespace App\Services\Support;

use App\Models\DocumentSequence;
use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    /**
     * Generate next document number per company, doc type and month.
     * Each company has independent sequences that reset monthly.
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

        // Transaction + lock row to avoid race; use company-specific sequence
        return DB::transaction(function () use ($companyId, $docType, $year, $month, $prefix, $pad) {
            // Find or create sequence record for THIS COMPANY
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
                'invoice_before' => 'invoices',  // มัดจำก่อนใช้ตาราง invoices เหมือนกัน
                'invoice_after' => 'invoices',   // มัดจำหลังใช้ตาราง invoices เหมือนกัน
                'receipt' => 'receipts',
                'tax_invoice' => 'receipts',
                'full_tax_invoice' => 'receipts',
                'delivery_note' => 'delivery_notes',
            ];
            $table = $tableMap[$docType] ?? null;

            // Auto-healing: Check if sequences are out of sync with actual data (FOR THIS COMPANY ONLY)
            if ($table) {
                $actualMaxNumber = DB::table($table)
                    ->where('company_id', $companyId)
                    ->where('number', 'like', $prefix . '-%')
                    ->selectRaw('MAX(CAST(SUBSTRING(number, -4) AS UNSIGNED)) as max_num')
                    ->first()->max_num ?? 0;
                
                // If sequence is ahead of actual data, reset to match reality
                if ($row->last_number > $actualMaxNumber) {
                    \Log::info("DocumentNumberService: Auto-healing sequences for {$docType} {$year}/{$month} (Company: {$companyId})", [
                        'old_sequence' => $row->last_number,
                        'actual_max' => $actualMaxNumber,
                        'prefix' => $prefix
                    ]);
                    
                    $row->last_number = $actualMaxNumber;
                    $row->save();
                }
            }

            // Find next available number starting from company's last_number + 1
            $seqNumber = $row->last_number + 1;
            
            if ($table) {
                // Check only THIS COMPANY's documents to ensure uniqueness within company scope
                $allNumbers = DB::table($table)
                    ->where('company_id', $companyId)
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

            return $candidate;
        });
    }

    /**
     * Generate invoice number based on deposit mode
     * @param string $companyId
     * @param string $depositMode 'before' or 'after'
     * @param string|null $date Y-m-d date string (defaults to today)
     * @return string
     */
    public function nextInvoiceNumber(string $companyId, string $depositMode, ?string $date = null): string
    {
        $docType = $depositMode === 'before' ? 'invoice_before' : 'invoice_after';
        return $this->next($companyId, $docType, $date);
    }
}
