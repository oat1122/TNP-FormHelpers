<?php

namespace App\Http\Controllers\Api\V1\Supy;

use App\Http\Controllers\Controller;
use App\Models\MasterProductCategory;
use App\Models\Supy\SupplierProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SupplierCategoryController extends Controller
{
    /**
     * List all active categories
     */
    public function index()
    {
        try {
            $categories = MasterProductCategory::where('mpc_is_deleted', false)
                ->select('mpc_id', 'mpc_name', 'mpc_sku_prefix', 'mpc_remark')
                ->orderBy('mpc_name')
                ->get();

            return response()->json(['data' => $categories]);
        } catch (\Exception $e) {
            Log::error('SupplierCategoryController@index: ' . $e->getMessage());
            return response()->json(['message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * Create a new category
     */
    public function store(Request $request)
    {
        $request->validate([
            'mpc_name' => 'required|string|max:100',
            'mpc_sku_prefix' => 'nullable|string|max:10',
            'mpc_remark' => 'nullable|string',
        ]);

        try {
            // Check duplicate name
            $exists = MasterProductCategory::where('mpc_name', $request->mpc_name)
                ->where('mpc_is_deleted', false)
                ->exists();

            if ($exists) {
                return response()->json(['message' => 'ชื่อหมวดหมู่นี้มีอยู่แล้ว'], 409);
            }

            // Auto-generate prefix if not provided
            $prefix = $request->mpc_sku_prefix;
            if (!$prefix) {
                $prefix = strtoupper(Str::substr(preg_replace('/[^A-Za-z]/', '', $request->mpc_name), 0, 3));
            }

            $category = MasterProductCategory::create([
                'mpc_id' => Str::uuid()->toString(),
                'mpc_name' => $request->mpc_name,
                'mpc_sku_prefix' => strtoupper($prefix),
                'mpc_remark' => $request->mpc_remark,
            ]);

            return response()->json(['data' => $category, 'message' => 'สร้างหมวดหมู่สำเร็จ'], 201);
        } catch (\Exception $e) {
            Log::error('SupplierCategoryController@store: ' . $e->getMessage());
            return response()->json(['message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * Update a category
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'mpc_name' => 'required|string|max:100',
            'mpc_sku_prefix' => 'nullable|string|max:10',
            'mpc_remark' => 'nullable|string',
        ]);

        try {
            $category = MasterProductCategory::findOrFail($id);

            // Check duplicate name (exclude self)
            $exists = MasterProductCategory::where('mpc_name', $request->mpc_name)
                ->where('mpc_is_deleted', false)
                ->where('mpc_id', '!=', $id)
                ->exists();

            if ($exists) {
                return response()->json(['message' => 'ชื่อหมวดหมู่นี้มีอยู่แล้ว'], 409);
            }

            $category->update([
                'mpc_name' => $request->mpc_name,
                'mpc_sku_prefix' => $request->mpc_sku_prefix ? strtoupper($request->mpc_sku_prefix) : $category->mpc_sku_prefix,
                'mpc_remark' => $request->mpc_remark,
            ]);

            return response()->json(['data' => $category, 'message' => 'แก้ไขหมวดหมู่สำเร็จ']);
        } catch (\Exception $e) {
            Log::error('SupplierCategoryController@update: ' . $e->getMessage());
            return response()->json(['message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * Soft delete a category
     */
    public function destroy($id)
    {
        try {
            $category = MasterProductCategory::findOrFail($id);

            // Check if category is in use
            $inUse = SupplierProduct::where('sp_mpc_id', $id)
                ->where('sp_is_deleted', false)
                ->exists();

            if ($inUse) {
                return response()->json([
                    'message' => 'ไม่สามารถลบได้ — หมวดหมู่นี้ถูกใช้งานอยู่',
                ], 422);
            }

            $category->update(['mpc_is_deleted' => true]);

            return response()->json(['message' => 'ลบหมวดหมู่สำเร็จ']);
        } catch (\Exception $e) {
            Log::error('SupplierCategoryController@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * Generate next SKU for a category
     * Format: PREFIX-0001, PREFIX-0002, ...
     */
    public function nextSku($id)
    {
        try {
            $category = MasterProductCategory::findOrFail($id);
            $prefix = $category->mpc_sku_prefix;

            if (!$prefix) {
                $prefix = strtoupper(Str::substr(preg_replace('/[^A-Za-z]/', '', $category->mpc_name), 0, 3));
            }

            // Count existing products in this category to determine next number
            $lastProduct = SupplierProduct::where('sp_mpc_id', $id)
                ->where('sp_sku', 'like', $prefix . '-%')
                ->orderByRaw("CAST(SUBSTRING(sp_sku, ?) AS UNSIGNED) DESC", [strlen($prefix) + 2])
                ->first();

            $nextNumber = 1;
            if ($lastProduct && $lastProduct->sp_sku) {
                $parts = explode('-', $lastProduct->sp_sku);
                if (count($parts) >= 2) {
                    $nextNumber = intval(end($parts)) + 1;
                }
            }

            $sku = $prefix . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

            return response()->json([
                'data' => [
                    'sku' => $sku,
                    'prefix' => $prefix,
                    'next_number' => $nextNumber,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierCategoryController@nextSku: ' . $e->getMessage());
            return response()->json(['message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }
}
