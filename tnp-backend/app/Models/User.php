<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Auth\Authenticatable as AuthAuthenticatable;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;

/**
 * Class User
 * 
 * @property int $user_id
 * @property string $user_uuid
 * @property string $username
 * @property string $password
 * @property string $role
 * @property string|null $user_emp_no
 * @property string|null $user_firstname
 * @property string|null $user_lastname
 * @property string|null $user_phone
 * @property string|null $user_nickname
 * @property string|null $user_position
 * @property string $enable
 * @property bool $user_is_enable
 * @property int $deleted
 * @property bool $user_is_deleted
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $new_pass
 * @property bool|null $pass_is_updated
 * @property Carbon|null $user_created_date
 * @property string|null $user_created_by
 * @property Carbon|null $user_updated_date
 * @property string|null $user_updated_by
 *
 * @package App\Models
 */
class User extends Model implements Authenticatable
{
	use HasFactory, AuthAuthenticatable, HasApiTokens;

	protected $table = 'users';
	protected $primaryKey = 'user_id';

	protected $casts = [
		'user_is_enable' => 'boolean',
		'deleted' => 'int',
		'user_is_deleted' => 'bool',
		'pass_is_updated' => 'bool',
		'user_created_date' => 'datetime',
		'user_updated_date' => 'datetime'
	];

	protected $hidden = [
		'password',
		'new_pass'
	];

	protected $fillable = [
		'user_uuid',
		'username',
		'password',
		'role',		// ['admin','manager','production','graphic','sale','technician','telesale']
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

	/**
	 * Get all notification reads by this user
	 */
	public function notificationReads()
	{
		return $this->hasMany(CustomerNotificationRead::class, 'user_id', 'user_id');
	}

	/**
	 * Get unread customer allocations for this user
	 */
	public function unreadAllocations()
	{
		return MasterCustomer::where('cus_manage_by', $this->user_id)
			->where('cus_allocation_status', 'allocated')
			->whereNotNull('cus_allocated_at')
			->whereDoesntHave('notificationReads', function($query) {
				$query->where('user_id', $this->user_id);
			});
	}

	/**
	 * Relationship: User -> Sub Roles (Many-to-Many through user_sub_roles)
	 */
	public function subRoles()
	{
		return $this->belongsToMany(
			MasterSubRole::class,
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
			UserSubRole::class,
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
		UserSubRole::where('usr_user_id', $this->user_id)->delete();

		// Insert new sub roles
		foreach ($subRoleIds as $subRoleId) {
			UserSubRole::create([
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
