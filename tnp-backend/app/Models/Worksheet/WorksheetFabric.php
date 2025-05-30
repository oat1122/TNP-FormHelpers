<?php

namespace App\Models\Worksheet;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class WorksheetFabric extends Model
{
    use HasFactory;

    protected $fillable = [
        'fabric_id',
        'fabric_name',
        'fabric_no',
        'fabric_color',
        'fabric_color_no',
        'fabric_factory',
        'crewneck_color',
    ];
    
    protected $table = 'new_worksheet_fabrics';
    protected $primaryKey = 'fabric_id';
    public $incrementing = false;

    public function worksheet()
    {
        return $this->hasOne(Worksheet::class);
    }

    public function fabricCustoms(): HasMany
    {
        return $this->hasMany(WorksheetFabricCustom::class, 'fabric_id', 'fabric_id');
    }

    protected static function booted(): void 
    {
        static::creating(function (WorksheetFabric $fabric) {
            $fabric->fabric_id = Str::uuid();
        });
    }
}
