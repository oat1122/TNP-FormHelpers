<?php

namespace App\Models\Worksheet;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WorksheetStatus extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'status_id',
        'worksheet_id',
        'sales',     // [0=ใบงานถูกสร้าง, 1=ยืนยันใบงาน, 2=ขอสิทธิ์แก้ไขใบงาน, 3=แก้ไขใบงาน]
        'manager',  // [0=ใบงานถูกสร้าง, 1=ยืนยันใบงาน]
        'sales_confirm_date',
        'manager_confirm_date',
        'sales_permission_date',
        'manager_approve_date',
        'sales_edit_date',
    ];

    protected $table = 'new_worksheet_status';
    protected $primaryKey = 'status_id';
    public $incrementing = false;

    protected static function booted(): void 
    {
        static::creating(function (WorksheetStatus $status) {
            $status->status_id = Str::uuid();
        });
    }
}
