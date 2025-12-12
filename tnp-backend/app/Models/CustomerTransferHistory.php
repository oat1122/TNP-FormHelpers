<?php

namespace App\Models;

use App\Constants\CustomerChannel;
use Illuminate\Database\Eloquent\Model;

/**
 * Class CustomerTransferHistory
 * 
 * ตารางประวัติการโอนย้ายลูกค้า
 * 
 * @property string $id
 * @property string $customer_id
 * @property int $previous_channel
 * @property int $new_channel
 * @property int|null $previous_manage_by
 * @property int|null $new_manage_by
 * @property int $action_by_user_id
 * @property string|null $remark
 * @property \Carbon\Carbon $created_at
 * 
 * @property-read string $previous_channel_label
 * @property-read string $new_channel_label
 * @property-read MasterCustomer $customer
 * @property-read User $actionBy
 * 
 * @package App\Models
 */
class CustomerTransferHistory extends Model
{
    protected $table = 'customer_transfer_history';
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'customer_id',
        'previous_channel',
        'new_channel',
        'previous_manage_by',
        'new_manage_by',
        'action_by_user_id',
        'remark',
        'created_at'
    ];

    protected $casts = [
        'previous_channel' => 'int',
        'new_channel' => 'int',
        'previous_manage_by' => 'int',
        'new_manage_by' => 'int',
        'action_by_user_id' => 'int',
        'created_at' => 'datetime'
    ];

    protected $appends = ['previous_channel_label', 'new_channel_label'];

    // ─────────────────────────────────────────────────────────────
    // Accessors (Computed Properties)
    // ─────────────────────────────────────────────────────────────

    /**
     * Get previous channel label
     */
    public function getPreviousChannelLabelAttribute(): string
    {
        return CustomerChannel::getLabel($this->previous_channel);
    }

    /**
     * Get new channel label
     */
    public function getNewChannelLabelAttribute(): string
    {
        return CustomerChannel::getLabel($this->new_channel);
    }

    // ─────────────────────────────────────────────────────────────
    // Relationships
    // ─────────────────────────────────────────────────────────────

    /**
     * Get the customer this history belongs to
     */
    public function customer()
    {
        return $this->belongsTo(MasterCustomer::class, 'customer_id', 'cus_id');
    }

    /**
     * Get the user who performed the transfer
     */
    public function actionBy()
    {
        return $this->belongsTo(User::class, 'action_by_user_id', 'user_id')
            ->select(['user_id', 'username', 'user_firstname', 'user_lastname']);
    }

    /**
     * Get the previous manager
     */
    public function previousManager()
    {
        return $this->belongsTo(User::class, 'previous_manage_by', 'user_id')
            ->select(['user_id', 'username', 'user_firstname', 'user_lastname']);
    }

    /**
     * Get the new manager
     */
    public function newManager()
    {
        return $this->belongsTo(User::class, 'new_manage_by', 'user_id')
            ->select(['user_id', 'username', 'user_firstname', 'user_lastname']);
    }

    // ─────────────────────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────────────────────

    /**
     * Scope to get history for a specific customer
     */
    public function scopeForCustomer($query, string $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    /**
     * Scope to get recent history first
     */
    public function scopeLatestFirst($query)
    {
        return $query->orderByDesc('created_at');
    }
}
