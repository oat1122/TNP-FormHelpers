<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NewWorksheetPoloDetail
 * 
 * @property string $polo_detail_id
 * @property string|null $worksheet_id
 * @property int|null $collar
 * @property int|null $collar_type
 * @property string|null $other_collar_type
 * @property string|null $collar_type_detail
 * @property int|null $placket
 * @property string|null $other_placket
 * @property bool|null $outer_placket
 * @property string|null $outer_placket_detail
 * @property bool|null $inner_placket
 * @property string|null $inner_placket_detail
 * @property int|null $button
 * @property string|null $other_button
 * @property string|null $button_color
 * @property int|null $sleeve
 * @property string|null $sleeve_detail
 * @property int|null $pocket
 * @property string|null $pocket_detail
 * @property bool|null $bottom_hem
 * @property string|null $bottom_hem_detail
 * @property bool|null $back_seam
 * @property string|null $back_seam_detail
 * @property bool|null $side_vents
 * @property string|null $side_vents_detail
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class NewWorksheetPoloDetail extends Model
{
	protected $table = 'new_worksheet_polo_details';
	protected $primaryKey = 'polo_detail_id';
	public $incrementing = false;

	protected $casts = [
		'collar' => 'int',
		'collar_type' => 'int',
		'placket' => 'int',
		'outer_placket' => 'bool',
		'inner_placket' => 'bool',
		'button' => 'int',
		'sleeve' => 'int',
		'pocket' => 'int',
		'bottom_hem' => 'bool',
		'back_seam' => 'bool',
		'side_vents' => 'bool'
	];

	protected $fillable = [
		'worksheet_id',
		'collar',
		'collar_type',
		'other_collar_type',
		'collar_type_detail',
		'placket',
		'other_placket',
		'outer_placket',
		'outer_placket_detail',
		'inner_placket',
		'inner_placket_detail',
		'button',
		'other_button',
		'button_color',
		'sleeve',
		'sleeve_detail',
		'pocket',
		'pocket_detail',
		'bottom_hem',
		'bottom_hem_detail',
		'back_seam',
		'back_seam_detail',
		'side_vents',
		'side_vents_detail'
	];
}
