<?php

namespace App\Http\Controllers\Api\V1\Worksheet;

use Illuminate\Http\Request;
use App\Models\Worksheet\Worksheet;
use App\Models\Worksheet\Customer;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Worksheet\WorksheetCollection;
use App\Http\Resources\V1\Worksheet\WorksheetResource;
use App\Http\Resources\V1\Worksheet\WsCustomerResource;
use App\Http\Requests\V1\StoreWorksheetRequest;
use App\Models\MasterCustomer;
use App\Models\MonitorProduction\Block;
use App\Models\MonitorProduction\Production;
use App\Models\User\User;
use App\Services\WorksheetService;
use App\Services\WorksheetPDF\WorksheetPDF;
use App\Models\Worksheet\WorksheetFabric;
use App\Models\Worksheet\WorksheetFabricCustom;
use App\Models\Worksheet\WorksheetPoloDetail;
use App\Models\Worksheet\WorksheetPoloEmbroider;
use App\Models\Worksheet\WorksheetScreen;
use App\Models\Worksheet\WorksheetShirtPattern;
use App\Models\Worksheet\WorksheetShirtSize;
use App\Models\Worksheet\WorksheetStatus;
use App\Models\Worksheet\WorksheetExampleQty;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WorksheetController extends Controller
{
    protected $worksheetService;

    public function __construct()
    {
        $this->worksheetService = new WorksheetService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $keyword = trim($request->input('search'));

        $query = Worksheet::where('deleted', '!=', 1);

        if ($keyword !== '') {
            $searchTerm = '%' . $keyword . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('work_id', 'like', $searchTerm)
                    ->orWhere('work_name', 'like', $searchTerm)
                    ->orWhereHas('nwsCreatedBy', function ($user_q) use ($searchTerm) {
                        $user_q->where('username', 'like', $searchTerm);
                    })
                    ->orWhereHas('customer', function ($cus_q) use ($searchTerm) {
                        $cus_q->where('cus_name', 'like', $searchTerm);
                    });
            });
        }

        $worksheets = $query->orderByRaw(
                "SUBSTRING(work_id, 3, 2) DESC, SUBSTRING(work_id, 1, 2) DESC, SUBSTRING(work_id, 6, 3) DESC"
            )
            ->paginate($perPage);

        $result = WorksheetCollection::make($worksheets);

        return [
            'data' => $result,
            'pagination' => [
                'current_page' => $worksheets->currentPage(),
                'per_page' => $worksheets->perPage(),
                'total_pages' => $worksheets->lastPage(),
                'total_items' => $worksheets->total(),
            ]
        ];
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
        $worksheetService = new WorksheetService;
        $is_duplicate = $request->is_duplicate;
        $fabric_input = [];
        $pattern_input = [];
        $polo_embroider_input = [];

        try {
            DB::beginTransaction();

            // generate work id
            $work_id = $worksheetService->generateWorkID($is_duplicate, $request->work_id);

            // -------------------- Fabric section -------------------- //
            if ($request->crewneck_selected === '0') {
                $request['crewneck_color'] = "";
            }

            $fabric = WorksheetFabric::create($request->all());
            $fabric_id = $fabric->fabric_id;

            if (count($request->fabric_custom_color) > 0) {

                foreach ($request->fabric_custom_color as $customColor) {
                    WorksheetFabricCustom::create([
                        'fabric_custom_id' => Str::uuid(),
                        'fabric_id' => $fabric_id,
                        'fabric_custom_color' => $customColor,
                        'created_at' => $this->worksheetService->get_datetime_now(),
                        'updated_at' => $this->worksheetService->get_datetime_now()
                    ]);
                }
            }

            // -------------------- Pattern section -------------------- //
            $pattern = WorksheetShirtPattern::create($request->all());
            $pattern_id = $pattern->pattern_id;

            if ($request->pattern_type == 1) {
                $this->worksheetService->prepareStorePatternData($request->pattern_sizes, $pattern_input, $pattern_id, 1);
            } else {
                $this->worksheetService->prepareStorePatternData($request->pattern_sizes['men'], $pattern_input, $pattern_id, 2);
                $this->worksheetService->prepareStorePatternData($request->pattern_sizes['women'], $pattern_input, $pattern_id, 3);
            }

            $pattern_input = collect($pattern_input)->map(function ($item) {
                return array_merge($item, ['shirt_size_id' => Str::uuid()]);
            });

            if (count($pattern_input) > 0) {
                foreach ($pattern_input as $item) {
                    WorksheetShirtSize::create($item);
                }
            }

            // -------------------- Screen section -------------------- //
            $screen = WorksheetScreen::create($request->all());
            $screen_id = $screen->screen_id;

            $worksheet_input = $request->all();
            $worksheet_input['date_created'] = $worksheetService->get_datetime_now();
            $worksheet_input['customer_id'] = $request->cus_id;
            $worksheet_input['fabric_id'] = $fabric_id;
            $worksheet_input['pattern_id'] = $pattern_id;
            $worksheet_input['screen_id'] = $screen_id;
            $worksheet_input['work_id'] = $work_id;
            $worksheet_input['nws_created_date'] = now();
            $worksheet_input['nws_created_by'] = $worksheet_input['nws_created_by'] ?? null;
            $worksheet_input['nws_updated_date'] = now();
            $worksheet_input['nws_updated_by'] = $worksheet_input['nws_updated_by'] ?? null;
            $worksheet = Worksheet::create($worksheet_input);
            $worksheet_id = $worksheet->worksheet_id;

            // -------------------- Example quantity section -------------------- //
            if (!empty($request->example_quantity)) {

                if ($request->pattern_type == 1) {
                    $this->updateExampleQty($request->example_quantity, $worksheet->worksheet_id, 1);
                } else {
                    $this->updateExampleQty($request->example_quantity['men'], $worksheet->worksheet_id, 2);
                    $this->updateExampleQty($request->example_quantity['women'], $worksheet->worksheet_id, 3);
                }
            }

            // -------------------- Polo section -------------------- //
            if ($request->type_shirt === 'polo-shirt') {

                $polo_input = $worksheetService->clearValueIfNotSelected($request);
                $polo_input['worksheet_id'] = $worksheet_id;
                $polo = WorksheetPoloDetail::create($polo_input->all());
                $polo_detail_id = $polo->polo_detail_id;

                foreach ($request->polo_embroider as $embroider_item) {

                    WorksheetPoloEmbroider::create([
                        'polo_detail_id' => $polo_detail_id,
                        'embroider_position' => $embroider_item['embroider_position'],
                        'embroider_size' => $embroider_item['embroider_size'],
                        'created_at' => $worksheetService->get_datetime_now(),
                        'updated_at' => $worksheetService->get_datetime_now()
                    ]);
                }
            }

            // -------------------- Worksheet status -------------------- //
            WorksheetStatus::create(['worksheet_id' => $worksheet_id]);
            DB::commit();

            return response()->json([
                'status' => 'ok',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create worksheet error : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Create worksheet error : ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(String $id)
    {
        if ($id === 'all') {
            return new WorksheetCollection(Worksheet::orderByDesc('work_id')->get());
        } else {
            $worksheet = Worksheet::where('deleted', '!=', 1)->where('worksheet_id', $id)->first();

            if ($worksheet) {
                return new WorksheetResource($worksheet);
            }
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Worksheet $worksheet)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, String $id)
    {
        $worksheetService = new WorksheetService;
        $fabric_input = [];
        $pattern_del_list = [];
        $example_del_list = [];
        $polo_embroider_del_list = [];

        try {
            DB::beginTransaction();

            $worksheet = Worksheet::findOrFail($id);
            $worksheet->fill($request->only([
                'work_name',
                'due_date',
                'exam_date',
                'creator_name',
                'manager_name',
                'production_name',
                'worksheet_note',
                'type_shirt',
                'size_tag',
                'packaging',
                'shirt_detail',
                'total_quantity',
            ]));
            $worksheet->nws_updated_date = now();
            
            // -------------------- Customer section -------------------- //
            if ($request->cus_id !== $worksheet->customer_id) {
                $worksheet->customer_id = $request->cus_id;
            }
            
            $worksheet->save();

            // -------------------- Fabric section -------------------- //
            $fabric = WorksheetFabric::find($worksheet->fabric_id);

            if ($request->crewneck_selected === '0') {
                $request['crewneck_color'] = "";
            }

            $fabric->update($request->all());
            $fabric_id = $fabric->fabric_id;
            $fabric_custom_q = WorksheetFabricCustom::where('fabric_id', $fabric_id)->get();

            // Delete all record and insert fabric custom color data
            if (count($request->fabric_custom_color) > 0 || count($fabric_custom_q) > 0) {

                WorksheetFabricCustom::where('fabric_id', $fabric_id)->delete();

                foreach ($request->fabric_custom_color as $custom_color) {
                    WorksheetFabricCustom::create([
                        'fabric_custom_id' => Str::uuid(),
                        'fabric_id' => $fabric_id,
                        'fabric_custom_color' => $custom_color,
                        'created_at' => $this->worksheetService->get_datetime_now(),
                        'updated_at' => $this->worksheetService->get_datetime_now()
                    ]);
                }
            }

            // -------------------- Pattern section -------------------- //
            $pattern_id = $request->pattern_id;
            $pattern = WorksheetShirtPattern::find($pattern_id);

            // ค่าประเภทแพทเทิร์นจากฐานข้อมูล
            $existing_pattern_type = $pattern['pattern_type'];

            // ถ้ามีการเปลี่ยนประเภทแพทเทิร์น ให้ลบข้อมูลไซซ์ทั้งหมดทิ้ง
            if ($existing_pattern_type != $request->pattern_type) {
                $shirt_size_q = WorksheetShirtSize::where('pattern_id', $pattern_id)->get();

                if (count($shirt_size_q) > 0) {
                    foreach($shirt_size_q as $item) {
                        $item->delete();
                    }
                }
            }

            $pattern->update($request->all());

            if ($request->pattern_type == 1) {
                $this->worksheetService->checkDeletePatternData($pattern_del_list, $pattern_id, $request->pattern_sizes, 1);
                $this->updatePatternSizes($request->pattern_sizes, $pattern_id, 1);
            } else {
                $this->worksheetService->checkDeletePatternData($pattern_del_list, $pattern_id, $request->pattern_sizes['men'], 2);
                $this->worksheetService->checkDeletePatternData($pattern_del_list, $pattern_id, $request->pattern_sizes['women'], 3);

                $this->updatePatternSizes($request->pattern_sizes['men'], $pattern_id, 2);
                $this->updatePatternSizes($request->pattern_sizes['women'], $pattern_id, 3);
            }

            // delete pattern size
            if (count($pattern_del_list) > 0) {
                foreach ($pattern_del_list as $item_del) {
                    $pattern_del = WorksheetShirtSize::find($item_del['shirt_size_id']);
                    $pattern_del->delete();
                }
            }
            
            // -------------------- Shirt screen section -------------------- //
            $screen_id = $request->screen_id;
            $screen = WorksheetScreen::find($screen_id);
            $screen->update($request->all());
            
            // -------------------- Example quantity section -------------------- //
            // ถ้ามีการเปลี่ยนประเภทแพทเทิร์น ให้ลบข้อมูลเสื้อตัวอย่างทั้งหมดทิ้ง
            if ($existing_pattern_type != $request->pattern_type) {
                $example_qty_q = WorksheetExampleQty::where('worksheet_id', $id)->get();
                if (count($example_qty_q) > 0) {
                    foreach($example_qty_q as $item) {
                        $item->delete();
                    }
                }
            }
             
            if ($request->pattern_type == 1) {
                $this->worksheetService->checkDeleteExampleData($example_del_list, $worksheet->worksheet_id, 1, $request->example_quantity);
                $this->updateExampleQty($request->example_quantity, $worksheet->worksheet_id, 1);
            } else {
                $this->worksheetService->checkDeleteExampleData($example_del_list, $worksheet->worksheet_id, 2, $request->example_quantity['men']);
                $this->worksheetService->checkDeleteExampleData($example_del_list, $worksheet->worksheet_id, 3, $request->example_quantity['women']);
                $this->updateExampleQty($request->example_quantity['men'], $worksheet->worksheet_id, 2);
                $this->updateExampleQty($request->example_quantity['women'], $worksheet->worksheet_id, 3);
            }

            // delete example quantity
            if (count($example_del_list) > 0) {
                foreach ($example_del_list as $item_del) {
                    $ex_del = WorksheetExampleQty::find($item_del['ex_id']);
                    $ex_del->delete();
                }
            }

            // -------------------- Status section -------------------- //
            $worksheet_status = WorksheetStatus::where('worksheet_id', $id)->first();
            // ถ้าสถานะงานเป็นแก้ไข หลังจากเคยยืนยันใบงานแล้ว ให้อัพเดตค่าเวลาที่เซลได้ทำการแก้ไข
            if ($worksheet_status->sales == 1) {
                $worksheet_status->update([
                    'sales' => 3, 'sales_edit_date' => $worksheetService->get_datetime_now()
                ]);
            }

            // -------------------- Polo section -------------------- //
            if ($request->type_shirt === 'polo-shirt') {

                $polo_detail_id = $request->polo_detail_id;
                $polo = WorksheetPoloDetail::find($polo_detail_id);
                $modified_request = $worksheetService->clearValueIfNotSelected($request);
                $polo->update($modified_request->all());

                $polo_embroider_q = WorksheetPoloEmbroider::where('polo_detail_id', $polo_detail_id)->get();
                $input_polo_embroider = array_column($request->polo_embroider, 'polo_embroider_id');

                if (count($polo_embroider_q) > 0) {
                    foreach ($polo_embroider_q as $row) {
                        if (isset($row['polo_embroider_id']) && !in_array($row['polo_embroider_id'], $input_polo_embroider)) 
                        {
                            $polo_embroider_del_list[] = $row;
                        }
                    }
                }

                foreach ($request->polo_embroider as $item) {
                    $item['polo_detail_id'] = $polo_detail_id;
                    $item['embroider_position'] = $item['embroider_position'];
                    $item['embroider_size'] = $item['embroider_size'] ?? '';

                    WorksheetPoloEmbroider::updateOrCreate(
                        ['polo_detail_id' => $polo_detail_id, 'polo_embroider_id' => $item['polo_embroider_id'] ?? null],
                        $item
                    );
                }

                // delete embroider position
                if (count($polo_embroider_del_list) > 0) {
                    foreach ($polo_embroider_del_list as $item_del) {
                        $polo_embroider_del = WorksheetPoloEmbroider::find($item_del['polo_embroider_id']);
                        $polo_embroider_del->delete();
                    }
                }
            }

            DB::commit();
            return response()->json([
                'status' => 'ok'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update worksheet error : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Update worksheet error : ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $worksheetService = new WorksheetService;

        try {
            DB::beginTransaction();
            $worksheet = Worksheet::findOrFail($id);
            $copied_sheet_q = Worksheet::where('work_id', 'like', $worksheet->work_id . '%')->get();

            // handel if copies worksheet is delete, but is original worksheet update field deleted
            if (strlen($worksheet->work_id) > 8) {
                $this->deleteRelatedWorksheetTbl($worksheet);
                $worksheetService->generateWorkID(false, $worksheet->work_id, true);

            } else if (count($copied_sheet_q) > 1 && strlen($worksheet->work_id) == 8) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Can\'t delete the origin worksheet.'
                ]);

            } else {
                $worksheet->update(['deleted' => 1]);
            }

            DB::commit();
            return response()->json([
                'status' => 'ok',
            ]);
        } catch (\Exception $e) {
            
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Delete worksheet error : ' . $e->getMessage()
            ]);
        }
    }

    public function generatePdf(Request $request)
    {
        try {
            $worksheet = Worksheet::findOrFail($request->worksheet_id);
            $WorksheetPDF = new WorksheetPDF($worksheet);
    
            if ($request->sheet_type === "work_sheet") {
                return $WorksheetPDF->workSheet($request->user_role);
            } else {
                return $WorksheetPDF->orderSheet();
            }

        } catch (\Exception $e) {
            Log::error('Generate the PDF error : ' . $e);
            return response()->json([
                'message' => 'An error occurred while generating the PDF.',
                'error' => $e->getMessage()
                ], 500);
        }
    }

    public function generatePdfGet(string $id, string $sheet, string $role)
    {
        try {
            $worksheet = Worksheet::findOrFail($id);
            $WorksheetPDF = new WorksheetPDF($worksheet);
    
            if ($sheet === "work_sheet") {
                return $WorksheetPDF->workSheet($role);
            } else {
                return $WorksheetPDF->orderSheet();
            }

        } catch (\Exception $e) {
            Log::error('Generate the PDF error : ' . $e);
            return response()->json([
                'message' => 'An error occurred while generating the PDF.',
                'error' => $e->getMessage()
                ], 500);
        }
    }

    public function uploadImage(Request $request)
    {
        $input_update = [];
        $worksheetService = new WorksheetService;
        $worksheet = Worksheet::findOrFail($request->worksheet_id);
        $existing_images_q = $worksheet->images;
        $existing_images_file = Storage::get('public/images/worksheet/' . $existing_images_q);
        
        if ($request->is_delete === '1') {
            $input_update['images'] = ''; 

        } else {
            $request->validate([
                'images' => 'required|image|mimes:jpeg,png,jpg',
            ]);
            $images_file = $request->file('images');
            $images_width = getimagesize($images_file);
            
            // Rename images file.
            $timestamp = microtime(true) . date('YmdHis');
            $extension_file = $images_file->getClientOriginalExtension();
            $new_filename = $timestamp . '.' . $extension_file;
            
            if ($images_width[0] > 2500) {
                $worksheetService->scalingImages($images_file, $new_filename);
            } else {
                $images_file->storeAs('public/images/worksheet', $new_filename);
            }
    
            $input_update['images'] = $new_filename;
    
            if ($worksheet->creator_name === null) {
                $input_update['creator_name'] = $request->creator_name; 
            }
        }

        try {
            DB::beginTransaction();

            $worksheet->update($input_update);

            DB::commit();

            // Delete old images file.
            if ($existing_images_file !== null) {
                Storage::delete('public/images/worksheet/' . $existing_images_q);
            }

            return response()->json([
                'status' => 'ok',
            ]);

        } catch (\Exception $e) {
                
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Upload image error : ' . $e->getMessage()
            ]);
        }
    }

    public function updateStatus(Request $request)
    {
        $data_update = [];
        $worksheet_status_q = WorksheetStatus::where('worksheet_id', $request->worksheet_id)->firstOrFail();
        $user_q = User::findOrFail($request->user_id);
        
        try {
            DB::beginTransaction();

            if ($user_q->role == 'sale') {

                if ($request->action == 'confirm') {

                    $data_update = [
                        'sales' => 1,
                        'sales_confirm_date' => $this->worksheetService->get_datetime_now()
                    ];
                    
                } else if ($request->action == 'edit') {
                    
                    $data_update = [
                        'sales' => 2,
                        'sales_permission_date' => $this->worksheetService->get_datetime_now()
                    ];

                } else {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Invalid action for sale role.'
                    ], 400);
                }

            } else if ($user_q->role == 'manager') {

                if ($request->action == 'confirm') {

                    $data_update = [
                        'manager' => 1,
                        'manager_confirm_date' => $this->worksheetService->get_datetime_now()
                    ];

                    $this->insertProductionsMonitor($request->worksheet_id);

                } else if ($request->action == 'approve') {
                    
                    $data_update = [
                        'sales' => 3,
                        'manager' => 0,
                        'manager_approve_date' => $this->worksheetService->get_datetime_now(),
                        'sales_edit_date' => $this->worksheetService->get_datetime_now()
                    ];

                } else if ($request->action == 'disapprove') {

                    $data_update = [
                        'sales' => 1,
                        'manager' => 1
                    ];

                } else {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Invalid action for manager role.'
                    ], 400);
                }

            } else {
                Log::info('Invalid user role : ' . json_encode($request->all()));
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user role.'
                ], 400);
            }

            $worksheet_status_q->update($data_update);
            DB::commit();

            return response()->json([
                'status' => 'ok',
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update worksheet status error : ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Update worksheet status error : ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteRelatedWorksheetTbl($worksheet_query)
    {
        $worksheet_status_q = WorksheetStatus::where('worksheet_id', $worksheet_query->worksheet_id)->first();

        $worksheet_fabric_custom_q = WorksheetFabricCustom::where('fabric_id', $worksheet_query->fabric_id);
        $worksheet_fabric_custom_q->delete();

        $worksheet_shirt_size_q = WorksheetShirtSize::where('pattern_id', $worksheet_query->pattern_id);
        $worksheet_shirt_size_q->delete();
        
        $worksheet_ex_qty_q = WorksheetExampleQty::where('worksheet_id', $worksheet_query->worksheet_id);
        $worksheet_ex_qty_q->delete();
       
        if ($worksheet_query->type_shirt == 'polo-shirt') {

            $worksheet_polo_detail_q = WorksheetPoloDetail::where('worksheet_id', $worksheet_query->worksheet_id)->first();
            
            if ($worksheet_polo_detail_q) {
                $worksheet_polo_embroider_q = WorksheetPoloEmbroider::where('polo_detail_id', $worksheet_polo_detail_q->polo_detail_id);
                $worksheet_polo_embroider_q->delete();
            }
            
            $worksheet_polo_detail_q->delete();
        }

        $worksheet_query->shirtScreen->delete();
        $worksheet_query->shirtPattern->delete();
        $worksheet_query->fabric->delete();
        $worksheet_status_q->delete();
        $worksheet_query->delete();
    }

    // public function storeAndUpdateCustomer($request_input)
    // {
    //     // for create duplicate worksheet.
    //     if ($request_input->is_duplicate && !empty($request_input->worksheet_id)) {
    //         $worksheet_existing = Worksheet::findOrFail($request_input->worksheet_id);
    //         return $worksheet_existing->customer_id;
    //     }

    //     if (!empty($request_input->customer_id)) {
    //         $customer_existing = Customer::findOrFail($request_input->customer_id);
    //         $customer_name_matching = $customer_existing->customer_name == $request_input->customer_name;
    //         $company_name_matching = $customer_existing->company_name == $request_input->company_name;

    //         if ($customer_existing && $customer_name_matching && $company_name_matching) {
    //             $customer_existing->update($request_input->all());
    //             return $customer_existing->customer_id;

    //         } else {
    //             $customer = Customer::create($request_input->all());
    //             return $customer->customer_id;
    //         }

    //     } else {
    //         $customer = Customer::create($request_input->all());
    //         return $customer->customer_id;
    //     }
    // }

    public function getAllCustomers()
    {
        $query = MasterCustomer::active()
        ->select(
            'cus_id',
            'cus_name',
            'cus_firstname',
            'cus_lastname',
            'cus_company',
            'cus_address',
            'cus_tel_1',
            'cus_email'
        )->orderBy('cus_id', 'desc')->get();
        return WsCustomerResource::collection($query);
    }

    private function updatePatternSizes($pattern_sizes, $pattern_id, $shirt_pattern_type)
    {
        $field_update = [
            'pattern_id' => $pattern_id,
            'shirt_pattern_type' => $shirt_pattern_type,
            'chest' => 0,
            'long' => 0,
            'quantity' => 0
        ];
    
        $unique_keys = ['pattern_id', 'size_name', 'shirt_pattern_type'];

        foreach ($pattern_sizes as &$item) {
            // อัปเดต pattern_id ถ้ามีอยู่และไม่ตรงกับค่าใหม่
            if (isset($item['pattern_id']) && $item['pattern_id'] != $pattern_id) {
                $item['pattern_id'] = $pattern_id;
                unset($item['shirt_size_id']);
            }
            
            // อัปเดต shirt_pattern_type
            $item['shirt_pattern_type'] = $shirt_pattern_type;
        }

        $this->updateDynamicData($pattern_sizes, $pattern_id, $field_update, WorksheetShirtSize::class, $unique_keys);
    }

    private function updateExampleQty($example_request, $worksheet_id, $ex_pattern_type)
    {
        $example_qty_input = [];
        $field_update = [
            'worksheet_id' => $worksheet_id,
            'ex_pattern_type' => $ex_pattern_type,
            'ex_quantity' => null
        ];
    
        $unique_keys = ['worksheet_id', 'ex_size_name', 'ex_pattern_type']; // กำหนดฟิลด์ที่ใช้ในการค้นหา record

        foreach ($example_request as $example_item) {

            if ($example_item['ex_quantity'] !== null || intval($example_item['ex_quantity']) !== 0) {

                $example_qty_input[] = [
                    'worksheet_id' => $worksheet_id,
                    'ex_pattern_type' => $example_item['ex_pattern_type'],
                    'ex_size_name' => $example_item['ex_size_name'],
                    'ex_quantity' => $example_item['ex_quantity']
                ];
            }
        }

        if (count($example_qty_input) > 0) {
            $this->updateDynamicData($example_qty_input, $worksheet_id, $field_update, WorksheetExampleQty::class, $unique_keys);
        }
    }

    private function updateDynamicData($request_data, $id, $field_update, $model, $unique_keys)
    {
        foreach ($request_data as $item) {

            // ตั้งค่าค่าดีฟอลต์ (default) ถ้าไม่มีค่าใน array
            foreach ($field_update as $key => $field_item) {
                $item[$key] = $item[$key] ?? $field_item;
            }

            // อัปเดตหรือสร้างข้อมูลในโมเดลตามเงื่อนไขที่กำหนด
            $model::updateOrCreate(
                array_intersect_key($item, array_flip($unique_keys)), // เงื่อนไขในการหา record ที่ต้องการอัปเดต
                $item // ข้อมูลที่ต้องการอัปเดต
            );
        }
    }

    // เพิ่มไอดีใบงานลงในตาราง productions สำหรับแสดงในระบบ monitor
    private function insertProductionsMonitor($worksheet_id)
    {
        $production_q = Production::where('new_worksheet_id', $worksheet_id)->first();

        try {
        
            if (!$production_q) {
                $data_input = [];

                // Get the current time and add 24 hours
                $currentDateTime = date('Y-m-d H:i:s');

                // ค่ากำหนดวันสิ้นสุดที่ต้องกดเริ่มงาน
                $endSelectProcessTime = date('Y-m-d H:i:s', strtotime($currentDateTime . ' +24 hours'));

                $data_input = [
                    'new_worksheet_id' => $worksheet_id, 
                    'end_select_process_time' => $endSelectProcessTime
                ];

                $production_r = Production::create($data_input);
                Block::create(['pd_id' => $production_r->pd_id]);
            }

        } catch (\Exception $e) {
            Log::error('insertProductionsMonitor error : ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'insertProductionsMonitor error : ' . $e->getMessage()
            ], 500);
        }
    }
}
