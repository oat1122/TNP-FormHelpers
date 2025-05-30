<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class MasterProductCategory
 * 
 * @property string $mpc_id
 * @property string|null $mpc_name
 * @property string|null $mpc_remark
 * @property bool $mpc_is_deleted
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class MasterProductCategory extends Model
{
	protected $table = 'master_product_categories';
	protected $primaryKey = 'mpc_id';
	public $incrementing = false;

	protected $casts = [
		'mpc_is_deleted' => 'bool'
	];

	protected $fillable = [
		'mpc_name',
		'mpc_remark',
		'mpc_is_deleted'
	];
}
