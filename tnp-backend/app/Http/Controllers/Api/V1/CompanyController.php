<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CompanyController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => Company::orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $validator = \Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'branch' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:13',
            'phone' => 'nullable|string|max:100',
            'short_code' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        $data['id'] = (string) \Illuminate\Support\Str::uuid();
        $company = Company::create($data);
        return response()->json(['success' => true, 'data' => $company], 201);
    }

    public function show($id)
    {
        $company = Company::findOrFail($id);
        return response()->json(['success' => true, 'data' => $company]);
    }

    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);
        $validator = \Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'branch' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:13',
            'phone' => 'nullable|string|max:100',
            'short_code' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        $company->fill($validator->validated());
        $company->save();
        return response()->json(['success' => true, 'data' => $company]);
    }

    public function destroy($id)
    {
        $company = Company::findOrFail($id);
        $company->delete();
        return response()->json(['success' => true]);
    }
}
