<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class RelationWorksheetsProduction
 * 
 * @property string $rwp_id
 * @property int|null $rwp_pd_id
 * @property int|null $rwp_ws_id
 * @property string|null $rwp_new_ws_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class RelationWorksheetsProduction extends Model
{
	protected $table = 'relation_worksheets_productions';
	protected $primaryKey = 'rwp_id';
	public $incrementing = false;

	protected $casts = [
		'rwp_pd_id' => 'int',
		'rwp_ws_id' => 'int'
	];

	protected $fillable = [
		'rwp_pd_id',
		'rwp_ws_id',
		'rwp_new_ws_id'
	];
}
