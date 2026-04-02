<?php

namespace App\Http\Requests\V1\Notebook;

use App\Models\Notebook;
use App\Repositories\NotebookRepositoryInterface;
use App\Services\Notebook\NotebookService;

class ReserveNotebookRequest extends NotebookRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        $notebookId = (string) ($this->route('id') ?? $this->route('notebook'));
        $notebook = app(NotebookRepositoryInterface::class)->find($notebookId);

        return $notebook instanceof Notebook
            && app(NotebookService::class)->canReserve($user, $notebook);
    }

    public function rules(): array
    {
        return [];
    }

    protected function authorizationMessage(): string
    {
        return 'Unauthorized: You do not have permission to reserve this notebook.';
    }
}
