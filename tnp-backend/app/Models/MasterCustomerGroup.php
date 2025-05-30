<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class MasterCustomerGroup
 * 
 * @property string $mcg_id
 * @property string|null $mcg_name
 * @property string|null $mcg_remark
 * @property string|null $mcg_recall_default
 * @property int|null $mcg_sort
 * @property bool $mcg_is_use
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class MasterCustomerGroup extends Model
{
	protected $table = 'master_customer_groups';
	protected $primaryKey = 'mcg_id';
	public $incrementing = false;

	protected $casts = [
		'mcg_sort' => 'int',
		'mcg_is_use' => 'bool'
	];

	protected $fillable = [
		'mcg_name',
		'mcg_remark',
		'mcg_recall_default',
		'mcg_sort',
		'mcg_is_use'
	];

	protected static function boot()
	{
		parent::boot();

		static::creating(function ($item) {
			if (empty($item->mcg_id)) {
				$item->mcg_id = Str::uuid(); // สร้างค่า UUID อัตโนมัติ
			}
		});
	}

	public function scopeActive($query) {
		return $query->where('mcg_is_use', true);
	}

	public function customerGroup(): HasMany
    {
        return $this->hasMany(MasterCustomer::class, 'cus_mcg_id', 'mcg_id')
			->select(['cus_id', 'cus_mcg_id']);
    }
}
