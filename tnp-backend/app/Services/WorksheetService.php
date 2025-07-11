<?php

namespace App\Services;

use App\Models\Worksheet\Worksheet;
use App\Models\Worksheet\WorksheetExampleQty;
use App\Models\Worksheet\WorksheetShirtSize;
use App\Models\Worksheet\WorksheetStatus;
use DateTime;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Illuminate\Support\Facades\DB;

class WorksheetService
{

    public function generateWorkID(bool $is_duplicate = false, $work_id, bool $is_delete = false)
    {
        // init work_id when start new month
        $result_work_id = 1;
        $date_now = new DateTime();
        $date = $date_now->format('my');

        // return only work_id
        if (strlen($work_id) > 8) {
            $work_id = substr($work_id, 0, strrpos($work_id, '(') - 1);
        }

        $order_by = $is_delete ? 'asc' : 'desc';
        $search_term = $is_duplicate || $is_delete ? $work_id : $date;
        $query = Worksheet::orderBy('created_at', $order_by)
            ->where('work_id', 'LIKE', '%' . $search_term . '%');

        // Query 'work_id' from worksheets old table.
        $worksheet_old_q = DB::table('worksheets')
            ->select('sheetID', 'work_id')
            ->orderByDesc('create_sheet_1')
            ->where('work_id', 'LIKE', '%' . $date . '%')
            ->get();

        if ($is_delete) {
            $query->where('deleted', 0);
        }

        // Fetch worksheets
        $fetch_worksheet = $query->get(['worksheet_id', 'work_id']);

        if (!$fetch_worksheet->isEmpty() || !$worksheet_old_q->isEmpty()) {

            if ($is_duplicate) {
                $work_id_r = $fetch_worksheet->pluck('work_id')->first();
                $result_work_id = (int)substr($work_id_r, strrpos($work_id_r, '-') + 1);
            } else if ($is_delete) {
                return $this->genNewDuplicateID($fetch_worksheet);
            } else {
                $max_id = $fetch_worksheet->max(function ($item) {
                    return (int)substr($item->work_id, strrpos($item->work_id, '-') + 1);
                });

                $max_id_old = $worksheet_old_q->max(function ($item) {
                    return (int)substr($item->work_id, strrpos($item->work_id, '-') + 1);
                });

                $result_max_id = max($max_id, $max_id_old);
                
                $result_work_id = $result_max_id + 1;
            }
        }
        
        // Format the result
        $init_id_with_zero = str_pad($result_work_id, 3, '0', STR_PAD_LEFT);
        
        if ($is_duplicate) {
            $suffix = " (" . count($fetch_worksheet) . ")";
            $result = $work_id . $suffix;

        } else {
            $result = $date . '-' . $init_id_with_zero;
        }

        return $result;
    }

    public function genNewDuplicateID($fetch_worksheet)
    {
        $work_id = $fetch_worksheet->pluck('work_id')->first();
        $i = 1;

        foreach ($fetch_worksheet as $item) {

            if (strlen($item['work_id']) > 8) {
                preg_match('/\((\d+)\)/', $item['work_id'], $matches);
                $new_work_id = $work_id . ' (' . $i . ')';
                $item->update(['work_id' => $new_work_id]);
                $i++;
            }
        }
    }

    public function convertStatus($worksheet_id)
    {
        // status worksheet meaning
        // sale : 0 = worksheet created, 1 = request to edit worksheet, 2 = editing worksheet, 3 = confirm worksheet
        // manager : 0 = worksheet created, 1 = confirm worksheet

        $query = WorksheetStatus::where('worksheet_id', $worksheet_id)->first();
        $sales = $query->sales;
        $manager = $query->manager;

        if ($sales == 3 && $manager == 0) {
            $msg = [
                'code' => 6,
                'title' => 'Editing'
            ];
        } else if ($sales == 1 && $manager == 0 && $query->manager_confirm_date) {
            $msg = [
                'code' => 5,
                'title' => 'Waiting Manager'
            ];
        } else if (($sales == 2 && $manager == 1) || ($sales == 1 && $manager == 0 && $query->manager_confirm_date)) {
            $msg = [
                'code' => 4,
                'title' => 'Waiting Manager Approve'
            ];
        } else if ($sales == 1 && $manager == 1) {
            $msg = [
                'code' => 3,
                'title' => 'Complete'
            ];
        } else if ($sales == 1 && $manager == 0) {
            $msg = [
                'code' => 2,
                'title' => 'Waiting Manager'
            ];
        } else {
            $msg = [
                'code' => 1,
                'title' => 'Waiting'
            ];
        }

        return $msg;
    }

    public function transformData($dataArr, $keyName)
    {
        return array_map(function ($data) use ($keyName) {
            $transformedData = [];

            if (is_array($keyName)) {
                // Extract values for multiple keys
                foreach ($keyName as $key) {
                    if (isset($data[$key])) {
                        $transformedData[$key] = $data[$key];
                    }
                }
            } else {
                // Extract value for single key
                $transformedData[$keyName] = $data[$keyName];
            }

            return $transformedData;
        }, $dataArr);
    }

    public function extractFabricCustomColor($dataArr)
    {
        return array_map(function ($data) {
            return $data['fabric_custom_color'];
        }, $dataArr);
    }

    public function get_datetime_now()
    {
        return new DateTime();
    }

    public function clearValueIfNotSelected($requst)
    {
        $modified_request = $requst->duplicate();

        foreach ($modified_request->all() as $key => &$value) {

            if (in_array($key, ['outer_placket', 'inner_placket', 'bottom_hem', 'back_seam', 'side_vents'])) {
                if (!$value) {
                    $modified_request[$key . '_detail'] = '';
                }
            } else if (in_array($key, ['collar_type', 'placket', 'button'])) {
                if ($value !== 0) {
                    $modified_request['other_' . $key] = '';
                }
            }
        }

        return $modified_request;
    }

    public function getLineColorForMonth($date_input)
    {
        $month_val = date_format($date_input, 'm');

        $colors = [
            "01" => [195, 242, 166],
            "02" => [242, 240, 166],
            "03" => [166, 242, 238],
            "04" => [166, 187, 242],
            "05" => [190, 166, 242],
            "06" => [242, 166, 230],
            "07" => [242, 166, 166],
            "08" => [252, 198, 98],
            "09" => [252, 148, 93],
            "10" => [10, 120, 5],
            "11" => [185, 179, 3],
        ];
        
        return isset($colors[$month_val]) ? $colors[$month_val] : [0, 0, 0];
    }

    public function checkPoloDetailValue($condition, $detail) {
        return ($condition == 1 && $detail == '') ? 'มี' : $detail;
    }

    public function limitStringForDisplay($value, $limit) {
        $converted_value = iconv('UTF-8', 'TIS-620', $value);

        if (strlen($converted_value) > $limit) {
            return substr_replace($converted_value, '...', $limit);
        } else {
            return $converted_value;
        }
    }

    public function scalingImages($images_file, $new_filename) {
        $path = storage_path('app/public/images/worksheet/');
        $new_images_path = $path . $new_filename;

        $imageManager = new ImageManager(new GdDriver);
        $image_r = $imageManager->read($images_file);
        $image_r->scale(2500);
        $image_r->save($new_images_path);
    }

    public function filterShirtPatternByType($items, $pattern_id, $worksheet_id)
    {
        $result = [
            'unisex' => [],
            'men' => [],
            'women' => [],
        ];

        // sort data by size name
        $this->sortSizeData($items, 'size_name');

        foreach ($items as $item) {

            if ($item['pattern_id'] == $pattern_id) {

                $pattern_data = [
                    'shirt_size_id' => $item['shirt_size_id'],
                    'pattern_id' => $item['pattern_id'],
                    'shirt_pattern_type' => $item['shirt_pattern_type'],
                    'size_name' => $item['size_name'],
                    'chest' => $item['chest'],
                    'long' => $item['long'],
                    'quantity' => ($worksheet_id ? $item['quantity'] : '') ?? '',
                ];
        
                switch ($item['shirt_pattern_type']) {
                    case 2:
                        $result['men'][] = $pattern_data;
                        break;
        
                    case 3:
                        $result['women'][] = $pattern_data;
                        break;
        
                    default:
                        $result['unisex'][] = $pattern_data;
                        break;
                }
            }
        }

        return !empty($result['unisex']) ? $result['unisex'] : ['men' => $result['men'], 'women' => $result['women']];
    }

    public function filterExampleShirtByType($items, $worksheet_id, $pattern_type)
    {
        $result = [
            'unisex' => [],
            'men' => [],
            'women' => [],
        ];

        // sort data by size name
        $this->sortSizeData($items, 'ex_size_name');

        foreach ($items as $item) {

            if ($item['worksheet_id'] == $worksheet_id) {

                $pattern_data = [
                    'ex_pattern_type' => $item['ex_pattern_type'],
                    'ex_size_name' => $item['ex_size_name'],
                    'ex_quantity' => ($worksheet_id ? $item['ex_quantity'] : '') ?? '',
                ];
        
                switch ($item['ex_pattern_type']) {
                    case 2:
                        $result['men'][] = $pattern_data;
                        break;
        
                    case 3:
                        $result['women'][] = $pattern_data;
                        break;
        
                    default:
                        $result['unisex'][] = $pattern_data;
                        break;
                }
            }
        }

        return !empty($result['unisex']) || $pattern_type == 1 ? $result['unisex'] : ['men' => $result['men'], 'women' => $result['women']];
    }

    public function prepareStorePatternData($request_pattern_size, &$pattern_input, $pattern_id, $shirt_pattern_type)
    {
        if (empty($request_pattern_size)) {
            throw new \Exception('Pattern sizes cannot be empty.');
        }
                
        foreach ($request_pattern_size as $pattern_item) {
            $pattern_input[] = [
                'pattern_id' => $pattern_id,
                'shirt_pattern_type' => $shirt_pattern_type,
                'size_name' => $pattern_item['size_name'],
                'chest' => (float) $pattern_item['chest'],
                'long' => (float) $pattern_item['long'],
                'quantity' => (int) $pattern_item['quantity'],
                'created_at' => $this->get_datetime_now(),
                'updated_at' => $this->get_datetime_now()
            ];
        }
    }

    public function checkDeletePatternData(&$pattern_del_list, $pattern_id, $request_pattern_sizes, $shirt_pattern_type)
    {
        $shirt_size_q = WorksheetShirtSize::where('pattern_id', $pattern_id)->where('shirt_pattern_type', $shirt_pattern_type)->get();
        $input_pattern_sizes = array_column($request_pattern_sizes, 'size_name');

        // adding existing data from DB to delete list when input not matching existing data.
        if (count($shirt_size_q) > 0) {
            foreach ($shirt_size_q as $row) {
                if (isset($row['size_name']) && !in_array($row['size_name'], $input_pattern_sizes)) {
                    $pattern_del_list[] = $row;
                }
            }
        }
    }

    public function checkDeleteExampleData(&$example_del_list, $worksheet_id, $ex_pattern_type, $request_ex_sizes)
    {
        $request_ex_sizes_arr = [];
        $query = WorksheetExampleQty::where('worksheet_id', $worksheet_id)->where('ex_pattern_type', $ex_pattern_type)->get();

        foreach ($request_ex_sizes as $item) {
            if ($item['ex_quantity'] !== null || intval($item['ex_quantity']) !== 0) {
                $request_ex_sizes_arr[] = $item;
            }
        }

        if (count($query) > 0) {
            $size_name_arr = array_column($request_ex_sizes_arr, 'ex_size_name');

            foreach ($query as $row) {
                if (isset($row['ex_size_name']) && !in_array($row['ex_size_name'], $size_name_arr)) {
                    $example_del_list[] = $row;
                }
            }
        }
    }

    public function sortSizeData(&$items_q, $field_name) {
        $sizes_arr = ['ssss', 'sss', 'ss', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl', '10xl'];

        usort($items_q, function ($a, $b) use ($sizes_arr, $field_name) {
            $pos_a = array_search($a[$field_name], $sizes_arr);
            $pos_b = array_search($b[$field_name], $sizes_arr);
            return $pos_a - $pos_b;
        });
    }

    /**
     * ดึงข้อมูล Worksheet จากระบบ NewWorksNet
     */
    public function getFromNewWorksNet()
    {
        return Worksheet::with([
                'customer',
                'fabric.fabricCustoms',
                'shirtPattern.shirtSizes',
                'shirtScreen',
                'exampleQty',
                'poloDetail.poloEmbroiders',
                'nwsCreatedBy',
                'user',
            ])
            ->where('nws_is_deleted', false)
            ->orderByDesc('nws_created_date')
            ->get();
    }
}
