<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentSequence extends Model
{
    protected $table = 'document_sequences';
    public $timestamps = true;
    protected $fillable = [
        'company_id',
        'doc_type',
        'year',
        'month',
        'last_number',
        'prefix_override',
    ];
}
