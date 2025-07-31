<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    // Use existing master_customers table instead of creating new customers table
    protected $table = 'master_customers';
    protected $primaryKey = 'cus_id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'cus_mcg_id',
        'cus_no',
        'cus_channel',
        'cus_bt_id',
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

    protected $casts = [
        'cus_channel' => 'int',
        'cus_manage_by' => 'int',
        'cus_is_use' => 'bool',
        'cus_created_date' => 'datetime',
        'cus_created_by' => 'int',
        'cus_updated_date' => 'datetime',
        'cus_updated_by' => 'int'
    ];

    // Accessor methods to maintain compatibility with accounting system
    public function getIdAttribute()
    {
        return $this->cus_id;
    }

    public function getCustomerCodeAttribute()
    {
        return $this->cus_no;
    }

    public function getNameAttribute()
    {
        return trim($this->cus_firstname . ' ' . $this->cus_lastname);
    }

    public function getCompanyNameAttribute()
    {
        return $this->cus_company;
    }

    public function getTaxIdAttribute()
    {
        return $this->cus_tax_id;
    }

    public function getAddressAttribute()
    {
        return $this->cus_address;
    }

    public function getPhoneAttribute()
    {
        return $this->cus_tel_1;
    }

    public function getEmailAttribute()
    {
        return $this->cus_email;
    }

    public function getContactPersonAttribute()
    {
        return $this->cus_name;
    }

    public function getIsActiveAttribute()
    {
        return $this->cus_is_use;
    }

    public function getCreatedAtAttribute()
    {
        return $this->cus_created_date;
    }

    public function getUpdatedAtAttribute()
    {
        return $this->cus_updated_date;
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'customer_id', 'cus_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'customer_id', 'cus_id');
    }

    public function receipts()
    {
        return $this->hasMany(Receipt::class, 'customer_id', 'cus_id');
    }

    public function deliveryNotes()
    {
        return $this->hasMany(DeliveryNote::class, 'customer_id', 'cus_id');
    }

    public function scopeActive($query)
    {
        return $query->where('cus_is_use', true);
    }
}
