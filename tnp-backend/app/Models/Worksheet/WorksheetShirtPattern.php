<?php

namespace App\Models\Worksheet;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class WorksheetShirtPattern extends Model
{
    use HasFactory;

    protected $fillable = [
        'pattern_id',
        'display_pattern_id',
        'pattern_name',
        'pattern_type',   // [1=unisex, 2=men/women]
        'enable_edit',
    ];

    protected $table = 'new_worksheet_shirt_patterns';
    protected $primaryKey = 'pattern_id';
    public $incrementing = false;

    public function shirtSizes(): HasMany
    {
        return $this->hasMany(WorksheetShirtSize::class, 'pattern_id', 'pattern_id');
    }

    protected static function booted(): void 
    {
        static::creating(function (WorksheetShirtPattern $pattern) {
            $pattern->pattern_id = Str::uuid();
        });
    }
}
