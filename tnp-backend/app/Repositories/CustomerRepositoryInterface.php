<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Customer Repository Interface
 *
 * Contract สำหรับ CustomerRepository
 * กำหนด methods ที่ต้องมีสำหรับการจัดการข้อมูล Customer
 */
interface CustomerRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get filtered and paginated customers
     *
     * @param  array<string, mixed>  $filters  Filter parameters (search, group, date_range, etc.)
     * @param  User  $user  Current authenticated user for role-based filtering
     * @return LengthAwarePaginator<\App\Models\MasterCustomer>
     */
    public function getFiltered(array $filters, User $user): LengthAwarePaginator;

    /**
     * Get customer counts per group with applied filters
     *
     * @param  array<string, mixed>  $filters  Filter parameters
     * @param  User  $user  Current authenticated user
     * @return array<string|int, int> Associative array with group_id => count
     */
    public function getGroupCounts(array $filters, User $user): array;

    /**
     * Get customer groups with customer count
     *
     * @param  array<string, mixed>  $filters  Filter parameters
     * @param  User  $user  Current authenticated user
     * @return Collection<int, \App\Models\MasterCustomerGroup>
     */
    public function getCustomerGroups(array $filters, User $user): Collection;

    /**
     * Get total count of filtered customers
     *
     * @param  array<string, mixed>  $filters  Filter parameters
     * @param  User  $user  Current authenticated user
     */
    public function getTotalCount(array $filters, User $user): int;

    /**
     * Get active customer by ID with relations
     *
     * @param  string  $id  Customer UUID
     * @return mixed Customer model or null
     */
    public function findActiveWithRelations(string $id);

    /**
     * Get all customers with basic fields only
     *
     * @return Collection<int, \App\Models\MasterCustomer>
     */
    public function getAllBasic(): Collection;

    /**
     * Get customers in pool (waiting for allocation)
     *
     * @param  array<string, mixed>  $filters  Filter parameters
     * @return LengthAwarePaginator<\App\Models\MasterCustomer>
     */
    public function getPoolCustomers(array $filters): LengthAwarePaginator;

    /**
     * Get latest customer number for generation
     */
    public function getLatestCustomerNo(): ?string;

    /**
     * Check for duplicate customers by phone or company
     *
     * @param  string  $type  'phone' or 'company'
     * @param  string  $value  Value to check
     * @return Collection<int, \App\Models\MasterCustomer>
     */
    public function checkDuplicate(string $type, string $value): Collection;

    /**
     * Get base query builder for custom queries
     *
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\MasterCustomer>
     */
    public function getBaseQuery(): \Illuminate\Database\Eloquent\Builder;

    /**
     * Get pool customers from Telesales source
     *
     * @param  array<string, mixed>  $filters  Filter parameters (search, per_page)
     * @return LengthAwarePaginator<\App\Models\MasterCustomer>
     */
    public function getPoolTelesalesCustomers(array $filters): LengthAwarePaginator;

    /**
     * Get pool customers that have transfer history
     *
     * @param  array<string, mixed>  $filters  Filter parameters (channel, per_page)
     * @return LengthAwarePaginator<\App\Models\MasterCustomer>
     */
    public function getPoolTransferredCustomers(array $filters): LengthAwarePaginator;
}
