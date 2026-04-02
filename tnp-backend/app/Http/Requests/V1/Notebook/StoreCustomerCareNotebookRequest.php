<?php

namespace App\Http\Requests\V1\Notebook;

use App\Services\Notebook\NotebookService;
use Illuminate\Validation\Rule;

class StoreCustomerCareNotebookRequest extends NotebookRequest
{
    public function authorize(): bool
    {
        return app(NotebookService::class)->canCreateCustomerCare($this->user());
    }

    public function rules(): array
    {
        return [
            'nb_date' => ['required', 'date'],
            'nb_additional_info' => ['nullable', 'string'],
            'nb_action' => ['nullable', 'string', 'max:255'],
            'nb_status' => ['nullable', 'string', 'max:255'],
            'nb_remarks' => ['nullable', 'string'],
            'source_type' => ['required', Rule::in(['customer', 'notebook'])],
            'source_customer_id' => ['nullable', 'string', 'max:36', Rule::exists('master_customers', 'cus_id')],
            'source_notebook_id' => ['nullable', 'integer', Rule::exists('notebooks', 'id')],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $sourceType = $this->input('source_type');

            if ($sourceType === 'customer' && ! $this->filled('source_customer_id')) {
                $validator->errors()->add('source_customer_id', 'The source customer field is required.');
            }

            if ($sourceType === 'notebook' && ! $this->filled('source_notebook_id')) {
                $validator->errors()->add('source_notebook_id', 'The source notebook field is required.');
            }
        });
    }

    protected function authorizationMessage(): string
    {
        return 'Unauthorized: You do not have permission to create customer care entries.';
    }
}
