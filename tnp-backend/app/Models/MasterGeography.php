<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class MasterGeography
 * 
 * @property string $geo_id
 * @property string|null $geo_name
 * @property int|null $geo_sort_id
 * @property bool $geo_is_use
 *
 * @package App\Models
 */
class MasterGeography extends Model
{
	protected $table = 'master_geographies';
	protected $primaryKey = 'geo_id';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'geo_sort_id' => 'int',
		'geo_is_use' => 'bool'
	];

	protected $fillable = [
		'geo_name',
		'geo_sort_id',
		'geo_is_use'
	];
}
