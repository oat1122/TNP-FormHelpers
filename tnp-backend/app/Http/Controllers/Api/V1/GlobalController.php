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
}
