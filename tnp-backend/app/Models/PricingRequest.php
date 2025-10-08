<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class PricingRequest
 * 
 * @property string $pr_id
 * @property string|null $pr_cus_id
 * @property string|null $pr_mpc_id
 * @property string|null $pr_status_id
 * @property string|null $pr_no
 * @property string|null $pr_work_name
 * @property string|null $pr_pattern
 * @property string|null $pr_fabric_type
 * @property string|null $pr_color
 * @property string|null $pr_sizes
 * @property string|null $pr_quantity
 * @property Carbon|null $pr_due_date
 * @property string|null $pr_silk
 * @property string|null $pr_dft
 * @property string|null $pr_embroider
 * @property string|null $pr_sub
 * @property string|null $pr_other_screen
 * @property string|null $pr_image
 * @property bool $pr_is_deleted
 * @property Carbon|null $pr_created_date
 * @property string|null $pr_created_by
 * @property Carbon|null $pr_updated_date
 * @property string|null $pr_updated_by
 *
 * @package App\Models
 */
class PricingRequest extends Model
{
	protected $table = 'pricing_requests';
	protected $primaryKey = 'pr_id';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'pr_due_date' => 'datetime',
		'pr_is_deleted' => 'bool',
		'pr_created_date' => 'datetime',
		'pr_updated_date' => 'datetime'
	];

	protected $fillable = [
		'pr_cus_id',
		'pr_mpc_id',
		'pr_status_id',
		'pr_no',
		'pr_work_name',
		'pr_pattern',
		'pr_fabric_type',
		'pr_color',
		'pr_sizes',
		'pr_quantity',
		'pr_due_date',
		'pr_silk',
		'pr_dft',
		'pr_embroider',
		'pr_sub',
		'pr_other_screen',
		'pr_image',
		'pr_is_deleted',
		'pr_created_date',
		'pr_created_by',
		'pr_updated_date',
		'pr_updated_by'
	];

	public function prCreatedBy()
    {
        return $this->belongsTo(User::class, 'pr_created_by', 'user_uuid')
			->select('user_uuid', 'username', 'user_nickname');
    }

	public function pricingCustomer()
    {
        return $this->belongsTo(MasterCustomer::class, 'pr_cus_id', 'cus_id')
			->select('cus_id', 'cus_firstname', 'cus_lastname', 'cus_name', 'cus_company', 'cus_tel_1', 'cus_email');
    }

	public function pricingStatus()
    {
        return $this->belongsTo(MasterStatus::class, 'pr_status_id', 'status_id')
			->select('status_id', 'status_name');
    }

	public function pricingNote()
    {
        return $this->hasMany(PricingRequestNote::class, 'prn_pr_id', 'pr_id')
			->orderBy('prn_created_date', 'desc')
			->select('prn_id', 'prn_pr_id', 'prn_text', 'prn_note_type', 'prn_is_deleted', 'prn_created_date', 'prn_created_by');
    }

	public function quotationItems()
    {
        return $this->hasMany(\App\Models\Accounting\QuotationItem::class, 'pricing_request_id', 'pr_id');
    }
}
