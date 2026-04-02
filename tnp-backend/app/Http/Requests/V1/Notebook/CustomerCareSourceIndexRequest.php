<?php

namespace App\Http\Requests\V1\Notebook;

use App\Services\Notebook\NotebookService;
use Illuminate\Validation\Rule;

class CustomerCareSourceIndexRequest extends NotebookRequest
{
    public function authorize(): bool
    {
        return app(NotebookService::class)->canCreateCustomerCare($this->user());
    }

    public function rules(): array
    {
        return [
            'source' => ['required', Rule::in(['customer', 'notebook'])],
            'search' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    protected function authorizationMessage(): string
    {
        return 'Unauthorized: You do not have permission to manage customer care entries.';
    }
}
