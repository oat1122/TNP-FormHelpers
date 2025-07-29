<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\DocumentService;
use App\Models\Accounting\DocumentAttachment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class DocumentAttachmentController extends Controller
{
    protected DocumentService $documentService;

    public function __construct(DocumentService $documentService)
    {
        $this->documentService = $documentService;
    }

    /**
     * Upload document attachment
     */
    public function upload(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'document_type' => 'required|in:quotation,invoice,receipt,delivery_note',
                'document_id' => 'required|string',
                'file' => 'required|file|max:10240', // 10MB max
                'description' => 'nullable|string|max:255'
            ]);

            $attachment = $this->documentService->uploadAttachment(
                $validatedData['document_type'],
                $validatedData['document_id'],
                $request->file('file'),
                $validatedData['description'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'File uploaded successfully',
                'data' => $attachment
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download attachment
     */
    public function download(string $id)
    {
        try {
            return $this->documentService->downloadAttachment($id);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download file',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Delete attachment
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->documentService->deleteAttachment($id);

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
     * Get attachments for a document
     */
    public function getDocumentAttachments(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'document_type' => 'required|in:quotation,invoice,receipt,delivery_note',
                'document_id' => 'required|string'
            ]);

            $attachments = $this->documentService->getAttachments(
                $validatedData['document_type'],
                $validatedData['document_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Attachments retrieved successfully',
                'data' => $attachments
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve attachments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attachment info
     */
    public function show(string $id): JsonResponse
    {
        try {
            $attachment = DocumentAttachment::with('uploadedBy')->find($id);

            if (!$attachment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attachment not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Attachment retrieved successfully',
                'data' => $attachment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve attachment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update attachment description
     */
    public function updateDescription(Request $request, string $id): JsonResponse
    {
        try {
            $attachment = DocumentAttachment::find($id);

            if (!$attachment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attachment not found'
                ], 404);
            }

            $validatedData = $request->validate([
                'description' => 'nullable|string|max:255'
            ]);

            $attachment->update([
                'description' => $validatedData['description']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Attachment description updated successfully',
                'data' => $attachment
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update attachment description',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get storage statistics
     */
    public function getStorageStats(Request $request): JsonResponse
    {
        try {
            $documentType = $request->get('document_type');
            $stats = $this->documentService->getStorageStats($documentType);

            return response()->json([
                'success' => true,
                'message' => 'Storage statistics retrieved successfully',
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve storage statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
