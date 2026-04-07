<?php

namespace App\Http\Requests\V1\Notebook;

use App\Services\Notebook\NotebookService;
use Illuminate\Validation\Rule;

class AssignNotebookRequest extends NotebookRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()
            && app(NotebookService::class)->canAssignNotebookQueue($this->user());
    }

    public function rules(): array
    {
        return [
            'sales_user_id' => ['required', 'integer', Rule::exists('users', 'user_id')],
        ];
    }

    protected function authorizationMessage(): string
    {
        return 'Unauthorized: You do not have permission to assign this notebook.';
    }
}
