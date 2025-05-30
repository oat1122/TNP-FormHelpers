<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NewWorksheetFabricCustom
 * 
 * @property string $fabric_custom_id
 * @property string|null $fabric_id
 * @property string|null $fabric_custom_color
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class NewWorksheetFabricCustom extends Model
{
	protected $table = 'new_worksheet_fabric_customs';
	protected $primaryKey = 'fabric_custom_id';
	public $incrementing = false;

	protected $fillable = [
		'fabric_id',
		'fabric_custom_color'
	];
}
