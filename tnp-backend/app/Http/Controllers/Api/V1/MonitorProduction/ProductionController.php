<?php

namespace App\Http\Controllers\Api\V1\MonitorProduction;

use Illuminate\Http\Request;
use App\Models\MonitorProduction\Production;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Database\QueryException;

class ProductionController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function getProduction()
    {
        $production_join_ws_old = DB::table('productions')
            ->join('worksheets', 'productions.work_id', '=', 'worksheets.sheetID')
            ->join('users', 'worksheets.user_id', '=', 'users.user_id')
            ->join('production_blocks', 'productions.pd_id', '=', 'production_blocks.pd_id')
            ->leftJoin('tailoring_factory', 'productions.cutting_factory', '=', 'tailoring_factory.factory_id')
            ->select('productions.*', 'worksheets.work_id', 'worksheets.work_name', 'worksheets.picture', 'worksheets.due_date', 
                    'worksheets.quantity', 'users.username', 'production_blocks.*', 'worksheets.product_category', 'worksheets.sheetID as worksheet_id')
            ->get();

        $production_join_ws_new = DB::table('productions')
            ->join('new_worksheets', 'productions.new_worksheet_id', '=', 'new_worksheets.worksheet_id')
            ->join('users', 'new_worksheets.user_id', '=', 'users.user_id')
            ->join('production_blocks', 'productions.pd_id', '=', 'production_blocks.pd_id')
            ->leftJoin('tailoring_factory', 'productions.cutting_factory', '=', 'tailoring_factory.factory_id')
            ->select('productions.*', 'new_worksheets.work_id', 'new_worksheets.work_name', 'new_worksheets.images as picture', 
                    'new_worksheets.due_date', 'new_worksheets.total_quantity as quantity', 'users.username', 'production_blocks.*',
                    'new_worksheets.type_shirt as product_category', 'new_worksheets.worksheet_id')
            ->get();

        $merged_q = $production_join_ws_old->merge($production_join_ws_new);
        $merged_array = $merged_q->toArray();

        // กรณีเป็นข้อมูลจากระบบใบงานใหม่ ให้ใส่พาร์ทแสดงรูปจากระบบใบงานใหม่
        foreach($merged_array as $item) {
            if ($item->new_worksheet_id) {
                $item->picture = $item->picture ? url('storage/images/worksheet/' . $item->picture) : '';
            }
        }

        usort($merged_array, function ($a, $b) {
            return $b->pd_id - $a->pd_id; // เรียงจากมากไปน้อย
        });

        return response()->json($merged_array);
    }

    public function getFactory()
    {
        $production = DB::table('tailoring_factory')
            ->select('factory_id', 'factory_no', 'factory_name')
            ->get();

        return response()->json($production);
    }

    public function getPdCount()
    {
        // Get all productions with status = 1 (in process)
        $productions = DB::table('productions')
            ->where('status', '=', 1)
            ->get();

        $pdCount = count($productions);
        $totalShirts = 0;
        
        // Get all pd_ids
        $pdIds = $productions->pluck('pd_id')->toArray();
        
        // Get worksheet data for old worksheets
        $oldWorksheetData = DB::table('productions')
            ->join('worksheets', 'productions.work_id', '=', 'worksheets.sheetID')
            ->whereIn('productions.pd_id', $pdIds)
            ->where('productions.status', '=', 1)
            ->where('productions.new_worksheet_id', '=', null)
            ->select('worksheets.quantity')
            ->get();
            
        // Get worksheet data for new worksheets
        $newWorksheetData = DB::table('productions')
            ->join('new_worksheets', 'productions.new_worksheet_id', '=', 'new_worksheets.worksheet_id')
            ->whereIn('productions.pd_id', $pdIds)
            ->where('productions.status', '=', 1)
            ->where('productions.new_worksheet_id', '!=', null)
            ->select('new_worksheets.total_quantity as quantity')
            ->get();
            
        // Calculate total shirts
        $totalShirts = $oldWorksheetData->sum('quantity') + $newWorksheetData->sum('quantity');
        
        return response()->json([
            'pdCount' => $pdCount,
            'totalShirts' => $totalShirts
        ]);
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, Production $production)
    {
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Production  $production
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Production $production)
    {
        try {

            $production->fill($request->post())->update();

            return response()->json([
                "status" => 200,
                "success" => true,
                "message" => "Production update successfully"
            ]);
        } catch (\Exception $e) {

            return response()->json([
                "status" => 'failed',
                "success" => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function resetEndTimeStartWork(Request $request)
    {
        try {
            $pd_id = $request->input('pd_id');
            // Get current date
            $current_date = Carbon::now();
            // Adding 24 hrs to the current date
            $current_date->addHours(24);

            $production = Production::where('pd_id', $pd_id)->first();
            $production->update(['end_select_process_time' => $current_date]);

            // Return a success message
            return response()->json(['success' => true, 'message' => 'Time Resets']);
        } catch (QueryException $e) {
            // Handle the exception (e.g., log the error, return an error response, etc.)
            return response()->json(['error' => 'Update failed : ' . $e->getMessage()], 500);
        }
    }
}
