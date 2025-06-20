<?php

namespace App\Http\Controllers\Api\V1\Feedback;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Feedback\EncouragingMessageResource;
use App\Models\EncouragingMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EncouragingMessageController extends Controller
{
    /**
     * Get a random encouraging message.
     */
    public function getRandom(Request $request)
    {
        try {
            $category = $request->input('category', 'general');
            $message = EncouragingMessage::getRandomMessage($category);
            
            if (!$message) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No encouraging messages found'
                ], 404);
            }
            
            return response()->json([
                'status' => 'success',
                'data' => new EncouragingMessageResource($message)
            ]);
        } catch (\Exception $e) {
            Log::error('Get encouraging message error: ' . $e);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Get encouraging message error: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Display a listing of encouraging messages.
     * Admin only function
     */
    public function index()
    {
        try {
            // Check if user has admin role
            if (!in_array(Auth::user()->role, ['admin', 'manager'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You do not have permission to view all encouraging messages'
                ], 403);
            }
            
            $messages = EncouragingMessage::all();
            
            return response()->json([
                'status' => 'success',
                'data' => EncouragingMessageResource::collection($messages)
            ]);
        } catch (\Exception $e) {
            Log::error('List encouraging messages error: ' . $e);
            
            return response()->json([
                'status' => 'error',
                'message' => 'List encouraging messages error: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Store a newly created encouraging message.
     * Admin only function
     */
    public function store(Request $request)
    {
        try {
            // Check if user has admin role
            if (!in_array(Auth::user()->role, ['admin'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You do not have permission to create encouraging messages'
                ], 403);
            }
            
            $request->validate([
                'em_content' => 'required|string',
                'em_category' => 'required|string'
            ]);
            
            DB::beginTransaction();
            
            $message = new EncouragingMessage();
            $message->em_content = $request->em_content;
            $message->em_category = $request->em_category;
            $message->em_is_active = true;
            $message->em_created_date = now();
            $message->em_created_by = Auth::id();
            $message->save();
            
            DB::commit();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Encouraging message created successfully',
                'data' => new EncouragingMessageResource($message)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create encouraging message error: ' . $e);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Create encouraging message error: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update the specified encouraging message.
     * Admin only function
     */
    public function update(Request $request, string $id)
    {
        try {
            // Check if user has admin role
            if (!in_array(Auth::user()->role, ['admin'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You do not have permission to update encouraging messages'
                ], 403);
            }
            
            $request->validate([
                'em_content' => 'required|string',
                'em_category' => 'required|string',
                'em_is_active' => 'boolean'
            ]);
            
            $message = EncouragingMessage::findOrFail($id);
            $message->em_content = $request->em_content;
            $message->em_category = $request->em_category;
            
            if ($request->has('em_is_active')) {
                $message->em_is_active = $request->em_is_active;
            }
            
            $message->em_updated_date = now();
            $message->em_updated_by = Auth::id();
            $message->save();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Encouraging message updated successfully',
                'data' => new EncouragingMessageResource($message)
            ]);
        } catch (\Exception $e) {
            Log::error('Update encouraging message error: ' . $e);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Update encouraging message error: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Toggle the active status of an encouraging message.
     * Admin only function
     */
    public function toggleActive(string $id)
    {
        try {
            // Check if user has admin role
            if (!in_array(Auth::user()->role, ['admin'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You do not have permission to modify encouraging messages'
                ], 403);
            }
            
            $message = EncouragingMessage::findOrFail($id);
            $message->em_is_active = !$message->em_is_active;
            $message->em_updated_date = now();
            $message->em_updated_by = Auth::id();
            $message->save();
            
            $status = $message->em_is_active ? 'activated' : 'deactivated';
            
            return response()->json([
                'status' => 'success',
                'message' => "Encouraging message {$status} successfully",
                'data' => new EncouragingMessageResource($message)
            ]);
        } catch (\Exception $e) {
            Log::error('Toggle encouraging message status error: ' . $e);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Toggle encouraging message status error: ' . $e->getMessage()
            ], 500);
        }
    }
}
