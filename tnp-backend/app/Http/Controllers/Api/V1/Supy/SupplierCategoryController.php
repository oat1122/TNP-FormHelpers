<?php

namespace App\Http\Controllers\Api\V1\Supy;

use App\Http\Controllers\Controller;
use App\Models\Supy\SupplierProductCategory;
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
            $categories = SupplierProductCategory::where('spc_is_deleted', false)
                ->select('spc_id', 'spc_name', 'spc_sku_prefix', 'spc_remark')
                ->orderBy('spc_name')
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
            'spc_name' => 'required|string|max:100',
            'spc_sku_prefix' => 'nullable|string|max:10',
            'spc_remark' => 'nullable|string',
        ]);

        try {
            // Check duplicate name
            $exists = SupplierProductCategory::where('spc_name', $request->spc_name)
                ->where('spc_is_deleted', false)
                ->exists();

            if ($exists) {
                return response()->json(['message' => 'ชื่อหมวดหมู่นี้มีอยู่แล้ว'], 409);
            }

            // Auto-generate prefix if not provided
            $prefix = $request->spc_sku_prefix;
            if (!$prefix) {
                $prefix = strtoupper(Str::substr(preg_replace('/[^A-Za-z]/', '', $request->spc_name), 0, 3));
            }

            $category = SupplierProductCategory::create([
                'spc_id' => Str::uuid()->toString(),
                'spc_name' => $request->spc_name,
                'spc_sku_prefix' => strtoupper($prefix),
                'spc_remark' => $request->spc_remark,
                'spc_is_deleted' => false,
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
            'spc_name' => 'required|string|max:100',
            'spc_sku_prefix' => 'nullable|string|max:10',
            'spc_remark' => 'nullable|string',
        ]);

        try {
            $category = SupplierProductCategory::findOrFail($id);

            // Check duplicate name (exclude self)
            $exists = SupplierProductCategory::where('spc_name', $request->spc_name)
                ->where('spc_is_deleted', false)
                ->where('spc_id', '!=', $id)
                ->exists();

            if ($exists) {
                return response()->json(['message' => 'ชื่อหมวดหมู่นี้มีอยู่แล้ว'], 409);
            }

            $category->update([
                'spc_name' => $request->spc_name,
                'spc_sku_prefix' => $request->spc_sku_prefix ? strtoupper($request->spc_sku_prefix) : $category->spc_sku_prefix,
                'spc_remark' => $request->spc_remark,
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
            $category = SupplierProductCategory::findOrFail($id);

            // Check if category is in use
            $inUse = SupplierProduct::where('sp_spc_id', $id)
                ->where('sp_is_deleted', false)
                ->exists();

            if ($inUse) {
                return response()->json([
                    'message' => 'ไม่สามารถลบได้ — หมวดหมู่นี้ถูกใช้งานอยู่',
                ], 422);
            }

            $category->update(['spc_is_deleted' => true]);

            return response()->json(['message' => 'ลบหมวดหมู่สำเร็จ']);
        } catch (\Exception $e) {
            Log::error('SupplierCategoryController@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * Generate next SKU for a category
     * Format: PREFIX-YYYYMM-NN
     */
    public function nextSku($id)
    {
        try {
            $category = SupplierProductCategory::findOrFail($id);
            $prefix = $category->spc_sku_prefix;

            if (!$prefix) {
                $prefix = strtoupper(Str::substr(preg_replace('/[^A-Za-z]/', '', $category->spc_name), 0, 3));
            }

            $ym = now()->format('Ym');
            $skuPrefix = "{$prefix}-{$ym}-";

            // Count existing products in this category to determine next number
            $lastProduct = SupplierProduct::where('sp_sku', 'like', $skuPrefix . '%')
                ->orderByRaw('LENGTH(sp_sku) DESC')
                ->orderBy('sp_sku', 'desc')
                ->first();

            $nextNumber = 1;
            if ($lastProduct && preg_match('/-(\d+)$/', $lastProduct->sp_sku, $matches)) {
                $nextNumber = intval($matches[1]) + 1;
            }

            $sku = $skuPrefix . str_pad($nextNumber, 2, '0', STR_PAD_LEFT);

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
