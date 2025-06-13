<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterBusinessType extends Model
{
    use HasFactory;

    protected $table = 'master_business_types';
    protected $primaryKey = 'bt_id';
    public $incrementing = false;

    protected $casts = [
        'bt_sort' => 'int',
        'bt_is_use' => 'bool'
    ];

    protected $fillable = [
        'bt_name',
        'bt_sort',
        'bt_is_use',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            if (empty($item->bt_id)) {
                $item->bt_id = Str::uuid(); // สร้างค่า UUID อัตโนมัติ
            }
        });
    }

    public function scopeActive($query)
    {
        return $query->where('bt_is_use', true);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(MasterCustomer::class, 'cus_bt_id', 'bt_id');
    }
}
