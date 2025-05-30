<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class MasterStatus
 * 
 * @property string $status_id
 * @property string|null $status_name
 * @property string|null $status_remark
 * @property int|null $status_type
 * @property bool $status_is_deleted
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class MasterStatus extends Model
{
	protected $table = 'master_status';
	protected $primaryKey = 'status_id';
	public $incrementing = false;

	protected $casts = [
		'status_type' => 'int',
		'status_is_deleted' => 'bool'
	];

	protected $fillable = [
		'status_name',
		'status_remark',
		'status_type',		// [ 1=คำขอราคา ]
		'status_is_deleted'
	];

	public function pricingReqStatus()
    {
        return $this->hasMany(PricingRequest::class, 'pr_status_id', 'status_id')
			->select('pr_id', 'pr_status_id', 'pr_is_deleted');
    }
}
