<?php

namespace App\Http\Requests\V1\Notebook;

use App\Helpers\UserSubRoleHelper;

class NotebookAllTabStatsRequest extends NotebookRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user() && UserSubRoleHelper::canViewAllNotebookScope($this->user());
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'date_filter_by' => ['nullable', 'in:nb_date,created_at,updated_at,all'],
            'status' => ['nullable', 'string', 'max:255'],
            'action' => ['nullable', 'string', 'max:255'],
            'entry_type' => ['nullable', 'string', 'max:50'],
            'manage_by' => ['nullable', 'integer'],
        ];
    }

    protected function authorizationMessage(): string
    {
        return 'Unauthorized: คุณไม่มีสิทธิ์ดูสรุปยอด Lead ทั้งหมด';
    }
}
