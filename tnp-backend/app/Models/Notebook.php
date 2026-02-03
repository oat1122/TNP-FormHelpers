<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notebook extends Model
{
    use HasFactory;

    protected $fillable = [
        'nb_date',
        'nb_time',
        'nb_customer_name',
        'nb_is_online',
        'nb_additional_info',
        'nb_contact_number',
        'nb_email',
        'nb_contact_person',
        'nb_action',
        'nb_status',
        'nb_remarks',
        'nb_manage_by',
        'nb_converted_at',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'nb_is_online' => 'boolean',
        'nb_date' => 'date',
        'nb_converted_at' => 'datetime'
    ];
    public function manageBy()
    {
        return $this->belongsTo(User::class, 'nb_manage_by', 'user_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_id');
    }
}
