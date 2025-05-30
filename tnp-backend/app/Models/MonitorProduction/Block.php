<?php

namespace App\Models\MonitorProduction;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Block extends Model
{
    use HasFactory;

    protected $primaryKey = 'block_id';
    protected $table = 'production_blocks';
    protected $fillable = [
        'pd_id',
        'user_id',
        'embroid_factory',
        'screen_block',
        'dft_block',
        'embroid_date',
        'screen_date',
        'dft_date'
    ];
}