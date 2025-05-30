<?php

namespace App\Models\CostCalc;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CostFabric extends Model
{
    use HasFactory;
    protected $table = 'cost_fabrics';
    protected $primaryKey = 'cost_fabric_id';
    protected $fillable = [
        'pattern_id',
        'fabric_name',
        'supplier',
        'fabric_name_tnp',
        'fabric_kg',
        'collar_kg',
        'fabric_price_per_kg',
        'shirt_per_total',
        'cutting_price',
        'sewing_price',
        'collar_price',
        'button_price',
        'fabric_class',
        'shirt_price_percent',
        'shirt_1k_price_percent',
        'created_at',
        'updated_at'
    ];
}
