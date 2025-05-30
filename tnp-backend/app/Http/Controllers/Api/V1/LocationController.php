<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MasterDistrict;
use App\Models\MasterProvice;
use App\Models\MasterSubdistrict;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $provinces_q = MasterProvice::orderBy('pro_sort_id', 'asc')->get();

        $districts_q = [];
        $sub_districts_q = [];

        if ($request->has('province_sort_id')) {
            $districts_q = MasterDistrict::where('dis_pro_sort_id', $request->province_sort_id)->orderBy('dis_sort_id', 'asc')->get();
        }

        if ($request->has('district_sort_id')) {
            $sub_districts_q = MasterSubdistrict::where('sub_dis_sort_id', $request->district_sort_id)->orderBy('sub_sort_id', 'asc')->get();
        }

        return response()->json([
            'master_provinces' => $provinces_q,
            'master_district' => $districts_q,
            'master_subdistrict' => $sub_districts_q,
        ]);
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
