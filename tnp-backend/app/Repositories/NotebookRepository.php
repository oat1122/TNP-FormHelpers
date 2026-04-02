<?php

namespace App\Repositories;

use App\Helpers\UserSubRoleHelper;
use App\Models\Notebook;
use App\Models\NotebookHistory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class NotebookRepository extends BaseRepository implements NotebookRepositoryInterface
{
    public function __construct(Notebook $model)
    {
        parent::__construct($model);
    }

    public function getFilteredPaginated(array $filters, $user): LengthAwarePaginator
    {
        return $this->buildIndexQuery($filters, $user)->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function getFilteredCollection(array $filters, $user): Collection
    {
        return $this->buildIndexQuery($filters, $user)->get();
    }

    public function findWithRelationsOrFail(string $id, array $includes = ['histories']): Notebook
    {
        return $this->newQuery()
            ->withRequestedIncludes($this->normalizeIncludes($includes))
            ->findOrFail($id);
    }

    public function getNotebookSummaryQuery(array $dateRange, string $sourceFilter, ?int $targetUserId, ?string $nbStatus): Builder
    {
        $query = NotebookHistory::query()
            ->with('actionBy')
            ->join('notebooks', 'notebook_histories.notebook_id', '=', 'notebooks.id')
            ->select('notebook_histories.*')
            ->distinct()
            ->whereBetween('notebook_histories.created_at', [$dateRange['start'], $dateRange['end']]);

        $this->applyNotebookSourceFilter($query, $sourceFilter);

        if ($targetUserId) {
            $query->where('notebook_histories.action_by', $targetUserId);
        }

        if ($nbStatus && $nbStatus !== 'all') {
            $query->where('notebooks.nb_status', $nbStatus);
        }

        return $query;
    }

    public function getNotebookDetailsQuery(array $dateRange, string $sourceFilter, ?int $targetUserId, ?string $nbStatus): Builder
    {
        $query = NotebookHistory::query()
            ->with(['actionBy', 'notebook'])
            ->join('notebooks', 'notebook_histories.notebook_id', '=', 'notebooks.id')
            ->select(
                'notebook_histories.*',
                'notebooks.nb_customer_name',
                'notebooks.nb_is_online',
                'notebooks.nb_contact_number',
                'notebooks.nb_status',
                'notebooks.nb_additional_info',
                'notebooks.nb_remarks',
                'notebooks.nb_action',
                'notebooks.nb_date',
                'notebooks.nb_time'
            )
            ->distinct()
            ->whereBetween('notebook_histories.created_at', [$dateRange['start'], $dateRange['end']]);

        $this->applyNotebookSourceFilter($query, $sourceFilter);

        if ($targetUserId) {
            $query->where('notebook_histories.action_by', $targetUserId);
        }

        if ($nbStatus && $nbStatus !== 'all') {
            $query->where('notebooks.nb_status', $nbStatus);
        }

        return $query->orderBy('notebook_histories.created_at', 'desc');
    }

    public function getSelfReportLeadAdditions(array $filters, $user): Collection
    {
        return $this->newQuery()
            ->withRequestedIncludes($this->normalizeIncludes($filters['include'] ?? []))
            ->leadQueue()
            ->where('created_by', $user?->user_id)
            ->filterDateRange(
                $filters['start_date'] ?? null,
                $filters['end_date'] ?? null,
                'created_at'
            )
            ->orderByDesc('created_at')
            ->get();
    }

    public function getSelfReportActivityItems(array $filters, $user): Collection
    {
        $startDate = $filters['start_date'] ?? null;
        $endDate = $filters['end_date'] ?? null;

        return $this->newQuery()
            ->with([
                'histories' => function ($historyQuery) use ($user, $startDate, $endDate) {
                    $historyQuery->where('action_by', $user?->user_id)
                        ->with('actionBy')
                        ->orderBy('created_at', 'asc');

                    if ($startDate && $endDate) {
                        $historyQuery->whereBetween('created_at', [
                            $startDate.' 00:00:00',
                            $endDate.' 23:59:59',
                        ]);
                    }
                },
            ])
            ->whereHas('histories', function (Builder $historyQuery) use ($user, $startDate, $endDate) {
                $historyQuery->where('action_by', $user?->user_id);

                if ($startDate && $endDate) {
                    $historyQuery->whereBetween('created_at', [
                        $startDate.' 00:00:00',
                        $endDate.' 23:59:59',
                    ]);
                }
            })
            ->orderByDesc('updated_at')
            ->get();
    }

    protected function buildIndexQuery(array $filters, $user): Builder
    {
        $scope = $filters['scope'] ?? null;

        return $this->newQuery()
            ->visibleTo($user, $scope)
            ->withRequestedIncludes($this->normalizeIncludes($filters['include'] ?? []))
            ->applySearch($filters['search'] ?? null)
            ->filterDateRange(
                $filters['start_date'] ?? null,
                $filters['end_date'] ?? null,
                $filters['date_filter_by'] ?? 'nb_date'
            )
            ->filterStatus($filters['status'] ?? null)
            ->filterAction($filters['action'] ?? null)
            ->filterEntryType($filters['entry_type'] ?? null)
            ->filterWorkflow($filters['workflow'] ?? null)
            ->filterManageBy(isset($filters['manage_by']) ? (int) $filters['manage_by'] : null)
            ->orderByDesc('created_at');
    }

    protected function normalizeIncludes(array|string|null $includes): array
    {
        if (is_string($includes)) {
            $includes = array_filter(array_map('trim', explode(',', $includes)));
        }

        $normalized = array_map(
            static fn ($include) => str_starts_with((string) $include, 'histories') ? 'histories' : $include,
            (array) $includes
        );

        return array_values(array_unique(array_intersect($normalized, ['histories'])));
    }

    protected function applyNotebookSourceFilter(Builder $query, string $sourceFilter): void
    {
        if ($sourceFilter === 'all') {
            return;
        }

        if ($sourceFilter === 'online') {
            $query->where('notebooks.nb_is_online', true);

            return;
        }

        $roleMap = [
            'sales' => 'sale',
            'telesales' => 'telesale',
            'office' => 'office',
        ];

        $targetRole = $roleMap[$sourceFilter] ?? null;
        if (! $targetRole) {
            return;
        }

        $query
            ->leftJoin('users as notebook_manage_users', 'notebooks.nb_manage_by', '=', 'notebook_manage_users.user_id')
            ->leftJoin('users as notebook_created_users', 'notebooks.created_by', '=', 'notebook_created_users.user_id')
            ->leftJoin('user_sub_roles as notebook_created_user_sub_roles', 'notebook_created_users.user_id', '=', 'notebook_created_user_sub_roles.usr_user_id')
            ->leftJoin('master_sub_roles as notebook_created_master_sub_roles', 'notebook_created_user_sub_roles.usr_sub_role_id', '=', 'notebook_created_master_sub_roles.msr_id')
            ->where('notebooks.nb_is_online', false)
            ->where(function (Builder $roleQuery) use ($targetRole) {
                $roleQuery
                    ->where(function (Builder $query) use ($targetRole) {
                        $query->whereNotNull('notebooks.nb_manage_by')
                            ->where('notebook_manage_users.role', $targetRole);
                    })
                    ->orWhere(function (Builder $query) use ($targetRole) {
                        $query->whereNull('notebooks.nb_manage_by')
                            ->where(function (Builder $createdQuery) use ($targetRole) {
                                $createdQuery->where('notebook_created_users.role', $targetRole);

                                if ($targetRole === 'sale') {
                                    $createdQuery->orWhere('notebook_created_master_sub_roles.msr_code', UserSubRoleHelper::SUPPORT_SALES);
                                }

                                if ($targetRole === 'telesale') {
                                    $createdQuery->orWhere('notebook_created_master_sub_roles.msr_code', UserSubRoleHelper::TALESALES);
                                }
                            });
                    });
            });
    }
}
