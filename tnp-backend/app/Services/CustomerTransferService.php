<?php

namespace App\Services;

use App\Constants\CustomerChannel;
use App\Models\MasterCustomer;
use App\Models\CustomerTransferHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * Service สำหรับจัดการการโอนย้ายลูกค้า
 * 
 * Responsibility: Transfer logic only (Single Responsibility Principle)
 */
class CustomerTransferService
{
    // ─────────────────────────────────────────────────────────────
    // Public Methods
    // ─────────────────────────────────────────────────────────────

    /**
     * โอนลูกค้าจาก Online ไปยัง Sales
     * 
     * @param string $customerId Customer UUID
     * @param int|null $newManageBy User ID ที่จะดูแลลูกค้าใหม่
     * @param string|null $remark หมายเหตุ
     * @return array Transfer result
     */
    public function transferToSales(string $customerId, ?int $newManageBy = null, ?string $remark = null): array
    {
        return $this->transfer($customerId, CustomerChannel::SALES, $newManageBy, $remark);
    }

    /**
     * โอนลูกค้าจาก Sales ไปยัง Online
     * 
     * @param string $customerId Customer UUID
     * @param int|null $newManageBy User ID ที่จะดูแลลูกค้าใหม่
     * @param string|null $remark หมายเหตุ
     * @return array Transfer result
     */
    public function transferToOnline(string $customerId, ?int $newManageBy = null, ?string $remark = null): array
    {
        return $this->transfer($customerId, CustomerChannel::ONLINE, $newManageBy, $remark);
    }

    /**
     * ดึงประวัติการโอนย้ายของลูกค้า
     * 
     * @param string $customerId Customer UUID
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getHistory(string $customerId)
    {
        return CustomerTransferHistory::forCustomer($customerId)
            ->with(['actionBy', 'previousManager', 'newManager'])
            ->latestFirst()
            ->get();
    }

    /**
     * ตรวจสอบว่า user มีสิทธิ์โอนลูกค้าหรือไม่
     * 
     * @param string $role User's role
     * @param int $currentChannel Customer's current channel
     * @return bool
     */
    public function canTransfer(string $role, int $currentChannel): bool
    {
        // Admin ทำได้ทุกอย่าง
        if ($role === 'admin') {
            return true;
        }

        // ตรวจสอบตาม Transfer Rules
        $rule = CustomerChannel::TRANSFER_RULES[$role] ?? null;
        
        return $rule && $rule['from'] === $currentChannel;
    }

    /**
     * หา target channel สำหรับ role
     * 
     * @param string $role User's role
     * @param int $currentChannel Customer's current channel
     * @return int|null Target channel or null if cannot transfer
     */
    public function getTargetChannel(string $role, int $currentChannel): ?int
    {
        if ($role === 'admin') {
            // Admin: toggle ระหว่าง Sales และ Online
            return $currentChannel === CustomerChannel::SALES 
                ? CustomerChannel::ONLINE 
                : CustomerChannel::SALES;
        }

        $rule = CustomerChannel::TRANSFER_RULES[$role] ?? null;
        
        return $rule['to'] ?? null;
    }

    /**
     * Get transfer info for a customer (for frontend display)
     * 
     * @param string $role User's role
     * @param int $currentChannel Customer's current channel
     * @return array
     */
    public function getTransferInfo(string $role, int $currentChannel): array
    {
        $canTransfer = $this->canTransfer($role, $currentChannel);
        $targetChannel = $this->getTargetChannel($role, $currentChannel);

        return [
            'can_transfer' => $canTransfer,
            'current_channel' => $currentChannel,
            'current_channel_label' => CustomerChannel::getLabel($currentChannel),
            'target_channel' => $targetChannel,
            'target_channel_label' => $targetChannel ? CustomerChannel::getLabel($targetChannel) : null,
        ];
    }

    /**
     * Attach latest transfer info to paginated customers
     * 
     * @param \Illuminate\Pagination\LengthAwarePaginator $customers
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function attachTransferInfo(\Illuminate\Pagination\LengthAwarePaginator $customers): \Illuminate\Pagination\LengthAwarePaginator
    {
        $customersWithTransfer = $customers->getCollection()->map(function ($customer) {
            $latestTransfer = CustomerTransferHistory::forCustomer($customer->cus_id)
                ->with(['previousManager', 'newManager', 'actionBy'])
                ->latestFirst()
                ->first();

            $customer->latest_transfer = $latestTransfer ? [
                'previous_channel' => $latestTransfer->previous_channel,
                'previous_channel_label' => $latestTransfer->previous_channel_label,
                'previous_manager_name' => $latestTransfer->previous_manager_name,
                'new_channel' => $latestTransfer->new_channel,
                'new_channel_label' => $latestTransfer->new_channel_label,
                'transferred_at' => $latestTransfer->created_at,
                'action_by' => $latestTransfer->actionBy ? [
                    'user_id' => $latestTransfer->actionBy->user_id,
                    'username' => $latestTransfer->actionBy->username,
                ] : null,
            ] : null;

            return $customer;
        });

        $customers->setCollection($customersWithTransfer);

        return $customers;
    }

    // ─────────────────────────────────────────────────────────────
    // Private Methods (Internal Logic)
    // ─────────────────────────────────────────────────────────────

    /**
     * Core transfer logic
     * 
     * @param string $customerId Customer UUID
     * @param int $newChannel Target channel
     * @param int|null $newManageBy New manager user ID
     * @param string|null $remark Transfer remark
     * @return array Transfer result
     * @throws \InvalidArgumentException
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    private function transfer(string $customerId, int $newChannel, ?int $newManageBy, ?string $remark): array
    {
        $customer = MasterCustomer::findOrFail($customerId);
        
        $this->validateTransfer($customer, $newChannel);
        
        $oldData = $this->captureOldData($customer);
        
        $this->updateCustomer($customer, $newChannel, $newManageBy);
        
        $historyId = $this->createHistory($customerId, $oldData, $newChannel, $newManageBy, $remark);

        // Send real-time notification to new manager
        if ($newManageBy) {
            app(NotificationService::class)->notifyCustomerTransferred(
                $newManageBy,
                $customer->cus_name ?? $customer->cus_company ?? 'ลูกค้า',
                CustomerChannel::getLabel($oldData['channel']),
                CustomerChannel::getLabel($newChannel)
            );
        }

        return [
            'customer_id' => $customerId,
            'customer_name' => $customer->cus_name ?? $customer->cus_company,
            'old_channel' => $oldData['channel'],
            'new_channel' => $newChannel,
            'old_channel_label' => CustomerChannel::getLabel($oldData['channel']),
            'new_channel_label' => CustomerChannel::getLabel($newChannel),
            'transfer_history_id' => $historyId,
        ];
    }

    /**
     * Validate transfer request
     * 
     * @param MasterCustomer $customer
     * @param int $newChannel
     * @throws \InvalidArgumentException
     */
    private function validateTransfer(MasterCustomer $customer, int $newChannel): void
    {
        if ($customer->cus_channel === $newChannel) {
            throw new \InvalidArgumentException('ลูกค้าอยู่ใน channel นี้แล้ว');
        }

        if (!CustomerChannel::isValid($newChannel)) {
            throw new \InvalidArgumentException('Channel ไม่ถูกต้อง');
        }
    }

    /**
     * Capture current state before transfer
     * 
     * @param MasterCustomer $customer
     * @return array
     */
    private function captureOldData(MasterCustomer $customer): array
    {
        return [
            'channel' => $customer->cus_channel,
            'manage_by' => $customer->cus_manage_by,
        ];
    }

    /**
     * Update customer record with new channel and manager
     * 
     * @param MasterCustomer $customer
     * @param int $newChannel
     * @param int|null $newManageBy
     */
    private function updateCustomer(MasterCustomer $customer, int $newChannel, ?int $newManageBy): void
    {
        $customer->cus_channel = $newChannel;
        
        if ($newManageBy) {
            $customer->cus_manage_by = $newManageBy;
            $customer->cus_allocation_status = 'allocated';
            // Set allocation timestamp for notification system
            $customer->cus_allocated_at = now();
        } else {
            // ถ้าไม่ระบุผู้ดูแลใหม่ ให้เข้า pool
            $customer->cus_manage_by = null;
            $customer->cus_allocation_status = 'pool';
        }
        
        $customer->cus_updated_date = now();
        $customer->cus_updated_by = Auth::id();
        $customer->save();
    }

    /**
     * Create transfer history record
     * 
     * @param string $customerId
     * @param array $oldData
     * @param int $newChannel
     * @param int|null $newManageBy
     * @param string|null $remark
     * @return string History record ID
     */
    private function createHistory(
        string $customerId,
        array $oldData,
        int $newChannel,
        ?int $newManageBy,
        ?string $remark
    ): string {
        $history = new CustomerTransferHistory([
            'id' => Str::uuid()->toString(),
            'customer_id' => $customerId,
            'previous_channel' => $oldData['channel'],
            'new_channel' => $newChannel,
            'previous_manage_by' => $oldData['manage_by'],
            'new_manage_by' => $newManageBy,
            'action_by_user_id' => Auth::id(),
            'remark' => $remark,
            'created_at' => now(),
        ]);
        
        $history->save();
        
        return $history->id;
    }
}
