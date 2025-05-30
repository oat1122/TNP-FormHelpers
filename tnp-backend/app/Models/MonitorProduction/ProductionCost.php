<?php

namespace App\Models\MonitorProduction;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionCost extends Model
{
    use HasFactory;

    protected $primaryKey = 'cost_id';
    protected $table = 'production_costs';
    protected $fillable = [
        'pd_id',
        'fabric',
        'factory',
        'fabric_color',
        'quantity',
        'fabric_price'
    ];
}
