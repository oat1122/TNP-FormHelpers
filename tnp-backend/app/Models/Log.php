<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Log
 * 
 * @property int $id
 * @property int|null $cost_fabric_id
 * @property string $level
 * @property string $message
 * @property string|null $context
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class Log extends Model
{
	protected $table = 'logs';

	protected $casts = [
		'cost_fabric_id' => 'int'
	];

	protected $fillable = [
		'cost_fabric_id',
		'level',
		'message',
		'context'
	];
}
