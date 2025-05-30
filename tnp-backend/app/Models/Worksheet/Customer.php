<?php

namespace App\Models\Worksheet;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Worksheet\Worksheet;
use Illuminate\Support\Str;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',    
        'customer_name',    
        'company_name',
        'customer_address',
        'customer_tel',
        'customer_email',
        'customer_tax_id'
    ];
    
    protected $primaryKey = 'customer_id';
    // protected $keyType = 'string';
    public $incrementing = false;

    public function worksheets()
    {
        return $this->hasMany(Worksheet::class);
    }

    protected static function booted(): void 
    {
        static::creating(function (Customer $customer) {
            $customer->customer_id = Str::uuid();
        });
    }

}
