<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Helpers\AccountingHelper;
use App\Constants\UserRole;
use App\Models\Notebook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class NotebookController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $query = Notebook::query();

        // Check permission (Admin/Manager see all, others see only their assigned notebooks)
        if (!$this->canManageAllNotebooks($user)) {
            $query->where('nb_manage_by', $user->user_id);
        }

        // Include relationships
        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('histories', $includes)) {
                $query->with('histories.actionBy');
            }
        }

        // Search by name or contact
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('nb_customer_name', 'like', "%{$search}%")
                  ->orWhere('nb_contact_number', 'like', "%{$search}%")
                  ->orWhere('nb_contact_person', 'like', "%{$search}%");
            });
        }

        // Filter by date range and type
        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $dateFilterBy = $request->input('date_filter_by', 'nb_date'); // Default to nb_date for backwards compatibility
            
            // Map the generic 'created_at' and 'updated_at' string
            $column = in_array($dateFilterBy, ['nb_date', 'created_at', 'updated_at', 'all']) ? $dateFilterBy : 'nb_date';

            if ($column === 'all') {
                $query->where(function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('created_at', [
                        $startDate . ' 00:00:00',
                        $endDate . ' 23:59:59'
                    ])->orWhereBetween('updated_at', [
                        $startDate . ' 00:00:00',
                        $endDate . ' 23:59:59'
                    ]);
                });
            } else if ($column === 'nb_date') {
                $query->whereBetween($column, [$startDate, $endDate]);
            } else {
                // For timestamp columns, append times to cover the whole day
                $query->whereBetween($column, [
                    $startDate . ' 00:00:00',
                    $endDate . ' 23:59:59'
                ]);
            }
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('nb_status', $request->input('status'));
        }

        // Default sort by created_at desc
        $query->orderBy('created_at', 'desc');

        if (!$request->boolean('paginate', true)) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate((int) $request->input('per_page', 15)));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate($this->notebookRules($user, false));
        $data = $this->extractNotebookPayload($validated, $user, false);

        $notebook = new Notebook($data);
        $notebook->created_by = $user->user_id;
        $notebook->updated_by = $user->user_id;
        $notebook->save();

        return response()->json($notebook->load('histories.actionBy'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $notebook = Notebook::with(['histories.actionBy'])->findOrFail($id);

        if (!$this->canAccessNotebook($request->user(), $notebook)) {
            return $this->forbiddenResponse('Unauthorized: You do not have permission to view this notebook.');
        }

        return response()->json($notebook);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $notebook = Notebook::findOrFail($id);
        $user = $request->user();

        if (!$this->canAccessNotebook($user, $notebook)) {
            return $this->forbiddenResponse('Unauthorized: You do not have permission to edit this notebook.');
        }

        $validated = $request->validate($this->notebookRules($user, true));
        $data = $this->extractNotebookPayload($validated, $user, true);

        $notebook->fill($data);
        $notebook->updated_by = $user->user_id;
        $notebook->save();

        return response()->json($notebook->fresh()->load('histories.actionBy'));
    }

    /**
     * Mark the specified notebook as converted.
     */
    public function convert(Request $request, string $id): JsonResponse
    {
        $notebook = Notebook::findOrFail($id);
        $user = $request->user();

        if (!$this->canAccessNotebook($user, $notebook)) {
            return $this->forbiddenResponse('Unauthorized: You do not have permission to convert this notebook.');
        }

        if ($notebook->nb_converted_at) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notebook has already been converted.',
            ], 422);
        }

        $validated = $request->validate([
            'nb_status' => ['nullable', 'string', 'max:255'],
        ]);

        if (array_key_exists('nb_status', $validated)) {
            $notebook->nb_status = $validated['nb_status'];
        }

        $notebook->nb_converted_at = now();
        $notebook->updated_by = $user->user_id;
        $notebook->save();

        return response()->json($notebook->fresh()->load('histories.actionBy'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notebook = Notebook::findOrFail($id);

        // Permission check - Only Admin can delete
        if (!AccountingHelper::hasRole([UserRole::ADMIN])) {
            return $this->forbiddenResponse('Unauthorized: Only Admin can delete notebooks.');
        }
        $notebook->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    private function notebookRules($user, bool $isUpdate): array
    {
        $rules = [
            'nb_customer_name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'nb_date' => ['nullable', 'date'],
            'nb_time' => ['nullable', 'string', 'max:255'],
            'nb_is_online' => ['sometimes', 'boolean'],
            'nb_additional_info' => ['nullable', 'string'],
            'nb_contact_number' => ['nullable', 'string', 'max:255'],
            'nb_email' => ['nullable', 'email', 'max:255'],
            'nb_contact_person' => ['nullable', 'string', 'max:255'],
            'nb_action' => ['nullable', 'string', 'max:255'],
            'nb_status' => ['nullable', 'string', 'max:255'],
            'nb_remarks' => ['nullable', 'string'],
        ];

        if ($this->canManageAllNotebooks($user)) {
            $rules['nb_manage_by'] = ['sometimes', 'nullable', 'integer', Rule::exists('users', 'user_id')];
        }

        return $rules;
    }

    private function extractNotebookPayload(array $validated, $user, bool $isUpdate): array
    {
        $data = Arr::only($validated, [
            'nb_date',
            'nb_time',
            'nb_customer_name',
            'nb_is_online',
            'nb_additional_info',
            'nb_contact_number',
            'nb_email',
            'nb_contact_person',
            'nb_action',
            'nb_status',
            'nb_remarks',
            'nb_manage_by',
        ]);

        if (!$this->canManageAllNotebooks($user)) {
            if (!$isUpdate) {
                $data['nb_manage_by'] = $user->user_id;
            } else {
                unset($data['nb_manage_by']);
            }
        }

        return $data;
    }

    private function canAccessNotebook($user, Notebook $notebook): bool
    {
        if (!$user) {
            return false;
        }

        if ($this->canManageAllNotebooks($user)) {
            return true;
        }

        return (int) $notebook->nb_manage_by === (int) $user->user_id;
    }

    private function canManageAllNotebooks($user): bool
    {
        return (bool) $user && in_array($user->role, [UserRole::ADMIN, UserRole::MANAGER], true);
    }

    private function forbiddenResponse(string $message): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
        ], 403);
    }
}
