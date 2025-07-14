<?php

namespace App\Models\Worksheet;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WorksheetExampleQty extends Model
{
    use HasFactory;

    protected $fillable = [
        'ex_id',
        'worksheet_id',
        'ex_pattern_type',     // [1=unisex, 2=men, 3=women]
        'ex_size_name',
        'ex_quantity',
        'created_at',
        'updated_at'
    ];
    
    protected $table = 'new_worksheet_example_qty';
    protected $primaryKey = 'ex_id';
    public $incrementing = false;

    protected static function booted(): void 
    {
        static::creating(function (WorksheetExampleQty $example) {
            $example->ex_id = Str::uuid();
        });
    }
}
