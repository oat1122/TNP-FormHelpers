<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ShirtPattern
 * 
 * @property int $pattern_id
 * @property string $pattern_name
 * @property int $shirt_category
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class ShirtPattern extends Model
{
	protected $table = 'shirt_patterns';
	protected $primaryKey = 'pattern_id';

	protected $casts = [
		'shirt_category' => 'int'
	];

	protected $fillable = [
		'pattern_name',
		'shirt_category'
	];
}
