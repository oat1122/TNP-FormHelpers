<?php

namespace App\Http\Controllers\Api\V1\MonitorProduction;

use App\Models\MonitorProduction\Note;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class NoteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Note::select('production_notes.*', 'users.username')
            ->join('users', 'production_notes.user_id', '=', 'users.user_id')
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
        $request->validate([
            'note_descr' => 'required',
        ]);

        try {
            Note::create($request->post());

            return response()->json([
                'message' => 'Note created!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($pd_id)
    {
        $note = Note::select('production_notes.*', 'users.username')
            ->join('users', 'production_notes.user_id', '=', 'users.user_id')
            ->where('pd_id', '=', $pd_id)
            ->orderBy('note_datetime', 'desc')
            ->get();
        return response()->json($note);
    }


    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Note $note)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Note $note)
    {
        $request->validate([
            'note_descr' => 'required',
        ]);

        try {

            $note->fill($request->post())->update();

            return response()->json([
                'message' => 'Product updated successfully!'
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
    public function destroy(Note $note)
    {
        try {

            $note->delete();

            return response()->json([
                'message' => 'Note deleted!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ]);
        }
    }
}
