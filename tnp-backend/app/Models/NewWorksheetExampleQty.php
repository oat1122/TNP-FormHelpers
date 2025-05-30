<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NewWorksheetExampleQty
 * 
 * @property string $ex_id
 * @property string|null $worksheet_id
 * @property int|null $ex_pattern_type
 * @property string|null $ex_size_name
 * @property int|null $ex_quantity
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class NewWorksheetExampleQty extends Model
{
	protected $table = 'new_worksheet_example_qty';
	protected $primaryKey = 'ex_id';
	public $incrementing = false;

	protected $casts = [
		'ex_pattern_type' => 'int',
		'ex_quantity' => 'int'
	];

	protected $fillable = [
		'worksheet_id',
		'ex_pattern_type',
		'ex_size_name',
		'ex_quantity'
	];
}
