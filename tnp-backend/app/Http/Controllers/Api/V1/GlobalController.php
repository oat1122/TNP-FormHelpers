<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MasterBusinessType;
use App\Models\MasterDistrict;
use App\Models\MasterProductCategory;
use App\Models\MasterProvice;
use App\Models\MasterStatus;
use App\Models\MasterSubdistrict;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GlobalController extends Controller
{
    public function get_all_business_types()
    {
        return MasterBusinessType::active()
            ->orderBy('bt_sort', 'asc')
            ->select('bt_id', 'bt_name')
            ->get();
    }

    public function get_all_product_categories()
    {
        return MasterProductCategory::where('mpc_is_deleted', false)
            ->select('mpc_id', 'mpc_name', 'mpc_remark')
            ->get();
    }

    public function get_status_by_type($status_type)
    {
        return MasterStatus::where('status_is_deleted', false)
            ->where('status_type', $status_type)
            ->select('status_id', 'status_name', 'status_remark', 'status_type')
            ->get();
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    /**
     * เพิ่มประเภทธุรกิจใหม่
     */
    public function store_business_type(Request $request)
    {
        $request->validate([
            'bt_name' => 'required|string|max:255',
        ]);

        try {
            // หาค่า sort สูงสุด และบวก 1 เพื่อใส่เป็นค่าลำดับล่าสุด
            $maxSort = MasterBusinessType::max('bt_sort') ?? 0;
            
            $businessType = new MasterBusinessType();
            $businessType->bt_name = $request->bt_name;
            $businessType->bt_sort = $maxSort + 1;
            $businessType->bt_is_use = true;
            $businessType->save();

            return response()->json([
                'status' => 'success',
                'message' => 'ประเภทธุรกิจถูกเพิ่มเรียบร้อยแล้ว',
                'data' => $businessType
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * อัพเดทประเภทธุรกิจ
     */
    public function update_business_type(Request $request, $id)
    {
        $request->validate([
            'bt_name' => 'required|string|max:255',
        ]);

        try {
            $businessType = MasterBusinessType::findOrFail($id);
            $businessType->bt_name = $request->bt_name;
            $businessType->save();

            return response()->json([
                'status' => 'success',
                'message' => 'อัพเดทประเภทธุรกิจเรียบร้อยแล้ว',
                'data' => $businessType
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ลบประเภทธุรกิจ (soft delete)
     */
    public function delete_business_type($id)
    {
        try {
            // ล้าง cache และข้อมูลเก่า
            DB::statement('ANALYZE TABLE master_customers;'); // เพื่อให้ MySQL อัพเดทสถิติข้อมูลในตาราง
            
            $businessType = MasterBusinessType::findOrFail($id);
            
            // ตรวจสอบการใช้งานจากลูกค้าที่ยังใช้งานอยู่ (cus_is_use = true) ด้วยการ query โดยตรง
            $customers = DB::table('master_customers')
                ->where('cus_bt_id', $id)
                ->where('cus_is_use', true)
                ->select(['cus_id', 'cus_name', 'cus_company'])
                ->get();
                
            $usageCount = $customers->count();
            
            if ($usageCount > 0) {
                // เตรียมข้อมูลลูกค้าที่ใช้ประเภทธุรกิจนี้ (แค่ 5 รายแรก)
                $customersList = $customers->take(5)->map(function($customer) {
                    return $customer->cus_name ?: $customer->cus_company;
                })->implode(', ');
                
                if ($usageCount > 5) {
                    $customersList .= ' และอีก ' . ($usageCount - 5) . ' ราย';
                }
                
                return response()->json([
                    'status' => 'error',
                    'message' => 'ไม่สามารถลบได้ เนื่องจากมีลูกค้าใช้งานประเภทธุรกิจนี้อยู่ ' . $usageCount . ' ราย (เช่น ' . $customersList . ')',
                    'customerCount' => $usageCount,
                ], 400);
            }
            
            // ล้างการอ้างอิงประเภทธุรกิจในลูกค้าที่ถูกลบไปแล้ว (inactive)
            DB::table('master_customers')
                ->where('cus_bt_id', $id)
                ->where('cus_is_use', false)
                ->update(['cus_bt_id' => null]);
            
            // ตรวจสอบอีกครั้งว่าไม่มีลูกค้าที่กำลังใช้งานประเภทธุรกิจนี้
            $checkAgain = DB::table('master_customers')
                ->where('cus_bt_id', $id)
                ->where('cus_is_use', true)
                ->count();
                
            if ($checkAgain > 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'ยังมีลูกค้าที่ใช้งานประเภทธุรกิจนี้อยู่ กรุณาลองใหม่อีกครั้ง',
                ], 400);
            }
            
            // Soft delete
            $businessType->bt_is_use = false;
            $businessType->save();

            return response()->json([
                'status' => 'success',
                'message' => 'ลบประเภทธุรกิจเรียบร้อยแล้ว'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }
}
