<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class RelationUserRole
 * 
 * @property string $rur_id
 * @property string|null $rur_user_id
 * @property string|null $rur_role_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class RelationUserRole extends Model
{
	protected $table = 'relation_user_roles';
	protected $primaryKey = 'rur_id';
	public $incrementing = false;

	protected $fillable = [
		'rur_user_id',
		'rur_role_id'
	];
}
