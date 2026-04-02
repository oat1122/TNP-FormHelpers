<?php

namespace App\Http\Requests\V1\Notebook;

use App\Constants\UserRole;
use App\Helpers\UserSubRoleHelper;

class NotebookSummaryRequest extends NotebookRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return (bool) $user && (
            in_array($user->role, [
                UserRole::ADMIN,
                UserRole::MANAGER,
                UserRole::TELESALE,
                UserRole::SALE,
            ], true) || UserSubRoleHelper::isNotebookQueueUser($user)
        );
    }

    public function rules(): array
    {
        return [
            'period' => ['nullable', 'in:today,week,month,quarter,year,custom,prev_month,prev_week,prev_quarter'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'source_filter' => ['nullable', 'in:telesales,sales,online,office,all'],
            'user_id' => ['nullable', 'integer'],
            'nb_status' => ['nullable', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('user_id') === 'all') {
            $this->merge(['user_id' => null]);
        }
    }

    protected function authorizationMessage(): string
    {
        return 'Unauthorized: Access denied';
    }
}
