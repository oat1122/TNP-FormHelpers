<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaxSupply extends Model
{
    use HasFactory;

    protected $fillable = [
        'worksheet_id',
        'title',
        'status',
        'due_date',
    ];
}
