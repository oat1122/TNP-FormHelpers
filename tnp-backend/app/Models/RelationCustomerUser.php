<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Class RelationCustomerUser
 * 
 * @property string $rcs_id
 * @property string|null $rcs_cus_id
 * @property int|null $rcs_user_id
 * @property bool $rcs_is_use
 * @property Carbon|null $rcs_created_date
 * @property Carbon|null $rcs_updated_date
 *
 * @package App\Models
 */
class RelationCustomerUser extends Model
{
	protected $table = 'relation_customer_users';
	protected $primaryKey = 'rcs_id';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'rcs_user_id' => 'int',
		'rcs_is_use' => 'bool',
		'rcs_created_date' => 'datetime',
		'rcs_updated_date' => 'datetime'
	];

	protected $fillable = [
		'rcs_cus_id',
		'rcs_user_id',
		'rcs_is_use',
		'rcs_created_date',
		'rcs_updated_date'
	];

	protected static function boot()
	{
		parent::boot();

		static::creating(function ($item) {
			if (empty($item->rcs_id)) {
				$item->rcs_id = Str::uuid(); // สร้างค่า UUID อัตโนมัติ
			}
		});
	}
}
