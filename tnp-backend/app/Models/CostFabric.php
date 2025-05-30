<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class CostFabric
 * 
 * @property int $cost_fabric_id
 * @property int $pattern_id
 * @property string $fabric_name
 * @property string|null $fabric_name_tnp
 * @property string|null $supplier
 * @property string $fabric_class
 * @property float|null $fabric_kg
 * @property float|null $fabric_price_per_kg
 * @property int|null $shirt_per_total
 * @property int|null $shirt_per_kg
 * @property float|null $cutting_price
 * @property float|null $sewing_price
 * @property int|null $collar_kg
 * @property int|null $collar_price
 * @property int|null $button_price
 * @property int|null $shirt_price_percent
 * @property int|null $shirt_1k_price_percent
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class CostFabric extends Model
{
	protected $table = 'cost_fabrics';
	protected $primaryKey = 'cost_fabric_id';

	protected $casts = [
		'pattern_id' => 'int',
		'fabric_kg' => 'float',
		'fabric_price_per_kg' => 'float',
		'shirt_per_total' => 'int',
		'shirt_per_kg' => 'int',
		'cutting_price' => 'float',
		'sewing_price' => 'float',
		'collar_kg' => 'int',
		'collar_price' => 'int',
		'button_price' => 'int',
		'shirt_price_percent' => 'int',
		'shirt_1k_price_percent' => 'int'
	];

	protected $fillable = [
		'pattern_id',
		'fabric_name',
		'fabric_name_tnp',
		'supplier',
		'fabric_class',
		'fabric_kg',
		'fabric_price_per_kg',
		'shirt_per_total',
		'shirt_per_kg',
		'cutting_price',
		'sewing_price',
		'collar_kg',
		'collar_price',
		'button_price',
		'shirt_price_percent',
		'shirt_1k_price_percent'
	];
}
