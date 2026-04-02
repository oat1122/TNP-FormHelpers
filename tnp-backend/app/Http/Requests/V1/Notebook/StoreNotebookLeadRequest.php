<?php

namespace App\Http\Requests\V1\Notebook;

class StoreNotebookLeadRequest extends NotebookRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('cus_channel')) {
            $this->merge([
                'cus_channel' => 1,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'cus_channel' => ['required', 'integer', 'in:1,2,3'],
            'cus_company' => ['nullable', 'string', 'max:255'],
            'cus_name' => ['required', 'string', 'max:255'],
            'cus_firstname' => ['required', 'string', 'max:255'],
            'cus_lastname' => ['required', 'string', 'max:255'],
            'cus_tel_1' => ['required', 'string', 'max:20'],
            'cus_tel_2' => ['nullable', 'string', 'max:20'],
            'cus_email' => ['nullable', 'email', 'max:100'],
            'cus_tax_id' => ['nullable', 'string', 'max:13'],
            'cus_bt_id' => ['nullable', 'string', 'max:36'],
            'cus_depart' => ['nullable', 'string', 'max:255'],
            'cus_address' => ['nullable', 'string'],
            'cus_address_detail' => ['nullable', 'string', 'max:500'],
            'cus_zip_code' => ['nullable', 'string', 'max:10'],
            'cus_pro_id' => ['nullable'],
            'cus_dis_id' => ['nullable'],
            'cus_sub_id' => ['nullable'],
            'cd_note' => ['nullable', 'string', 'max:2000'],
            'cd_remark' => ['nullable', 'string', 'max:1000'],
            'is_possible_duplicate' => ['sometimes', 'boolean'],
        ];
    }
}
