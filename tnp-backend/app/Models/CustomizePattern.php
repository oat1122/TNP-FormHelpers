<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class CustomizePattern
 * 
 * @property int $pattern_id
 * @property string $work_id
 * @property string $pattern_name
 * @property float $chest_sss
 * @property float $long_sss
 * @property float $chest_ss
 * @property float $long_ss
 * @property float $chest_s
 * @property float $long_s
 * @property float $chest_m
 * @property float $long_m
 * @property float $chest_l
 * @property float $long_l
 * @property float $chest_xl
 * @property float $long_xl
 * @property float $chest_2xl
 * @property float $long_2xl
 * @property float $chest_3xl
 * @property float $long_3xl
 * @property float $chest_4xl
 * @property float $long_4xl
 * @property float $chest_5xl
 * @property float $long_5xl
 * @property float $chest_6xl
 * @property float $long_6xl
 * @property float $chest_7xl
 * @property float $long_7xl
 *
 * @package App\Models
 */
class CustomizePattern extends Model
{
	protected $table = 'customize_pattern';
	protected $primaryKey = 'pattern_id';
	public $timestamps = false;

	protected $casts = [
		'chest_sss' => 'float',
		'long_sss' => 'float',
		'chest_ss' => 'float',
		'long_ss' => 'float',
		'chest_s' => 'float',
		'long_s' => 'float',
		'chest_m' => 'float',
		'long_m' => 'float',
		'chest_l' => 'float',
		'long_l' => 'float',
		'chest_xl' => 'float',
		'long_xl' => 'float',
		'chest_2xl' => 'float',
		'long_2xl' => 'float',
		'chest_3xl' => 'float',
		'long_3xl' => 'float',
		'chest_4xl' => 'float',
		'long_4xl' => 'float',
		'chest_5xl' => 'float',
		'long_5xl' => 'float',
		'chest_6xl' => 'float',
		'long_6xl' => 'float',
		'chest_7xl' => 'float',
		'long_7xl' => 'float'
	];

	protected $fillable = [
		'work_id',
		'pattern_name',
		'chest_sss',
		'long_sss',
		'chest_ss',
		'long_ss',
		'chest_s',
		'long_s',
		'chest_m',
		'long_m',
		'chest_l',
		'long_l',
		'chest_xl',
		'long_xl',
		'chest_2xl',
		'long_2xl',
		'chest_3xl',
		'long_3xl',
		'chest_4xl',
		'long_4xl',
		'chest_5xl',
		'long_5xl',
		'chest_6xl',
		'long_6xl',
		'chest_7xl',
		'long_7xl'
	];
}
