<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QuotationReportService
{
    /**
     * ดึงข้อมูลรายงานใบเสนอราคา
     */
    public function getReportData(array $filters): array
    {
        try {
            $query = $this->buildReportQuery($filters);
            $rows = $query->get();

            $summary = $this->calculateSummary($rows);

            return [
                'data'    => $rows->values()->toArray(),
                'summary' => $summary,
                'count'   => $rows->count(),
            ];
        } catch (\Exception $e) {
            Log::error('QuotationReportService::getReportData error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * สร้าง query หลักสำหรับรายงาน
     */
    private function buildReportQuery(array $filters)
    {
        $query = DB::table('quotations as q')
            ->leftJoin('users as u', 'u.user_uuid', '=', 'q.created_by')
            ->select([
                'q.id',
                'q.number',
                DB::raw("DATE(q.created_at) as document_date"),
                DB::raw("JSON_UNQUOTE(JSON_EXTRACT(q.customer_snapshot, '$.cus_company')) as customer_name"),
                DB::raw("JSON_UNQUOTE(JSON_EXTRACT(q.customer_snapshot, '$.cus_tax_id')) as tax_id"),
                DB::raw("JSON_UNQUOTE(JSON_EXTRACT(q.customer_snapshot, '$.cus_depart')) as branch"),
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

        // Filter: company
        if (!empty($filters['company_id'])) {
            $query->where('q.company_id', $filters['company_id']);
        }

        // Filter: date range
        if (!empty($filters['date_from'])) {
            $query->whereDate('q.created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('q.created_at', '<=', $filters['date_to']);
        }

        // Filter: status (supports single or comma-separated)
        if (!empty($filters['status'])) {
            $statuses = is_array($filters['status'])
                ? $filters['status']
                : explode(',', $filters['status']);
            $statuses = array_filter(array_map('trim', $statuses));
            if (!empty($statuses)) {
                $query->whereIn('q.status', $statuses);
            }
        }

        // Filter: salesperson (created_by uuid)
        if (!empty($filters['created_by'])) {
            $query->where('q.created_by', $filters['created_by']);
        }

        // Filter: search (number, customer name, project)
        if (!empty($filters['search'])) {
            $like = '%' . trim($filters['search']) . '%';
            $query->where(function ($q) use ($like) {
                $q->where('q.number', 'like', $like)
                  ->orWhere('q.work_name', 'like', $like)
                  ->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(q.customer_snapshot, '$.cus_company')) like ?", [$like]);
            });
        }

        return $query->orderBy('q.created_at', 'desc');
    }

    /**
     * คำนวณสรุปตัวเลข
     */
    private function calculateSummary($rows): array
    {
        $subtotal = 0;
        $taxAmount = 0;
        $totalAmount = 0;

        foreach ($rows as $row) {
            // นับเฉพาะที่ไม่ใช่ rejected
            if (!in_array($row->status, ['rejected'])) {
                $subtotal   += (float) $row->subtotal;
                $taxAmount  += (float) $row->tax_amount;
                $totalAmount += (float) $row->final_total_amount;
            }
        }

        return [
            'subtotal'     => round($subtotal, 2),
            'tax_amount'   => round($taxAmount, 2),
            'total_amount' => round($totalAmount, 2),
            'count'        => $rows->count(),
            'count_by_status' => $rows->groupBy('status')
                ->map(fn($group) => $group->count())
                ->toArray(),
        ];
    }

    /**
     * Export ข้อมูลเป็น CSV
     */
    public function exportCsv(array $filters): string
    {
        $result = $this->getReportData($filters);
        $rows   = $result['data'];
        $summary = $result['summary'];

        $output = fopen('php://temp', 'r+');

        // Header lines (เลียนแบบ CSV ต้นฉบับ)
        fputcsv($output, ['รายงานยอดขาย']);
        fputcsv($output, ['ช่วงเวลา', ($filters['date_from'] ?? '') . ' ถึง ' . ($filters['date_to'] ?? '')]);
        fputcsv($output, []); // blank line

        // Column headers
        fputcsv($output, [
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
        ]);

        $statusLabels = $this->getStatusLabels();
        $no = 1;
        foreach ($rows as $row) {
            $row = (array) $row;
            fputcsv($output, [
                $no++,
                $row['number'],
                $row['document_date'],
                $row['customer_name'],
                $row['work_name'],
                $row['tax_id'],
                $row['branch'] ?? 'สำนักงานใหญ่',
                number_format((float)($row['subtotal'] ?? 0), 2),
                number_format((float)($row['tax_amount'] ?? 0), 2),
                number_format((float)($row['final_total_amount'] ?? 0), 2),
                'THB',
                '1.00',
                $statusLabels[$row['status']] ?? $row['status'],
                $row['salesperson'],
                $row['notes'],
            ]);
        }

        // Summary footer
        fputcsv($output, []);
        fputcsv($output, [
            '', '', '', '', '', '',
            'ยอดรวมทั้งหมด',
            number_format($summary['subtotal'], 2),
            number_format($summary['tax_amount'], 2),
            number_format($summary['total_amount'], 2),
        ]);

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        // เพิ่ม BOM สำหรับ Excel ภาษาไทย
        return "\xEF\xBB\xBF" . $csv;
    }

    /**
     * Map status → ภาษาไทย
     */
    private function getStatusLabels(): array
    {
        return [
            'draft'          => 'แบบร่าง',
            'pending_review' => 'รอตรวจสอบ',
            'approved'       => 'อนุมัติแล้ว',
            'sent'           => 'ส่งแล้ว',
            'completed'      => 'เสร็จสิ้น',
            'rejected'       => 'ยกเลิก/ปฏิเสธ',
        ];
    }
}
