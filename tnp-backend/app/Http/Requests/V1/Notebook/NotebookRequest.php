<?php

namespace App\Http\Requests\V1\Notebook;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class NotebookRequest extends FormRequest
{
    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(response()->json([
            'status' => 'error',
            'message' => $this->authorizationMessage(),
        ], 403));
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors(),
        ], 422));
    }

    protected function authorizationMessage(): string
    {
        return 'Unauthorized';
    }
}
