<?php

namespace App\Services\WorksheetPDF;

use Codedge\Fpdf\Fpdf\Fpdf;
use DateTime;
use App\Services\WorksheetService;
use App\Services\WorksheetPDF\MainLayout;

// header("Access-Control-Allow-Origin: " . env('APP_URL'));
define('FPDF_FONTPATH', 'fonts/');

class WorksheetPDF
{
  protected $pdf;
  protected $oPdf;
  protected $worksheetService;
  protected $mainLayout;
  protected $data;
  protected $work_name;
  protected $customer_name;
  protected $len_worksheet_note;
  protected $len_pattern_name;
  protected $date_created;
  protected $due_date;
  protected $exam_date;
  protected $total_screen_qty;
  protected $count_screen_position;
  protected $screen_result;
  protected $shirt_sizes_r;
  protected $sum_quantity_r;
  protected $sum_example_qty;
  protected $example_quantity_r;
  protected $example_shirt_filter;
  protected $pattern_name;
  protected $pattern_type;
  protected $pattern_sizes_filter;
  protected $fabric_factory;
  protected $fabric_name;
  protected $fabric_no;
  protected $fabric_color;
  protected $fabric_color_no;

  public function __construct($worksheet_data)
  {
    $this->pdf = new FPDF('L', 'mm', 'A4');
    $this->oPdf = new FPDF('P', 'mm', 'A4');    // pdf for order worksheet
    $this->worksheetService = new WorksheetService;
    $this->data = $worksheet_data;
    $this->mainLayout = new MainLayout($this->pdf, $this->data);
    $this->PrepareData();

    // ถ้าเนื้อหาหลุดหน้ากระดาษ ให้เช็คขนาดขอบกระดาษในไลบรารี่ของ Fpdf (Fpdf.php)
    // ฟังก์ชัน `__construct` ตัวแปร `$margin` ค่าต้องเป็น 6.35
  }

  public function PrepareData()
  {
    $this->pattern_name = $this->worksheetService->limitStringForDisplay($this->data->shirtPattern->pattern_name, 60);
    $this->work_name = $this->worksheetService->limitStringForDisplay($this->data->work_name, 25);
    $this->customer_name = $this->worksheetService->limitStringForDisplay($this->data->customer->cus_name, 15);
    $this->len_pattern_name = strlen($this->pattern_name);
    $this->len_worksheet_note = strlen(iconv('UTF-8', 'TIS-620', $this->data->worksheet_note));
    $this->date_created = new DateTime($this->data->date_created);
    $this->due_date = new DateTime($this->data->due_date);
    $this->exam_date = ($this->data->exam_date == null ? null : new DateTime($this->data->exam_date));
    $this->pattern_type = $this->data->shirtPattern->pattern_type;
    
    // -------------------- Screen data -------------------- //
    $screen_point = $this->data->shirtScreen->screen_point;
    $screen_flex = $this->data->shirtScreen->screen_flex;
    $screen_dft = $this->data->shirtScreen->screen_dft;
    $screen_label = $this->data->shirtScreen->screen_label;
    $screen_embroider = $this->data->shirtScreen->screen_embroider;
    $this->total_screen_qty =  array_sum([$screen_point, $screen_flex, $screen_dft, $screen_label, $screen_embroider]);
    $this->screen_result = [
      'screen' => $screen_point, 'poly-flex' => $screen_flex, 'dft' => $screen_dft,
      'label' => $screen_label, 'embroider' => $screen_embroider
    ];
    $this->count_screen_position = count(array_filter($this->screen_result));

    // -------------------- Shirt size name, size, quantity data -------------------- //
    $shirtSizes = $this->data->shirtPattern->shirtSizes;
    $this->pattern_sizes_filter = $this->worksheetService->filterShirtPatternByType($shirtSizes->toArray(), $this->data->pattern_id, $this->data->worksheet_id);
    $this->shirt_sizes_r = $this->worksheetService->transformData($shirtSizes->toArray(), ['size_name', 'chest', 'long', 'quantity']);
    $this->sum_quantity_r = 0;
    foreach ($this->shirt_sizes_r as $shirt_sizes_item) {
      $this->sum_quantity_r += $shirt_sizes_item['quantity'];
    }

    // -------------------- Example shirt data -------------------- //
    $exampleQty = $this->data->exampleQty;
    $this->example_shirt_filter = $this->worksheetService->filterExampleShirtByType($exampleQty->toArray(), $this->data->worksheet_id, $this->pattern_type);
    $this->example_quantity_r = $this->worksheetService->transformData($exampleQty->toArray(), ['ex_size_name', 'ex_quantity', 'ex_pattern_type']);
    $this->sum_example_qty = 0;
    foreach ($this->example_quantity_r as $example_item) {

      if (isset($example_item['ex_quantity'])) {
        $this->sum_example_qty += $example_item['ex_quantity'];
      }
    }

    // -------------------- Fabric data -------------------- //
    $this->fabric_factory = $this->worksheetService->limitStringForDisplay($this->data->fabric->fabric_factory, 11);
    $this->fabric_name = $this->worksheetService->limitStringForDisplay($this->data->fabric->fabric_name, 39);
    $this->fabric_no = iconv('UTF-8', 'TIS-620', $this->data->fabric->fabric_no);
    $this->fabric_color = iconv('UTF-8', 'TIS-620', $this->data->fabric->fabric_color);
    $this->fabric_color_no = iconv('UTF-8', 'TIS-620', $this->data->fabric->fabric_color_no);
  }

  public function Worksheet($user_role)
  {
    // ------------- Start page 1 worksheet ------------- //
    $this->mainLayout->HeaderPageOne();

    $this->mainLayout->ImageBox();

    $arr_ex_shirt_table = [$this->exam_date, $this->sum_example_qty, $this->example_quantity_r, $this->pattern_name];
    $this->mainLayout->ExShirtTable($arr_ex_shirt_table);

    // Pattern size table and worksheet note
    $arr_pattern_size_table = [$this->pattern_type, $this->pattern_sizes_filter];
    $this->mainLayout->PatternSizeTable($arr_pattern_size_table);

    $arr_screen_table = [$this->total_screen_qty, $this->screen_result];
    $this->mainLayout->ScreenSection($arr_screen_table);
    
    $this->mainLayout->DateBox($this->date_created);
    
    $arr_name_box = [$this->work_name, $this->customer_name];
    $this->mainLayout->NameBox($arr_name_box);

    $arr_fabric_box = [$this->fabric_factory, $this->fabric_name, $this->fabric_no, $this->fabric_color, $this->fabric_color_no];
    $this->mainLayout->FabricBox($arr_fabric_box);
    
    $this->mainLayout->DueDateBox($this->due_date);
    
    $this->mainLayout->SignatureBox($user_role);
    // ------------- End page 1 worksheet ------------- //

    // ------------- Start page 2 worksheet for tailor ------------- //
      if ($this->pattern_type == 1) {
        $this->sheetForTailoring(1);
      } else {
        $this->sheetForTailoring(2);
        $this->sheetForTailoring(3);
      }
    // ------------- End page 2 worksheet for tailor ------------- //

    // ------------- Start page 3 example shirt worksheet for tailor ------------- //
    if ($this->sum_example_qty != 0 || $user_role == 'admin') {

      if ($this->pattern_type == 1) {
        $this->exampleShirtForTailoring(1);
      } else {
        $this->exampleShirtForTailoring(2);
        $this->exampleShirtForTailoring(3);
      }
    }
    // ------------- End page 3 example shirt worksheet for tailor ------------- //

    return $this->pdf->Output('S', '', true);   // for test gen PDF change 'S' to 'I'.
  }

  public function orderSheet()
  {
    $orderLayout = new OrderLayout($this->oPdf, $this->data);

    $orderLayout->Header();

    $orderLayout->OrderDataSection();

    $orderLayout->FabricDataSection();

    $arr_screen_data = [$this->total_screen_qty, $this->screen_result];
    $orderLayout->ScreenDataSection($arr_screen_data);

    $arr_ex_data = [$this->pattern_type, $this->sum_example_qty, $this->example_shirt_filter];
    $orderLayout->ExampleDataSection($arr_ex_data);
    
    $arr_shirt_sizes_data = [$this->pattern_type, $this->pattern_name, $this->pattern_sizes_filter, $this->sum_example_qty];
    $orderLayout->ShirtSizesDataSection($arr_shirt_sizes_data);

    return $this->oPdf->Output('S', '', true);
  }

  private function sheetForTailoring($shirtPatternType)
  {
    $pattern_sizes = $this->pattern_sizes_filter;

    if ($shirtPatternType == 2) {
      $pattern_sizes = $this->pattern_sizes_filter['men'];
      
    } else if ($shirtPatternType == 3) {
      
      $pattern_sizes = $this->pattern_sizes_filter['women'];
    }

    $this->shirt_sizes_r = $this->worksheetService->transformData($pattern_sizes, ['size_name', 'chest', 'long', 'quantity']);

    $this->mainLayout->HeaderOtherPage();

    $this->mainLayout->ImageBox(2);

    $arr_pattern_size_table_p_two = [$this->pattern_name, $this->shirt_sizes_r, $shirtPatternType];
    $this->mainLayout->PatternSizeTablePageTwo($arr_pattern_size_table_p_two);

    $this->mainLayout->MoreDetailBox([2, count($this->shirt_sizes_r)]);

    $arr_work_data_table_p_two = [2, count($this->shirt_sizes_r), $this->work_name, $this->date_created, $this->fabric_factory, $this->fabric_name, $this->fabric_no, $this->fabric_color, $this->fabric_color_no];
    $this->mainLayout->WorkDataTablePageTwo($arr_work_data_table_p_two);
  }

  private function exampleShirtForTailoring($shirtPatternType)
  {
    $example_shirt = $this->example_shirt_filter;
    $pattern_sizes = $this->pattern_sizes_filter;

    $count = count(array_filter($this->example_shirt_filter, function ($item) {
      return !empty($item['ex_quantity']);
    }));

    if ($shirtPatternType == 2) {
      $example_shirt = $this->example_shirt_filter['men'];
      $pattern_sizes = $this->pattern_sizes_filter['men'];

      $count = count(array_filter($this->example_shirt_filter['men'], function ($item) {
        return !empty($item['ex_quantity']);
      }));
      
    } else if ($shirtPatternType == 3) {
      
      $example_shirt = $this->example_shirt_filter['women'];
      $pattern_sizes = $this->pattern_sizes_filter['women'];

      $count = count(array_filter($this->example_shirt_filter['women'], function ($item) {
        return !empty($item['ex_quantity']);
      }));

    }

    $this->mainLayout->HeaderOtherPage(3);
      
    $this->mainLayout->ImageBox(2);
    
    $arr_pattern_size_table_p_three = [$count, $this->pattern_name, $pattern_sizes, $example_shirt, $shirtPatternType];
    $this->mainLayout->ExShirtTablePageThree($arr_pattern_size_table_p_three);
    
    $this->mainLayout->MoreDetailBox([3, $count]);
    
    $arr_work_data_table_p_ex = [3, $count, $this->work_name, $this->date_created, $this->fabric_factory, $this->fabric_name, $this->fabric_no, $this->fabric_color, $this->fabric_color_no];
    $this->mainLayout->WorkDataTablePageTwo($arr_work_data_table_p_ex);
  }
}
