<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class UserSubRole extends Model
{
    protected $table = 'user_sub_roles';
    protected $primaryKey = 'usr_id';
    public $incrementing = false;
    protected $keyType = 'string';

    // Disable updated_at since pivot table only has created_at
    const UPDATED_AT = null;

    protected $fillable = [
        'usr_id',
        'usr_user_id',
        'usr_sub_role_id',
        'created_by',
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
     * Relationship: UserSubRole -> User (Many-to-One)
     */
    public function user()
    {
        return $this->belongsTo(
            \App\Models\User::class,
            'usr_user_id',  // FK column
            'user_id'       // Owner key
        );
    }

    /**
     * Relationship: UserSubRole -> MasterSubRole (Many-to-One)
     */
    public function subRole()
    {
        return $this->belongsTo(
            MasterSubRole::class,
            'usr_sub_role_id',  // FK column
            'msr_id'            // Owner key
        );
    }
}
