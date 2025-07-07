<?php

namespace App\Http\Controllers\Api\V1\MaxSupply;

use App\Http\Controllers\Controller;
use App\Models\MaxSupply;
use App\Models\MaxSupplyFile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Upload files for max supply
     */
    public function store(Request $request, MaxSupply $maxSupply): JsonResponse
    {
        $request->validate([
            'files' => 'required|array|max:10',
            'files.*' => 'required|file|max:10240', // 10MB max per file
            'descriptions' => 'nullable|array',
            'descriptions.*' => 'nullable|string|max:255',
        ]);

        try {
            $uploadedFiles = [];

            foreach ($request->file('files') as $index => $file) {
                $originalName = $file->getClientOriginalName();
                $extension = $file->getClientOriginalExtension();
                $storedName = Str::uuid() . '.' . $extension;
                $filePath = 'max-supply/' . $maxSupply->id . '/' . $storedName;
                
                // Store the file
                $file->storeAs('max-supply/' . $maxSupply->id, $storedName, 'public');
                
                // Determine file type
                $mimeType = $file->getMimeType();
                $fileType = $this->determineFileType($mimeType);
                
                // Create database record
                $maxSupplyFile = MaxSupplyFile::create([
                    'max_supply_id' => $maxSupply->id,
                    'original_name' => $originalName,
                    'stored_name' => $storedName,
                    'file_path' => $filePath,
                    'file_type' => $fileType,
                    'mime_type' => $mimeType,
                    'file_size' => $file->getSize(),
                    'description' => $request->input("descriptions.{$index}"),
                    'uploaded_by' => auth()->id(),
                ]);

                $uploadedFiles[] = [
                    'id' => $maxSupplyFile->id,
                    'original_name' => $maxSupplyFile->original_name,
                    'stored_name' => $maxSupplyFile->stored_name,
                    'file_type' => $maxSupplyFile->file_type,
                    'mime_type' => $maxSupplyFile->mime_type,
                    'file_size' => $maxSupplyFile->file_size,
                    'formatted_size' => $maxSupplyFile->formatted_size,
                    'description' => $maxSupplyFile->description,
                    'url' => $maxSupplyFile->url,
                    'is_image' => $maxSupplyFile->is_image,
                    'uploaded_at' => $maxSupplyFile->created_at->format('Y-m-d H:i:s'),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $uploadedFiles,
                'message' => 'Files uploaded successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload files',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a specific file
     */
    public function destroy(MaxSupply $maxSupply, MaxSupplyFile $file): JsonResponse
    {
        try {
            // Check if file belongs to the max supply
            if ($file->max_supply_id !== $maxSupply->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'File does not belong to this max supply'
                ], 403);
            }

            // Delete the file
            $file->delete();

            return response()->json([
                'success' => true,
                'message' => 'File deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get files for a max supply
     */
    public function index(MaxSupply $maxSupply): JsonResponse
    {
        try {
            $files = $maxSupply->files()
                ->with('uploader')
                ->orderBy('created_at', 'desc')
                ->get();

            $formattedFiles = $files->map(function ($file) {
                return [
                    'id' => $file->id,
                    'original_name' => $file->original_name,
                    'stored_name' => $file->stored_name,
                    'file_type' => $file->file_type,
                    'mime_type' => $file->mime_type,
                    'file_size' => $file->file_size,
                    'formatted_size' => $file->formatted_size,
                    'description' => $file->description,
                    'url' => $file->url,
                    'is_image' => $file->is_image,
                    'is_document' => $file->is_document,
                    'uploaded_at' => $file->created_at->format('Y-m-d H:i:s'),
                    'uploader' => [
                        'id' => $file->uploader?->id,
                        'name' => $file->uploader?->name,
                    ],
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedFiles,
                'message' => 'Files retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve files',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download a specific file
     */
    public function download(MaxSupply $maxSupply, MaxSupplyFile $file)
    {
        try {
            // Check if file belongs to the max supply
            if ($file->max_supply_id !== $maxSupply->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'File does not belong to this max supply'
                ], 403);
            }

            // Check if file exists
            if (!Storage::disk('public')->exists($file->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            $filePath = storage_path('app/public/' . $file->file_path);
            return response()->download($filePath, $file->original_name);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Determine file type based on MIME type
     */
    private function determineFileType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }
        
        if (str_starts_with($mimeType, 'video/')) {
            return 'video';
        }
        
        if (in_array($mimeType, [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ])) {
            return 'document';
        }

        return 'other';
    }
}
