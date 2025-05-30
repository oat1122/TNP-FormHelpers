<?php

namespace App\Models\Worksheet;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Worksheet\Worksheet;
use Illuminate\Support\Str;

class WorksheetScreen extends Model
{
    use HasFactory;

    protected $fillable = [
        'screen_id',
        'screen_point',
        'screen_flex',
        'screen_dft',
        'screen_label',
        'screen_embroider',
        'screen_detail'
    ];
    
    protected $table = 'new_worksheet_screens';
    protected $primaryKey = 'screen_id';
    public $incrementing = false;

    public function worksheets()
    {
        return $this->hasMany(Worksheet::class);
    }

    protected static function booted(): void 
    {
        static::creating(function (WorksheetScreen $screen) {
            $screen->screen_id = Str::uuid();
        });
    }
}
