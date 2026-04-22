<?php

namespace App\Repositories;

use App\Helpers\PhoneNormalizer;
use App\Helpers\UserSubRoleHelper;
use App\Models\MasterCustomer;
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
                'histories' => function ($historyQuery) use ($endDate) {
                    $historyQuery
                        ->with('actionBy')
                        ->orderBy('created_at', 'asc');

                    if ($endDate) {
                        $historyQuery->where('created_at', '<=', $endDate.' 23:59:59');
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
            ->orderByDesc('nb_is_favorite')
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

    public function findDuplicateMatches(string $type, string $value, ?int $excludeNotebookId = null): array
    {
        $trimmed = trim($value);

        if ($trimmed === '') {
            return ['customers' => [], 'notebooks' => []];
        }

        return match ($type) {
            'phone' => $this->findPhoneMatches($trimmed, $excludeNotebookId),
            'email' => $this->findEmailMatches($trimmed, $excludeNotebookId),
            'customer_name' => $this->findCustomerNameMatches($trimmed, $excludeNotebookId),
            'contact_person' => $this->findContactPersonMatches($trimmed, $excludeNotebookId),
            default => ['customers' => [], 'notebooks' => []],
        };
    }

    protected function findPhoneMatches(string $value, ?int $excludeNotebookId): array
    {
        $digits = PhoneNormalizer::digitsOnly($value);

        if ($digits === '' || strlen($digits) < 8) {
            return ['customers' => [], 'notebooks' => []];
        }

        $customers = MasterCustomer::query()
            ->active()
            ->with('cusManageBy:user_id,username,user_nickname,user_firstname,user_lastname')
            ->where(function (Builder $query) use ($digits) {
                $query
                    ->whereRaw("REPLACE(REPLACE(REPLACE(REPLACE(cus_tel_1,'-',''),' ',''),'(',''),')','') = ?", [$digits])
                    ->orWhereRaw("REPLACE(REPLACE(REPLACE(REPLACE(cus_tel_2,'-',''),' ',''),'(',''),')','') = ?", [$digits]);
            })
            ->limit(5)
            ->get();

        $notebooksQuery = Notebook::query()
            ->with('manageBy:user_id,username,user_nickname,user_firstname,user_lastname')
            ->where('nb_entry_type', '!=', Notebook::ENTRY_TYPE_PERSONAL_ACTIVITY)
            ->whereNull('nb_converted_at')
            ->whereRaw("REPLACE(REPLACE(REPLACE(REPLACE(nb_contact_number,'-',''),' ',''),'(',''),')','') = ?", [$digits]);

        if ($excludeNotebookId) {
            $notebooksQuery->where('id', '!=', $excludeNotebookId);
        }

        $notebooks = $notebooksQuery->orderByDesc('updated_at')->limit(5)->get();

        return [
            'customers' => $this->transformCustomerMatches($customers),
            'notebooks' => $this->transformNotebookMatches($notebooks),
        ];
    }

    protected function findEmailMatches(string $value, ?int $excludeNotebookId): array
    {
        $email = strtolower($value);

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['customers' => [], 'notebooks' => []];
        }

        $customers = MasterCustomer::query()
            ->active()
            ->with('cusManageBy:user_id,username,user_nickname,user_firstname,user_lastname')
            ->whereRaw('LOWER(TRIM(cus_email)) = ?', [$email])
            ->limit(5)
            ->get();

        $notebooksQuery = Notebook::query()
            ->with('manageBy:user_id,username,user_nickname,user_firstname,user_lastname')
            ->where('nb_entry_type', '!=', Notebook::ENTRY_TYPE_PERSONAL_ACTIVITY)
            ->whereNull('nb_converted_at')
            ->whereRaw('LOWER(TRIM(nb_email)) = ?', [$email]);

        if ($excludeNotebookId) {
            $notebooksQuery->where('id', '!=', $excludeNotebookId);
        }

        $notebooks = $notebooksQuery->orderByDesc('updated_at')->limit(5)->get();

        return [
            'customers' => $this->transformCustomerMatches($customers),
            'notebooks' => $this->transformNotebookMatches($notebooks),
        ];
    }

    protected function findCustomerNameMatches(string $value, ?int $excludeNotebookId): array
    {
        if (mb_strlen($value) < 3) {
            return ['customers' => [], 'notebooks' => []];
        }

        $like = '%'.$value.'%';

        $customers = MasterCustomer::query()
            ->active()
            ->with('cusManageBy:user_id,username,user_nickname,user_firstname,user_lastname')
            ->where(function (Builder $query) use ($like) {
                $query->where('cus_name', 'like', $like)
                    ->orWhere('cus_company', 'like', $like);
            })
            ->limit(5)
            ->get();

        $notebooksQuery = Notebook::query()
            ->with('manageBy:user_id,username,user_nickname,user_firstname,user_lastname')
            ->where('nb_entry_type', '!=', Notebook::ENTRY_TYPE_PERSONAL_ACTIVITY)
            ->whereNull('nb_converted_at')
            ->where('nb_customer_name', 'like', $like);

        if ($excludeNotebookId) {
            $notebooksQuery->where('id', '!=', $excludeNotebookId);
        }

        $notebooks = $notebooksQuery->orderByDesc('updated_at')->limit(5)->get();

        return [
            'customers' => $this->transformCustomerMatches($customers),
            'notebooks' => $this->transformNotebookMatches($notebooks),
        ];
    }

    protected function findContactPersonMatches(string $value, ?int $excludeNotebookId): array
    {
        if (mb_strlen($value) < 3) {
            return ['customers' => [], 'notebooks' => []];
        }

        $like = '%'.$value.'%';

        $customers = MasterCustomer::query()
            ->active()
            ->with('cusManageBy:user_id,username,user_nickname,user_firstname,user_lastname')
            ->where(function (Builder $query) use ($like) {
                $query
                    ->whereRaw("CONCAT_WS(' ', cus_firstname, cus_lastname) LIKE ?", [$like])
                    ->orWhere('cus_firstname', 'like', $like)
                    ->orWhere('cus_lastname', 'like', $like);
            })
            ->limit(5)
            ->get();

        $notebooksQuery = Notebook::query()
            ->with('manageBy:user_id,username,user_nickname,user_firstname,user_lastname')
            ->where('nb_entry_type', '!=', Notebook::ENTRY_TYPE_PERSONAL_ACTIVITY)
            ->whereNull('nb_converted_at')
            ->where('nb_contact_person', 'like', $like);

        if ($excludeNotebookId) {
            $notebooksQuery->where('id', '!=', $excludeNotebookId);
        }

        $notebooks = $notebooksQuery->orderByDesc('updated_at')->limit(5)->get();

        return [
            'customers' => $this->transformCustomerMatches($customers),
            'notebooks' => $this->transformNotebookMatches($notebooks),
        ];
    }

    protected function transformCustomerMatches(iterable $customers): array
    {
        return collect($customers)
            ->map(fn (MasterCustomer $customer) => [
                'cus_id' => $customer->cus_id,
                'cus_name' => $customer->cus_name,
                'cus_company' => $customer->cus_company,
                'cus_firstname' => $customer->cus_firstname,
                'cus_lastname' => $customer->cus_lastname,
                'cus_tel_1' => $customer->cus_tel_1,
                'cus_tel_2' => $customer->cus_tel_2,
                'cus_email' => $customer->cus_email,
                'sales_name' => $this->resolveUserDisplayName($customer->cusManageBy ?? null),
            ])
            ->values()
            ->all();
    }

    protected function transformNotebookMatches(iterable $notebooks): array
    {
        return collect($notebooks)
            ->map(fn (Notebook $notebook) => [
                'id' => $notebook->id,
                'nb_customer_name' => $notebook->nb_customer_name,
                'nb_contact_person' => $notebook->nb_contact_person,
                'nb_contact_number' => $notebook->nb_contact_number,
                'nb_email' => $notebook->nb_email,
                'nb_workflow' => $notebook->nb_workflow,
                'nb_entry_type' => $notebook->nb_entry_type,
                'nb_manage_by' => $notebook->nb_manage_by,
                'nb_manage_by_name' => $this->resolveUserDisplayName($notebook->manageBy ?? null),
                'updated_at' => $notebook->updated_at?->toISOString(),
            ])
            ->values()
            ->all();
    }

    protected function resolveUserDisplayName(mixed $user): ?string
    {
        if (! $user) {
            return null;
        }

        $first = trim((string) ($user->user_firstname ?? ''));
        $last = trim((string) ($user->user_lastname ?? ''));
        $fullName = trim($first.' '.$last);

        return $user->username
            ?? $user->user_nickname
            ?? ($fullName !== '' ? $fullName : null);
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
