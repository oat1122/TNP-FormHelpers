<?php

namespace App\Http\Controllers\Api\V1\CostCalc;

use App\Models\CostCalc\CostFabric;
use App\Models\Log;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

date_default_timezone_set("Asia/Bangkok");

class CostFabricController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return CostFabric::select('cost_fabrics.*', 'shirt_patterns.pattern_name', 'shirt_patterns.shirt_category')
            ->join('shirt_patterns', 'cost_fabrics.pattern_id', '=', 'shirt_patterns.pattern_id')
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
        $requestData = $request->all();

        try {
            foreach ($requestData as $fabricData) {
                $costFabric = new CostFabric();
                $costFabric->fill($fabricData);
                $costFabric->save();
            }

            return response()->json([
                'message' => 'Fabric data stored successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $cost = CostFabric::select()
            ->where('pattern_id', '=', $id)
            ->orderBy('fabric_class', 'asc')
            ->get();
        $cost->makeHidden(['created_at', 'updated_at']);

        return response()->json($cost);
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
    public function update(Request $request)
    {

        try {

            // Store the original fabric data in the log table
            $fabricData = $request->json()->all();

            $logData = [
                'level' => 'info',
                'message' => 'Original fabric data',
                'context' => json_encode($fabricData),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            // return response()->json([
            //     'message' => $fabricData
            // ]);

            $log = new Log();
            $log->fill($logData);
            $log->save();

            foreach ($fabricData as $data) {

                if (isset($data['cost_fabric_id'])) {
                    // Update existing fabric record
                    CostFabric::where('cost_fabric_id', $data['cost_fabric_id'])->update($data);
                } else {
                    // Create new fabric record
                    CostFabric::create($data);
                }
            }

            return response()->json([
                'message' => 'Cost updated successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update just once.
     */
    public function updateOnce(Request $request)
    {

        try {

            // Store the original fabric data in the log table
            $fabricData = $request->json()->all();

            $logData = [
                'level' => 'info',
                'message' => 'Original fabric data',
                'context' => json_encode($fabricData),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            // return response()->json([
            //     'message' => $logData
            // ]);

            $log = new Log();
            $log->fill($logData);
            $log->save();

            if (isset($fabricData['cost_fabric_id'])) {
                    // Update existing fabric record
                CostFabric::where('cost_fabric_id', $fabricData['cost_fabric_id'])->update($fabricData);
            } else {
                // Create new fabric record
                CostFabric::create($fabricData);
            }

            return response()->json([
                'message' => 'Cost updated successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {

            $cost = CostFabric::findOrFail($id);
            $cost->delete();

            return response()->json([
                'message' => 'Cost deleted!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ]);
        }
    }

    public function getEnumFabricClass()
    {
        $result = DB::selectOne("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ? AND COLUMN_NAME = ?", ['cost_fabrics', 'fabric_class']);

        $enumList = explode(',', substr($result->COLUMN_TYPE, 5, -1));
        $enumList = array_map(fn ($item) => trim($item, "'"), $enumList);

        return response()->json($enumList);
    }
}
