<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Helpers\AccountingHelper;
use App\Constants\UserRole;

class NotebookController extends Controller
{
    //
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = \App\Models\Notebook::query();
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        // Check permission (Admin/Manager see all, others see only their assigned notebooks)
        if (!AccountingHelper::hasRole([UserRole::ADMIN, UserRole::MANAGER])) {
            $query->where('nb_manage_by', $user->user_id);
        }

        // Include relationships
        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            if (in_array('histories', $includes)) {
                $query->with('histories');
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

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('nb_date', [$request->input('start_date'), $request->input('end_date')]);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('nb_status', $request->input('status'));
        }

        // Default sort by created_at desc
        $query->orderBy('created_at', 'desc');

        return response()->json($query->paginate($request->input('per_page', 15)));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nb_customer_name' => 'required|string|max:255',
            'nb_date' => 'nullable|date',
            'nb_time' => 'nullable|string',
            'nb_is_online' => 'boolean',
            'nb_contact_number' => 'nullable|string',
            'nb_email' => 'nullable|email',
            'nb_status' => 'nullable|string',
            'nb_manage_by' => 'nullable|integer',
        ]);

        // Add creator info
        $data = $request->all();
        $data['created_by'] = $request->user()->user_id ?? null; // Assuming auth is used

        $notebook = \App\Models\Notebook::create($data);

        return response()->json($notebook, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $notebook = \App\Models\Notebook::findOrFail($id);
        return response()->json($notebook);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $notebook = \App\Models\Notebook::findOrFail($id);
        $user = $request->user();

        // Permission check
        if (!AccountingHelper::hasRole([UserRole::ADMIN, UserRole::MANAGER])) {
            if ($notebook->nb_manage_by != $user->user_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized: You do not have permission to edit this notebook.'
                ], 403);
            }
        }
        
        $data = $request->all();
        $data['updated_by'] = $request->user()->user_id ?? null;

        $notebook->update($data);

        return response()->json($notebook);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notebook = \App\Models\Notebook::findOrFail($id);
        $user = $request->user();

        // Permission check - Only Admin can delete
        if (!AccountingHelper::hasRole([UserRole::ADMIN])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Only Admin can delete notebooks.'
            ], 403);
        }
        $notebook->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
