<?php

namespace App\Http\Controllers\Api\V1\Notebook;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Notebook\NotebookAllTabStatsRequest;
use App\Http\Requests\V1\Notebook\NotebookDetailsRequest;
use App\Http\Requests\V1\Notebook\NotebookSummaryRequest;
use App\Services\Notebook\NotebookKpiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class NotebookKpiController extends Controller
{
    public function __construct(
        protected NotebookKpiService $notebookKpiService
    ) {}

    public function summary(NotebookSummaryRequest $request): JsonResponse
    {
        try {
            $period = $request->input('period', 'month');
            $sourceFilter = $request->input('source_filter', 'all');
            $requestedUserId = $request->input('user_id');
            $nbStatus = $request->input('nb_status', 'all');

            $data = $this->notebookKpiService->getSummaryData(
                $period,
                $request->input('start_date'),
                $request->input('end_date'),
                $sourceFilter,
                $requestedUserId,
                $request->user(),
                $nbStatus
            );

            return response()->json([
                'status' => 'success',
                'data' => $data['summary'],
                'meta' => [
                    'period' => $data['period'],
                ],
            ]);
        } catch (\Exception $exception) {
            Log::error('Notebook Summary KPI error: '.$exception->getMessage(), [
                'user_id' => $request->user()?->user_id,
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching notebook summary: '.$exception->getMessage(),
            ], 500);
        }
    }

    public function allTabStats(NotebookAllTabStatsRequest $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'search',
                'start_date',
                'end_date',
                'date_filter_by',
                'status',
                'action',
                'entry_type',
                'manage_by',
            ]);

            $stats = $this->notebookKpiService->getAllTabStats($filters, $request->user());

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $exception) {
            Log::error('Notebook All-Tab Stats error: '.$exception->getMessage(), [
                'user_id' => $request->user()?->user_id,
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถดึงสรุปยอด Lead ทั้งหมดได้',
            ], 500);
        }
    }

    public function details(NotebookDetailsRequest $request): JsonResponse
    {
        try {
            $period = $request->input('period', 'month');
            $sourceFilter = $request->input('source_filter', 'all');
            $requestedUserId = $request->input('user_id');
            $nbStatus = $request->input('nb_status', 'all');

            $data = $this->notebookKpiService->getDetailsData(
                $period,
                $request->input('start_date'),
                $request->input('end_date'),
                $sourceFilter,
                $requestedUserId,
                $request->user(),
                $nbStatus
            );

            return response()->json([
                'status' => 'success',
                'data' => $data['details'],
                'meta' => [
                    'period' => $data['period'],
                ],
            ]);
        } catch (\Exception $exception) {
            Log::error('Notebook Details KPI error: '.$exception->getMessage(), [
                'user_id' => $request->user()?->user_id,
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching notebook details: '.$exception->getMessage(),
            ], 500);
        }
    }
}
