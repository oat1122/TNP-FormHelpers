<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class TailoringPosition
 * 
 * @property int $id
 * @property string $work_id
 * @property string $position
 * @property string $position_size
 *
 * @package App\Models
 */
class TailoringPosition extends Model
{
	protected $table = 'tailoring_position';
	public $timestamps = false;

	protected $fillable = [
		'work_id',
		'position',
		'position_size'
	];
}
