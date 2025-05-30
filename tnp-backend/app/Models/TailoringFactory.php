<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class TailoringFactory
 * 
 * @property int $factory_id
 * @property int $factory_no
 * @property string $factory_name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class TailoringFactory extends Model
{
	protected $table = 'tailoring_factory';
	protected $primaryKey = 'factory_id';

	protected $casts = [
		'factory_no' => 'int'
	];

	protected $fillable = [
		'factory_no',
		'factory_name'
	];
}
