<?php

namespace App\Models;

use App\Constants\UserRole;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notebook extends Model
{
    use HasFactory;

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
        'nb_manage_by'
    ];

    protected $casts = [
        'nb_is_online' => 'boolean',
        'nb_date' => 'date',
        'nb_converted_at' => 'datetime',
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

    public function scopeVisibleTo(Builder $query, $user): Builder
    {
        if (! $user || ! in_array($user->role, [UserRole::ADMIN, UserRole::MANAGER], true)) {
            $query->where('nb_manage_by', $user?->user_id);
        }

        return $query;
    }

    public function scopeWithRequestedIncludes(Builder $query, array $includes): Builder
    {
        if (in_array('histories', $includes, true)) {
            $query->with('histories.actionBy');
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
}
