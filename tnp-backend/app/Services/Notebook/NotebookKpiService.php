<?php

namespace App\Services\Notebook;

use App\Repositories\NotebookRepositoryInterface;
use Carbon\Carbon;

class NotebookKpiService
{
    public function __construct(
        protected NotebookRepositoryInterface $notebookRepository
    ) {}

    public function getSummaryData(string $period, ?string $startDate, ?string $endDate, string $sourceFilter, ?int $requestedUserId, $user, ?string $nbStatus = 'all'): array
    {
        $dateRange = $this->getDateRange($period, $startDate, $endDate);
        $targetUserId = $this->getTargetUserId($requestedUserId, $user);

        $summary = $this->notebookRepository
            ->getNotebookSummaryQuery($dateRange, $sourceFilter, $targetUserId, $nbStatus)
            ->get()
            ->groupBy('action_by')
            ->map(function ($histories, $userId) {
                $addedCount = $histories->filter(fn ($history) => $this->isCreateAction($history->action))->count();
                $updatedCount = $histories->filter(fn ($history) => ! $this->isCreateAction($history->action))->count();

                $actionBy = $histories->first()?->actionBy;
                $allocatorName = $actionBy
                    ? trim($actionBy->user_firstname.' '.$actionBy->user_lastname.
                        ($actionBy->user_nickname ? " ({$actionBy->user_nickname})" : ''))
                    : 'ไม่ระบุ';

                return [
                    'user_id' => $userId,
                    'user_name' => $allocatorName,
                    'added_count' => $addedCount,
                    'updated_count' => $updatedCount,
                ];
            })
            ->values()
            ->toArray();

        usort($summary, function (array $left, array $right) {
            return ($right['added_count'] + $right['updated_count']) <=> ($left['added_count'] + $left['updated_count']);
        });

        return [
            'period' => $this->formatPeriod($period, $dateRange),
            'summary' => $summary,
        ];
    }

    public function getDetailsData(string $period, ?string $startDate, ?string $endDate, string $sourceFilter, ?int $requestedUserId, $user, ?string $nbStatus = 'all'): array
    {
        $dateRange = $this->getDateRange($period, $startDate, $endDate);
        $targetUserId = $this->getTargetUserId($requestedUserId, $user);

        $details = $this->notebookRepository
            ->getNotebookDetailsQuery($dateRange, $sourceFilter, $targetUserId, $nbStatus)
            ->get()
            ->map(function ($history) {
                $actionBy = $history->actionBy;
                $allocatorName = $actionBy
                    ? trim($actionBy->user_firstname.' '.$actionBy->user_lastname)
                    : 'admin';

                return [
                    'history_id' => $history->id,
                    'notebook_id' => $history->notebook_id,
                    'nb_customer_name' => collect([
                        $history->nb_customer_name,
                        $history->nb_is_online ? '(Online)' : null,
                    ])->filter()->join(' '),
                    'nb_contact_number' => $history->nb_contact_number,
                    'nb_status' => $history->nb_status,
                    'nb_additional_info' => $history->nb_additional_info,
                    'nb_remarks' => $history->nb_remarks,
                    'nb_action' => $history->nb_action,
                    'nb_date' => $history->nb_date,
                    'nb_time' => $history->nb_time,
                    'action_type' => $this->normalizeHistoryAction($history->action),
                    'old_values' => $history->old_values,
                    'new_values' => $history->new_values,
                    'action_by_name' => $allocatorName,
                    'created_at' => Carbon::parse($history->created_at)->format('Y-m-d H:i:s'),
                ];
            })
            ->values()
            ->toArray();

        return [
            'period' => $this->formatPeriod($period, $dateRange),
            'details' => $details,
        ];
    }

    protected function getDateRange(string $period, ?string $startDate, ?string $endDate): array
    {
        if ($startDate && $endDate) {
            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->endOfDay();

            return [
                'start' => $start,
                'end' => $end,
                'label' => $start->format('d/m/Y').' - '.$end->format('d/m/Y'),
            ];
        }

        $now = Carbon::now();

        return match ($period) {
            'today' => [
                'start' => $now->copy()->startOfDay(),
                'end' => $now->copy()->endOfDay(),
                'label' => 'วันนี้',
            ],
            'week' => [
                'start' => $now->copy()->startOfWeek(),
                'end' => $now->copy()->endOfWeek(),
                'label' => 'สัปดาห์นี้',
            ],
            'quarter' => [
                'start' => $now->copy()->startOfQuarter(),
                'end' => $now->copy()->endOfQuarter(),
                'label' => 'ไตรมาสนี้ (Q'.$now->quarter.')',
            ],
            'year' => [
                'start' => $now->copy()->startOfYear(),
                'end' => $now->copy()->endOfYear(),
                'label' => 'ปีนี้ ('.$now->year.')',
            ],
            'prev_month' => [
                'start' => $now->copy()->subMonth()->startOfMonth(),
                'end' => $now->copy()->subMonth()->endOfMonth(),
                'label' => 'เดือนที่แล้ว',
            ],
            'prev_week' => [
                'start' => $now->copy()->subWeek()->startOfWeek(),
                'end' => $now->copy()->subWeek()->endOfWeek(),
                'label' => 'สัปดาห์ที่แล้ว',
            ],
            'prev_quarter' => [
                'start' => $now->copy()->subQuarter()->startOfQuarter(),
                'end' => $now->copy()->subQuarter()->endOfQuarter(),
                'label' => 'ไตรมาสที่แล้ว (Q'.$now->copy()->subQuarter()->quarter.')',
            ],
            default => [
                'start' => $now->copy()->startOfMonth(),
                'end' => $now->copy()->endOfMonth(),
                'label' => 'เดือนนี้',
            ],
        };
    }

    protected function getTargetUserId(?int $requestedUserId, $user): ?int
    {
        if (! $user) {
            return null;
        }

        if (in_array($user->role, ['admin', 'manager'], true)) {
            return $requestedUserId;
        }

        return $user->user_id;
    }

    protected function formatPeriod(string $period, array $dateRange): array
    {
        return [
            'type' => $period,
            'start_date' => $dateRange['start']->format('Y-m-d'),
            'end_date' => $dateRange['end']->format('Y-m-d'),
            'label' => $dateRange['label'],
        ];
    }

    protected function isCreateAction(?string $action): bool
    {
        return in_array($action, ['created', 'created_to_queue', 'created_to_mine'], true);
    }

    protected function normalizeHistoryAction(?string $action): string
    {
        return $this->isCreateAction($action) ? 'created' : 'updated';
    }
}
