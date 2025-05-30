<?php

namespace App\Models\Worksheet;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WorksheetPoloEmbroider extends Model
{
    use HasFactory;

    protected $fillable = [
        'polo_embroider_id',
        'polo_detail_id',
        'embroider_position',   // [1=ปักบนกระเป๋า, 2=ปักเหนือกระเป๋า, 3=ปักอกซ้าย, 4=ปักอกขวา, 5=ปักแขนซ้าย, 6=ปักแขนขวา, 7=ปักหลัง]
        'embroider_size',
        'created_at',
        'updated_at'
    ];
    
    protected $table = 'new_worksheet_polo_embroiders';
    protected $primaryKey = 'polo_embroider_id';
    public $incrementing = false;

    public function poloDetail(): BelongsTo
    {
        return $this->belongsTo(WorksheetPoloDetail::class, 'polo_detail_id', 'polo_detail_id');
    }

    protected static function booted(): void 
    {
        static::creating(function (WorksheetPoloEmbroider $polo) {
            $polo->polo_embroider_id = Str::uuid();
        });
    }
}
