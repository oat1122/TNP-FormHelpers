<?php

namespace App\Observers;

use App\Models\Notebook;
use App\Models\NotebookHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class NotebookObserver
{
    public function creating(Notebook $notebook): void
    {
        $notebook->nb_is_fresh_queue = $this->deriveFreshQueueFlag($notebook);
    }

    public function updating(Notebook $notebook): void
    {
        $notebook->nb_is_fresh_queue = $this->deriveFreshQueueFlag($notebook);
    }

    /**
     * Fresh = queue lead ที่ assign แล้วและ sales ยังไม่ได้กรอก status / followup
     * (matches recompute migration 2026_04_29_140000_recompute_is_fresh_queue_v2)
     */
    private function deriveFreshQueueFlag(Notebook $notebook): bool
    {
        if (! empty($notebook->nb_converted_at)) {
            return false;
        }

        if ($notebook->nb_workflow !== Notebook::WORKFLOW_LEAD_QUEUE) {
            return false;
        }

        if (empty($notebook->nb_manage_by)) {
            return false;
        }

        $hasStatus = trim((string) $notebook->nb_status) !== '';
        $hasFollowupDate = ! empty($notebook->nb_next_followup_date);
        $hasFollowupNote = trim((string) $notebook->nb_next_followup_note) !== '';

        return ! $hasStatus && ! $hasFollowupDate && ! $hasFollowupNote;
    }

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
