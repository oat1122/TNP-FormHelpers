<?php

namespace App\Http\Controllers\Api\V1\Customers;

use App\Helpers\AccountingHelper;
use App\Http\Controllers\Controller;
use App\Services\KpiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * KPI Controller
 *
 * Provides KPI dashboard statistics and CSV export for telesales/sales tracking.
 * Tracks customer additions by: day, week, month, quarter, year
 * Grouped by cus_source and cus_allocated_by.
 */
class KpiController extends Controller
{
    public function __construct(
        protected KpiService $kpiService
    ) {}

    /**
     * Get KPI Dashboard Statistics
     *
     * GET /api/v1/customers/kpi
     *
     * @param  Request  $request
     *                            - period: today|week|month|quarter|year|custom (default: month)
     *                            - start_date: Y-m-d (required if period=custom)
     *                            - end_date: Y-m-d (required if period=custom)
     *                            - source_filter: telesales|sales|online|office|all (default: all)
     *                            - user_id: filter by specific user (admin/manager only)
     * @return \Illuminate\Http\JsonResponse
     */
    public function dashboard(Request $request)
    {
        $user = auth()->user();

        // Check authorization - allow admin, manager, and telesales
        if (! AccountingHelper::hasRole(['admin', 'manager', 'telesale', 'sale'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Access denied',
            ], 403);
        }

        try {
            if ($request->input('user_id') === 'all') {
                $request->merge(['user_id' => null]);
            }

            // Validate inputs
            $request->validate([
                'period' => 'nullable|in:today,week,month,quarter,year,custom,prev_month,prev_week,prev_quarter',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'source_filter' => 'nullable|in:telesales,sales,online,office,all',
                'user_id' => 'nullable|integer',
            ]);

            $period = $request->input('period', 'month');
            $sourceFilter = $request->input('source_filter', 'all');
            $requestedUserId = $request->input('user_id');

            $data = $this->kpiService->getDashboardData(
                $period,
                $request->start_date,
                $request->end_date,
                $sourceFilter,
                $requestedUserId,
                $user
            );

            return response()->json([
                'status' => 'success',
                'data' => $data,
                'meta' => $data['meta'],
            ]);

        } catch (\Exception $e) {
            Log::error('KPI Dashboard error: '.$e->getMessage(), [
                'user_id' => $user->user_id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching KPI stats: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get KPI Dashboard Details (List of customers for a specific KPI)
     *
     * GET /api/v1/customers/kpi/details
     */
    public function details(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = auth()->user();

        // Check authorization - allow admin, manager, and telesales
        if (! AccountingHelper::hasRole(['admin', 'manager', 'telesale', 'sale'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Access denied',
            ], 403);
        }

        try {
            if ($request->input('user_id') === 'all') {
                $request->merge(['user_id' => null]);
            }

            // Validate inputs
            $request->validate([
                'period' => 'nullable|in:today,week,month,quarter,year,custom,prev_month,prev_week,prev_quarter',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'source_filter' => 'nullable|in:telesales,sales,online,office,all',
                'kpi_type' => 'required|in:total,pool,allocated,created_by',
                'user_id' => 'nullable|integer',
                'per_page' => 'nullable|integer|max:100',
            ]);

            $period = $request->input('period', 'month');
            $sourceFilter = $request->input('source_filter', 'all');
            $kpiType = $request->input('kpi_type');
            $perPage = $request->input('per_page', 10);
            $requestedUserId = $request->input('user_id');

            $result = $this->kpiService->getKpiDetails(
                $period,
                $request->start_date,
                $request->end_date,
                $sourceFilter,
                $kpiType,
                $requestedUserId,
                $user,
                $perPage
            );

            return response()->json([
                'status' => 'success',
                'data' => $result['data'],
                'meta' => $result['meta'],
            ]);

        } catch (\Exception $e) {
            Log::error('KPI Dashboard Details error: '.$e->getMessage(), [
                'user_id' => $user->user_id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching details: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get detailed list of customers for a specific Recall status type
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function recallDetails(Request $request)
    {
        try {
            $user = auth()->user();

            // Input parameters
            $type = $request->query('recall_type'); // 'waiting', 'in_criteria', 'made'
            $period = $request->query('period', 'month');
            $sourceFilter = $request->query('source_filter', 'all');
            $perPage = $request->query('per_page', 10);

            // Support custom date passing
            $customStartDate = $request->query('start_date');
            $customEndDate = $request->query('end_date');
            $requestedUserId = $request->input('user_id');

            if (! in_array($type, ['waiting', 'in_criteria', 'made'])) {
                return response()->json(['success' => false, 'message' => 'Invalid recall type'], 400);
            }

            if ($requestedUserId === 'all') {
                $requestedUserId = null;
            }

            $result = $this->kpiService->getRecallDetails(
                $type,
                $period,
                $customStartDate,
                $customEndDate,
                $sourceFilter,
                $requestedUserId,
                $user,
                $perPage
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);

        } catch (\Exception $e) {
            Log::error('KPI Recall Details Error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve recall details',
            ], 500);
        }
    }

    /**
     * Export KPI data to CSV
     *
     * GET /api/v1/customers/kpi/export
     */
    public function export(Request $request): StreamedResponse
    {
        $user = auth()->user();

        if (! AccountingHelper::hasRole(['admin', 'manager', 'telesale', 'sale'])) {
            abort(403, 'Unauthorized');
        }

        if ($request->input('user_id') === 'all') {
            $request->merge(['user_id' => null]);
        }

        $period = $request->input('period', 'month');
        $sourceFilter = $request->input('source_filter', 'all');
        $requestedUserId = $request->input('user_id');

        $exportData = $this->kpiService->getExportData(
            $period,
            $request->start_date,
            $request->end_date,
            $sourceFilter,
            $requestedUserId,
            $user
        );

        $customers = $exportData['customers'];
        $filename = $exportData['filename'];

        return response()->streamDownload(function () use ($customers) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header row
            fputcsv($handle, [
                'ธหัสลูกค้า',
                'ชื่อลูกค้า',
                'บริษัท',
                'เบอร์โทร',
                'แหล่งที่มา',
                'สถานะ',
                'ผู้เพิ่ม',
                'วันที่สร้าง',
            ]);

            foreach ($customers as $customer) {
                $allocatorName = $customer->allocatedBy
                    ? trim($customer->allocatedBy->user_firstname.' '.$customer->allocatedBy->user_lastname.
                           ($customer->allocatedBy->user_nickname ? " ({$customer->allocatedBy->user_nickname})" : ''))
                    : 'ไม่ระบุ';

                fputcsv($handle, [
                    $customer->cus_no,
                    $customer->cus_name ?? '-',
                    $customer->cus_company ?? '-',
                    $customer->cus_tel_1 ?? '-',
                    $this->kpiService->getSourceLabel($customer->cus_source),
                    $customer->cus_allocation_status === 'pool' ? 'รอจัดสรร' : 'จัดสรรแล้ว',
                    $allocatorName,
                    $customer->cus_created_date?->format('Y-m-d H:i') ?? '-',
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Get historical recall status for trend analysis and drill-down
     * GET /api/v1/customers/kpi/recall-history
     */
    public function recallHistory(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = auth()->user();

        if (! AccountingHelper::hasRole(['admin', 'manager', 'telesale', 'sale'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Access denied',
            ], 403);
        }

        try {
            if ($request->input('user_id') === 'all') {
                $request->merge(['user_id' => null]);
            }

            $request->validate([
                'month' => 'required|date_format:Y-m', // e.g. "2024-03"
                'source_filter' => 'nullable|in:telesales,sales,online,office,all',
                'user_id' => 'nullable|integer',
            ]);

            $month = $request->input('month');
            $sourceFilter = $request->input('source_filter', 'all');
            $requestedUserId = $request->input('user_id');

            $history = $this->kpiService->getRecallHistory(
                $month,
                $sourceFilter,
                $requestedUserId,
                $user
            );

            return response()->json([
                'success' => true,
                'data' => $history,
            ]);

        } catch (\Exception $e) {
            Log::error('KPI Recall History Error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve recall history',
            ], 500);
        }
    }

}
