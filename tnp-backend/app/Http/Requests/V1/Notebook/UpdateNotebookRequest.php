<?php

namespace App\Http\Requests\V1\Notebook;

use App\Models\Notebook;
use App\Repositories\NotebookRepositoryInterface;
use App\Services\Notebook\NotebookService;
use Illuminate\Validation\Rule;

class UpdateNotebookRequest extends NotebookRequest
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
            && app(NotebookService::class)->canEdit($user, $notebook);
    }

    public function rules(): array
    {
        $rules = [
            'nb_customer_name' => ['sometimes', 'string', 'max:255'],
            'nb_date' => ['nullable', 'date'],
            'nb_time' => ['nullable', 'string', 'max:255'],
            'nb_is_online' => ['sometimes', 'boolean'],
            'nb_additional_info' => ['nullable', 'string'],
            'nb_contact_number' => ['nullable', 'string', 'max:255'],
            'nb_email' => ['nullable', 'email', 'max:255'],
            'nb_contact_person' => ['nullable', 'string', 'max:255'],
            'nb_action' => ['nullable', 'string', 'max:255'],
            'nb_status' => ['nullable', 'string', 'max:255'],
            'nb_remarks' => ['nullable', 'string'],
            'nb_next_followup_date' => ['nullable', 'date'],
            'nb_next_followup_note' => ['nullable', 'string'],
            'nb_is_favorite' => ['sometimes', 'boolean'],
            '_history_action' => ['sometimes', 'string', 'in:customer_info_updated'],
        ];

        if (app(NotebookService::class)->canManageAll($this->user())) {
            $rules['nb_manage_by'] = ['sometimes', 'nullable', 'integer', Rule::exists('users', 'user_id')];
        }

        return $rules;
    }

    protected function authorizationMessage(): string
    {
        return 'Unauthorized: You do not have permission to edit this notebook.';
    }
}
