<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Class CustomerDetail
 * 
 * @property string $cd_id
 * @property string|null $cd_cus_id
 * @property Carbon|null $cd_last_datetime
 * @property string|null $cd_note
 * @property string|null $cd_remark
 * @property bool $cd_is_use
 * @property Carbon|null $cd_created_date
 * @property int|null $cd_created_by
 * @property Carbon|null $cd_updated_date
 * @property int|null $cd_updated_by
 *
 * @package App\Models
 */
class CustomerDetail extends Model
{
	protected $table = 'customer_details';
	protected $primaryKey = 'cd_id';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'cd_last_datetime' => 'datetime',
		'cd_is_use' => 'bool',
		'cd_created_date' => 'datetime',
		'cd_created_by' => 'int',
		'cd_updated_date' => 'datetime',
		'cd_updated_by' => 'int'
	];

	protected $fillable = [
		'cd_cus_id',
		'cd_last_datetime',
		'cd_note',
		'cd_remark',
		'cd_is_use',
		'cd_created_date',
		'cd_created_by',
		'cd_updated_date',
		'cd_updated_by'
	];

}
