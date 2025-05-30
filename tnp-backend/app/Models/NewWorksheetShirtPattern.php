<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NewWorksheetShirtPattern
 * 
 * @property string $pattern_id
 * @property string|null $display_pattern_id
 * @property string|null $pattern_name
 * @property int|null $pattern_type
 * @property string $enable_edit
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class NewWorksheetShirtPattern extends Model
{
	protected $table = 'new_worksheet_shirt_patterns';
	protected $primaryKey = 'pattern_id';
	public $incrementing = false;

	protected $casts = [
		'pattern_type' => 'int'
	];

	protected $fillable = [
		'display_pattern_id',
		'pattern_name',
		'pattern_type',
		'enable_edit'
	];
}
