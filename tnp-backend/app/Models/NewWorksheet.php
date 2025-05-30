<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NewWorksheet
 * 
 * @property string $worksheet_id
 * @property string|null $work_id
 * @property string|null $customer_id
 * @property string|null $pattern_id
 * @property string|null $user_id
 * @property string|null $fabric_id
 * @property string|null $screen_id
 * @property string|null $work_name
 * @property int|null $total_quantity
 * @property Carbon|null $due_date
 * @property Carbon|null $exam_date
 * @property Carbon|null $date_created
 * @property string|null $creator_name
 * @property string|null $manager_name
 * @property string|null $production_name
 * @property string|null $images
 * @property string|null $worksheet_note
 * @property string|null $worksheet_edit_detail
 * @property string|null $type_shirt
 * @property string|null $shirt_detail
 * @property bool|null $size_tag
 * @property string|null $packaging
 * @property int $deleted
 * @property bool|null $nws_is_deleted
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $nws_created_date
 * @property string|null $nws_created_by
 * @property Carbon|null $nws_updated_date
 * @property string|null $nws_updated_by
 *
 * @package App\Models
 */
class NewWorksheet extends Model
{
	protected $table = 'new_worksheets';
	protected $primaryKey = 'worksheet_id';
	public $incrementing = false;

	protected $casts = [
		'total_quantity' => 'int',
		'due_date' => 'datetime',
		'exam_date' => 'datetime',
		'date_created' => 'datetime',
		'size_tag' => 'bool',
		'deleted' => 'int',
		'nws_is_deleted' => 'bool',
		'nws_created_date' => 'datetime',
		'nws_updated_date' => 'datetime'
	];

	protected $fillable = [
		'work_id',
		'customer_id',
		'pattern_id',
		'user_id',
		'fabric_id',
		'screen_id',
		'work_name',
		'total_quantity',
		'due_date',
		'exam_date',
		'date_created',
		'creator_name',
		'manager_name',
		'production_name',
		'images',
		'worksheet_note',
		'worksheet_edit_detail',
		'type_shirt',
		'shirt_detail',
		'size_tag',
		'packaging',
		'deleted',
		'nws_is_deleted',
		'nws_created_date',
		'nws_created_by',
		'nws_updated_date',
		'nws_updated_by'
	];
}
