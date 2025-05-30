<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Customer
 * 
 * @property string $customer_id
 * @property string|null $customer_name
 * @property string|null $company_name
 * @property string|null $customer_address
 * @property string|null $customer_tel
 * @property string|null $customer_email
 * @property int|null $customer_tax_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class Customer extends Model
{
	protected $table = 'customers';
	protected $primaryKey = 'customer_id';
	public $incrementing = false;

	protected $casts = [
		'customer_tax_id' => 'int'
	];

	protected $fillable = [
		'customer_name',
		'company_name',
		'customer_address',
		'customer_tel',
		'customer_email',
		'customer_tax_id'
	];
}
