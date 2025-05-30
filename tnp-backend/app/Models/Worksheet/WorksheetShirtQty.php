<?php

namespace App\Models\Worksheet;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WorksheetShirtQty extends Model
{
    use HasFactory;

    protected $fillable = [
        'shirt_qty_id',
        'pattern_id',
        'shirt_pattern_type',     // [1=unisex, 2=men, 3=women]
        'size_name',
        'quantity',
        'created_at',
        'updated_at'
    ];
    
    protected $table = 'new_worksheet_shirt_qty';
    protected $primaryKey = 'shirt_qty_id';
    public $incrementing = false;

    protected static function booted(): void 
    {
        static::creating(function (WorksheetShirtPattern $pattern) {
            $pattern->pattern_id = Str::uuid();
        });
    }
}
