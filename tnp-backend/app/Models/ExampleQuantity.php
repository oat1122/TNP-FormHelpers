<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class ExampleQuantity
 * 
 * @property int $ex_id
 * @property string $work_id
 * @property int $ex_sss
 * @property int $ex_ss
 * @property int $ex_s
 * @property int $ex_m
 * @property int $ex_l
 * @property int $ex_xl
 * @property int $ex_2xl
 * @property int $ex_3xl
 * @property int $ex_4xl
 * @property int $ex_5xl
 * @property int $ex_6xl
 *
 * @package App\Models
 */
class ExampleQuantity extends Model
{
	protected $table = 'example_quantity';
	protected $primaryKey = 'ex_id';
	public $timestamps = false;

	protected $casts = [
		'ex_sss' => 'int',
		'ex_ss' => 'int',
		'ex_s' => 'int',
		'ex_m' => 'int',
		'ex_l' => 'int',
		'ex_xl' => 'int',
		'ex_2xl' => 'int',
		'ex_3xl' => 'int',
		'ex_4xl' => 'int',
		'ex_5xl' => 'int',
		'ex_6xl' => 'int'
	];

	protected $fillable = [
		'work_id',
		'ex_sss',
		'ex_ss',
		'ex_s',
		'ex_m',
		'ex_l',
		'ex_xl',
		'ex_2xl',
		'ex_3xl',
		'ex_4xl',
		'ex_5xl',
		'ex_6xl'
	];
}
