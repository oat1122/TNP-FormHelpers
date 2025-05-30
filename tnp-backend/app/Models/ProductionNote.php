<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ProductionNote
 * 
 * @property int $note_id
 * @property int $pd_id
 * @property int $user_id
 * @property string|null $note_category
 * @property string|null $note_descr
 * @property Carbon|null $note_datetime
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class ProductionNote extends Model
{
	protected $table = 'production_notes';
	protected $primaryKey = 'note_id';

	protected $casts = [
		'pd_id' => 'int',
		'user_id' => 'int',
		'note_datetime' => 'datetime'
	];

	protected $fillable = [
		'pd_id',
		'user_id',
		'note_category',
		'note_descr',
		'note_datetime'
	];
}
