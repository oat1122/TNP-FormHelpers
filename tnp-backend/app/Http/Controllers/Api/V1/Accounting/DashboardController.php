<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Accounting\Quotation;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DeliveryNote;
use App\Models\Accounting\Customer;
use App\Models\Accounting\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard summary
     */
    public function getSummary(Request $request): JsonResponse
    {
        try {
            $dateFilter = $request->get('period', 'month'); // month, quarter, year
            $startDate = $this->getStartDate($dateFilter);

            $summary = [
                'quotations' => $this->getQuotationSummary($startDate),
                'invoices' => $this->getInvoiceSummary($startDate),
                'receipts' => $this->getReceiptSummary($startDate),
                'delivery_notes' => $this->getDeliveryNoteSummary($startDate),
                'customers' => $this->getCustomerSummary(),
                'products' => $this->getProductSummary(),
                'overdue_invoices' => $this->getOverdueInvoices(),
                'recent_activities' => $this->getRecentActivities()
            ];

            return response()->json([
                'success' => true,
                'message' => 'Dashboard summary retrieved successfully',
                'data' => $summary
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve dashboard summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get quotation summary
     */
    private function getQuotationSummary($startDate): array
    {
        $quotations = Quotation::where('created_at', '>=', $startDate)
                              ->selectRaw('
                                  status,
                                  COUNT(*) as count,
                                  SUM(total_amount) as total_amount
                              ')
                              ->groupBy('status')
                              ->get();

        $summary = [
            'total_count' => $quotations->sum('count'),
            'total_amount' => $quotations->sum('total_amount'),
            'by_status' => []
        ];

        foreach ($quotations as $quotation) {
            $summary['by_status'][$quotation->status] = [
                'count' => $quotation->count,
                'amount' => $quotation->total_amount
            ];
        }

        return $summary;
    }

    /**
     * Get invoice summary
     */
    private function getInvoiceSummary($startDate): array
    {
        $invoices = Invoice::where('created_at', '>=', $startDate)
                          ->selectRaw('
                              payment_status,
                              COUNT(*) as count,
                              SUM(total_amount) as total_amount,
                              SUM(paid_amount) as paid_amount,
                              SUM(remaining_amount) as remaining_amount
                          ')
                          ->groupBy('payment_status')
                          ->get();

        $summary = [
            'total_count' => $invoices->sum('count'),
            'total_amount' => $invoices->sum('total_amount'),
            'total_paid' => $invoices->sum('paid_amount'),
            'total_outstanding' => $invoices->sum('remaining_amount'),
            'by_payment_status' => []
        ];

        foreach ($invoices as $invoice) {
            $summary['by_payment_status'][$invoice->payment_status] = [
                'count' => $invoice->count,
                'amount' => $invoice->total_amount,
                'paid' => $invoice->paid_amount,
                'outstanding' => $invoice->remaining_amount
            ];
        }

        return $summary;
    }

    /**
     * Get receipt summary
     */
    private function getReceiptSummary($startDate): array
    {
        $receipts = Receipt::where('created_at', '>=', $startDate)
                          ->selectRaw('
                              COUNT(*) as count,
                              SUM(total_amount) as total_amount
                          ')
                          ->first();

        return [
            'total_count' => $receipts->count ?? 0,
            'total_amount' => $receipts->total_amount ?? 0
        ];
    }

    /**
     * Get delivery note summary
     */
    private function getDeliveryNoteSummary($startDate): array
    {
        $deliveryNotes = DeliveryNote::where('created_at', '>=', $startDate)
                                   ->selectRaw('
                                       status,
                                       COUNT(*) as count
                                   ')
                                   ->groupBy('status')
                                   ->get();

        $summary = [
            'total_count' => $deliveryNotes->sum('count'),
            'by_status' => []
        ];

        foreach ($deliveryNotes as $note) {
            $summary['by_status'][$note->status] = $note->count;
        }

        return $summary;
    }

    /**
     * Get customer summary
     */
    private function getCustomerSummary(): array
    {
        return [
            'total_count' => Customer::count(),
            'active_count' => Customer::where('is_active', true)->count(),
            'with_outstanding' => Customer::whereHas('invoices', function ($query) {
                $query->where('remaining_amount', '>', 0);
            })->count()
        ];
    }

    /**
     * Get product summary
     */
    private function getProductSummary(): array
    {
        return [
            'total_count' => Product::count(),
            'active_count' => Product::where('is_active', true)->count(),
            'low_stock_count' => Product::whereRaw('stock_quantity <= minimum_stock')->count()
        ];
    }

    /**
     * Get overdue invoices
     */
    private function getOverdueInvoices(): array
    {
        $overdueInvoices = Invoice::where('due_date', '<', now())
                                 ->where('payment_status', '!=', 'paid')
                                 ->with(['customer'])
                                 ->orderBy('due_date', 'asc')
                                 ->limit(10)
                                 ->get();

        return [
            'count' => $overdueInvoices->count(),
            'total_amount' => $overdueInvoices->sum('remaining_amount'),
            'invoices' => $overdueInvoices->map(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'invoice_no' => $invoice->invoice_no,
                    'customer_name' => $invoice->customer->name ?? 'Unknown',
                    'due_date' => $invoice->due_date->format('Y-m-d'),
                    'days_overdue' => now()->diffInDays($invoice->due_date),
                    'remaining_amount' => $invoice->remaining_amount
                ];
            })
        ];
    }

    /**
     * Get recent activities
     */
    private function getRecentActivities(): array
    {
        $activities = collect();

        // Recent quotations
        $recentQuotations = Quotation::with(['customer'])
                                   ->orderBy('updated_at', 'desc')
                                   ->limit(5)
                                   ->get()
                                   ->map(function ($quotation) {
                                       return [
                                           'type' => 'quotation',
                                           'id' => $quotation->id,
                                           'document_no' => $quotation->quotation_no,
                                           'customer' => $quotation->customer->name ?? 'Unknown',
                                           'status' => $quotation->status,
                                           'amount' => $quotation->total_amount,
                                           'updated_at' => $quotation->updated_at
                                       ];
                                   });

        // Recent invoices
        $recentInvoices = Invoice::with(['customer'])
                                ->orderBy('updated_at', 'desc')
                                ->limit(5)
                                ->get()
                                ->map(function ($invoice) {
                                    return [
                                        'type' => 'invoice',
                                        'id' => $invoice->id,
                                        'document_no' => $invoice->invoice_no,
                                        'customer' => $invoice->customer->name ?? 'Unknown',
                                        'status' => $invoice->payment_status,
                                        'amount' => $invoice->total_amount,
                                        'updated_at' => $invoice->updated_at
                                    ];
                                });

        return $activities->merge($recentQuotations)
                         ->merge($recentInvoices)
                         ->sortByDesc('updated_at')
                         ->take(10)
                         ->values()
                         ->toArray();
    }

    /**
     * Get chart data for revenue trends
     */
    public function getRevenueChart(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', 'month'); // month, quarter, year
            $months = $request->get('months', 12);

            $data = $this->getRevenueData($period, $months);

            return response()->json([
                'success' => true,
                'message' => 'Revenue chart data retrieved successfully',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve revenue chart data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get revenue data for charts
     */
    private function getRevenueData($period, $months): array
    {
        $format = $period === 'month' ? '%Y-%m' : '%Y-%m';
        $startDate = now()->subMonths($months);

        $quotationData = Quotation::where('created_at', '>=', $startDate)
                                 ->where('status', 'approved')
                                 ->selectRaw("DATE_FORMAT(created_at, '{$format}') as period, SUM(total_amount) as amount")
                                 ->groupBy('period')
                                 ->orderBy('period')
                                 ->get();

        $invoiceData = Invoice::where('created_at', '>=', $startDate)
                             ->selectRaw("DATE_FORMAT(created_at, '{$format}') as period, SUM(total_amount) as amount")
                             ->groupBy('period')
                             ->orderBy('period')
                             ->get();

        $receiptData = Receipt::where('created_at', '>=', $startDate)
                             ->selectRaw("DATE_FORMAT(created_at, '{$format}') as period, SUM(total_amount) as amount")
                             ->groupBy('period')
                             ->orderBy('period')
                             ->get();

        return [
            'quotations' => $quotationData,
            'invoices' => $invoiceData,
            'receipts' => $receiptData
        ];
    }

    /**
     * Get start date based on period
     */
    private function getStartDate($period)
    {
        switch ($period) {
            case 'week':
                return now()->startOfWeek();
            case 'month':
                return now()->startOfMonth();
            case 'quarter':
                return now()->startOfQuarter();
            case 'year':
                return now()->startOfYear();
            default:
                return now()->startOfMonth();
        }
    }
}
