<?php

namespace App\Models\Worksheet;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class WorksheetPoloDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'polo_detail_id',
        'worksheet_id',
        'collar',   // [1=คอปก, 2=คอจีน, 3=ปกเชิ้ต]
        'collar_type',  // [1=ปกธรรมดา, 2=ปกทอ/ขลิบปก, 3=ปกเจ็กการ์ด, 4=ปกเชิ้ต, 0=อื่นๆ]
        'other_collar_type',
        'collar_type_detail',
        'placket',  // [1=สาปปกติ, 2=สาปโชว์, 3=สาปแลป, 0=อื่นๆ]
        'other_placket',
        'outer_placket',
        'outer_placket_detail',
        'inner_placket',
        'inner_placket_detail',
        'button',   // [1=2เม็ด, 2=3เม็ด, 0=อื่นๆ]
        'other_button',
        'button_color',
        'sleeve',   // [1=แขนปล่อย, 2=แขนซ้อน/แขนเบิล, 3=แขนจั๊มรอบ, 4=แขนจั๊มครึ่ง]
        'sleeve_detail',
        'pocket',   // [1=กระเป๋าโชว์, 2=กระเป๋าเจาะ, 3=ไม่มีกระเป๋า]
        'pocket_detail',
        'bottom_hem',
        'bottom_hem_detail',
        'back_seam',
        'back_seam_detail',
        'side_vents',
        'side_vents_detail'
    ];
    
    protected $table = 'new_worksheet_polo_details';
    protected $primaryKey = 'polo_detail_id';
    public $incrementing = false;

    public function worksheet()
    {
        return $this->hasOne(Worksheet::class);
    }

    public function poloEmbroiders(): HasMany
    {
        return $this->hasMany(WorksheetPoloEmbroider::class, 'polo_detail_id', 'polo_detail_id');
    }

    protected static function booted(): void 
    {
        static::creating(function (WorksheetPoloDetail $polo) {
            $polo->polo_detail_id = Str::uuid();
        });
    }
}
