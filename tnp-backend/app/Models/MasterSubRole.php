<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class MasterSubRole extends Model
{
    protected $table = 'master_sub_roles';
    protected $primaryKey = 'msr_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'msr_id',
        'msr_code',
        'msr_name',
        'msr_description',
        'msr_is_active',
        'msr_sort',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'msr_is_active' => 'boolean',
        'msr_sort' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    /**
     * Relationship: Sub Role -> Users (Many-to-Many through user_sub_roles)
     */
    public function users()
    {
        return $this->belongsToMany(
            \App\Models\User::class,
            'user_sub_roles',      // Pivot table
            'usr_sub_role_id',     // FK on pivot table pointing to this model
            'usr_user_id',         // FK on pivot table pointing to User
            'msr_id',              // PK of this model
            'user_id'              // PK of User model
        )->withTimestamps();
    }

    /**
     * Scope: Active Sub Roles only
     */
    public function scopeActive($query)
    {
        return $query->where('msr_is_active', true);
    }

    /**
     * Scope: Ordered by sort field
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('msr_sort', 'asc')->orderBy('msr_name', 'asc');
    }
}
