<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Worksheet
 * 
 * @property int $sheetID
 * @property string $work_id
 * @property int $customer_id
 * @property int $pattern_id
 * @property int $ex_id
 * @property int $user_id
 * @property string $work_name
 * @property Carbon $create_sheet_1
 * @property Carbon $create_sheet_2
 * @property string $fabric
 * @property string $no_fabric
 * @property string $color
 * @property string $no_color
 * @property string $fact_fabric
 * @property int $quantity
 * @property int $exam_quantity
 * @property int $size_sss
 * @property int $size_ss
 * @property int $size_s
 * @property int $size_m
 * @property int $size_l
 * @property int $size_xl
 * @property int $size_2xl
 * @property int $size_3xl
 * @property int $size_4xl
 * @property int $size_5xl
 * @property int $size_6xl
 * @property int $size_7xl
 * @property int $screen_point
 * @property int $screen_flex
 * @property int $screen_dft
 * @property int $screen_label
 * @property int $screen_embroider
 * @property Carbon|null $exam_date
 * @property Carbon $due_date
 * @property string|null $creator_name
 * @property string|null $manager_name
 * @property string|null $production_name
 * @property string $picture
 * @property string|null $note
 * @property string|null $product_category
 * @property string|null $product_detail
 * @property string|null $screen_detail
 * @property string|null $size_tag
 * @property string|null $packaging
 * @property int $deleted
 *
 * @package App\Models
 */
class Worksheet extends Model
{
	protected $table = 'worksheets';
	protected $primaryKey = 'sheetID';
	public $timestamps = false;

	protected $casts = [
		'customer_id' => 'int',
		'pattern_id' => 'int',
		'ex_id' => 'int',
		'user_id' => 'int',
		'create_sheet_1' => 'datetime',
		'create_sheet_2' => 'datetime',
		'quantity' => 'int',
		'exam_quantity' => 'int',
		'size_sss' => 'int',
		'size_ss' => 'int',
		'size_s' => 'int',
		'size_m' => 'int',
		'size_l' => 'int',
		'size_xl' => 'int',
		'size_2xl' => 'int',
		'size_3xl' => 'int',
		'size_4xl' => 'int',
		'size_5xl' => 'int',
		'size_6xl' => 'int',
		'size_7xl' => 'int',
		'screen_point' => 'int',
		'screen_flex' => 'int',
		'screen_dft' => 'int',
		'screen_label' => 'int',
		'screen_embroider' => 'int',
		'exam_date' => 'datetime',
		'due_date' => 'datetime',
		'deleted' => 'int'
	];

	protected $fillable = [
		'work_id',
		'customer_id',
		'pattern_id',
		'ex_id',
		'user_id',
		'work_name',
		'create_sheet_1',
		'create_sheet_2',
		'fabric',
		'no_fabric',
		'color',
		'no_color',
		'fact_fabric',
		'quantity',
		'exam_quantity',
		'size_sss',
		'size_ss',
		'size_s',
		'size_m',
		'size_l',
		'size_xl',
		'size_2xl',
		'size_3xl',
		'size_4xl',
		'size_5xl',
		'size_6xl',
		'size_7xl',
		'screen_point',
		'screen_flex',
		'screen_dft',
		'screen_label',
		'screen_embroider',
		'exam_date',
		'due_date',
		'creator_name',
		'manager_name',
		'production_name',
		'picture',
		'note',
		'product_category',
		'product_detail',
		'screen_detail',
		'size_tag',
		'packaging',
		'deleted'
	];
}
