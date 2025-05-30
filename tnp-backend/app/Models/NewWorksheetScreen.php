<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NewWorksheetScreen
 * 
 * @property string $screen_id
 * @property int|null $screen_point
 * @property int|null $screen_dft
 * @property int|null $screen_flex
 * @property int|null $screen_label
 * @property int|null $screen_embroider
 * @property string|null $screen_detail
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class NewWorksheetScreen extends Model
{
	protected $table = 'new_worksheet_screens';
	protected $primaryKey = 'screen_id';
	public $incrementing = false;

	protected $casts = [
		'screen_point' => 'int',
		'screen_dft' => 'int',
		'screen_flex' => 'int',
		'screen_label' => 'int',
		'screen_embroider' => 'int'
	];

	protected $fillable = [
		'screen_point',
		'screen_dft',
		'screen_flex',
		'screen_label',
		'screen_embroider',
		'screen_detail'
	];
}
