<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Accounting\Quotation;

class UpdateQuotationStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Handle authorization in middleware/policies
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                'in:' . implode(',', [
                    Quotation::STATUS_DRAFT,
                    Quotation::STATUS_PENDING_REVIEW,
                    Quotation::STATUS_APPROVED,
                    Quotation::STATUS_REJECTED,
                    Quotation::STATUS_COMPLETED
                ])
            ],
            'notes' => 'nullable|string|max:1000'
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'status.required' => 'Status is required',
            'status.in' => 'Invalid status. Valid statuses are: draft, pending_review, approved, rejected, completed',
            'notes.max' => 'Notes cannot exceed 1000 characters'
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'status' => 'status',
            'notes' => 'notes'
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $quotation = $this->route('quotation');
            $newStatus = $this->input('status');

            if ($quotation) {
                // Check if status transition is valid
                if (!$this->isValidStatusTransition($quotation->status, $newStatus)) {
                    $validator->errors()->add(
                        'status',
                        "Cannot change status from {$quotation->status} to {$newStatus}"
                    );
                }

                // Require notes for rejection
                if ($newStatus === Quotation::STATUS_REJECTED && empty($this->input('notes'))) {
                    $validator->errors()->add(
                        'notes',
                        'Notes are required when rejecting a quotation'
                    );
                }
            }
        });
    }

    /**
     * Check if status transition is valid
     */
    private function isValidStatusTransition(string $currentStatus, string $newStatus): bool
    {
        $validTransitions = [
            Quotation::STATUS_DRAFT => [
                Quotation::STATUS_PENDING_REVIEW,
                Quotation::STATUS_REJECTED
            ],
            Quotation::STATUS_PENDING_REVIEW => [
                Quotation::STATUS_DRAFT,
                Quotation::STATUS_APPROVED,
                Quotation::STATUS_REJECTED
            ],
            Quotation::STATUS_APPROVED => [
                Quotation::STATUS_COMPLETED,
                Quotation::STATUS_REJECTED // In case of later issues
            ],
            Quotation::STATUS_REJECTED => [
                Quotation::STATUS_DRAFT // Allow to restart the process
            ],
            Quotation::STATUS_COMPLETED => [
                // Completed quotations generally cannot be changed
            ]
        ];

        return in_array($newStatus, $validTransitions[$currentStatus] ?? []);
    }
}
