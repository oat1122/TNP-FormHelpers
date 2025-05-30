<?php

namespace App\Http\Controllers\Api\V1\MonitorProduction;

use Illuminate\Http\Request;
use App\Models\MonitorProduction\ProductionCost;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ProductionCostController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return ProductionCost::select()
            ->get();
    }

    public function updateCost(Request $request)
    {
        try {
            $inputList = $request->inputList;
            $inputDel = $request->inputDel;
            $data = [];

            // Delete records with specified cost_id
            ProductionCost::whereIn('cost_id', $inputDel)->delete();

            // Update or create records with input data
            foreach ($inputList as $input) {
                $record = ProductionCost::updateOrCreate(['cost_id' => $input['cost_id']], $input);
                $data[] = $record;
            }

            return response()->json([
                'message' => 'Production cost updated!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ]);
        }
    }



    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function getCost($pd_id)
    {
        $cost = DB::table('production_costs')
            ->where('pd_id', '=', $pd_id)
            ->select()
            ->get();

        return response()->json($cost);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\ProductionCost  $production
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, ProductionCost $cost)
    {
        try {

            $cost->fill($request->post())->update();

            return response()->json([
                'message' => 'Cost saved!!!'
            ]);
        } catch (\Exception $e) {

            return response()->json([
                'error' => $e->getMessage()
            ]);
        }
    }
}
