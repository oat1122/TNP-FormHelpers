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
        $this->recordHistory($notebook, 'created', null, $notebook->getAttributes());
    }

    /**
     * Handle the Notebook "updated" event.
     */
    public function updated(Notebook $notebook): void
    {
        $oldValues = [];
        $newValues = [];
        
        foreach ($notebook->getDirty() as $key => $value) {
            // Skip updated_at as it always changes on update
            if ($key === 'updated_at') {
                continue;
            }
            
            $oldValues[$key] = $notebook->getOriginal($key);
            $newValues[$key] = $value;
        }

        if (!empty($newValues)) {
            $this->recordHistory($notebook, 'updated', $oldValues, $newValues);
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
