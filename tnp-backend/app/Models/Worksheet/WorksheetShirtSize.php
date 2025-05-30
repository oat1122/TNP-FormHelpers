<?php

namespace App\Models\Worksheet;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WorksheetShirtSize extends Model
{
    use HasFactory;

    protected $fillable = [
        'shirt_size_id',
        'pattern_id',
        'shirt_pattern_type',     // [1=unisex, 2=men, 3=women]
        'size_name',
        'chest',
        'long',
        'quantity',
        'created_at',
        'updated_at'
    ];
    
    protected $table = 'new_worksheet_shirt_sizes';
    protected $primaryKey = 'shirt_size_id';
    public $incrementing = false;

    protected static function booted(): void 
    {
        static::creating(function (WorksheetShirtSize $shirt) {
            $shirt->shirt_size_id = Str::uuid();
        });
    }
}
