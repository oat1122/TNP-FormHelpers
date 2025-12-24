<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class CustomerNotificationRead
 *
 * @property int $id
 * @property string $cus_id Customer ID
 * @property int $user_id User ID who read the notification
 * @property \Carbon\Carbon $read_at When the notification was read
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 *
 * @property-read MasterCustomer $customer
 * @property-read User $user
 *
 * @package App\Models
 */
class CustomerNotificationRead extends Model
{
    protected $table = 'customer_notification_reads';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'cus_id',
        'user_id',
        'read_at',
        'is_dismissed',
    ];

    protected $casts = [
        'cus_id' => 'string',
        'user_id' => 'int',
        'read_at' => 'datetime',
        'is_dismissed' => 'boolean',
    ];

    /**
     * Get the customer that this notification belongs to
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(MasterCustomer::class, 'cus_id', 'cus_id');
    }

    /**
     * Get the user who read this notification
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    /**
     * Scope to get notifications read by a specific user
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get recent reads (within specified days)
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('read_at', '>=', now()->subDays($days));
    }

    /**
     * Mark a customer notification as read for a user
     */
    public static function markAsRead(string $customerId, int $userId): self
    {
        return static::updateOrCreate(
            [
                'cus_id' => $customerId,
                'user_id' => $userId,
            ],
            [
                'read_at' => now(),
            ]
        );
    }

    /**
     * Check if a notification has been read by a user
     */
    public static function isRead(string $customerId, int $userId): bool
    {
        return static::where('cus_id', $customerId)
            ->where('user_id', $userId)
            ->exists();
    }

    /**
     * Get unread customer IDs for a user
     */
    public static function getUnreadIds(int $userId, array $customerIds): array
    {
        $readIds = static::where('user_id', $userId)
            ->whereIn('cus_id', $customerIds)
            ->pluck('cus_id')
            ->toArray();

        return array_diff($customerIds, $readIds);
    }
}