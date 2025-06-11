<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Class MasterCustomer
 * 
 * @property string $cus_id
 * @property string|null $cus_mcg_id
 * @property string|null $cus_no
 * @property int|null $cus_channel
 * @property string|null $cus_firstname
 * @property string|null $cus_lastname
 * @property string|null $cus_name
 * @property string|null $cus_depart
 * @property string|null $cus_company
 * @property string|null $cus_tel_1
 * @property string|null $cus_tel_2
 * @property string|null $cus_email
 * @property string|null $cus_tax_id
 * @property string|null $cus_pro_id
 * @property string|null $cus_dis_id
 * @property string|null $cus_sub_id
 * @property string|null $cus_zip_code
 * @property string|null $cus_address
 * @property int|null $cus_manage_by
 * @property bool $cus_is_use
 * @property Carbon|null $cus_created_date
 * @property int|null $cus_created_by
 * @property Carbon|null $cus_updated_date
 * @property int|null $cus_updated_by
 *
 * @package App\Models
 */
class MasterCustomer extends Model
{
	protected $table = 'master_customers';
	protected $primaryKey = 'cus_id';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'cus_channel' => 'int',
		'cus_manage_by' => 'int',
		'cus_is_use' => 'bool',
		'cus_created_date' => 'datetime',
		'cus_created_by' => 'int',
		'cus_updated_date' => 'datetime',
		'cus_updated_by' => 'int'
	];

	protected $fillable = [
		'cus_mcg_id',
		'cus_no',
		'cus_channel',		// [1=sales, 2=online, 3=office]
		'cus_firstname',
		'cus_lastname',
		'cus_name',
		'cus_depart',
		'cus_company',
		'cus_tel_1',
		'cus_tel_2',
		'cus_email',
		'cus_tax_id',
		'cus_pro_id',
		'cus_dis_id',
		'cus_sub_id',
		'cus_zip_code',
		'cus_address',
		'cus_manage_by',
		'cus_is_use',
		'cus_created_date',
		'cus_created_by',
		'cus_updated_date',
		'cus_updated_by'
	];

	public function scopeActive($query) {
		return $query->where('cus_is_use', true);
	}

	/**
	 * Scope a query to filter by date range
	 * 
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param string|null $startDate Date in YYYY-MM-DD format
	 * @param string|null $endDate Date in YYYY-MM-DD format
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeFilterByDateRange($query, $startDate, $endDate) {
		if ($startDate) {
			$query->whereDate('cus_created_date', '>=', $startDate);
		}
		
		if ($endDate) {
			$query->whereDate('cus_created_date', '<=', $endDate);
		}
		
		return $query;
	}

	/**
	 * Scope a query to filter by sales name
	 * 
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param array $salesNames Array of sales usernames
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeFilterBySalesNames($query, $salesNames) {
		if (!empty($salesNames)) {
			return $query->whereHas('cusManageBy', function ($q) use ($salesNames) {
				$q->whereIn('username', $salesNames);
			});
		}
		
		return $query;
	}

	/**
	 * Scope a query to filter by channel
	 * 
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param array $channels Array of channel values
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeFilterByChannels($query, $channels) {
		if (!empty($channels)) {
			return $query->whereIn('cus_channel', $channels);
		}
		
		return $query;
	}

	/**
	 * Scope a query to filter by recall days range
	 * 
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param int|null $minDays Minimum days since last contact
	 * @param int|null $maxDays Maximum days since last contact
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeFilterByRecallRange($query, $minDays, $maxDays) {
		if ($minDays !== null || $maxDays !== null) {
			return $query->whereHas('customerDetail', function ($q) use ($minDays, $maxDays) {
				if ($minDays !== null) {
					$minDate = now()->subDays($minDays)->format('Y-m-d');
					$q->whereDate('cd_last_datetime', '<=', $minDate);
				}
				
				if ($maxDays !== null) {
					$maxDate = now()->subDays($maxDays)->format('Y-m-d');
					$q->whereDate('cd_last_datetime', '>=', $maxDate);
				}
			});
		}
		
		return $query;
	}

	public function customerDetail()
    {
        return $this->belongsTo(CustomerDetail::class, 'cus_id', 'cd_cus_id')
			->select('cd_id', 'cd_cus_id', 'cd_last_datetime', 'cd_note', 'cd_remark');
    }

	public function cusManageBy()
    {
        return $this->belongsTo(User::class, 'cus_manage_by', 'user_id')
			->select('user_id', 'username');
    }

	public function customerDistrict()
    {
        return $this->belongsTo(MasterDistrict::class, 'cus_dis_id', 'dis_id')
			->select('dis_id', 'dis_pro_sort_id', 'dis_sort_id', 'dis_name_th');
	}
		
	public function customerSubdistrict()
	{
		return $this->belongsTo(MasterSubdistrict::class, 'cus_sub_id', 'sub_id')
			->select('sub_id', 'sub_dis_sort_id', 'sub_sort_id', 'sub_name_th', 'sub_zip_code');
    }
}
