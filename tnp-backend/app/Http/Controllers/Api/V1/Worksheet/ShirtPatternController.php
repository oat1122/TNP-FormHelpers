<?php

namespace App\Http\Controllers\Api\V1\Worksheet;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Worksheet\WorksheetShirtPattern;
use App\Http\Resources\V1\Worksheet\ShirtPatternCollection;
use App\Http\Resources\V1\Worksheet\ShirtPatternResource;
use App\Models\Worksheet\WorksheetShirtSize;
use DateTime;
use Illuminate\Support\Facades\DB;
use App\Services\WorksheetService;

class ShirtPatternController extends Controller
{
    protected $worksheetService;

    public function __construct()
    {
        $this->worksheetService = new WorksheetService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $shirt_pattern_q = WorksheetShirtPattern::select('*')
            ->join('new_worksheet_shirt_sizes', 'new_worksheet_shirt_patterns.pattern_id', '=', 'new_worksheet_shirt_sizes.pattern_id')
            ->orderBy('new_worksheet_shirt_patterns.created_at')
            ->get();
        return new ShirtPatternCollection($shirt_pattern_q);
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
        try {
            DB::beginTransaction();

            $pattern = WorksheetShirtPattern::create($request->all());
            $pattern_id = $pattern->pattern_id;
            $pattern_input = [];

            if ($request->pattern_type == 1) {
                $this->preparePatternSizes($request->pattern_sizes, $pattern_input, $pattern_id, 1);
            } else {
                $this->preparePatternSizes($request->pattern_sizes['men'], $pattern_input, $pattern_id, 2);
                $this->preparePatternSizes($request->pattern_sizes['women'], $pattern_input, $pattern_id, 3);
            }

            WorksheetShirtSize::insert($pattern_input);

            DB::commit();

            return response()->json([
                'status' => 'ok',
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Create shirt pattern error : ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        if ($id === 'all') {
            return WorksheetShirtPattern::all();
        } else {
            $pattern = WorksheetShirtPattern::select('*')
                ->join('new_worksheet_shirt_sizes', 'new_worksheet_shirt_patterns.pattern_id', '=', 'new_worksheet_shirt_sizes.pattern_id')
                ->where('new_worksheet_shirt_patterns.pattern_id', $id)
                ->get();
            return new ShirtPatternResource($pattern->flatten(1));
        }
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
        $pattern_id = $request->pattern_id;

        $delete_list = [];
        $shirt_size_q = WorksheetShirtSize::where('pattern_id', $pattern_id)->get();
        $input_pattern_sizes = array_column($request->pattern_sizes, 'size_name');
        
        // adding existing data from DB to delete list when input not matching existing data.
        foreach ($shirt_size_q as $row) {
            if (isset($row['size_name']) && !in_array($row['size_name'], $input_pattern_sizes)) {
                $delete_list[] = $row;
            }
        }

        try {
            DB::beginTransaction();

            $pattern = WorksheetShirtPattern::find($pattern_id);
            $pattern->update($request->all());

            // update and create new data.
            foreach ($request->pattern_sizes as $item) {
                WorksheetShirtSize::updateOrCreate(
                    ['pattern_id' => $item['pattern_id'], 'size_name' => $item['size_name']],
                    $item
                );
            }

            // delete
            if (count($delete_list) > 0) {
                foreach ($delete_list as $item_del) {
                    $pattern_del = WorksheetShirtSize::find($item_del['shirt_size_id']);
                    $pattern_del->delete();
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'ok',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Update shirt pattern error : ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    private function preparePatternSizes($pattern_sizes, &$pattern_input, $pattern_id, $shirt_pattern_type)
    {
        $current_date_time = new DateTime();

        if (empty($pattern_sizes)) {
            throw new \Exception('Pattern sizes cannot be empty.');
        }

        foreach ($pattern_sizes as $pattern_item) {
            $pattern_input[] = [
                'pattern_id' => $pattern_id,
                'shirt_pattern_type' => $shirt_pattern_type,
                'size_name' => $pattern_item['size_name'],
                'chest' => (float) $pattern_item['chest'],
                'long' => (float) $pattern_item['long'],
                'created_at' => $current_date_time,
                'updated_at' => $current_date_time,
            ];
        }
    }
}
