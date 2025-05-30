<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ProductionBlock
 * 
 * @property int $block_id
 * @property int $pd_id
 * @property int|null $user_id
 * @property int|null $embroid_factory
 * @property string|null $screen_block
 * @property string|null $dft_block
 * @property Carbon|null $embroid_date
 * @property Carbon|null $screen_date
 * @property Carbon|null $dft_date
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class ProductionBlock extends Model
{
	protected $table = 'production_blocks';
	protected $primaryKey = 'block_id';

	protected $casts = [
		'pd_id' => 'int',
		'user_id' => 'int',
		'embroid_factory' => 'int',
		'embroid_date' => 'datetime',
		'screen_date' => 'datetime',
		'dft_date' => 'datetime'
	];

	protected $fillable = [
		'pd_id',
		'user_id',
		'embroid_factory',
		'screen_block',
		'dft_block',
		'embroid_date',
		'screen_date',
		'dft_date'
	];
}
