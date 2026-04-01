<?php

namespace App\Http\Requests\V1\Notebook;

class NotebookIndexRequest extends NotebookRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('paginate')) {
            $value = $this->input('paginate');

            if ($value === 'true') {
                $this->merge(['paginate' => true]);
            }

            if ($value === 'false') {
                $this->merge(['paginate' => false]);
            }
        }
    }

    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'date_filter_by' => ['nullable', 'in:nb_date,created_at,updated_at,all'],
            'status' => ['nullable', 'string', 'max:255'],
            'action' => ['nullable', 'string', 'max:255'],
            'manage_by' => ['nullable', 'integer', 'min:1'],
            'include' => ['nullable', 'string'],
            'paginate' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function filters(): array
    {
        return $this->validated();
    }

    public function shouldPaginate(): bool
    {
        return $this->boolean('paginate', true);
    }
}
