<?php

namespace App\Http\Requests\V1\Notebook;

use Illuminate\Validation\Rule;

class CheckNotebookDuplicateRequest extends NotebookRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['phone', 'email', 'customer_name', 'contact_person'])],
            'value' => ['required', 'string', 'max:255'],
            'exclude_notebook_id' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
