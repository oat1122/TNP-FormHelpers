<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class MasterDistrict
 * 
 * @property string $dis_id
 * @property string|null $dis_name_th
 * @property string|null $dis_name_en
 * @property int|null $dis_sort_id
 * @property int|null $dis_pro_sort_id
 * @property bool $dis_is_use
 *
 * @package App\Models
 */
class MasterDistrict extends Model
{
	protected $table = 'master_districts';
	protected $primaryKey = 'dis_id';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'dis_sort_id' => 'int',
		'dis_pro_sort_id' => 'int',
		'dis_is_use' => 'bool'
	];

	protected $fillable = [
		'dis_name_th',
		'dis_name_en',
		'dis_sort_id',
		'dis_pro_sort_id',
		'dis_is_use'
	];
}
