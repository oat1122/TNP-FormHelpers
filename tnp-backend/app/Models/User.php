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

	// Relationships for MaxSupply
	public function maxSuppliesCreated()
	{
		return $this->hasMany(MaxSupply::class, 'created_by', 'user_id');
	}

	public function maxSuppliesUpdated()
	{
		return $this->hasMany(MaxSupply::class, 'updated_by', 'user_id');
	}

	public function maxSupplyLogs()
	{
		return $this->hasMany(MaxSupplyLog::class, 'user_id', 'user_id');
	}

	public function maxSupplyFiles()
	{
		return $this->hasMany(MaxSupplyFile::class, 'uploaded_by', 'user_id');
	}

	// Accessors for backward compatibility
	public function getIdAttribute()
	{
		return $this->user_id;
	}

	public function getNameAttribute()
	{
		return trim($this->user_firstname . ' ' . $this->user_lastname);
	}

	public function getEmailAttribute()
	{
		return $this->username; // Assuming username is email
	}
}
