<?php

namespace App\Models\Worksheet;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WorksheetFabricCustom extends Model
{
    use HasFactory;

    protected $fillable = [
        'fabric_custom_id',
        'fabric_id',
        'fabric_custom_color',
    ];

    protected $table = 'new_worksheet_fabric_customs';
    protected $primaryKey = 'fabric_custom_id';
    public $incrementing = false;

    public function fabric(): BelongsTo
    {
        return $this->belongsTo(WorksheetFabric::class, 'fabric_id', 'fabric_id');
    }

    protected static function booted(): void 
    {
        static::creating(function (WorksheetFabricCustom $fabric) {
            $fabric->fabric_custom_id = Str::uuid();
        });
    }
}
