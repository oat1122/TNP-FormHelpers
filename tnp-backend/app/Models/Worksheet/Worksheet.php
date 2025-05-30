<?php

namespace App\Models\Worksheet;

use App\Models\MasterCustomer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User\User;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Worksheet extends Model
{
    use HasFactory;

    protected $fillable = [
        'worksheet_id',
        'work_id',
        'user_id',
        'customer_id',
        'pattern_id',
        'fabric_id',
        'screen_id',
        'work_name',
        'due_date',
        'exam_date',
        'date_created',
        'creator_name',
        'manager_name',
        'production_name',
        'images',
        'worksheet_note',
        'type_shirt',   // [ t-shirt, polo-shirt ]
        'size_tag',     // [0, 1]
        'packaging',
        'shirt_detail',
        'deleted',      // [ 0, 1=deleted ]
        'total_quantity',
        'nws_is_deleted',
		'nws_created_date',
		'nws_created_by',
		'nws_updated_date',
		'nws_updated_by'
    ];

    protected $table = 'new_worksheets';
    protected $primaryKey = 'worksheet_id';
    public $incrementing = false;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function nwsCreatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nws_created_by', 'user_uuid')
			->select('user_id', 'user_uuid', 'username', 'user_nickname');
    }

    public function creatorName(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_name', 'user_uuid')
			->select('user_id', 'user_uuid', 'username', 'user_nickname');
    }

    public function managerName(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_name', 'user_uuid')
			->select('user_id', 'user_uuid', 'username', 'user_nickname');
    }

    public function productionName(): BelongsTo
    {
        return $this->belongsTo(User::class, 'production_name', 'user_uuid')
			->select('user_id', 'user_uuid', 'username', 'user_nickname');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(MasterCustomer::class, 'customer_id', 'cus_id')
            ->select(
                'cus_id',
                'cus_name',
                'cus_company',
                'cus_address',
                'cus_tel_1',
                'cus_email'
            );
    }

    public function fabric()
    {
        return $this->hasOne(WorksheetFabric::class, 'fabric_id', 'fabric_id');
    }

    public function shirtPattern(): HasOne
    {
        return $this->hasOne(WorksheetShirtPattern::class, 'pattern_id', 'pattern_id')
            ->select('pattern_id', 'pattern_name', 'pattern_type');
    }

    public function shirtScreen()
    {
        return $this->hasOne(WorksheetScreen::class, 'screen_id', 'screen_id');
    }

    public function exampleQty(): HasMany
    {
        return $this->hasMany(WorksheetExampleQty::class, 'worksheet_id', 'worksheet_id');
    }

    public function poloDetail(): BelongsTo
    {
        return $this->belongsTo(WorksheetPoloDetail::class, 'worksheet_id', 'worksheet_id');
    }

    protected static function booted(): void
    {
        static::creating(function (Worksheet $worksheet) {
            $worksheet->worksheet_id = Str::uuid();
        });
    }
}
