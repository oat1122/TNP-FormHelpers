<?php

namespace App\Repositories;

/**
 * Base Repository Interface
 * 
 * กำหนด contract พื้นฐานสำหรับ Repository ทุกตัว
 */
interface BaseRepositoryInterface
{
    /**
     * Find a record by ID
     * 
     * @param string $id
     * @return mixed
     */
    public function find(string $id);

    /**
     * Find a record by ID or throw exception
     * 
     * @param string $id
     * @return mixed
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function findOrFail(string $id);

    /**
     * Get all records
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function all();

    /**
     * Create a new record
     * 
     * @param array $data
     * @return mixed
     */
    public function create(array $data);

    /**
     * Update a record by ID
     * 
     * @param string $id
     * @param array $data
     * @return mixed
     */
    public function update(string $id, array $data);

    /**
     * Delete a record by ID
     * 
     * @param string $id
     * @return bool
     */
    public function delete(string $id);
}
