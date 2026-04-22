<?php

namespace App\Models;

use App\Constants\UserRole;
use App\Helpers\UserSubRoleHelper;
use App\Models\MasterCustomer;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notebook extends Model
{
    use HasFactory;

    public const WORKFLOW_STANDARD = 'standard';

    public const WORKFLOW_LEAD_QUEUE = 'lead_queue';

    public const ENTRY_TYPE_STANDARD = 'standard';

    public const ENTRY_TYPE_CUSTOMER_CARE = 'customer_care';

    public const ENTRY_TYPE_PERSONAL_ACTIVITY = 'personal_activity';

    public const SOURCE_TYPE_CUSTOMER = 'customer';

    public const SOURCE_TYPE_NOTEBOOK = 'notebook';

    public const USER_RELATION_COLUMNS = 'user_id,username,user_nickname,user_firstname,user_lastname,role';

    protected ?string $historyActionOverride = null;

    protected ?array $historyOldValuesOverride = null;

    protected ?array $historyNewValuesOverride = null;

    protected $fillable = [
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
        'nb_next_followup_date',
        'nb_next_followup_note',
        'nb_is_favorite',
        'nb_manage_by',
        'nb_workflow',
        'nb_entry_type',
        'nb_source_type',
        'nb_source_customer_id',
        'nb_source_notebook_id',
        'nb_lead_payload',
        'nb_claimed_at',
        'nb_converted_customer_id',
    ];

    protected $attributes = [
        'nb_workflow' => self::WORKFLOW_STANDARD,
        'nb_entry_type' => self::ENTRY_TYPE_STANDARD,
    ];

    protected $casts = [
        'nb_is_online' => 'boolean',
        'nb_is_favorite' => 'boolean',
        'nb_date' => 'date',
        'nb_next_followup_date' => 'date',
        'nb_converted_at' => 'datetime',
        'nb_claimed_at' => 'datetime',
        'nb_source_notebook_id' => 'integer',
        'nb_lead_payload' => 'array',
    ];

    public function manageBy()
    {
        return $this->belongsTo(User::class, 'nb_manage_by', 'user_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_id');
    }

    public function histories()
    {
        return $this->hasMany(NotebookHistory::class)->orderBy('created_at', 'desc');
    }

    public function sourceCustomer()
    {
        return $this->belongsTo(MasterCustomer::class, 'nb_source_customer_id', 'cus_id');
    }

    public function sourceNotebook()
    {
        return $this->belongsTo(self::class, 'nb_source_notebook_id');
    }

    public function isLeadQueue(): bool
    {
        return $this->nb_workflow === self::WORKFLOW_LEAD_QUEUE;
    }

    public function isCustomerCare(): bool
    {
        return $this->nb_entry_type === self::ENTRY_TYPE_CUSTOMER_CARE;
    }

    public function isPersonalActivity(): bool
    {
        return $this->nb_entry_type === self::ENTRY_TYPE_PERSONAL_ACTIVITY;
    }

    public function setHistoryContext(?string $action = null, ?array $oldValues = null, ?array $newValues = null): self
    {
        $this->historyActionOverride = $action;
        $this->historyOldValuesOverride = $oldValues;
        $this->historyNewValuesOverride = $newValues;

        return $this;
    }

    public function pullHistoryContext(): array
    {
        $context = [
            'action' => $this->historyActionOverride,
            'old_values' => $this->historyOldValuesOverride,
            'new_values' => $this->historyNewValuesOverride,
        ];

        $this->historyActionOverride = null;
        $this->historyOldValuesOverride = null;
        $this->historyNewValuesOverride = null;

        return $context;
    }

    public function scopeLeadQueue(Builder $query): Builder
    {
        return $query->where('nb_workflow', self::WORKFLOW_LEAD_QUEUE);
    }

    public function scopeQueueInbox(Builder $query): Builder
    {
        return $query->leadQueue()
            ->whereNull('nb_manage_by')
            ->whereNull('nb_converted_at');
    }

    public function scopeVisibleTo(Builder $query, $user, ?string $scope = null): Builder
    {
        if (! $user) {
            return $query->whereRaw('1 = 0');
        }

        if (method_exists($user, 'loadMissing') && ! $user->relationLoaded('subRoles')) {
            $user->loadMissing('subRoles');
        }

        $resolvedScope = $scope ?? (UserSubRoleHelper::canViewAllNotebookScope($user) ? 'all' : 'mine');

        if ($resolvedScope === 'queue') {
            if (! UserSubRoleHelper::canViewNotebookQueue($user)) {
                return $query->whereRaw('1 = 0');
            }

            return $query->queueInbox();
        }

        if (UserSubRoleHelper::canViewAllNotebookScope($user) && $resolvedScope === 'all') {
            return $query;
        }

        return $query->where('nb_manage_by', $user?->user_id);
    }

    public function scopeWithRequestedIncludes(Builder $query, array $includes): Builder
    {
        $query->with(['manageBy:'.self::USER_RELATION_COLUMNS]);

        if (in_array('histories', $includes, true)) {
            $query->with(['histories.actionBy:'.self::USER_RELATION_COLUMNS]);
        }

        return $query;
    }

    public function scopeApplySearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($search) {
            $builder->where('nb_customer_name', 'like', "%{$search}%")
                ->orWhere('nb_contact_number', 'like', "%{$search}%")
                ->orWhere('nb_contact_person', 'like', "%{$search}%");
        });
    }

    public function scopeFilterDateRange(Builder $query, ?string $startDate, ?string $endDate, string $dateFilterBy = 'nb_date'): Builder
    {
        if (! $startDate || ! $endDate) {
            return $query;
        }

        $column = in_array($dateFilterBy, ['nb_date', 'created_at', 'updated_at', 'all'], true)
            ? $dateFilterBy
            : 'nb_date';

        if ($column === 'all') {
            return $query->where(function (Builder $builder) use ($startDate, $endDate) {
                $builder->whereBetween('created_at', [
                    $startDate.' 00:00:00',
                    $endDate.' 23:59:59',
                ])->orWhereBetween('updated_at', [
                    $startDate.' 00:00:00',
                    $endDate.' 23:59:59',
                ]);
            });
        }

        if ($column === 'nb_date') {
            return $query->whereBetween($column, [$startDate, $endDate]);
        }

        return $query->whereBetween($column, [
            $startDate.' 00:00:00',
            $endDate.' 23:59:59',
        ]);
    }

    public function scopeFilterStatus(Builder $query, ?string $status): Builder
    {
        if ($status !== null && $status !== '') {
            $query->where('nb_status', $status);
        }

        return $query;
    }

    public function scopeFilterAction(Builder $query, ?string $action): Builder
    {
        if ($action !== null && $action !== '') {
            $query->where('nb_action', $action);
        }

        return $query;
    }

    public function scopeFilterManageBy(Builder $query, ?int $manageBy): Builder
    {
        if ($manageBy !== null) {
            $query->where('nb_manage_by', $manageBy);
        }

        return $query;
    }

    public function scopeFilterWorkflow(Builder $query, ?string $workflow): Builder
    {
        if ($workflow !== null && $workflow !== '') {
            $query->where('nb_workflow', $workflow);
        }

        return $query;
    }

    public function scopeFilterEntryType(Builder $query, ?string $entryType): Builder
    {
        if ($entryType !== null && $entryType !== '' && $entryType !== 'all') {
            $query->where('nb_entry_type', $entryType);
        }

        return $query;
    }
}
