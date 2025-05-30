<?php

namespace App\Http\Controllers\Api\V1\MonitorProduction;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\MonitorProduction\Block;
use Illuminate\Support\Facades\DB;

class BlockController extends Controller
{
    public function updateBlock(Request $request, Block $block, $id)
    {
        try {
            $block = Block::where('pd_id', $id)->firstOrFail();
            $block->fill($request->post());
            $block->save();

            return response()->json([
                "status" => 200, 
                "success" => true,
                "message" => "Block update successfully"
            ]);
        }  catch (\Exception $e) {
            
            return response()->json([
                "status" => 'failed', 
                "success" => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function getEnumEmbroid()
    {
        $result = DB::selectOne("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ? AND COLUMN_NAME = ?", ['production_blocks', 'embroid_block']);

        $enumList = explode(',', substr($result->COLUMN_TYPE, 5, -1));
        $enumList = array_map(fn ($item) => trim($item, "'"), $enumList);

        return response()->json($enumList);
    }

    public function getEnumScreen()
    {
        $result = DB::selectOne("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ? AND COLUMN_NAME = ?", ['production_blocks', 'screen_block']);

        $enumList = explode(',', substr($result->COLUMN_TYPE, 5, -1));
        $enumList = array_map(fn ($item) => trim($item, "'"), $enumList);

        return response()->json($enumList);
    }

    public function getEnumDft()
    {
        $result = DB::selectOne("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ? AND COLUMN_NAME = ?", ['production_blocks', 'dft_block']);

        $enumList = explode(',', substr($result->COLUMN_TYPE, 5, -1));
        $enumList = array_map(fn ($item) => trim($item, "'"), $enumList);

        return response()->json($enumList);
    }
}
