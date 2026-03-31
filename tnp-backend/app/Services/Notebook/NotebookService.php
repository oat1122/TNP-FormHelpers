<?php

namespace App\Services\Notebook;

use App\Constants\UserRole;
use App\Models\Notebook;
use App\Repositories\NotebookRepositoryInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class NotebookService
{
    public function __construct(
        protected NotebookRepositoryInterface $notebookRepository
    ) {}

    public function create(array $validated, $user): Notebook
    {
        return DB::transaction(function () use ($validated, $user) {
            $data = $this->preparePayload($validated, $user, false);

            $notebook = new Notebook($data);
            $notebook->created_by = $user->user_id;
            $notebook->updated_by = $user->user_id;
            $notebook->save();

            return $this->notebookRepository->findWithRelationsOrFail((string) $notebook->id);
        });
    }

    public function update(string $id, array $validated, $user): Notebook
    {
        return DB::transaction(function () use ($id, $validated, $user) {
            /** @var Notebook $notebook */
            $notebook = $this->notebookRepository->findOrFail($id);
            $this->authorizeAccess($user, $notebook, 'edit');

            $notebook->fill($this->preparePayload($validated, $user, true));
            $notebook->updated_by = $user->user_id;
            $notebook->save();

            return $this->notebookRepository->findWithRelationsOrFail($id);
        });
    }

    public function convert(string $id, array $validated, $user): Notebook
    {
        return DB::transaction(function () use ($id, $validated, $user) {
            /** @var Notebook $notebook */
            $notebook = $this->notebookRepository->findOrFail($id);
            $this->authorizeAccess($user, $notebook, 'convert');

            if ($notebook->nb_converted_at) {
                throw new \DomainException('Notebook has already been converted.');
            }

            if (array_key_exists('nb_status', $validated)) {
                $notebook->nb_status = $validated['nb_status'];
            }

            $notebook->nb_converted_at = now();
            $notebook->updated_by = $user->user_id;
            $notebook->save();

            return $this->notebookRepository->findWithRelationsOrFail($id);
        });
    }

    public function delete(string $id, $user): void
    {
        if (! $this->canDelete($user)) {
            throw new AuthorizationException('Unauthorized: Only Admin can delete notebooks.');
        }

        DB::transaction(function () use ($id) {
            /** @var Notebook $notebook */
            $notebook = $this->notebookRepository->findOrFail($id);
            $notebook->delete();
        });
    }

    public function authorizeAccess($user, Notebook $notebook, string $action = 'view'): void
    {
        if ($this->canAccess($user, $notebook)) {
            return;
        }

        $message = match ($action) {
            'edit' => 'Unauthorized: You do not have permission to edit this notebook.',
            'convert' => 'Unauthorized: You do not have permission to convert this notebook.',
            default => 'Unauthorized: You do not have permission to view this notebook.',
        };

        throw new AuthorizationException($message);
    }

    public function canAccess($user, Notebook $notebook): bool
    {
        if (! $user) {
            return false;
        }

        if ($this->canManageAll($user)) {
            return true;
        }

        return (int) $notebook->nb_manage_by === (int) $user->user_id;
    }

    public function canManageAll($user): bool
    {
        return (bool) $user && in_array($user->role, [UserRole::ADMIN, UserRole::MANAGER], true);
    }

    public function canDelete($user): bool
    {
        return (bool) $user && $user->role === UserRole::ADMIN;
    }

    protected function preparePayload(array $validated, $user, bool $isUpdate): array
    {
        $data = Arr::only($validated, [
            'nb_date',
            'nb_time',
            'nb_customer_name',
            'nb_is_online',
            'nb_additional_info',
            'nb_contact_number',
            'nb_email',
            'nb_contact_person',
            'nb_action',
            'nb_status',
            'nb_remarks',
            'nb_manage_by',
        ]);

        if (! $this->canManageAll($user)) {
            if ($isUpdate) {
                unset($data['nb_manage_by']);
            } else {
                $data['nb_manage_by'] = $user->user_id;
            }
        }

        return $data;
    }
}
