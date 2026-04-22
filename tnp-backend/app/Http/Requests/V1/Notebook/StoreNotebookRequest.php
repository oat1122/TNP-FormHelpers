<?php

namespace App\Http\Requests\V1\Notebook;

use App\Services\Notebook\NotebookService;
use Illuminate\Validation\Rule;

class StoreNotebookRequest extends NotebookRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        $rules = [
            'nb_customer_name' => ['required', 'string', 'max:255'],
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
            'nb_workflow' => ['sometimes', Rule::in(['standard', 'lead_queue'])],
        ];

        if (app(NotebookService::class)->canManageAll($this->user())) {
            $rules['nb_manage_by'] = ['sometimes', 'nullable', 'integer', Rule::exists('users', 'user_id')];
        }

        return $rules;
    }
}
