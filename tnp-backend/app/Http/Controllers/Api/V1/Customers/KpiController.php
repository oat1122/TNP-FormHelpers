<?php

namespace App\Http\Controllers\Api\V1\Customers;

use App\Helpers\AccountingHelper;
use App\Helpers\UserSubRoleHelper;
use App\Http\Controllers\Controller;
use App\Services\KpiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class KpiController extends Controller
{
    public function __construct(
        protected KpiService $kpiService
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $user = auth()->user();

        if (! $this->canAccessKpi($user)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Access denied',
            ], 403);
        }

        try {
            if ($request->input('user_id') === 'all') {
                $request->merge(['user_id' => null]);
            }

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
                $request->input('start_date'),
                $request->input('end_date'),
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

    public function details(Request $request): JsonResponse
    {
        $user = auth()->user();

        if (! $this->canAccessKpi($user)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Access denied',
            ], 403);
        }

        try {
            if ($request->input('user_id') === 'all') {
                $request->merge(['user_id' => null]);
            }

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
                $request->input('start_date'),
                $request->input('end_date'),
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

    public function recallDetails(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();

            if (! $this->canAccessKpi($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: Access denied',
                ], 403);
            }

            $type = $request->query('recall_type');
            $period = $request->query('period', 'month');
            $sourceFilter = $request->query('source_filter', 'all');
            $perPage = $request->query('per_page', 10);
            $customStartDate = $request->query('start_date');
            $customEndDate = $request->query('end_date');
            $requestedUserId = $request->input('user_id');

            if (! in_array($type, ['waiting', 'in_criteria', 'made'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid recall type',
                ], 400);
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

    public function export(Request $request): StreamedResponse
    {
        $user = auth()->user();

        if (! $this->canAccessKpi($user)) {
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
            $request->input('start_date'),
            $request->input('end_date'),
            $sourceFilter,
            $requestedUserId,
            $user
        );

        $customers = $exportData['customers'] ?? collect();
        $notebooks = $exportData['notebooks'] ?? collect();
        $filename = $exportData['filename'];
        $dataSource = $exportData['data_source'] ?? 'customers';

        return response()->streamDownload(function () use ($customers, $notebooks, $dataSource) {
            $handle = fopen('php://output', 'w');

            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            if ($dataSource === 'notebook_leads') {
                fputcsv($handle, [
                    'Notebook ID',
                    'Customer',
                    'Contact Person',
                    'Phone',
                    'Source',
                    'Queue Status',
                    'Current Owner',
                    'Added By',
                    'Added At',
                ]);

                foreach ($notebooks as $notebook) {
                    $ownerName = $notebook->manageBy
                        ? trim($notebook->manageBy->user_firstname.' '.$notebook->manageBy->user_lastname.
                            ($notebook->manageBy->user_nickname ? " ({$notebook->manageBy->user_nickname})" : ''))
                        : 'Central Queue';

                    $creatorName = $notebook->createdBy
                        ? trim($notebook->createdBy->user_firstname.' '.$notebook->createdBy->user_lastname.
                            ($notebook->createdBy->user_nickname ? " ({$notebook->createdBy->user_nickname})" : ''))
                        : 'Unknown';

                    $creatorSubRoles = UserSubRoleHelper::getSubRoleCodes($notebook->createdBy);
                    $sourceKey = $notebook->nb_is_online ? 'online' : 'sales';

                    if (
                        $notebook->createdBy?->role === 'telesale'
                        || in_array(UserSubRoleHelper::TALESALES, $creatorSubRoles, true)
                    ) {
                        $sourceKey = 'telesales';
                    }

                    $sourceLabel = $this->kpiService->getSourceLabel($sourceKey);
                    $queueStatus = ($notebook->nb_manage_by || $notebook->nb_converted_at)
                        ? 'Claimed / Converted'
                        : 'Central Queue';

                    fputcsv($handle, [
                        $notebook->id,
                        $notebook->nb_customer_name ?? '-',
                        $notebook->nb_contact_person ?? '-',
                        $notebook->nb_contact_number ?? '-',
                        $sourceLabel,
                        $queueStatus,
                        $ownerName,
                        $creatorName,
                        $notebook->created_at?->format('Y-m-d H:i') ?? '-',
                    ]);
                }

                fclose($handle);

                return;
            }

            fputcsv($handle, [
                'Customer Code',
                'Customer Name',
                'Company',
                'Phone',
                'Source',
                'Status',
                'Added By',
                'Created At',
            ]);

            foreach ($customers as $customer) {
                $allocatorName = $customer->allocatedBy
                    ? trim($customer->allocatedBy->user_firstname.' '.$customer->allocatedBy->user_lastname.
                        ($customer->allocatedBy->user_nickname ? " ({$customer->allocatedBy->user_nickname})" : ''))
                    : 'Unknown';

                fputcsv($handle, [
                    $customer->cus_no,
                    $customer->cus_name ?? '-',
                    $customer->cus_company ?? '-',
                    $customer->cus_tel_1 ?? '-',
                    $this->kpiService->getSourceLabel($customer->cus_source),
                    $customer->cus_allocation_status === 'pool' ? 'Pool' : 'Allocated',
                    $allocatorName,
                    $customer->cus_created_date?->format('Y-m-d H:i') ?? '-',
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function recallHistory(Request $request): JsonResponse
    {
        $user = auth()->user();

        if (! $this->canAccessKpi($user)) {
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
                'month' => 'required|date_format:Y-m',
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

    protected function canAccessKpi($user): bool
    {
        return AccountingHelper::hasRole(['admin', 'manager', 'telesale', 'sale'])
            || UserSubRoleHelper::isNotebookQueueUser($user);
    }
}
