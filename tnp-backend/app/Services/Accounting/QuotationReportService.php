<?php

namespace App\Services\Accounting;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Read-only quotation report. Two flavours:
 *   - getReportData()  — array payload (rows + summary) for the FE
 *   - exportCsv()      — Thai-localized CSV with BOM for Excel compatibility
 *
 * Both share the same filtered query + summary aggregation.
 */
class QuotationReportService
{
    /**
     * Status code → Thai label, used in the CSV's "สถานะ" column.
     */
    private const STATUS_LABELS = [
        'draft' => 'แบบร่าง',
        'pending_review' => 'รอตรวจสอบ',
        'approved' => 'อนุมัติแล้ว',
        'sent' => 'ส่งแล้ว',
        'completed' => 'เสร็จสิ้น',
        'rejected' => 'ยกเลิก/ปฏิเสธ',
    ];

    /**
     * CSV column headers (Thai). Order is the contract — must stay aligned
     * with the row builder in `formatCsvRow()`.
     */
    private const CSV_COLUMNS = [
        'ลำดับที่',
        'เลขที่เอกสาร',
        'วัน/เดือน/ปี',
        'ชื่อลูกค้า',
        'ชื่อโปรเจ็ค',
        'เลขผู้เสียภาษี',
        'สำนักงานใหญ่/สาขา',
        'มูลค่า',
        'ภาษีมูลค่าเพิ่ม',
        'ยอดรวมสุทธิ',
        'สกุลเงินในเอกสาร',
        'อัตราแลกเปลี่ยน',
        'สถานะ',
        'พนักงานขาย',
        'หมายเหตุ',
    ];

    /**
     * UTF-8 BOM bytes — prepended to CSV output so Excel renders Thai text
     * correctly without manual encoding configuration.
     */
    private const UTF8_BOM = "\xEF\xBB\xBF";

    /**
     * Statuses that are excluded from financial summary aggregation
     * (rejected quotations should not contribute to revenue figures).
     */
    private const SUMMARY_EXCLUDED_STATUSES = ['rejected'];

    // ---------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $filters
     * @return array{data: array<int, array<string, mixed>>, summary: array<string, mixed>, count: int}
     */
    public function getReportData(array $filters): array
    {
        try {
            $rows = $this->buildReportQuery($filters)->get();
            $summary = $this->calculateSummary($rows);

            return [
                'data' => $rows->values()->toArray(),
                'summary' => $summary,
                'count' => $rows->count(),
            ];
        } catch (\Exception $e) {
            Log::error('QuotationReportService::getReportData error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Build a Thai-localized CSV string (with UTF-8 BOM for Excel).
     *
     * @param  array<string, mixed>  $filters
     */
    public function exportCsv(array $filters): string
    {
        $result = $this->getReportData($filters);
        $rows = $result['data'];
        $summary = $result['summary'];

        $output = fopen('php://temp', 'r+');

        $this->writeCsvHeader($output, $filters);
        fputcsv($output, self::CSV_COLUMNS);

        $no = 1;
        foreach ($rows as $row) {
            fputcsv($output, $this->formatCsvRow((array) $row, $no));
            $no++;
        }

        $this->writeCsvSummaryFooter($output, $summary);

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return self::UTF8_BOM.$csv;
    }

    // ---------------------------------------------------------------------
    // Private helpers — query
    // ---------------------------------------------------------------------

    /**
     * Build the filtered + ordered base query for both report flavours.
     *
     * @param  array<string, mixed>  $filters
     */
    private function buildReportQuery(array $filters): Builder
    {
        $query = DB::table('quotations as q')
            ->leftJoin('users as u', 'u.user_uuid', '=', 'q.created_by')
            ->select([
                'q.id',
                'q.number',
                DB::raw('DATE(q.created_at) as document_date'),
                $this->customerSnapshotExpr('cus_company', 'customer_name'),
                $this->customerSnapshotExpr('cus_tax_id', 'tax_id'),
                $this->customerSnapshotExpr('cus_depart', 'branch'),
                'q.work_name',
                'q.subtotal',
                'q.tax_amount',
                'q.final_total_amount',
                'q.special_discount_amount',
                'q.status',
                DB::raw("CONCAT(COALESCE(u.user_firstname,''), ' ', COALESCE(u.user_lastname,'')) as salesperson"),
                'q.notes',
                'q.created_at',
            ])
            ->whereNotIn('q.status', ['deleted']);

        $this->applyFilters($query, $filters);

        return $query->orderBy('q.created_at', 'desc');
    }

    /**
     * Apply filter clauses (company / date range / status / salesperson / search).
     *
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['company_id'])) {
            $query->where('q.company_id', $filters['company_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('q.created_at', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('q.created_at', '<=', $filters['date_to']);
        }

        if (! empty($filters['status'])) {
            $statuses = is_array($filters['status'])
                ? $filters['status']
                : explode(',', $filters['status']);
            $statuses = array_filter(array_map('trim', $statuses));
            if (! empty($statuses)) {
                $query->whereIn('q.status', $statuses);
            }
        }

        if (! empty($filters['created_by'])) {
            $query->where('q.created_by', $filters['created_by']);
        }

        if (! empty($filters['search'])) {
            $like = '%'.trim($filters['search']).'%';
            $query->where(function ($q) use ($like) {
                $q->where('q.number', 'like', $like)
                    ->orWhere('q.work_name', 'like', $like)
                    ->orWhereRaw($this->customerSnapshotJsonPath('cus_company').' like ?', [$like]);
            });
        }
    }

    /**
     * SQL fragment that pulls a single field out of the customer_snapshot JSON
     * column and exposes it as a SELECT-aliased column.
     */
    private function customerSnapshotExpr(string $field, string $alias): \Illuminate\Database\Query\Expression
    {
        return DB::raw($this->customerSnapshotJsonPath($field).' as '.$alias);
    }

    /**
     * Reusable raw SQL fragment for `JSON_UNQUOTE(JSON_EXTRACT(... '$.field'))`.
     */
    private function customerSnapshotJsonPath(string $field): string
    {
        return "JSON_UNQUOTE(JSON_EXTRACT(q.customer_snapshot, '$.{$field}'))";
    }

    // ---------------------------------------------------------------------
    // Private helpers — summary
    // ---------------------------------------------------------------------

    /**
     * Aggregate financial totals across the result set, excluding rejected
     * rows from the revenue figures.
     *
     * @param  \Illuminate\Support\Collection<int, object>  $rows
     * @return array<string, mixed>
     */
    private function calculateSummary($rows): array
    {
        $subtotal = 0.0;
        $taxAmount = 0.0;
        $totalAmount = 0.0;

        foreach ($rows as $row) {
            if (in_array($row->status, self::SUMMARY_EXCLUDED_STATUSES, true)) {
                continue;
            }
            $subtotal += (float) $row->subtotal;
            $taxAmount += (float) $row->tax_amount;
            $totalAmount += (float) $row->final_total_amount;
        }

        return [
            'subtotal' => round($subtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'total_amount' => round($totalAmount, 2),
            'count' => $rows->count(),
            'count_by_status' => $rows->groupBy('status')
                ->map(fn ($group) => $group->count())
                ->toArray(),
        ];
    }

    // ---------------------------------------------------------------------
    // Private helpers — CSV writers
    // ---------------------------------------------------------------------

    /**
     * Write the report metadata header lines (title + period).
     *
     * @param  resource  $output
     * @param  array<string, mixed>  $filters
     */
    private function writeCsvHeader($output, array $filters): void
    {
        fputcsv($output, ['รายงานยอดขาย']);
        fputcsv($output, [
            'ช่วงเวลา',
            ($filters['date_from'] ?? '').' ถึง '.($filters['date_to'] ?? ''),
        ]);
        fputcsv($output, []); // blank separator
    }

    /**
     * Project a row from the report query into a CSV-aligned array. Order
     * matches `CSV_COLUMNS`.
     *
     * @param  array<string, mixed>  $row
     * @return array<int, mixed>
     */
    private function formatCsvRow(array $row, int $no): array
    {
        return [
            $no,
            $row['number'] ?? '',
            $row['document_date'] ?? '',
            $row['customer_name'] ?? '',
            $row['work_name'] ?? '',
            $row['tax_id'] ?? '',
            $row['branch'] ?? 'สำนักงานใหญ่',
            number_format((float) ($row['subtotal'] ?? 0), 2),
            number_format((float) ($row['tax_amount'] ?? 0), 2),
            number_format((float) ($row['final_total_amount'] ?? 0), 2),
            'THB',
            '1.00',
            self::STATUS_LABELS[$row['status']] ?? $row['status'],
            $row['salesperson'] ?? '',
            $row['notes'] ?? '',
        ];
    }

    /**
     * Write the trailing summary row (totals across non-rejected rows).
     *
     * @param  resource  $output
     * @param  array<string, mixed>  $summary
     */
    private function writeCsvSummaryFooter($output, array $summary): void
    {
        fputcsv($output, []);
        fputcsv($output, [
            '', '', '', '', '', '',
            'ยอดรวมทั้งหมด',
            number_format($summary['subtotal'], 2),
            number_format($summary['tax_amount'], 2),
            number_format($summary['total_amount'], 2),
        ]);
    }
}
