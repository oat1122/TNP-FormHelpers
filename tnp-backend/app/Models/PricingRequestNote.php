<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class PricingRequestNote
 * 
 * @property string $prn_id
 * @property string|null $prn_pr_id
 * @property string|null $prn_text
 * @property int|null $prn_note_type
 * @property bool|null $prn_is_deleted
 * @property Carbon|null $prn_created_date
 * @property string|null $prn_created_by
 * @property Carbon|null $prn_updated_date
 * @property string|null $prn_updated_by
 *
 * @package App\Models
 */
class PricingRequestNote extends Model
{
	protected $table = 'pricing_request_notes';
	protected $primaryKey = 'prn_id';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'prn_note_type' => 'int',
		'prn_is_deleted' => 'bool',
		'prn_created_date' => 'datetime',
		'prn_updated_date' => 'datetime'
	];

	protected $fillable = [
		'prn_pr_id',
		'prn_text',
		'prn_note_type',		// 1=sales, 2=price, 3=manager
		'prn_is_deleted',
		'prn_created_date',
		'prn_created_by',
		'prn_updated_date',
		'prn_updated_by'
	];

	public function prnCreatedBy()
    {
        return $this->belongsTo(User::class, 'prn_created_by', 'user_uuid')
			->select('user_uuid', 'username', 'user_nickname');
    }
}
