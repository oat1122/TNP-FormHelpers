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
	protected $keyType = 'string';
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
		'cus_bt_id',       // Business Type ID
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
			$query->whereDate('master_customers.cus_created_date', '>=', $startDate);
		}

		if ($endDate) {
			$query->whereDate('master_customers.cus_created_date', '<=', $endDate);
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
	 * @param int|null $minDays Minimum days for recall
	 * @param int|null $maxDays Maximum days for recall
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeFilterByRecallRange($query, $minDays, $maxDays) {
		// Check if we already have the join to avoid duplicates
		$joins = collect($query->getQuery()->joins)->pluck('table')->toArray();

		if (!in_array('customer_details', $joins)) {
			// We need to join with customer_details to access cd_last_datetime
			$query->leftJoin('customer_details', 'master_customers.cus_id', '=', 'customer_details.cd_cus_id');
		}

		// Calculate the date range based on days
		$now = now();

		if ($minDays !== null) {
			$maxDate = $now->copy()->subDays($minDays)->format('Y-m-d');
			$query->where('customer_details.cd_last_datetime', '<=', $maxDate);
		}

		if ($maxDays !== null) {
			$minDate = $now->copy()->subDays($maxDays)->format('Y-m-d');
			$query->where('customer_details.cd_last_datetime', '>=', $minDate);
		}

		return $query;
	}

	public function customerDetail()
    {
        return $this->hasOne(CustomerDetail::class, 'cd_cus_id', 'cus_id')
			->where('cd_is_use', true);
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

	public function customerProvice()
	{
		return $this->belongsTo(\App\Models\MasterProvice::class, 'cus_pro_id', 'pro_id')
			->select('pro_id', 'pro_name_th', 'pro_sort_id');
	}

	public function customerSubdistrict()
	{
		return $this->belongsTo(MasterSubdistrict::class, 'cus_sub_id', 'sub_id')
			->select('sub_id', 'sub_dis_sort_id', 'sub_sort_id', 'sub_name_th', 'sub_zip_code');
    }

	public function businessType()
	{
		return $this->belongsTo(MasterBusinessType::class, 'cus_bt_id', 'bt_id')
			->select('bt_id', 'bt_name');
	}

	public function pricingRequests()
	{
		return $this->hasMany(\App\Models\PricingRequest::class, 'pr_cus_id', 'cus_id')
			->where('pr_is_deleted', 0)
			->orderBy('pr_created_date', 'desc');
	}

	/**
	 * สร้างที่อยู่เต็มจาก components
	 */
	public function getFullAddressAttribute()
	{
		$addressService = new \App\Services\AddressService();
		return $addressService->formatDisplayAddress($this);
	}

	/**
	 * แยกที่อยู่เป็น components
	 */
	public function getAddressComponentsAttribute()
	{
		$addressService = new \App\Services\AddressService();
		return $addressService->parseFullAddress($this->cus_address);
	}

	/**
	 * อัพเดทที่อยู่จาก components
	 */
	public function updateAddressFromComponents($addressDetail, $subId, $disId, $proId, $zipCode = null)
	{
		$addressService = new \App\Services\AddressService();
		
		// อัพเดท components
		$this->cus_pro_id = $proId;
		$this->cus_dis_id = $disId;
		$this->cus_sub_id = $subId;
		$this->cus_zip_code = $zipCode;
		
		// สร้างที่อยู่เต็ม
		$this->cus_address = $addressService->buildFullAddress($addressDetail, $subId, $disId, $proId, $zipCode);
		
		return $this;
	}

	/**
	 * อัพเดทที่อยู่จาก full address
	 */
	public function updateAddressFromFull($fullAddress)
	{
		$addressService = new \App\Services\AddressService();
		
		// อัพเดท full address
		$this->cus_address = $fullAddress;
		
		// แยก components และอัพเดท
		$components = $addressService->parseFullAddress($fullAddress);
		$locationIds = $addressService->findLocationIds(
			$components['province'],
			$components['district'],
			$components['subdistrict']
		);
		
		$this->cus_pro_id = $locationIds['pro_id'];
		$this->cus_dis_id = $locationIds['dis_id'];
		$this->cus_sub_id = $locationIds['sub_id'];
		$this->cus_zip_code = $components['zip_code'];
		
		return $this;
	}
}
