<?php

namespace App\Repositories;

use App\Models\Notebook;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface NotebookRepositoryInterface extends BaseRepositoryInterface
{
    public function getFilteredPaginated(array $filters, $user): LengthAwarePaginator;

    public function getFilteredCollection(array $filters, $user): Collection;

    public function findWithRelationsOrFail(string $id, array $includes = ['histories.actionBy']): Notebook;

    public function getNotebookSummaryQuery(array $dateRange, string $sourceFilter, ?int $targetUserId, ?string $nbStatus): Builder;

    public function getNotebookDetailsQuery(array $dateRange, string $sourceFilter, ?int $targetUserId, ?string $nbStatus): Builder;

    public function getSelfReportLeadAdditions(array $filters, $user): Collection;

    public function getSelfReportActivityItems(array $filters, $user): Collection;
}
