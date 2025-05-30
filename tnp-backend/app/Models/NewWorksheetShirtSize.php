<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NewWorksheetShirtSize
 * 
 * @property string $shirt_size_id
 * @property string|null $pattern_id
 * @property int|null $shirt_pattern_type
 * @property string|null $size_name
 * @property float|null $chest
 * @property float|null $long
 * @property int|null $quantity
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class NewWorksheetShirtSize extends Model
{
	protected $table = 'new_worksheet_shirt_sizes';
	protected $primaryKey = 'shirt_size_id';
	public $incrementing = false;

	protected $casts = [
		'shirt_pattern_type' => 'int',
		'chest' => 'float',
		'long' => 'float',
		'quantity' => 'int'
	];

	protected $fillable = [
		'pattern_id',
		'shirt_pattern_type',
		'size_name',
		'chest',
		'long',
		'quantity'
	];
}
