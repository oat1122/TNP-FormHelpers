<?php

namespace App\Observers;

use App\Models\Notebook;
use App\Models\NotebookHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class NotebookObserver
{
    /**
     * Handle the Notebook "created" event.
     */
    public function created(Notebook $notebook): void
    {
        $context = $notebook->pullHistoryContext();

        $this->recordHistory(
            $notebook,
            $context['action'] ?? 'created',
            $context['old_values'],
            $context['new_values'] ?? $notebook->getAttributes()
        );
    }

    /**
     * Handle the Notebook "updated" event.
     */
    public function updated(Notebook $notebook): void
    {
        $context = $notebook->pullHistoryContext();
        $oldValues = $context['old_values'] ?? [];
        $newValues = $context['new_values'] ?? [];
        $changes = $notebook->getChanges();
        unset($changes['updated_at']);

        if (empty($newValues)) {
            foreach ($changes as $key => $value) {
                $oldValues[$key] = $notebook->getOriginal($key);
                $newValues[$key] = $value;
            }
        }

        if (! empty($newValues)) {
            $this->recordHistory($notebook, $context['action'] ?? 'updated', $oldValues, $newValues);
        }
    }

    /**
     * Handle the Notebook "deleted" event.
     */
    public function deleted(Notebook $notebook): void
    {
        $this->recordHistory($notebook, 'deleted', $notebook->getAttributes(), null);
    }

    /**
     * Record the history entry.
     */
    protected function recordHistory(Notebook $notebook, string $action, ?array $oldValues, ?array $newValues): void
    {
        NotebookHistory::create([
            'notebook_id' => $notebook->id,
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'action_by' => Auth::id(),
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
