<?php

namespace App\Repositories;

use App\Contracts\Repositories\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

/**
 * Base Repository Implementation
 * 
 * Abstract class ที่ implement พื้นฐานของ CRUD operations
 * Repository อื่นๆ ควร extend class นี้
 */
abstract class BaseRepository implements BaseRepositoryInterface
{
    /**
     * The Eloquent model instance
     */
    protected Model $model;

    /**
     * Create a new repository instance
     * 
     * @param Model $model
     */
    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * Get the model instance
     * 
     * @return Model
     */
    public function getModel(): Model
    {
        return $this->model;
    }

    /**
     * {@inheritDoc}
     */
    public function find(string $id)
    {
        return $this->model->find($id);
    }

    /**
     * {@inheritDoc}
     */
    public function findOrFail(string $id)
    {
        return $this->model->findOrFail($id);
    }

    /**
     * {@inheritDoc}
     */
    public function all(): Collection
    {
        return $this->model->all();
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $data)
    {
        return $this->model->create($data);
    }

    /**
     * {@inheritDoc}
     */
    public function update(string $id, array $data)
    {
        $record = $this->findOrFail($id);
        $record->update($data);
        return $record;
    }

    /**
     * {@inheritDoc}
     */
    public function delete(string $id): bool
    {
        return $this->findOrFail($id)->delete();
    }

    /**
     * Get a new query builder for the model
     * 
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function newQuery()
    {
        return $this->model->newQuery();
    }
}
