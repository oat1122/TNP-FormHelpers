<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NewWorksheetFabric
 * 
 * @property string $fabric_id
 * @property string|null $worksheet_id
 * @property string|null $fabric_name
 * @property string|null $fabric_no
 * @property string|null $fabric_color
 * @property string|null $fabric_color_no
 * @property string|null $fabric_factory
 * @property string|null $crewneck_color
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class NewWorksheetFabric extends Model
{
	protected $table = 'new_worksheet_fabrics';
	protected $primaryKey = 'fabric_id';
	public $incrementing = false;

	protected $fillable = [
		'worksheet_id',
		'fabric_name',
		'fabric_no',
		'fabric_color',
		'fabric_color_no',
		'fabric_factory',
		'crewneck_color'
	];
}
