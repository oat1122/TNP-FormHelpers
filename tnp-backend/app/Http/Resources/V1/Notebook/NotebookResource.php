<?php

namespace App\Http\Resources\V1\Notebook;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

class NotebookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        unset($data['manage_by']);

        $data['nb_date'] = $this->nb_date?->toDateString();
        $data['nb_next_followup_date'] = $this->nb_next_followup_date?->toDateString();
        $data['manage_by_user'] = $this->relationLoaded('manageBy')
            ? $this->transformUserSummary($this->manageBy)
            : null;

        if ($this->relationLoaded('histories')) {
            $data['histories'] = $this->transformHistories($request);
        }

        return $data;
    }

    protected function transformHistories(Request $request): array
    {
        $histories = collect($this->histories)->values();
        $reportSnapshots = $this->buildHistoryReportSnapshots($histories);

        return $histories
            ->map(function ($history, $index) use ($request, $reportSnapshots) {
                $historyKey = $this->resolveHistorySnapshotKey($history, $index);
                $reportValues = $reportSnapshots[$historyKey] ?? [
                    'old' => $this->normalizeHistoryValues($history->old_values ?? null),
                    'new' => $this->normalizeHistoryValues($history->new_values ?? null),
                ];

                return (new NotebookHistoryResource($history))
                    ->withReportValues($reportValues['old'] ?? null, $reportValues['new'] ?? null)
                    ->resolve($request);
            })
            ->all();
    }

    protected function buildHistoryReportSnapshots(Collection $histories): array
    {
        $snapshots = [];
        $currentState = null;

        $sortedHistories = $histories
            ->values()
            ->sortBy(function ($history, $index) {
                $timestamp = $history?->created_at
                    ? strtotime((string) $history->created_at) ?: 0
                    : 0;

                return sprintf('%015d-%010d-%010d', $timestamp, (int) ($history->id ?? 0), $index);
            })
            ->values();

        foreach ($sortedHistories as $sortedIndex => $history) {
            $changedOldValues = $this->normalizeHistoryValues($history->old_values ?? null) ?? [];
            $changedNewValues = $this->normalizeHistoryValues($history->new_values ?? null) ?? [];
            $reportOldValues = $this->resolveReportOldValues(
                $currentState,
                $changedOldValues,
                $history->action ?? null
            );
            $reportNewValues = $this->resolveReportNewValues(
                $reportOldValues,
                $changedNewValues,
                $history->action ?? null
            );

            $snapshots[$this->resolveHistorySnapshotKey($history, $sortedIndex)] = [
                'old' => $reportOldValues,
                'new' => $reportNewValues,
            ];

            $currentState = $reportNewValues;
        }

        return $snapshots;
    }

    protected function resolveReportOldValues(?array $currentState, array $changedOldValues, ?string $action): ?array
    {
        if ($this->isCreateHistoryAction($action)) {
            return empty($changedOldValues) ? null : $changedOldValues;
        }

        if ($currentState !== null) {
            return empty($changedOldValues)
                ? $currentState
                : array_replace($currentState, $changedOldValues);
        }

        return empty($changedOldValues) ? null : $changedOldValues;
    }

    protected function resolveReportNewValues(?array $reportOldValues, array $changedNewValues, ?string $action): ?array
    {
        if ($action === 'deleted') {
            return null;
        }

        if ($this->isCreateHistoryAction($action)) {
            return empty($changedNewValues) ? $reportOldValues : $changedNewValues;
        }

        if ($reportOldValues !== null) {
            return empty($changedNewValues)
                ? $reportOldValues
                : array_replace($reportOldValues, $changedNewValues);
        }

        return empty($changedNewValues) ? null : $changedNewValues;
    }

    protected function isCreateHistoryAction(?string $action): bool
    {
        return in_array($action, ['created', 'created_to_queue', 'created_to_mine'], true);
    }

    protected function resolveHistorySnapshotKey(mixed $history, int $index): string
    {
        $historyId = $history->id ?? null;

        return $historyId !== null ? 'history-'.$historyId : 'history-index-'.$index;
    }

    protected function normalizeHistoryValues(mixed $values): ?array
    {
        return is_array($values) ? $values : null;
    }

    protected function transformUserSummary(mixed $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'user_id' => $user->user_id,
            'username' => $user->username,
            'user_nickname' => $user->user_nickname,
            'user_firstname' => $user->user_firstname,
            'user_lastname' => $user->user_lastname,
            'role' => $user->role,
        ];
    }
}
