<?php

namespace App\Models\MonitorProduction;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    use HasFactory;

    protected $table = 'production_notes';
    protected $primaryKey = 'note_id';
    protected $pd_id = 'pd_id';
    protected $fillable = [
        'pd_id',
        'user_id',
        'note_category',        // ['order', 'dyeing', 'cutting', 'sewing', 'received', 'example', 'general']
        'note_descr',
        'note_datetime'
    ];
}
