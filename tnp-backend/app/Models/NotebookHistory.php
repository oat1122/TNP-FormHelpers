<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User\User;

class NotebookHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'notebook_id',
        'action',
        'old_values',
        'new_values',
        'action_by',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function notebook()
    {
        return $this->belongsTo(Notebook::class);
    }

    public function actionBy()
    {
        return $this->belongsTo(User::class, 'action_by', 'user_id');
    }
}
