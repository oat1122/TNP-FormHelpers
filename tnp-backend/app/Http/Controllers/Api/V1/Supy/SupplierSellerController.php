<?php

namespace App\Http\Controllers\Api\V1\Supy;

use App\Http\Controllers\Controller;
use App\Models\Supy\SupplierSeller;
use App\Models\Supy\SupplierSellerPhoneLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SupplierSellerController extends Controller
{
    /**
     * List all active sellers
     */
    public function index(Request $request)
    {
        try {
            $query = SupplierSeller::where('ss_is_deleted', false);

            if ($request->filled('search')) {
                $s = $request->search;
                $query->where(function ($q) use ($s) {
                    $q->where('ss_company_name', 'like', "%{$s}%")
                      ->orWhere('ss_tax_id', 'like', "%{$s}%")
                      ->orWhere('ss_phone', 'like', "%{$s}%")
                      ->orWhere('ss_contact_person', 'like', "%{$s}%");
                });
            }

            $sellers = $query->orderBy('ss_company_name')->get();

            return response()->json([
                'status' => 'success',
                'data' => $sellers,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierSeller index error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a new seller
     */
    public function store(Request $request)
    {
        $request->validate([
            'ss_company_name' => 'required|string|max:255',
            'ss_tax_id' => 'nullable|string|max:20',
            'ss_phone' => 'nullable|string|max:50',
            'ss_country' => 'nullable|string|max:100',
            'ss_address' => 'nullable|string',
            'ss_contact_person' => 'nullable|string|max:255',
            'ss_remark' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // Check duplicate company name
            $exists = SupplierSeller::where('ss_company_name', $request->ss_company_name)
                ->where('ss_is_deleted', false)
                ->exists();

            if ($exists) {
                return response()->json([
                    'status' => 'error',
                    'message' => "ชื่อบริษัท \"{$request->ss_company_name}\" มีอยู่แล้ว",
                ], 409);
            }

            $user = $request->user();
            $sellerId = Str::uuid()->toString();

            $seller = SupplierSeller::create([
                'ss_id' => $sellerId,
                'ss_company_name' => $request->ss_company_name,
                'ss_tax_id' => $request->ss_tax_id,
                'ss_phone' => $request->ss_phone,
                'ss_country' => $request->ss_country,
                'ss_address' => $request->ss_address,
                'ss_contact_person' => $request->ss_contact_person,
                'ss_remark' => $request->ss_remark,
                'ss_created_by' => $user?->user_uuid,
                'ss_updated_by' => $user?->user_uuid,
            ]);

            // Log initial phone
            if ($request->ss_phone) {
                SupplierSellerPhoneLog::create([
                    'sspl_id' => Str::uuid()->toString(),
                    'sspl_ss_id' => $sellerId,
                    'sspl_old_phone' => null,
                    'sspl_new_phone' => $request->ss_phone,
                    'sspl_changed_by' => $user?->user_uuid,
                    'created_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'สร้าง Seller สำเร็จ',
                'data' => $seller,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('SupplierSeller store error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update a seller
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'ss_company_name' => 'required|string|max:255',
            'ss_tax_id' => 'nullable|string|max:20',
            'ss_phone' => 'nullable|string|max:50',
            'ss_country' => 'nullable|string|max:100',
            'ss_address' => 'nullable|string',
            'ss_contact_person' => 'nullable|string|max:255',
            'ss_remark' => 'nullable|string',
        ]);

        try {
            $seller = SupplierSeller::where('ss_id', $id)
                ->where('ss_is_deleted', false)
                ->first();

            if (!$seller) {
                return response()->json(['status' => 'error', 'message' => 'ไม่พบ Seller'], 404);
            }

            // Check duplicate name (exclude self)
            $exists = SupplierSeller::where('ss_company_name', $request->ss_company_name)
                ->where('ss_id', '!=', $id)
                ->where('ss_is_deleted', false)
                ->exists();

            if ($exists) {
                return response()->json([
                    'status' => 'error',
                    'message' => "ชื่อบริษัท \"{$request->ss_company_name}\" มีอยู่แล้ว",
                ], 409);
            }

            DB::beginTransaction();

            $user = $request->user();
            $oldPhone = $seller->ss_phone;
            $newPhone = $request->ss_phone;

            // Log phone change
            if ($oldPhone !== $newPhone) {
                SupplierSellerPhoneLog::create([
                    'sspl_id' => Str::uuid()->toString(),
                    'sspl_ss_id' => $id,
                    'sspl_old_phone' => $oldPhone,
                    'sspl_new_phone' => $newPhone,
                    'sspl_changed_by' => $user?->user_uuid,
                    'created_at' => now(),
                ]);
            }

            $seller->update([
                'ss_company_name' => $request->ss_company_name,
                'ss_tax_id' => $request->ss_tax_id,
                'ss_phone' => $newPhone,
                'ss_country' => $request->ss_country,
                'ss_address' => $request->ss_address,
                'ss_contact_person' => $request->ss_contact_person,
                'ss_remark' => $request->ss_remark,
                'ss_updated_by' => $user?->user_uuid,
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'แก้ไข Seller สำเร็จ',
                'data' => $seller->fresh(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('SupplierSeller update error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Soft delete a seller
     */
    public function destroy($id)
    {
        try {
            $seller = SupplierSeller::where('ss_id', $id)
                ->where('ss_is_deleted', false)
                ->first();

            if (!$seller) {
                return response()->json(['status' => 'error', 'message' => 'ไม่พบ Seller'], 404);
            }

            // Check if seller is in use
            $inUse = \App\Models\Supy\SupplierProduct::where('sp_ss_id', $id)
                ->where('sp_is_deleted', false)
                ->exists();

            if ($inUse) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'ไม่สามารถลบได้ เนื่องจาก Seller นี้ถูกใช้งานอยู่ในสินค้า',
                ], 422);
            }

            $seller->update(['ss_is_deleted' => true]);

            return response()->json([
                'status' => 'success',
                'message' => 'ลบ Seller สำเร็จ',
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierSeller destroy error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get phone change logs for a seller (admin only)
     */
    public function phoneLogs(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
            }

            $logs = SupplierSellerPhoneLog::where('sspl_ss_id', $id)
                ->with('changedByUser')
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierSeller phoneLogs error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
