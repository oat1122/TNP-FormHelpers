<?php

namespace App\Repositories;

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

    protected function buildIndexQuery(array $filters, $user): Builder
    {
        return $this->newQuery()
            ->visibleTo($user)
            ->withRequestedIncludes($this->normalizeIncludes($filters['include'] ?? []))
            ->applySearch($filters['search'] ?? null)
            ->filterDateRange(
                $filters['start_date'] ?? null,
                $filters['end_date'] ?? null,
                $filters['date_filter_by'] ?? 'nb_date'
            )
            ->filterStatus($filters['status'] ?? null)
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
            ->where('notebooks.nb_is_online', false)
            ->where(function (Builder $roleQuery) use ($targetRole) {
                $roleQuery
                    ->where(function (Builder $query) use ($targetRole) {
                        $query->whereNotNull('notebooks.nb_manage_by')
                            ->where('notebook_manage_users.role', $targetRole);
                    })
                    ->orWhere(function (Builder $query) use ($targetRole) {
                        $query->whereNull('notebooks.nb_manage_by')
                            ->where('notebook_created_users.role', $targetRole);
                    });
            });
    }
}
