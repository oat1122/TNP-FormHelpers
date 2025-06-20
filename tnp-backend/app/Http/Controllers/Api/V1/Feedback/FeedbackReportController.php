<?php

namespace App\Http\Controllers\Api\V1\Feedback;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Feedback\FeedbackReportResource;
use App\Http\Resources\V1\Feedback\FeedbackReportCollection;
use App\Models\FeedbackReport;
use App\Models\EncouragingMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FeedbackReportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            // Prepare the query
            $query = FeedbackReport::active();

            // Filter by category if provided
            if ($request->has('category')) {
                $query->byCategory($request->category);
            }

            // Filter by priority if provided
            if ($request->has('priority')) {
                $query->byPriority($request->priority);
            }

            // Filter by resolution status if provided
            if ($request->has('resolved')) {
                $resolved = filter_var($request->resolved, FILTER_VALIDATE_BOOLEAN);
                $query->where('fr_resolved', $resolved);
            }

            // Handle search
            if ($request->has('search')) {
                $search = '%' . $request->search . '%';
                $query->where('fr_content', 'like', $search);
            }

            // Apply sorting (default: most recent first)
            $sortField = $request->input('sort_field', 'fr_created_date');
            $sortDirection = $request->input('sort_direction', 'desc');
            $query->orderBy($sortField, $sortDirection);

            // Paginate results
            $perPage = $request->input('per_page', 10);
            $reports = $query->paginate($perPage);

            return new FeedbackReportCollection($reports);
        } catch (\Exception $e) {
            Log::error('Fetch feedback reports error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Fetch feedback reports error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'fr_content' => 'required|string',
            'fr_category' => 'required|string',
            'fr_priority' => 'required|integer|min:1|max:3',
            'fr_is_anonymous' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            $data = $request->all();
            $report = new FeedbackReport();

            // Handle image upload if provided
            if (isset($data['fr_image']) && Str::startsWith($data['fr_image'], 'data:image')) {
                // Extract image data from base64 string
                preg_match("/^data:image\/(.*?);base64,(.*)$/", $data['fr_image'], $matches);
                $imageType = $matches[1]; // png, jpeg, etc.
                $imageData = base64_decode($matches[2]);

                // Generate filename and validate image type
                $timestamp = microtime(true) . date('YmdHis');
                $filename = $timestamp . '.' . $imageType;

                if (!in_array($imageType, ['png', 'jpeg', 'jpg', 'gif'])) {
                    return response()->json([
                        'status' => 'error',
                        'message' => "Invalid image type. Supported formats: png, jpeg, jpg, gif."
                    ], 422);
                }

                // Save the image
                Storage::put('public/images/feedback/' . $filename, $imageData);
                $data['fr_image'] = $filename;
            }

            // Fill the model with data
            $report->fill($data);

            // Set creation metadata
            $report->fr_created_date = now();
            $report->fr_created_by = $data['fr_is_anonymous'] ? null : Auth::id();

            // Save the report
            $report->save();

            DB::commit();

            // Get a random encouraging message based on the feedback category
            $message = EncouragingMessage::getRandomMessage($data['fr_category']);

            return response()->json([
                'status' => 'success',
                'message' => 'Feedback submitted successfully',
                'data' => new FeedbackReportResource($report),
                'encouragement' => $message ? $message->em_content : null
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create feedback report error: ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Create feedback report error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $report = FeedbackReport::active()->findOrFail($id);
            return new FeedbackReportResource($report);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Feedback report not found'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     * Admin only: Add a response to a feedback report
     */
    public function adminResponse(Request $request, string $id)
    {
        try {
            // Validate that the user has admin role
            if (!in_array(Auth::user()->role, ['admin', 'manager'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You do not have permission to respond to feedback reports'
                ], 403);
            }

            $request->validate([
                'fr_admin_response' => 'required|string',
            ]);

            $report = FeedbackReport::active()->findOrFail($id);

            // Update with admin response
            $report->fr_admin_response = $request->fr_admin_response;
            $report->fr_response_date = now();
            $report->fr_response_by = Auth::id();
            $report->fr_updated_date = now();
            $report->fr_updated_by = Auth::id();
            $report->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Admin response added successfully',
                'data' => new FeedbackReportResource($report)
            ]);
        } catch (\Exception $e) {
            Log::error('Admin response error: ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Admin response error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the resolved status of a feedback report
     * Admin only: Mark feedback as resolved or unresolved
     */
    public function updateResolvedStatus(Request $request, string $id)
    {
        try {
            // Validate that the user has admin role
            if (!in_array(Auth::user()->role, ['admin', 'manager'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You do not have permission to update resolved status'
                ], 403);
            }

            $request->validate([
                'fr_resolved' => 'required|boolean',
            ]);

            $report = FeedbackReport::active()->findOrFail($id);

            // Update resolved status
            $report->fr_resolved = $request->fr_resolved;
            $report->fr_updated_date = now();
            $report->fr_updated_by = Auth::id();
            $report->save();

            $status = $request->fr_resolved ? 'resolved' : 'unresolved';

            return response()->json([
                'status' => 'success',
                'message' => 'Feedback marked as ' . $status,
                'data' => new FeedbackReportResource($report)
            ]);
        } catch (\Exception $e) {
            Log::error('Update resolved status error: ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Update resolved status error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft delete the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            // Validate that user has admin permissions
            if (!in_array(Auth::user()->role, ['admin'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You do not have permission to delete feedback reports'
                ], 403);
            }

            $report = FeedbackReport::findOrFail($id);

            // Soft delete
            $report->fr_is_deleted = true;
            $report->fr_updated_date = now();
            $report->fr_updated_by = Auth::id();
            $report->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Feedback report deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Delete feedback report error: ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Delete feedback report error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get feedback report statistics
     * For admin dashboard
     */
    public function getStatistics()
    {
        try {
            $statistics = [
                'total' => FeedbackReport::active()->count(),
                'resolved' => FeedbackReport::active()->resolved()->count(),
                'unresolved' => FeedbackReport::active()->unresolved()->count(),
                'anonymous' => FeedbackReport::active()->anonymous()->count(),
                'by_priority' => [
                    'low' => FeedbackReport::active()->byPriority(1)->count(),
                    'medium' => FeedbackReport::active()->byPriority(2)->count(),
                    'high' => FeedbackReport::active()->byPriority(3)->count()
                ]
            ];

            return response()->json([
                'status' => 'success',
                'data' => $statistics
            ]);
        } catch (\Exception $e) {
            Log::error('Fetch feedback statistics error: ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Fetch feedback statistics error: ' . $e->getMessage()
            ], 500);
        }
    }
}
