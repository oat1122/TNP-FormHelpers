<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Class FeedbackReport
 * 
 * @property string $fr_id
 * @property string|null $fr_content
 * @property string|null $fr_category
 * @property int $fr_priority
 * @property bool $fr_resolved
 * @property bool $fr_is_anonymous
 * @property string|null $fr_image
 * @property bool $fr_is_deleted
 * @property Carbon|null $fr_created_date
 * @property string|null $fr_created_by
 * @property Carbon|null $fr_updated_date
 * @property string|null $fr_updated_by
 * @property string|null $fr_admin_response
 * @property Carbon|null $fr_response_date
 * @property string|null $fr_response_by
 */
class FeedbackReport extends Model
{
    protected $table = 'feedback_reports';
    protected $primaryKey = 'fr_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $casts = [
        'fr_priority' => 'int',
        'fr_resolved' => 'bool',
        'fr_is_anonymous' => 'bool',
        'fr_is_deleted' => 'bool',
        'fr_created_date' => 'datetime',
        'fr_updated_date' => 'datetime',
        'fr_response_date' => 'datetime'
    ];

    protected $fillable = [
        'fr_content',
        'fr_category',
        'fr_priority',
        'fr_resolved',
        'fr_is_anonymous',
        'fr_image',
        'fr_is_deleted',
        'fr_created_date',
        'fr_created_by',
        'fr_updated_date',
        'fr_updated_by',
        'fr_admin_response',
        'fr_response_date',
        'fr_response_by'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            if (empty($item->fr_id)) {
                $item->fr_id = Str::uuid();
            }
        });
    }

    /**
     * Get the user that created the feedback report.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'fr_created_by', 'user_uuid')
            ->select('user_uuid', 'username', 'user_nickname');
    }

    /**
     * Get the admin who responded to the feedback report.
     */
    public function respondedBy()
    {
        return $this->belongsTo(User::class, 'fr_response_by', 'user_uuid')
            ->select('user_uuid', 'username', 'user_nickname');
    }

    /**
     * Scope for active (not deleted) feedback reports.
     */
    public function scopeActive($query)
    {
        return $query->where('fr_is_deleted', false);
    }

    /**
     * Scope for resolved feedback reports.
     */
    public function scopeResolved($query)
    {
        return $query->where('fr_resolved', true);
    }

    /**
     * Scope for unresolved feedback reports.
     */
    public function scopeUnresolved($query)
    {
        return $query->where('fr_resolved', false);
    }

    /**
     * Scope for anonymous feedback reports.
     */
    public function scopeAnonymous($query)
    {
        return $query->where('fr_is_anonymous', true);
    }

    /**
     * Scope for filtering by priority.
     */
    public function scopeByPriority($query, $priority)
    {
        return $query->where('fr_priority', $priority);
    }

    /**
     * Scope for filtering by category.
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('fr_category', $category);
    }
}
