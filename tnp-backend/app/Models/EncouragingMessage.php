<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Class EncouragingMessage
 * 
 * @property string $em_id
 * @property string $em_content
 * @property string|null $em_category
 * @property bool $em_is_active
 * @property Carbon|null $em_created_date
 * @property string|null $em_created_by
 * @property Carbon|null $em_updated_date
 * @property string|null $em_updated_by
 */
class EncouragingMessage extends Model
{
    protected $table = 'encouraging_messages';
    protected $primaryKey = 'em_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $casts = [
        'em_is_active' => 'bool',
        'em_created_date' => 'datetime',
        'em_updated_date' => 'datetime'
    ];

    protected $fillable = [
        'em_content',
        'em_category',
        'em_is_active',
        'em_created_date',
        'em_created_by',
        'em_updated_date',
        'em_updated_by'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            if (empty($item->em_id)) {
                $item->em_id = Str::uuid();
            }
        });
    }

    /**
     * Get the user that created the encouraging message.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'em_created_by', 'user_uuid')
            ->select('user_uuid', 'username', 'user_nickname');
    }

    /**
     * Scope for active encouraging messages.
     */
    public function scopeActive($query)
    {
        return $query->where('em_is_active', true);
    }

    /**
     * Scope for filtering by category.
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('em_category', $category);
    }

    /**
     * Get a random encouraging message by category.
     */
    public static function getRandomMessage($category = null)
    {
        $query = self::active();
        
        if ($category) {
            $query->where(function($q) use ($category) {
                $q->where('em_category', $category)
                  ->orWhere('em_category', 'general');
            });
        }
        
        return $query->inRandomOrder()->first();
    }
}
