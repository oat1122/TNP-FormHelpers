<?php

namespace App\Models\User;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_uuid',
		'username',
		'password',
		'role',		// ['admin','manager','production','graphic','sale','technician']
		'user_emp_no',
		'user_firstname',
		'user_lastname',
		'user_phone',
		'user_nickname',
		'user_position',
		'enable',
		'user_is_enable',
		'deleted',
		'user_is_deleted',
		'new_pass',
		'pass_is_updated',
		'user_created_date',
		'user_created_by',
		'user_updated_date',
		'user_updated_by'
    ];

    protected $primaryKey = 'user_id';

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'new_pass',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Relationship: User -> Sub Roles (Many-to-Many through user_sub_roles)
     */
    public function subRoles()
    {
        return $this->belongsToMany(
            \App\Models\MasterSubRole::class,
            'user_sub_roles',      // Pivot table
            'usr_user_id',         // FK on pivot table pointing to this model
            'usr_sub_role_id',     // FK on pivot table pointing to MasterSubRole
            'user_id',             // PK of this model
            'msr_id'               // PK of MasterSubRole model
        )->withPivot('created_at', 'created_by');
    }

    /**
     * Relationship: User -> UserSubRoles (One-to-Many - direct pivot access)
     */
    public function userSubRoles()
    {
        return $this->hasMany(
            \App\Models\UserSubRole::class,
            'usr_user_id',  // FK column
            'user_id'       // Local key
        );
    }

    /**
     * Helper: Sync Sub Roles for this user
     * @param array $subRoleIds - Array of msr_id values
     * @param int|null $createdBy - User ID who is making the change
     */
    public function syncSubRoles(array $subRoleIds, ?int $createdBy = null): void
    {
        // Delete existing sub roles for this user
        \App\Models\UserSubRole::where('usr_user_id', $this->user_id)->delete();

        // Insert new sub roles
        foreach ($subRoleIds as $subRoleId) {
            \App\Models\UserSubRole::create([
                'usr_user_id' => $this->user_id,
                'usr_sub_role_id' => $subRoleId,
                'created_by' => $createdBy,
            ]);
        }
    }

    /**
     * Helper: Get Sub Role codes array
     * @return array
     */
    public function getSubRoleCodes(): array
    {
        return $this->subRoles->pluck('msr_code')->toArray();
    }

    /**
     * Helper: Check if user has specific sub role
     * @param string $code - Sub role code (e.g., 'HEAD_ONLINE')
     * @return bool
     */
    public function hasSubRole(string $code): bool
    {
        return $this->subRoles()->where('msr_code', $code)->exists();
    }
}
