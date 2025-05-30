<?php

namespace App\Http\Controllers\Api\V1\CostCalc;

use App\Http\Controllers\Controller;
use App\Models\CostCalc\Pattern;
use Illuminate\Http\Request;

class PatternController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Pattern::select()->get();
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
            foreach ($requestData as $data) {
                $pattern = new Pattern();
                $pattern->fill($data);
                $pattern->save();
            }

            return response()->json([
                'message' => "Pattern created!"
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
    public function show(Pattern $pattern)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Pattern $pattern)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Pattern $pattern)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {

            $pattern = Pattern::findOrFail($id);
            $patternName = $pattern->pattern_name;
            $pattern->delete();

            return response()->json([
                'message' => "Pattern $patternName deleted!"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ]);
        }
    }
}
