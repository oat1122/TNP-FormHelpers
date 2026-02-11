<?php

namespace App\Http\Controllers\Api\V1\Supy;

use App\Http\Controllers\Controller;
use App\Models\Supy\SupplierProductTag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SupplierTagController extends Controller
{
    /**
     * List all tags
     */
    public function index(Request $request)
    {
        try {
            $query = SupplierProductTag::where('spt_is_deleted', false);

            if ($request->filled('search')) {
                $query->where('spt_name', 'like', "%{$request->search}%");
            }

            $tags = $query->orderBy('spt_name')->get();

            return response()->json([
                'status' => 'success',
                'data' => $tags,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierTag index error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a new tag
     */
    public function store(Request $request)
    {
        $request->validate([
            'spt_name' => 'required|string|max:100',
        ]);

        try {
            // Check if tag already exists (including soft-deleted)
            $existing = SupplierProductTag::where('spt_name', $request->spt_name)->first();

            if ($existing) {
                if ($existing->spt_is_deleted) {
                    // Restore soft-deleted tag
                    $existing->update(['spt_is_deleted' => false]);
                    return response()->json(['status' => 'success', 'data' => $existing]);
                }
                return response()->json(['status' => 'error', 'message' => 'Tag already exists'], 409);
            }

            $tag = SupplierProductTag::create([
                'spt_id' => Str::uuid()->toString(),
                'spt_name' => $request->spt_name,
            ]);

            return response()->json(['status' => 'success', 'data' => $tag], 201);
        } catch (\Exception $e) {
            Log::error('SupplierTag store error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Soft delete a tag
     */
    public function destroy($id)
    {
        try {
            $tag = SupplierProductTag::where('spt_is_deleted', false)->findOrFail($id);
            $tag->update(['spt_is_deleted' => true]);

            return response()->json(['status' => 'success', 'message' => 'Tag deleted']);
        } catch (\Exception $e) {
            Log::error('SupplierTag destroy error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
