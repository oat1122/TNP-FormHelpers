<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NewWorksheetStatus
 * 
 * @property string $status_id
 * @property string|null $worksheet_id
 * @property int $sales
 * @property int $manager
 * @property Carbon|null $sales_confirm_date
 * @property Carbon|null $manager_confirm_date
 * @property Carbon|null $sales_permission_date
 * @property Carbon|null $manager_approve_date
 * @property Carbon|null $sales_edit_date
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class NewWorksheetStatus extends Model
{
	protected $table = 'new_worksheet_status';
	protected $primaryKey = 'status_id';
	public $incrementing = false;

	protected $casts = [
		'sales' => 'int',
		'manager' => 'int',
		'sales_confirm_date' => 'datetime',
		'manager_confirm_date' => 'datetime',
		'sales_permission_date' => 'datetime',
		'manager_approve_date' => 'datetime',
		'sales_edit_date' => 'datetime'
	];

	protected $fillable = [
		'worksheet_id',
		'sales',
		'manager',
		'sales_confirm_date',
		'manager_confirm_date',
		'sales_permission_date',
		'manager_approve_date',
		'sales_edit_date'
	];
}
