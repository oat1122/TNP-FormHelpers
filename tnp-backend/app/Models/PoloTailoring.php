<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class PoloTailoring
 * 
 * @property int $id
 * @property string $work_id
 * @property string $collar
 * @property string $collar_type
 * @property string $other_collar_type
 * @property string $collar_type_d
 * @property string $placket
 * @property string $other_placket
 * @property int $outer_placket
 * @property string $outer_placket_d
 * @property int $inner_placket
 * @property string $inner_placket_d
 * @property string $button
 * @property string $other_button
 * @property string $button_color
 * @property string $sleeve
 * @property string $sleeve_detail
 * @property string $pocket
 * @property string $pocket_detail
 * @property int $bottom_hem
 * @property string $bottom_hem_d
 * @property int $back_seam
 * @property string $back_seam_d
 * @property int $side_vents
 * @property string $side_vents_d
 *
 * @package App\Models
 */
class PoloTailoring extends Model
{
	protected $table = 'polo_tailoring';
	public $timestamps = false;

	protected $casts = [
		'outer_placket' => 'int',
		'inner_placket' => 'int',
		'bottom_hem' => 'int',
		'back_seam' => 'int',
		'side_vents' => 'int'
	];

	protected $fillable = [
		'work_id',
		'collar',
		'collar_type',
		'other_collar_type',
		'collar_type_d',
		'placket',
		'other_placket',
		'outer_placket',
		'outer_placket_d',
		'inner_placket',
		'inner_placket_d',
		'button',
		'other_button',
		'button_color',
		'sleeve',
		'sleeve_detail',
		'pocket',
		'pocket_detail',
		'bottom_hem',
		'bottom_hem_d',
		'back_seam',
		'back_seam_d',
		'side_vents',
		'side_vents_d'
	];
}
