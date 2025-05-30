<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class MasterRole
 * 
 * @property string $role_id
 * @property string|null $role_name
 * @property string|null $role_remark
 * @property bool|null $role_is_deleted
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class MasterRole extends Model
{
	protected $table = 'master_roles';
	protected $primaryKey = 'role_id';
	public $incrementing = false;

	protected $casts = [
		'role_is_deleted' => 'bool'
	];

	protected $fillable = [
		'role_name',
		'role_remark',
		'role_is_deleted'
	];
}
