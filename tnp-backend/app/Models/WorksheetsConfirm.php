<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class WorksheetsConfirm
 * 
 * @property int $id
 * @property string $work_id
 * @property int $sale
 * @property int $graphic
 * @property int $manager
 * @property Carbon $sale_date
 * @property Carbon $graphic_date
 * @property Carbon $manager_date
 * @property Carbon|null $sale_edit_date
 * @property Carbon|null $graphic_edit_date
 * @property Carbon|null $manager_edit_date
 * @property Carbon|null $sale_access_date
 * @property Carbon|null $graphic_access_date
 *
 * @package App\Models
 */
class WorksheetsConfirm extends Model
{
	protected $table = 'worksheets_confirm';
	public $timestamps = false;

	protected $casts = [
		'sale' => 'int',
		'graphic' => 'int',
		'manager' => 'int',
		'sale_date' => 'datetime',
		'graphic_date' => 'datetime',
		'manager_date' => 'datetime',
		'sale_edit_date' => 'datetime',
		'graphic_edit_date' => 'datetime',
		'manager_edit_date' => 'datetime',
		'sale_access_date' => 'datetime',
		'graphic_access_date' => 'datetime'
	];

	protected $fillable = [
		'work_id',
		'sale',
		'graphic',
		'manager',
		'sale_date',
		'graphic_date',
		'manager_date',
		'sale_edit_date',
		'graphic_edit_date',
		'manager_edit_date',
		'sale_access_date',
		'graphic_access_date'
	];
}
