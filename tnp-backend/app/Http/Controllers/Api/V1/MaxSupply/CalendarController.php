<?php

namespace App\Http\Controllers\Api\V1\MaxSupply;

use App\Http\Controllers\Controller;
use App\Models\MaxSupply;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function index()
    {
        $events = MaxSupply::all()->map(function ($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'start' => $item->due_date,
                'end' => $item->due_date,
            ];
        });

        return response()->json($events);
    }
}
