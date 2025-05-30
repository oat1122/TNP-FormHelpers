<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Production
 * 
 * @property int $pd_id
 * @property int|null $work_id
 * @property string|null $new_worksheet_id
 * @property int|null $production_type
 * @property int|null $screen
 * @property int|null $dft
 * @property int|null $embroid
 * @property Carbon|null $order_start
 * @property Carbon|null $order_end
 * @property Carbon|null $dyeing_start
 * @property Carbon|null $dyeing_end
 * @property Carbon|null $cutting_start
 * @property Carbon|null $cutting_end
 * @property Carbon|null $sewing_start
 * @property Carbon|null $sewing_end
 * @property Carbon|null $received_start
 * @property Carbon|null $received_end
 * @property Carbon|null $exam_start
 * @property Carbon|null $exam_end
 * @property int|null $cutting_factory
 * @property int|null $sewing_factory
 * @property int|null $status
 * @property Carbon|null $end_select_process_time
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class Production extends Model
{
	protected $table = 'productions';
	protected $primaryKey = 'pd_id';

	protected $casts = [
		'work_id' => 'int',
		'production_type' => 'int',
		'screen' => 'int',
		'dft' => 'int',
		'embroid' => 'int',
		'order_start' => 'datetime',
		'order_end' => 'datetime',
		'dyeing_start' => 'datetime',
		'dyeing_end' => 'datetime',
		'cutting_start' => 'datetime',
		'cutting_end' => 'datetime',
		'sewing_start' => 'datetime',
		'sewing_end' => 'datetime',
		'received_start' => 'datetime',
		'received_end' => 'datetime',
		'exam_start' => 'datetime',
		'exam_end' => 'datetime',
		'cutting_factory' => 'int',
		'sewing_factory' => 'int',
		'status' => 'int',
		'end_select_process_time' => 'datetime'
	];

	protected $fillable = [
		'work_id',
		'new_worksheet_id',
		'production_type',
		'screen',
		'dft',
		'embroid',
		'order_start',
		'order_end',
		'dyeing_start',
		'dyeing_end',
		'cutting_start',
		'cutting_end',
		'sewing_start',
		'sewing_end',
		'received_start',
		'received_end',
		'exam_start',
		'exam_end',
		'cutting_factory',
		'sewing_factory',
		'status',
		'end_select_process_time'
	];
}
