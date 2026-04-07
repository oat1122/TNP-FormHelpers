<?php

namespace App\Services\Notebook;

use App\Constants\UserRole;
use App\Helpers\UserSubRoleHelper;
use App\Models\MasterCustomer;
use App\Models\Notebook;
use App\Models\User\User;
use App\Repositories\NotebookRepositoryInterface;
use App\Services\CustomerService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class NotebookService
{
    public function __construct(
        protected NotebookRepositoryInterface $notebookRepository,
        protected CustomerService $customerService
    ) {}

    public function create(array $validated, $user): Notebook
    {
        return DB::transaction(function () use ($validated, $user) {
            $data = $this->preparePayload($validated, $user, false);

            $notebook = new Notebook($data);
            $notebook->created_by = $user->user_id;
            $notebook->updated_by = $user->user_id;

            if ($notebook->isLeadQueue()) {
                $notebook->setHistoryContext($this->resolveCreateHistoryAction($notebook));
            }

            $notebook->save();

            return $this->notebookRepository->findWithRelationsOrFail((string) $notebook->id);
        });
    }

    public function createLead(array $validated, $user): Notebook
    {
        if (! UserSubRoleHelper::shouldCreateLeadIntoQueue($user) && ! UserSubRoleHelper::shouldCreateLeadIntoMine($user)) {
            throw new AuthorizationException('Unauthorized: You do not have permission to create notebook leads.');
        }

        return DB::transaction(function () use ($validated, $user) {
            $ownerId = $this->resolveLeadOwnerId($user);
            $contactPerson = trim(($validated['cus_firstname'] ?? '').' '.($validated['cus_lastname'] ?? ''));

            $notebook = new Notebook([
                'nb_date' => now()->toDateString(),
                'nb_time' => now()->format('H:i'),
                'nb_customer_name' => $this->resolveLeadDisplayName($validated),
                'nb_is_online' => (int) ($validated['cus_channel'] ?? 1) === 2,
                'nb_additional_info' => $validated['cd_note'] ?? null,
                'nb_contact_number' => $validated['cus_tel_1'] ?? null,
                'nb_email' => $validated['cus_email'] ?? null,
                'nb_contact_person' => $contactPerson !== '' ? $contactPerson : ($validated['cus_name'] ?? null),
                'nb_action' => null,
                'nb_status' => null,
                'nb_remarks' => $validated['cd_remark'] ?? null,
                'nb_manage_by' => $ownerId,
                'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
                'nb_lead_payload' => $validated,
                'nb_claimed_at' => $ownerId ? now() : null,
            ]);

            $notebook->created_by = $user->user_id;
            $notebook->updated_by = $user->user_id;
            $notebook->setHistoryContext($this->resolveCreateHistoryAction($notebook));
            $notebook->save();

            return $this->notebookRepository->findWithRelationsOrFail((string) $notebook->id);
        });
    }

    public function update(string $id, array $validated, $user): Notebook
    {
        return DB::transaction(function () use ($id, $validated, $user) {
            /** @var Notebook $notebook */
            $notebook = $this->notebookRepository->findOrFail($id);
            $this->authorizeAccess($user, $notebook, 'edit');

            $notebook->fill($this->preparePayload($validated, $user, true));
            $notebook->updated_by = $user->user_id;
            $notebook->save();

            return $this->notebookRepository->findWithRelationsOrFail($id);
        });
    }

    public function convert(string $id, array $validated, $user): Notebook
    {
        return DB::transaction(function () use ($id, $validated, $user) {
            /** @var Notebook $notebook */
            $notebook = Notebook::query()->lockForUpdate()->findOrFail($id);
            $this->authorizeAccess($user, $notebook, 'convert');

            if ($notebook->nb_converted_at) {
                throw new \DomainException('Notebook has already been converted.');
            }

            $convertedCustomerId = $validated['customer_id'] ?? null;
            if (! $convertedCustomerId && $notebook->isLeadQueue() && ! empty($notebook->nb_lead_payload)) {
                $convertedCustomerId = $this->customerService
                    ->createCustomer($this->buildCustomerPayloadFromLeadNotebook($notebook))
                    ->cus_id;
            }

            if (array_key_exists('nb_status', $validated)) {
                $notebook->nb_status = $validated['nb_status'];
            }

            $notebook->nb_converted_at = now();
            if ($convertedCustomerId) {
                $notebook->nb_converted_customer_id = $convertedCustomerId;
            }
            $notebook->updated_by = $user->user_id;
            $notebook->setHistoryContext('converted');
            $notebook->save();

            return $this->notebookRepository->findWithRelationsOrFail($id);
        });
    }

    public function reserve(string $id, $user): Notebook
    {
        return DB::transaction(function () use ($id, $user) {
            /** @var Notebook $notebook */
            $notebook = Notebook::query()->lockForUpdate()->findOrFail($id);

            if (! $this->canReserve($user, $notebook)) {
                throw new AuthorizationException('Unauthorized: You do not have permission to reserve this notebook.');
            }

            if (! $notebook->isLeadQueue()) {
                throw new \DomainException('Only lead queue notebooks can be reserved.');
            }

            if ($notebook->nb_converted_at) {
                throw new \DomainException('This notebook lead has already been converted.');
            }

            if ($notebook->nb_manage_by) {
                throw new \DomainException('This notebook lead has already been reserved.');
            }

            $notebook->nb_manage_by = $user->user_id;
            $notebook->nb_claimed_at = now();
            $notebook->updated_by = $user->user_id;
            $notebook->setHistoryContext('reserved');
            $notebook->save();

            return $this->notebookRepository->findWithRelationsOrFail((string) $notebook->id);
        });
    }

    public function assign(string $id, int $salesUserId, $user): Notebook
    {
        /** @var Notebook $notebook */
        $notebook = $this->assignMany([$id], $salesUserId, $user)->first();

        return $notebook;
    }

    public function assignMany(array $notebookIds, int $salesUserId, $user): Collection
    {
        if (! $this->canAssignNotebookQueue($user)) {
            throw new AuthorizationException('Unauthorized: You do not have permission to assign these notebooks.');
        }

        $normalizedIds = collect($notebookIds)
            ->map(static fn ($id) => (int) $id)
            ->filter(static fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($normalizedIds->isEmpty()) {
            throw new \DomainException('Please select at least one notebook to assign.');
        }

        return DB::transaction(function () use ($normalizedIds, $salesUserId, $user) {
            $assignee = $this->resolveAssignableAssignee($salesUserId, $user);

            $notebooks = Notebook::query()
                ->whereIn('id', $normalizedIds->all())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($notebooks->count() !== $normalizedIds->count()) {
                throw new \DomainException('Some selected notebooks were not found.');
            }

            foreach ($normalizedIds as $notebookId) {
                /** @var Notebook $notebook */
                $notebook = $notebooks->get($notebookId);
                $this->validateAssignableNotebook($notebook);
                $this->assignLockedNotebook($notebook, $assignee->user_id, $user->user_id);
            }

            return $normalizedIds
                ->map(fn ($notebookId) => $this->notebookRepository->findWithRelationsOrFail((string) $notebookId))
                ->values();
        });
    }

    public function delete(string $id, $user): void
    {
        if (! $this->canDelete($user)) {
            throw new AuthorizationException('Unauthorized: Only Admin can delete notebooks.');
        }

        DB::transaction(function () use ($id) {
            /** @var Notebook $notebook */
            $notebook = $this->notebookRepository->findOrFail($id);
            $notebook->delete();
        });
    }

    public function authorizeAccess($user, Notebook $notebook, string $action = 'view'): void
    {
        $allowed = match ($action) {
            'edit' => $this->canEdit($user, $notebook),
            'convert' => $this->canConvert($user, $notebook),
            default => $this->canView($user, $notebook),
        };

        if ($allowed) {
            return;
        }

        $message = match ($action) {
            'edit' => 'Unauthorized: You do not have permission to edit this notebook.',
            'convert' => 'Unauthorized: You do not have permission to convert this notebook.',
            default => 'Unauthorized: You do not have permission to view this notebook.',
        };

        throw new AuthorizationException($message);
    }

    public function canAccess($user, Notebook $notebook): bool
    {
        return $this->canView($user, $notebook);
    }

    public function canView($user, Notebook $notebook): bool
    {
        if (! $user) {
            return false;
        }

        if ($this->canManageAll($user)) {
            return true;
        }

        if ($this->isQueueInboxVisibleToUser($user, $notebook)) {
            return true;
        }

        return (int) $notebook->nb_manage_by === (int) $user->user_id;
    }

    public function canEdit($user, Notebook $notebook): bool
    {
        if (! $user) {
            return false;
        }

        if ($this->canManageAll($user)) {
            return true;
        }

        return (int) $notebook->nb_manage_by === (int) $user->user_id;
    }

    public function canConvert($user, Notebook $notebook): bool
    {
        return $this->canEdit($user, $notebook);
    }

    public function canReserve($user, Notebook $notebook): bool
    {
        if (! $user || ! $notebook->isLeadQueue() || $notebook->nb_converted_at) {
            return false;
        }

        if ($this->canManageAll($user)) {
            return true;
        }

        return UserSubRoleHelper::canReserveNotebookQueue($user);
    }

    public function canAssignNotebookQueue($user): bool
    {
        return UserSubRoleHelper::canAssignNotebookQueue($user);
    }

    public function canManageAll($user): bool
    {
        return UserSubRoleHelper::canManageAllNotebooks($user);
    }

    public function canDelete($user): bool
    {
        return (bool) $user && $user->role === UserRole::ADMIN;
    }

    public function canCreateCustomerCare($user): bool
    {
        return (bool) $user && $user->role === UserRole::SALE;
    }

    public function searchCustomerCareSources(array $filters, $user): LengthAwarePaginator
    {
        if (! $this->canCreateCustomerCare($user)) {
            throw new AuthorizationException('Unauthorized: You do not have permission to manage customer care entries.');
        }

        $source = $filters['source'] ?? Notebook::SOURCE_TYPE_CUSTOMER;

        return $source === Notebook::SOURCE_TYPE_NOTEBOOK
            ? $this->searchCustomerCareNotebookSources($filters, $user)
            : $this->searchCustomerCareCustomerSources($filters, $user);
    }

    public function createCustomerCare(array $validated, $user): Notebook
    {
        if (! $this->canCreateCustomerCare($user)) {
            throw new AuthorizationException('Unauthorized: You do not have permission to create customer care entries.');
        }

        return DB::transaction(function () use ($validated, $user) {
            $sourceType = $validated['source_type'];
            $snapshot = $this->resolveCustomerCareSnapshot($validated, $user);

            $notebook = new Notebook([
                'nb_date' => $validated['nb_date'],
                'nb_time' => now()->format('H:i'),
                'nb_customer_name' => $snapshot['customer_name'],
                'nb_is_online' => $snapshot['is_online'],
                'nb_additional_info' => $validated['nb_additional_info'] ?? null,
                'nb_contact_number' => $snapshot['contact_number'],
                'nb_email' => $snapshot['email'],
                'nb_contact_person' => $snapshot['contact_person'],
                'nb_action' => $validated['nb_action'] ?? null,
                'nb_status' => $validated['nb_status'] ?? null,
                'nb_remarks' => $validated['nb_remarks'] ?? null,
                'nb_manage_by' => $user->user_id,
                'nb_workflow' => Notebook::WORKFLOW_STANDARD,
                'nb_entry_type' => Notebook::ENTRY_TYPE_CUSTOMER_CARE,
                'nb_source_type' => $sourceType,
                'nb_source_customer_id' => $sourceType === Notebook::SOURCE_TYPE_CUSTOMER
                    ? $validated['source_customer_id']
                    : null,
                'nb_source_notebook_id' => $sourceType === Notebook::SOURCE_TYPE_NOTEBOOK
                    ? (int) $validated['source_notebook_id']
                    : null,
            ]);

            $notebook->created_by = $user->user_id;
            $notebook->updated_by = $user->user_id;
            $notebook->save();

            return $this->notebookRepository->findWithRelationsOrFail((string) $notebook->id);
        });
    }

    protected function preparePayload(array $validated, $user, bool $isUpdate): array
    {
        $data = Arr::only($validated, [
            'nb_date',
            'nb_time',
            'nb_customer_name',
            'nb_is_online',
            'nb_additional_info',
            'nb_contact_number',
            'nb_email',
            'nb_contact_person',
            'nb_action',
            'nb_status',
            'nb_remarks',
            'nb_manage_by',
            'nb_workflow',
        ]);

        $workflow = $data['nb_workflow'] ?? Notebook::WORKFLOW_STANDARD;
        $data['nb_workflow'] = in_array($workflow, [Notebook::WORKFLOW_STANDARD, Notebook::WORKFLOW_LEAD_QUEUE], true)
            ? $workflow
            : Notebook::WORKFLOW_STANDARD;
        if (! $isUpdate) {
            $data['nb_entry_type'] = Notebook::ENTRY_TYPE_STANDARD;
        }

        if ($data['nb_workflow'] === Notebook::WORKFLOW_LEAD_QUEUE && ! $isUpdate) {
            $data['nb_manage_by'] = $this->resolveLeadOwnerId($user);
            $data['nb_claimed_at'] = ! empty($data['nb_manage_by']) ? now() : null;

            return $data;
        }

        unset($data['nb_workflow']);

        if (! $this->canManageAll($user)) {
            if ($isUpdate) {
                unset($data['nb_manage_by']);
            } else {
                $data['nb_manage_by'] = $user->user_id;
            }
        }

        return $data;
    }

    protected function searchCustomerCareCustomerSources(array $filters, $user): LengthAwarePaginator
    {
        $page = (int) ($filters['page'] ?? 1);
        $perPage = (int) ($filters['per_page'] ?? 10);
        $search = trim((string) ($filters['search'] ?? ''));

        return MasterCustomer::query()
            ->active()
            ->select([
                'cus_id',
                'cus_channel',
                'cus_company',
                'cus_firstname',
                'cus_lastname',
                'cus_name',
                'cus_tel_1',
                'cus_email',
                'cus_manage_by',
                'cus_created_date',
                'cus_updated_date',
            ])
            ->where('cus_manage_by', $user->user_id)
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $searchQuery) use ($search) {
                    $searchQuery->where('cus_company', 'like', "%{$search}%")
                        ->orWhere('cus_name', 'like', "%{$search}%")
                        ->orWhere('cus_firstname', 'like', "%{$search}%")
                        ->orWhere('cus_lastname', 'like', "%{$search}%")
                        ->orWhere('cus_tel_1', 'like', "%{$search}%")
                        ->orWhere('cus_email', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('cus_updated_date')
            ->orderByDesc('cus_created_date')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    protected function searchCustomerCareNotebookSources(array $filters, $user): LengthAwarePaginator
    {
        $page = (int) ($filters['page'] ?? 1);
        $perPage = (int) ($filters['per_page'] ?? 10);
        $search = trim((string) ($filters['search'] ?? ''));

        return Notebook::query()
            ->select([
                'id',
                'nb_date',
                'nb_customer_name',
                'nb_is_online',
                'nb_contact_number',
                'nb_email',
                'nb_contact_person',
                'nb_manage_by',
                'created_at',
                'updated_at',
            ])
            ->where('nb_manage_by', $user->user_id)
            ->filterEntryType(Notebook::ENTRY_TYPE_STANDARD)
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $searchQuery) use ($search) {
                    $searchQuery->where('nb_customer_name', 'like', "%{$search}%")
                        ->orWhere('nb_contact_person', 'like', "%{$search}%")
                        ->orWhere('nb_contact_number', 'like', "%{$search}%")
                        ->orWhere('nb_email', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('updated_at')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    protected function resolveLeadOwnerId($user): ?int
    {
        if (UserSubRoleHelper::shouldCreateLeadIntoQueue($user)) {
            return null;
        }

        if (UserSubRoleHelper::shouldCreateLeadIntoMine($user)) {
            return $user->user_id;
        }

        return $this->canManageAll($user) ? $user->user_id : null;
    }

    protected function resolveCreateHistoryAction(Notebook $notebook): string
    {
        if (! $notebook->isLeadQueue()) {
            return 'created';
        }

        return $notebook->nb_manage_by ? 'created_to_mine' : 'created_to_queue';
    }

    protected function resolveLeadDisplayName(array $payload): string
    {
        $company = trim((string) ($payload['cus_company'] ?? ''));
        if ($company !== '') {
            return $company;
        }

        $fullName = trim(($payload['cus_firstname'] ?? '').' '.($payload['cus_lastname'] ?? ''));
        if ($fullName !== '') {
            return $fullName;
        }

        return trim((string) ($payload['cus_name'] ?? ''));
    }

    protected function resolveCustomerCareSnapshot(array $validated, $user): array
    {
        $sourceType = $validated['source_type'] ?? null;

        return match ($sourceType) {
            Notebook::SOURCE_TYPE_CUSTOMER => $this->resolveCustomerCareCustomerSnapshot(
                (string) $validated['source_customer_id'],
                $user
            ),
            Notebook::SOURCE_TYPE_NOTEBOOK => $this->resolveCustomerCareNotebookSnapshot(
                (string) $validated['source_notebook_id'],
                $user
            ),
            default => throw new \DomainException('Selected customer care source type is invalid.'),
        };
    }

    protected function resolveCustomerCareCustomerSnapshot(string $customerId, $user): array
    {
        $customer = MasterCustomer::query()
            ->active()
            ->select([
                'cus_id',
                'cus_channel',
                'cus_company',
                'cus_firstname',
                'cus_lastname',
                'cus_name',
                'cus_tel_1',
                'cus_email',
                'cus_manage_by',
            ])
            ->where('cus_manage_by', $user->user_id)
            ->where('cus_id', $customerId)
            ->first();

        if (! $customer) {
            throw new \DomainException('Selected customer source is not available.');
        }

        $contactPerson = trim(($customer->cus_firstname ?? '').' '.($customer->cus_lastname ?? ''));
        $customerName = trim((string) ($customer->cus_company ?: $customer->cus_name ?: $contactPerson));

        return [
            'customer_name' => $customerName !== '' ? $customerName : '-',
            'contact_person' => $contactPerson !== '' ? $contactPerson : ($customer->cus_name ?: $customerName ?: null),
            'contact_number' => $customer->cus_tel_1,
            'email' => $customer->cus_email,
            'is_online' => (int) ($customer->cus_channel ?? 0) === 2,
        ];
    }

    protected function resolveCustomerCareNotebookSnapshot(string $notebookId, $user): array
    {
        $notebook = Notebook::query()
            ->select([
                'id',
                'nb_customer_name',
                'nb_is_online',
                'nb_contact_number',
                'nb_email',
                'nb_contact_person',
                'nb_manage_by',
                'nb_entry_type',
            ])
            ->where('nb_manage_by', $user->user_id)
            ->filterEntryType(Notebook::ENTRY_TYPE_STANDARD)
            ->find($notebookId);

        if (! $notebook) {
            throw new \DomainException('Selected notebook source is not available.');
        }

        return [
            'customer_name' => $notebook->nb_customer_name ?: '-',
            'contact_person' => $notebook->nb_contact_person ?: ($notebook->nb_customer_name ?: null),
            'contact_number' => $notebook->nb_contact_number,
            'email' => $notebook->nb_email,
            'is_online' => (bool) $notebook->nb_is_online,
        ];
    }

    protected function isQueueInboxVisibleToUser($user, Notebook $notebook): bool
    {
        return $notebook->isLeadQueue()
            && ! $notebook->nb_manage_by
            && ! $notebook->nb_converted_at
            && UserSubRoleHelper::canViewNotebookQueue($user);
    }

    protected function validateAssignableNotebook(Notebook $notebook): void
    {
        if (! $notebook->isLeadQueue()) {
            throw new \DomainException('Only lead queue notebooks can be assigned.');
        }

        if ($notebook->nb_converted_at) {
            throw new \DomainException('This notebook lead has already been converted.');
        }

        if ($notebook->nb_manage_by) {
            throw new \DomainException('This notebook lead has already been assigned.');
        }
    }

    protected function assignLockedNotebook(Notebook $notebook, int $assigneeUserId, int $actionUserId): void
    {
        $notebook->nb_manage_by = $assigneeUserId;
        $notebook->nb_claimed_at = now();
        $notebook->updated_by = $actionUserId;
        $notebook->setHistoryContext('assigned');
        $notebook->save();
    }

    protected function resolveAssignableAssignee(int $salesUserId, $actingUser): User
    {
        $assignee = User::query()
            ->with('subRoles:msr_id,msr_code,msr_name')
            ->where('user_id', $salesUserId)
            ->where('user_is_enable', true)
            ->where('user_is_deleted', false)
            ->where(function (Builder $query) {
                $query->whereNull('enable')
                    ->orWhere('enable', 'Y');
            })
            ->first();

        if (! $assignee) {
            throw new \DomainException('Selected assignee is not available.');
        }

        if (UserSubRoleHelper::hasAnySubRole($assignee, [UserSubRoleHelper::SALES_OFFLINE])) {
            return $assignee;
        }

        $canSupportSalesAssignToHeadOffline = UserSubRoleHelper::hasAnySubRole($actingUser, [UserSubRoleHelper::SUPPORT_SALES])
            && UserSubRoleHelper::hasAnySubRole($assignee, [UserSubRoleHelper::HEAD_OFFLINE]);

        if ($canSupportSalesAssignToHeadOffline) {
            return $assignee;
        }

        $canAssignToSelfAsHeadOffline = UserSubRoleHelper::hasAnySubRole($actingUser, [UserSubRoleHelper::HEAD_OFFLINE])
            && (int) $assignee->user_id === (int) ($actingUser->user_id ?? 0)
            && UserSubRoleHelper::hasAnySubRole($assignee, [UserSubRoleHelper::HEAD_OFFLINE]);

        if ($canAssignToSelfAsHeadOffline) {
            return $assignee;
        }

        throw new \DomainException('Selected assignee must be an active SALES_OFFLINE user or an eligible HEAD_OFFLINE user.');
    }

    protected function buildCustomerPayloadFromLeadNotebook(Notebook $notebook): array
    {
        $payload = is_array($notebook->nb_lead_payload) ? $notebook->nb_lead_payload : [];
        $firstName = trim((string) ($payload['cus_firstname'] ?? ''));
        $lastName = trim((string) ($payload['cus_lastname'] ?? ''));
        $contactPerson = trim((string) ($notebook->nb_contact_person ?? ''));

        if ($firstName === '' && $contactPerson !== '') {
            $nameParts = preg_split('/\s+/', $contactPerson, -1, PREG_SPLIT_NO_EMPTY) ?: [];
            $firstName = $nameParts[0] ?? $notebook->nb_customer_name ?? '-';
            $lastName = $lastName !== '' ? $lastName : trim(implode(' ', array_slice($nameParts, 1)));
        }

        $company = trim((string) ($payload['cus_company'] ?? $notebook->nb_customer_name ?? ''));
        $customerName = trim((string) ($payload['cus_name'] ?? $contactPerson ?: $notebook->nb_customer_name ?? ''));

        return array_merge($payload, [
            'cus_channel' => $payload['cus_channel'] ?? ($notebook->nb_is_online ? 2 : 1),
            'cus_company' => $company !== '' ? $company : ($customerName !== '' ? $customerName : '-'),
            'cus_name' => $customerName !== '' ? $customerName : ($company !== '' ? $company : '-'),
            'cus_firstname' => $firstName !== '' ? $firstName : ($customerName !== '' ? $customerName : '-'),
            'cus_lastname' => $lastName !== '' ? $lastName : '-',
            'cus_tel_1' => $payload['cus_tel_1'] ?? $notebook->nb_contact_number,
            'cus_email' => $payload['cus_email'] ?? $notebook->nb_email,
            'cd_note' => $payload['cd_note'] ?? $notebook->nb_additional_info,
            'cus_source' => $payload['cus_source'] ?? 'telesales',
            'cus_allocation_status' => 'allocated',
            'cus_manage_by' => $notebook->nb_manage_by,
            'cus_allocated_by' => $notebook->created_by,
        ]);
    }
}
