<?php

namespace App\Models\CostCalc;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pattern extends Model
{
    use HasFactory;
    protected $table = 'shirt_patterns';
    protected $primaryKey = 'pattern_id';
    protected $fillable = [
        'pattern_name',
        'shirt_category',
        'created_at',
        'updated_at'
    ];
}
