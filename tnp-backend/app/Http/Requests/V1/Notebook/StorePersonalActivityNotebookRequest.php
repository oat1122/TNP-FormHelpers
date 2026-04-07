<?php

namespace App\Http\Requests\V1\Notebook;

class StorePersonalActivityNotebookRequest extends NotebookRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'nb_date' => ['required', 'date'],
            'nb_additional_info' => ['required', 'string'],
        ];
    }
}
