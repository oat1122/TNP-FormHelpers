<?php

namespace App\Http\Controllers\Api\V1\SubRole;

use App\Http\Controllers\Controller;
use App\Models\MasterSubRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SubRoleController extends Controller
{
    /**
     * Display a listing of Sub Roles.
     */
    public function index(Request $request)
    {
        try {
            $query = MasterSubRole::query();

            // Filter by active status
            if ($request->has('active_only') && $request->active_only == 'true') {
                $query->active();
            }

            // Search
            if ($request->has('search') && !empty($request->search)) {
                $search = '%' . trim($request->search) . '%';
                $query->where(function ($q) use ($search) {
                    $q->where('msr_code', 'like', $search)
                      ->orWhere('msr_name', 'like', $search)
                      ->orWhere('msr_description', 'like', $search);
                });
            }

            // Order by sort field
            $query->ordered();

            // Pagination
            $perPage = $request->input('per_page', 10);
            
            if ($request->has('all') && $request->all == 'true') {
                // Return all for dropdown
                $result = $query->get();
                return response()->json([
                    'status' => 'success',
                    'data' => $result
                ]);
            }

            $paginated = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $paginated->items(),
                'pagination' => [
                    'current_page' => $paginated->currentPage(),
                    'per_page' => $paginated->perPage(),
                    'total_pages' => $paginated->lastPage(),
                    'total_items' => $paginated->total()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching sub roles: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching sub roles: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created Sub Role.
     */
    public function store(Request $request)
    {
        $request->validate([
            'msr_code' => 'required|string|max:50|unique:master_sub_roles,msr_code',
            'msr_name' => 'required|string|max:100',
            'msr_description' => 'nullable|string',
            'msr_is_active' => 'boolean',
            'msr_sort' => 'nullable|integer',
        ]);

        try {
            DB::beginTransaction();

            $subRole = new MasterSubRole();
            $subRole->msr_id = (string) Str::uuid();
            $subRole->msr_code = strtoupper(trim($request->msr_code));
            $subRole->msr_name = trim($request->msr_name);
            $subRole->msr_description = $request->msr_description;
            $subRole->msr_is_active = $request->input('msr_is_active', true);
            $subRole->msr_sort = $request->input('msr_sort', 0);
            $subRole->created_by = $request->input('created_by');
            $subRole->updated_by = $request->input('created_by');
            $subRole->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'data' => $subRole,
                'message' => 'สร้าง Sub Role สำเร็จ'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating sub role: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error creating sub role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified Sub Role.
     */
    public function show(string $id)
    {
        try {
            $subRole = MasterSubRole::findOrFail($id);
            return response()->json([
                'status' => 'success',
                'data' => $subRole
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sub Role not found'
            ], 404);
        }
    }

    /**
     * Update the specified Sub Role.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'msr_code' => 'required|string|max:50|unique:master_sub_roles,msr_code,' . $id . ',msr_id',
            'msr_name' => 'required|string|max:100',
            'msr_description' => 'nullable|string',
            'msr_is_active' => 'boolean',
            'msr_sort' => 'nullable|integer',
        ]);

        try {
            DB::beginTransaction();

            $subRole = MasterSubRole::findOrFail($id);
            $subRole->msr_code = strtoupper(trim($request->msr_code));
            $subRole->msr_name = trim($request->msr_name);
            $subRole->msr_description = $request->msr_description;
            $subRole->msr_is_active = $request->input('msr_is_active', $subRole->msr_is_active);
            $subRole->msr_sort = $request->input('msr_sort', $subRole->msr_sort);
            $subRole->updated_by = $request->input('updated_by');
            $subRole->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'data' => $subRole,
                'message' => 'อัพเดท Sub Role สำเร็จ'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating sub role: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error updating sub role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified Sub Role (soft delete by setting inactive).
     */
    public function destroy(string $id)
    {
        try {
            DB::beginTransaction();

            $subRole = MasterSubRole::findOrFail($id);
            
            // Check if any users have this sub role assigned
            $usersCount = $subRole->users()->count();
            if ($usersCount > 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => "ไม่สามารถลบได้ มีผู้ใช้งาน {$usersCount} คนที่ถูก assign Sub Role นี้อยู่"
                ], 400);
            }

            // Hard delete since no users assigned
            $subRole->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'ลบ Sub Role สำเร็จ'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting sub role: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error deleting sub role: ' . $e->getMessage()
            ], 500);
        }
    }
}
