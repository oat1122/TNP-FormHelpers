<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

/**
 * Trait ApiResponseHelper
 * 
 * Standardize JSON API responses across all controllers
 * Provides consistent response format with success/error states
 */
trait ApiResponseHelper
{
    /**
     * Return a success JSON response
     * 
     * @param mixed $data The data to return
     * @param string $message Success message
     * @param int $code HTTP status code (default: 200)
     * @return JsonResponse
     */
    protected function successResponse($data, string $message = 'Success', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message
        ], $code);
    }

    /**
     * Return a success JSON response with pagination
     * 
     * @param mixed $data The data to return
     * @param array $pagination Pagination metadata
     * @param string $message Success message
     * @param int $code HTTP status code (default: 200)
     * @return JsonResponse
     */
    protected function successResponseWithPagination($data, array $pagination, string $message = 'Success', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => $pagination,
            'message' => $message
        ], $code);
    }

    /**
     * Return a success JSON response with metadata
     * 
     * @param mixed $data The data to return
     * @param array $meta Additional metadata
     * @param string $message Success message
     * @param int $code HTTP status code (default: 200)
     * @return JsonResponse
     */
    protected function successResponseWithMeta($data, array $meta, string $message = 'Success', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => $meta,
            'message' => $message
        ], $code);
    }

    /**
     * Return an error JSON response
     * 
     * @param string $message Error message
     * @param int $code HTTP status code (default: 500)
     * @param mixed $errors Additional error details (optional)
     * @return JsonResponse
     */
    protected function errorResponse(string $message, int $code = 500, $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        
        return response()->json($response, $code);
    }

    /**
     * Return a validation error response
     * 
     * @param mixed $errors Validation errors
     * @param string $message Error message (default: 'Validation failed')
     * @return JsonResponse
     */
    protected function validationErrorResponse($errors, string $message = 'Validation failed'): JsonResponse
    {
        return $this->errorResponse($message, 422, $errors);
    }

    /**
     * Return a not found error response
     * 
     * @param string $resource Resource name (default: 'Resource')
     * @return JsonResponse
     */
    protected function notFoundResponse(string $resource = 'Resource'): JsonResponse
    {
        return $this->errorResponse("{$resource} not found", 404);
    }

    /**
     * Return an unauthorized error response
     * 
     * @param string $message Error message (default: 'Unauthorized')
     * @return JsonResponse
     */
    protected function unauthorizedResponse(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->errorResponse($message, 403);
    }

    /**
     * Return a forbidden error response
     * 
     * @param string $message Error message (default: 'Forbidden: insufficient permissions')
     * @return JsonResponse
     */
    protected function forbiddenResponse(string $message = 'Forbidden: insufficient permissions'): JsonResponse
    {
        return $this->errorResponse($message, 403);
    }

    /**
     * Return a created success response
     * 
     * @param mixed $data The created resource data
     * @param string $message Success message
     * @return JsonResponse
     */
    protected function createdResponse($data, string $message = 'Resource created successfully'): JsonResponse
    {
        return $this->successResponse($data, $message, 201);
    }

    /**
     * Return a no content response
     * 
     * @return JsonResponse
     */
    protected function noContentResponse(): JsonResponse
    {
        return response()->json(null, 204);
    }
}
