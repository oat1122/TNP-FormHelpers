<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class MasterSubdistrict
 * 
 * @property string $sub_id
 * @property string|null $sub_name_th
 * @property string|null $sub_name_en
 * @property int|null $sub_sort_id
 * @property int|null $sub_dis_sort_id
 * @property string|null $sub_zip_code
 * @property bool $sub_is_use
 *
 * @package App\Models
 */
class MasterSubdistrict extends Model
{
	protected $table = 'master_subdistricts';
	protected $primaryKey = 'sub_id';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'sub_sort_id' => 'int',
		'sub_dis_sort_id' => 'int',
		'sub_is_use' => 'bool'
	];

	protected $fillable = [
		'sub_name_th',
		'sub_name_en',
		'sub_sort_id',
		'sub_dis_sort_id',
		'sub_zip_code',
		'sub_is_use'
	];
}
