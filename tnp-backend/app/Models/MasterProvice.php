<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class MasterProvice
 * 
 * @property string $pro_id
 * @property string|null $pro_name_th
 * @property string|null $pro_name_en
 * @property int|null $pro_sort_id
 * @property int|null $pro_geo_sort_id
 * @property bool $pro_is_use
 *
 * @package App\Models
 */
class MasterProvice extends Model
{
	protected $table = 'master_provices';
	protected $primaryKey = 'pro_id';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'pro_sort_id' => 'int',
		'pro_geo_sort_id' => 'int',
		'pro_is_use' => 'bool'
	];

	protected $fillable = [
		'pro_name_th',
		'pro_name_en',
		'pro_sort_id',
		'pro_geo_sort_id',
		'pro_is_use'
	];
}
