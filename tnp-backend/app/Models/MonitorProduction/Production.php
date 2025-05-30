<?php

namespace App\Models\MonitorProduction;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Production extends Model
{
    use HasFactory;

    protected $primaryKey = 'pd_id';
    protected $fillable = [
        'work_id',
        'new_worksheet_id',
        'production_type',
        'screen',
        'dft',
        'embroid',
        'status',
        'order_start',
        'order_end',
        'dyeing_start',
        'dyeing_end',
        'cutting_start',
        'cutting_end',
        'sewing_start',
        'sewing_end',
        'received_start',
        'received_end',
        'exam_start',
        'exam_end',
        'sewing_factory',
        'cutting_factory',
        'end_select_process_time'
    ];
}
