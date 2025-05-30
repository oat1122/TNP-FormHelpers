<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NewWorksheetPoloEmbroider
 * 
 * @property string $polo_embroider_id
 * @property string|null $polo_detail_id
 * @property int|null $embroider_position
 * @property string|null $embroider_size
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class NewWorksheetPoloEmbroider extends Model
{
	protected $table = 'new_worksheet_polo_embroiders';
	protected $primaryKey = 'polo_embroider_id';
	public $incrementing = false;

	protected $casts = [
		'embroider_position' => 'int'
	];

	protected $fillable = [
		'polo_detail_id',
		'embroider_position',
		'embroider_size'
	];
}
