<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ProductionCost
 * 
 * @property int $cost_id
 * @property int $pd_id
 * @property string|null $fabric
 * @property string|null $factory
 * @property string|null $fabric_color
 * @property float|null $quantity
 * @property int|null $fabric_price
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class ProductionCost extends Model
{
	protected $table = 'production_costs';
	protected $primaryKey = 'cost_id';

	protected $casts = [
		'pd_id' => 'int',
		'quantity' => 'float',
		'fabric_price' => 'int'
	];

	protected $fillable = [
		'pd_id',
		'fabric',
		'factory',
		'fabric_color',
		'quantity',
		'fabric_price'
	];
}
