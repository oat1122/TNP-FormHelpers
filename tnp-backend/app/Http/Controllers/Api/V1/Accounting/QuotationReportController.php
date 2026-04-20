<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\QuotationReportService;
use App\Traits\ApiResponseHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuotationReportController extends Controller
{
    use ApiResponseHelper;

    protected QuotationReportService $reportService;

    public function __construct(QuotationReportService $reportService)
    {
        $this->reportService = $reportService;
        $this->middleware('auth:sanctum');
    }

    /**
     * GET /api/v1/quotations/report
     * ดึงข้อมูลรายงานใบเสนอราคา
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'company_id' => $request->query('company_id'),
                'date_from'  => $request->query('date_from'),
                'date_to'    => $request->query('date_to'),
                'status'     => $request->query('status'),
                'created_by' => $request->query('created_by'),
                'search'     => $request->query('search'),
            ];

            $result = $this->reportService->getReportData($filters);

            return $this->successResponse($result, 'Report data retrieved successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationReportController::index', $e);
        }
    }

    /**
     * GET /api/v1/quotations/report/export
     * Export รายงานเป็น CSV
     */
    public function export(Request $request)
    {
        try {
            $filters = [
                'company_id' => $request->query('company_id'),
                'date_from'  => $request->query('date_from'),
                'date_to'    => $request->query('date_to'),
                'status'     => $request->query('status'),
                'created_by' => $request->query('created_by'),
                'search'     => $request->query('search'),
            ];

            $csv = $this->reportService->exportCsv($filters);

            $filename = 'QuotationReport_' . now()->format('Y-m-d_His') . '.csv';

            return response($csv, 200, [
                'Content-Type'        => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control'       => 'no-cache, no-store, must-revalidate',
            ]);

        } catch (\Exception $e) {
            return $this->serverErrorResponse('QuotationReportController::export', $e);
        }
    }
}
