<?php

namespace App\Services\WorksheetPDF;

use App\Models\Worksheet\Worksheet;
use App\Services\WorksheetService;

class MainLayout
{
    use PdfEncodingHelper;

    protected $worksheetService;
    protected $path;
    protected $pdf;
    protected $r;
    protected $g;
    protected $b;
    protected $data;
    protected $no_screen;           // number of screen
    protected $work_id;             // work id for display
    protected $saleName;
    protected $managerName;
    protected $productionName;
    protected $creatorName;

    public function __construct($pdf, $worksheet_data)
    {
        $this->path = public_path();
        $this->worksheetService = new WorksheetService;
        $this->pdf = $pdf;
        $this->data = $worksheet_data;
        $this->work_id = $worksheet_data->work_id;
        $this->saleName = $this->worksheetService->limitStringForDisplay($this->data->nwsCreatedBy?->user_nickname, 12);
        $this->managerName = $this->worksheetService->limitStringForDisplay($this->data->managerName?->user_nickname, 7);
        $this->productionName = $this->worksheetService->limitStringForDisplay($this->data->productionName?->user_nickname, 6);
        $this->creatorName = $this->worksheetService->limitStringForDisplay($this->data->creatorName?->user_nickname, 8);

        $this->pdf->SetMargins(0, 10, 9);
        $this->pdf->SetTitle('Worksheet ' . $worksheet_data->work_id);
        $this->pdf->AddFont('PSLKittithada', '', 'PSLKittithada.php');
        $this->pdf->AddFont('PSLKittithadaBold', '', 'PSLKittithadaBold.php');
    }

    public function HeaderPageOne()
    {
        $this->pdf->AddPage();

        $this->TitleWorksheetCopy();

        // Logo Thana Plus
        $this->pdf->Image($this->path . '/images/logo.png', 257, 10, 35);
    }

    public function HeaderOtherPage($page = 2)
    {
        $this->pdf->AddPage();

        $this->TitleWorksheetCopy(2);

        // Logo Thana Plus
        $this->pdf->Image($this->path . '/images/logo.png', 8, 10, 35);

        if ($page === 3) {
            $this->pdf->SetY(7);
            $this->pdf->SetX(100);
            $this->pdf->SetFont('PSLKittithadaBold', '', 30);
            $this->pdf->Cell(40, 1, $this->safeIconv('( ใบงานเสื้อตัวอย่าง )'), 0, 0, 'C');
        }
    }

    public function ImageBox($page = 1)
    {
        $width = [1 => 153, 2 => 137];    // image width
        $axis_x = [1 => 3, 2 => 35];
        $axis_y = [1 => 12, 2 => 25];

        $image_path = $this->data->images
        ? 'storage/images/worksheet/' . $this->data->images
        : $this->path . '/images/t-shirt_mockup-v2.jpg';

        $this->pdf->Image($image_path, $axis_x[$page], $axis_y[$page], $width[$page], 0);
    }

    public function NoteOfficeTable($arr_data)
    {
        [$count_screen_position, $example_quantity_r, $pattern_sizes_r, $len_pattern_name, $len_worksheet_note, $pattern_type] = $arr_data;

        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->SetLeftMargin(225);
        $this->pdf->SetY(-197);

        if (
            $count_screen_position < 4 && count($example_quantity_r) < 4 && count($pattern_sizes_r) < 11
            && $len_pattern_name < 30 && $len_worksheet_note < 40 && $pattern_type == 1
        ) {
            $this->pdf->SetFont('PSLKittithadaBold', '', 12);
            $this->pdf->SetDrawColor(0, 0, 0);
            $this->pdf->Cell(65, 6, ' Note (Office)', 'T B');
            $this->pdf->Ln(6);
            $this->pdf->Cell(65, 18, '', 'B');
            $this->pdf->Ln(25);
        }
    }

    public function ScreenSection($arr_data)
    {
        $screen_data = config('worksheet.screen_data');
        [$total_screen_qty, $screen_result] = $arr_data;

        $this->pdf->SetFillColor(0, 0, 0);

        // horizontal line above screen data
        $this->pdf->Rect(157, 157, 136, 0.3, 'F');  
        $this->pdf->ln(3);  

        $this->pdf->setY(159);      // default 138
        $this->pdf->setX(160);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(30, 6, 'SCREEN-POSITION', 0);
        $this->pdf->Cell(26, 6, 'TOTAL POSITION : ', 0);
        $this->pdf->SetFont('PSLKittithada', '', 12);
        $this->pdf->Cell(37, 6, $total_screen_qty, 0);
        $this->pdf->Ln(6);
        $this->pdf->setX(160);

        foreach ($screen_result as $key => $value) {

            $w = $screen_data['sheet_width'][$key];

            if ($value != 0) {
                //Vertical line between value
                if ($this->no_screen == 1) {
                    $this->pdf->Cell(3, 6, '', 0);
                    $this->pdf->Rect(178, 166.3, 0.2, 3.5, 'F');    // Y default 145.3
                } elseif ($this->no_screen == 2) {
                    $this->pdf->Cell(3, 6, '', 0);
                    $this->pdf->Rect(201, 166.3, 0.2, 3.5, 'F');
                } elseif ($this->no_screen == 3) {
                    $this->pdf->Cell(3, 6, '', 0);
                    $this->pdf->Rect(216, 166.3, 0.2, 3.5, 'F');
                } elseif ($this->no_screen == 4) {
                    $this->pdf->Cell(3, 6, '', 0);
                    $this->pdf->Rect(234, 166.3, 0.2, 3.5, 'F');  
                }

                $this->pdf->SetFont('PSLKittithadaBold', '', 12);
                $this->pdf->Cell($w, 6, strtoupper($key) . ' : ', 0);
                $this->pdf->SetFont('PSLKittithada', '', 12);
                $this->pdf->Cell(5, 6, $value, 0);
                $this->no_screen++;
            }
        }
    }

    public function ExShirtTable($arr_data)
    {
        [$exam_date, $sum_example_qty, $example_quantity_r, $pattern_name] = $arr_data;

        $this->pdf->setY(17);      // default 156, 20
        $this->pdf->setX(160);      // default 160
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(18, 6, 'EXAMPLE :', 0);

        if ($exam_date == null) {

            if ($sum_example_qty > 0) {
                $this->pdf->Cell(30, 6, '', 0);
            } else {
                $this->pdf->SetFont('PSLKittithada', '', 13);
                $this->pdf->Cell(30, 6, $this->safeIconv('ไม่ขอตัวอย่าง'), 0);
            }

        } else {
            $this->pdf->SetFont('PSLKittithada', '', 13);
            $this->pdf->Cell(30, 6, $exam_date->format('d-m-Y'), 0);
        }

        // pattern name line
        $this->pdf->setY(23);      // default 162, 26
        $this->pdf->setX(160);      // default 160
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(18, 6, 'PATTERN :', 0);
        $this->pdf->SetFont('PSLKittithada', '', 12);
        $this->pdf->Cell(115, 6, $pattern_name, 0);

        // horizontal line under pattern name
        $this->pdf->Rect(157, 31, 136, 0.3, 'F');  
        $this->pdf->ln(3); 
    }

    public function PatternSizeTable($arr_data)
    {
        [$pattern_type, $pattern_sizes_r] = $arr_data;

        if ($pattern_type == 1) {
            $this->pdf->setY(35);       // default 19, 38
            $this->pdf->setX(178);      // default 178
            $this->renderedPatternSizeTableNew($pattern_sizes_r, 1);
            
        } else {
            $pattern_sizes_men = $this->worksheetService->transformData($pattern_sizes_r['men'], ['size_name', 'chest', 'long', 'quantity']);
            $pattern_sizes_women = $this->worksheetService->transformData($pattern_sizes_r['women'], ['size_name', 'chest', 'long', 'quantity']);
            
            $this->pdf->setY(37);       // default 24
            $this->pdf->setX(157);      // default 157
            $this->renderedShirtSizeTblMenAndWomen($pattern_sizes_men, 2);
            $this->pdf->setY(37);       // default 24
            $this->pdf->setX(227);      // default 227
            $this->renderedShirtSizeTblMenAndWomen($pattern_sizes_women, 3);
        }

        $this->pdf->Ln(8);
    }

    public function DateBox($date_created)
    {
        [$this->r, $this->g, $this->b] = $this->worksheetService->getLineColorForMonth($date_created);

        $this->pdf->SetLeftMargin(8);
        $this->pdf->SetY(175);
        $this->pdf->SetFillColor($this->r, $this->g, $this->b);
        $this->pdf->Rect(9, 173, 2, 32, 'F');
        $this->pdf->SetLeftMargin(14);
        $this->pdf->SetY(180);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(15, 6, 'DATE');
        $this->pdf->Ln(7);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(24, 6, $date_created->format('d-m-Y'));
        $this->pdf->Ln(7);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(15, 6, 'TNP-' . $this->work_id);
    }

    public function NameBox($arr_data)
    {
        [$work_name, $customer_name] = $arr_data;

        $this->pdf->SetFillColor(0, 0, 0);
        $this->pdf->Rect(42, 173, 0.3, 32, 'F');
        $this->pdf->SetLeftMargin(48);
        $this->pdf->SetY(180);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(15, 6, 'NAME', 0);
        $this->pdf->Ln(8);
        $this->pdf->SetFont('PSLKittithada', '', 14);
        $this->pdf->MultiCell(25, 4, $work_name, 0);
        $this->pdf->Ln(3);
        $this->pdf->MultiCell(25, 4, $customer_name, 0);
    }

    public function FabricBox($arr_data)
    {
        [$fabric_factory, $fabric_name, $fabric_no, $fabric_color, $fabric_color_no] = $arr_data;

        $this->pdf->SetFillColor(0, 0, 0);
        $this->pdf->Rect(78, 173, 0.3, 32, 'F');
        $this->pdf->SetLeftMargin(84);
        $this->pdf->SetY(180);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(15, 6, 'FABRIC', 0);
        $this->pdf->Ln(6.5);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(9, 6, $this->safeIconv('ร้าน'), 0);
        $this->pdf->SetFont('PSLKittithada', '', 16);
        $this->pdf->Cell(22, 6, $fabric_factory, 0, 0, 'L');
        $this->pdf->SetLeftMargin(116);
        $this->pdf->SetY(186.5);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(7, 6, $this->safeIconv('ผ้า'), 0);
        $this->pdf->SetLeftMargin(123);
        $this->pdf->SetY(187.5);
        $this->pdf->SetFont('PSLKittithada', '', 15);
        $this->pdf->MultiCell(26, 4, $fabric_name . ' ' . $fabric_no, 0, 'L');

        $get_y_fabric = $this->pdf->GetY();

        $this->pdf->SetLeftMargin(84);
        $this->pdf->SetY(193.5);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(4, 6, $this->safeIconv('สี'), 0);
        $this->pdf->SetLeftMargin(88);
        $this->pdf->SetY(194.8);
        $this->pdf->SetFont('PSLKittithada', '', 15);

        $width_color_cell = 61;

        if ($get_y_fabric > 192) {
            $width_color_cell = 30;
        }

        $this->pdf->MultiCell($width_color_cell, 4, $fabric_color . ' ' . $fabric_color_no, 0, 'L');
    }

    public function DueDateBox($due_date)
    {
        $this->pdf->SetFillColor(0, 0, 0);
        $this->pdf->Rect(151, 173, 0.3, 32, 'F');
        $this->pdf->SetLeftMargin(157);
        $this->pdf->SetY(180);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(15, 6, 'DUE DATE', 0);
        $this->pdf->Ln(7);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(15, 6, $due_date->format('d-m-Y'), 0);
        $this->pdf->Ln(7);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(11, 6, 'TOTAL : ', 0);
        $this->pdf->SetFont('PSLKittithada', '', 12);
        $this->pdf->Cell(15, 6, $this->data->total_quantity);
    }

    public function SignatureBox($user_role)
    {
        $worksheet_status = $this->worksheetService->convertStatus($this->data->worksheet_id);
        $is_access = ['admin', 'manager', 'graphic'];

        $this->pdf->SetFillColor(0, 0, 0);
        $this->pdf->Rect(187, 173, 0.3, 32, 'F');
        $this->pdf->SetLeftMargin(193);
        $this->pdf->SetY(175);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(32, 4, 'SALE : ' . $this->saleName, 0, 0);
        $this->pdf->Cell(38, 4, 'DATE :', 0, 0);
        $this->pdf->Cell(15, 4, ' (_______________)', 0, 1, 'L');
        $this->pdf->Ln(4);

        if ($worksheet_status['code'] == 3) {
            $this->pdf->SetLeftMargin(193);
            $this->pdf->Cell(32, 4, 'MANAGER : ' . $this->managerName, 0, 0);
            $this->pdf->Cell(38, 4, 'DATE :', 0, 0);
            $this->pdf->Cell(15, 4, ' (_______________)', 0, 1, 'L');
            $this->pdf->Ln(4);
            $this->pdf->Cell(32, 4, 'PRODUCTION : ' . $this->productionName, 0, 0);
            $this->pdf->Cell(38, 4, 'DATE :', 0, 0);
            $this->pdf->Cell(15, 4, ' (_______________)', 0, 1, 'L');
            $this->pdf->Ln(4);
            $this->pdf->Cell(32, 4, 'CREATOR : ' . $this->creatorName, 0, 0);
        } else if (in_array($user_role, $is_access)) {
            $this->pdf->SetLeftMargin(193);
            $this->pdf->Cell(42, 4, 'MANAGER : ' . $this->managerName, 0, 1);
            $this->pdf->Ln(4);
            $this->pdf->SetLeftMargin(193);
            $this->pdf->Cell(42, 4, 'PRODUCTION : ' . $this->productionName, 0, 1);
            $this->pdf->Ln(4);
            $this->pdf->SetLeftMargin(193);
            $this->pdf->Cell(42, 4, 'CREATOR : ' . $this->creatorName, 0, 0);
        } else {
            $this->pdf->SetLeftMargin(193);
            $this->pdf->Cell(42, 4, 'MANAGER : ', 0, 1);
            $this->pdf->Ln(4);
            $this->pdf->SetLeftMargin(193);
            $this->pdf->Cell(42, 4, 'PRODUCTION : ', 0, 1);
            $this->pdf->Ln(4);
            $this->pdf->SetLeftMargin(193);
            $this->pdf->Cell(42, 4, 'CREATOR : ', 0, 0);
        }
    }

    public function PatternSizeTablePageTwo($arr_data)
    {
        [$pattern_name, $shirt_sizes_r, $shirtPatternType] = $arr_data;

        $shirtPatternTitlesMap = [
            2 => 'ชาย',
            3 => 'หญิง',
        ];

        $sumQuantity = 0;
        foreach ($shirt_sizes_r as $shirt_sizes_item) {
          $sumQuantity += $shirt_sizes_item['quantity'];
        }

        $this->pdf->SetY(10);
        $this->pdf->SetX(200);
        $this->pdf->SetFont('PSLKittithadaBold', '', 20);
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->MultiCell(88, 8, $this->safeIconv('แพทเทิน : ') . $pattern_name, 0, 'C');
        $this->pdf->Ln(2);
        $this->pdf->SetLeftMargin(200);

        // table head background color
        if ($shirtPatternType == 1 || $shirtPatternType == 2 ) {
            $this->pdf->SetFillColor(69, 69, 69);
        } else {
            $this->pdf->SetFillColor(174, 2, 0);
        }

        $this->pdf->SetTextColor(255, 255, 255);
        $this->pdf->SetDrawColor(0, 0, 0);
        $this->pdf->Ln(1);

        if ($shirtPatternType !== 1) {
            $this->pdf->Cell(88, 9, $this->safeIconv($shirtPatternTitlesMap[$shirtPatternType]), 'L T B', 1, 'C', 'F');
        }
        
        $this->pdf->SetFont('PSLKittithadaBold', '', 20);
        $this->pdf->Cell(22, 9, $this->safeIconv('ไซซ์'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(22, 9, $this->safeIconv('รอบอก'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(22, 9, $this->safeIconv('ความยาว'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(22, 9, $this->safeIconv('จำนวน'), 1, 0, 'C', 'F');
        $this->pdf->Ln(9);
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->SetDrawColor(69, 69, 69);

        // change width and height when '$shirt_sizes_r' count more than  
        foreach ($shirt_sizes_r as $shirt_sizes_item) {
            $this->pdf->SetFont('PSLKittithadaBold', '', 18);
            $this->pdf->SetX(200);
            $this->pdf->Cell(22, 8, strtoupper($shirt_sizes_item['size_name']), 'L B', 0, 'C');
            $this->pdf->Cell(22, 8, $shirt_sizes_item['chest'], 'L B', 0, 'C');
            $this->pdf->Cell(22, 8, $shirt_sizes_item['long'], 'L B', 0, 'C');
            $this->pdf->Cell(22, 8, $shirt_sizes_item['quantity'], 'L R B', 0, 'C');
            $this->pdf->Ln(8);
        }

        $this->pdf->SetX(200);
        $this->pdf->SetFont('PSLKittithadaBold', '', 20);
        $this->pdf->Cell(66, 9, $this->safeIconv('รวมทั้งหมด'), 'L B', 0, 'R');

        //if $total_quantity unequal $sum_quantity_r set text red color
        if ($shirtPatternType == 1 && $this->data->total_quantity != $sumQuantity) {
            $this->pdf->SetTextColor(220, 53, 69);
        }

        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(22, 9, $sumQuantity, 'R B', 0, 'C');
        $get_y_pattern_name = $this->pdf->GetY();
        $this->pdf->Ln(8);

        
        // Detail more size textfield
        // hide layout when count $shirt_sizes_r more than 10 
        if (count($shirt_sizes_r) < 10) {

            $this->pdf->SetFont('PSLKittithadaBold', '', 20);
            $this->pdf->SetTextColor(0, 0, 0);

            if ($get_y_pattern_name <= 119) {
                $this->pdf->SetX(200);
                $this->pdf->Cell(88, 10, $this->safeIconv('รายละเอียดไซต์เพิ่มเติม'), 0, 5, 'C');
                $this->pdf->Cell(88, 8, $this->safeIconv(''), 1, 5);
            } elseif ($get_y_pattern_name > 127) {
                $this->pdf->Cell(88, 8, '', 0, 5, 'C');
            } elseif ($get_y_pattern_name > 30) {
                $this->pdf->SetY(138);
                $this->pdf->SetX(200);
                $this->pdf->SetTextColor(230, 230, 230);
                $this->pdf->Cell(88, 8, $this->safeIconv('รายละเอียดไซต์เพิ่มเติม'), 1, 5, 'C');
            }
        }
    }

    public function MoreDetailBox($arr_data)
    {
        [$page, $row_count] = $arr_data;

        $width = [
            'title' => 178,
            'content' => 181
        ];

        if ($page == 2 && $row_count > 11 || $page == 3 && $row_count > 11) {
            $width = [
                'title' => 90,
                'content' => 93
            ];
        }

        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->SetY(155);
        $this->pdf->SetX(10);
        $this->pdf->Cell(3, 8, '', 'L T B', 0);
        $this->pdf->Cell($width['title'], 8, $this->safeIconv('ข้อมูลเพิ่มเติม'), 'T R B', 3);
        $this->pdf->SetX(10);
        $this->pdf->Cell($width['content'], 34, '', 'L R B', 0);
    }

    public function WorkDataTablePageTwo($arr_data)
    {
        $x = 201;
        [$page, $size_row_count, $work_name, $date_created, $fabric_factory, $fabric_name, $fabric_no, $fabric_color, $fabric_color_no] = $arr_data;

        if ($page == 2 && $size_row_count > 11 || $page == 3 && $size_row_count > 11) {
            $x = 108;
        }

        $this->pdf->SetFont('PSLKittithadaBold', '', 20);
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->SetY(145);
        $this->pdf->SetX($x);
        $this->pdf->Cell(87, 10, $this->safeIconv('ข้อมูลงาน'), 0, 5, 'C');
        $this->pdf->Cell(4, 8, '', 'L T', 0);
        $this->pdf->Cell(18, 8, $this->safeIconv('ร้านผ้า'), 'T', 0);
        $this->pdf->Cell(5, 8, '', 'L T', 0);
        $this->pdf->Cell(60, 8, $fabric_factory, 'R T', 1);
        $this->pdf->SetX($x);
        $this->pdf->Cell(4, 8, '', 'L', 0);
        $this->pdf->Cell(18, 8, $this->safeIconv('เนื้อผ้า'), 0, 0);
        $this->pdf->Cell(5, 8, '', 'L', 0);
       
        $sum_len_val_color = strlen($fabric_color) + strlen($fabric_color_no);

        if (strlen($fabric_name) > 24) {
            $fabric_name = substr_replace($fabric_name, '...', 24);
            $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        }

        $this->pdf->Cell(60, 8, $fabric_name . ' ' . $fabric_no, 'R', 1);
        $this->pdf->SetX($x);
        $this->pdf->SetFont('PSLKittithadaBold', '', 20);
        $this->pdf->Cell(4, 8, '', 'L', 0);
        $this->pdf->Cell(18, 8, $this->safeIconv('สีผ้า'), 0, 0);
        $this->pdf->Cell(5, 8, '', 'L', 0);

        if ($sum_len_val_color > 30) {
            $this->pdf->SetFont('PSLKittithadaBold', '', 16);
        } else if ($sum_len_val_color > 25) {
            $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        }

        $this->pdf->Cell(60, 8, $fabric_color . ' ' . $fabric_color_no, 'R', 1);
        $this->pdf->SetX($x);
        $this->pdf->Cell(4, 8, '', 'T L', 0);
        $this->pdf->SetFont('PSLKittithadaBold', '', 20);
        $this->pdf->Cell(18, 8, $this->safeIconv('ชื่องาน'), 'T', 0);
        $this->pdf->Cell(5, 8, '', 'T L', 0);
        $this->pdf->Cell(60, 8, $work_name, 'T R', 1);
        $this->pdf->SetX($x);
        $this->pdf->Cell(4.5, 8, '', 'T L', 0);
        $this->pdf->Cell(17.5, 8, $this->safeIconv('ใบงาน'), 'T', 0);
        $this->pdf->Cell(5, 8, '', 'T L', 0);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(60, 8, $date_created->format('d-m-Y'), 'T R', 0);
        $this->pdf->SetFont('PSLKittithadaBold', '', 14);
        $this->pdf->SetY(188);
        $this->pdf->SetX($x + 64);
        $this->pdf->Cell(22, 8, 'TNP-' . $this->work_id, 0, 5, 'R');
        $this->pdf->SetFillColor($this->r, $this->g, $this->b);
        $this->pdf->Rect($x, 195, 87, 2, 'DF');
        $this->pdf->Ln(3);
    }

    public function ExShirtTablePageThree($arr_data)
    {
        [$count, $pattern_name, $pattern_sizes, $example_quantity_r, $shirtPatternType] = $arr_data;

        $merged_result = [];
        $size_data = config('worksheet.size_data');

        $shirtPatternTitlesMap = [
            2 => 'ชาย',
            3 => 'หญิง',
        ];

        $sumQuantity = 0;
        foreach ($example_quantity_r as $example_quantity_item) {
          $sumQuantity += (int)$example_quantity_item['ex_quantity'];
        }

        foreach ($example_quantity_r as $example_quantity_item) {

            if (isset($example_quantity_item['ex_quantity'])) {

                $merged_item = [
                    'ex_size_name' => $example_quantity_item['ex_size_name'],
                    'ex_quantity' => $example_quantity_item['ex_quantity'],
                ];
                
                foreach ($pattern_sizes as $pattern_sizes_items) {
                    if ($example_quantity_item['ex_size_name'] == $pattern_sizes_items['size_name']) {
                        $merged_item['chest'] = $pattern_sizes_items['chest'];
                        $merged_item['long'] = $pattern_sizes_items['long'];
                        break;
                    }
                }
                
                $merged_result[] = $merged_item;
            }
        }

        $this->pdf->SetY(10);
        $this->pdf->SetX(200);
        $this->pdf->SetFont('PSLKittithadaBold', '', 20);
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->MultiCell(88, 8, $this->safeIconv('แพทเทิน : ') . $pattern_name, 0, 'C');
        $this->pdf->Ln(2);
        $this->pdf->SetDrawColor(0, 0, 0);

        // table head background color
        if ($shirtPatternType == 1 || $shirtPatternType == 2) {
            $this->pdf->SetFillColor(69, 69, 69);
        } else {
            $this->pdf->SetFillColor(174, 2, 0);
        }
        
        $this->pdf->SetTextColor(255, 255, 255);

        $this->pdf->SetX(200);
        if ($shirtPatternType !== 1) {
            $this->pdf->Cell(88, 9, $this->safeIconv($shirtPatternTitlesMap[$shirtPatternType]), 'L T B', 1, 'C', 'F');
        }
        
        $this->pdf->SetX(200);
        $this->pdf->SetFont('PSLKittithadaBold', '', 20);
        $this->pdf->Cell(22, 9, $this->safeIconv('ไซซ์'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(22, 9, $this->safeIconv('รอบอก'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(22, 9, $this->safeIconv('ความยาว'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(22, 9, $this->safeIconv('จำนวน'), 1, 0, 'C', 'F');
        $this->pdf->Ln(9);
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->SetDrawColor(69, 69, 69);

        foreach ($merged_result as $merged_item) {
            
            if ($merged_item['ex_quantity'] != '') {
                $this->pdf->SetFont('PSLKittithadaBold', '', 18);
                $this->pdf->SetX(200);
                $this->pdf->Cell(22, 8, strtoupper($merged_item['ex_size_name']), 'L B', 0, 'C');
                $this->pdf->Cell(22, 8, $merged_item['chest'], 'L B', 0, 'C');
                $this->pdf->Cell(22, 8, $merged_item['long'], 'L B', 0, 'C');
                $this->pdf->Cell(22, 8, $merged_item['ex_quantity'], 'L R B', 0, 'C');
                $this->pdf->Ln(8);
            }
        }

        $this->pdf->SetX(200);
        $this->pdf->SetFont('PSLKittithadaBold', '', 20);
        $this->pdf->Cell(66, 9, $this->safeIconv('รวมทั้งหมด'), 'L B', 0, 'R');
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(22, 9, $sumQuantity, 'R B', 0, 'C');
        $get_y_pattern_name = $this->pdf->GetY();
        $this->pdf->Ln(8);

        //Detail more size textfield
        if ($count < 11) {
            $this->pdf->SetFont('PSLKittithadaBold', '', 20);
            $this->pdf->SetTextColor(0, 0, 0);

            if ($get_y_pattern_name <= 119) {
                $this->pdf->SetX(200);
                $this->pdf->Cell(88, 10, $this->safeIconv('รายละเอียดไซต์เพิ่มเติม'), 0, 5, 'C');
                $this->pdf->Cell(88, 8, $this->safeIconv(''), 1, 5);
            } elseif ($get_y_pattern_name > 127) {
                $this->pdf->Cell(88, 8, '', 0, 5, 'C');
            } elseif ($get_y_pattern_name > 30) {
                $this->pdf->SetY(138);
                $this->pdf->SetX(200);
                $this->pdf->SetTextColor(230, 230, 230);
                $this->pdf->Cell(88, 8, $this->safeIconv('รายละเอียดไซต์เพิ่มเติม'), 1, 5, 'C');
            }
        }
    }

    private function TitleWorksheetCopy($page = 1)
    {
        $base_work_id = $this->work_id;

        if (strlen($this->work_id) > 8) {
            $base_work_id = preg_replace('/\s\(\d+\)/', '', $this->work_id);
        }

        $copy_sheet_query = Worksheet::where('work_id', 'like', $base_work_id . '%')->get();

        $this->pdf->SetFont('PSLKittithadaBold', '', 13);
        $this->pdf->SetY(-207);
        $this->pdf->SetLeftMargin(240);

        if ($page === 2) {
            $this->pdf->SetX(-297);
        }

        $this->pdf->Cell(52, 5, 'WORKSHEET TOTAL : ' . (count($copy_sheet_query)) . ' SHEETS', 0, 0, 'R');
    }

    private function renderedPatternSizeTable($shirt_sizes_r, $shirt_pattern_type)
    {
        $shirtPatternTitlesMap = [
            2 => 'MEN',
            3 => 'WOMEN',
        ];
        $bottomBorderTotalQty = [
            1 => 0,
            2 => 'B',
            3 => 'B'
        ];
        
        $shirtPatternTitles = $shirtPatternTitlesMap[$shirt_pattern_type] ?? '';

        $sumQuantity = 0;
        foreach ($shirt_sizes_r as $shirt_sizes_item) {
          $sumQuantity += $shirt_sizes_item['quantity'];
        }

        
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        
        if ($shirt_pattern_type !== 1) {
            $this->pdf->SetFillColor(246, 246, 246);
            $this->pdf->Cell(15, 6, $shirtPatternTitles, 'T', 0, 'C', 'F');
            $this->pdf->Cell(50, 6, '', 'T', 1, 'C', 'F');
        }
        
        $this->pdf->Cell(15, 6, 'SIZE', 'B T', 0, 'C');
        $this->pdf->Cell(14, 6, 'CHEST', 'B T', 0, 'C');
        $this->pdf->Cell(14, 6, 'LENGTH', 'B T', 0, 'C');
        $this->pdf->Cell(22, 6, 'QUANTITY', 'B T', 0, 'C');

        foreach ($shirt_sizes_r as $shirt_sizes_item) {
            $this->pdf->Ln(6);
            $this->pdf->SetFont('PSLKittithadaBold', '', 12);
            $this->pdf->Cell(15, 6, strtoupper($shirt_sizes_item['size_name']), 'B', 0, 'C');
            $this->pdf->SetFont('PSLKittithada', '', 12);
            $this->pdf->Cell(14, 6, $shirt_sizes_item['chest'], 'B', 0, 'C');
            $this->pdf->Cell(14, 6, $shirt_sizes_item['long'], 'B', 0, 'C');
            $this->pdf->Cell(22, 6, $shirt_sizes_item['quantity'], 'B', 0, 'C');
        }

        $this->pdf->Ln(6);
        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(15, 6, 'TOTAL', $bottomBorderTotalQty[$shirt_pattern_type], 0, 'C');
        $this->pdf->Cell(28, 6, '', $bottomBorderTotalQty[$shirt_pattern_type], 0, 'C');

        //if $quantity unequal $sum_quantity set text red color
        if ($shirt_pattern_type == 1) {
            ($this->data->total_quantity != $sumQuantity && $this->pdf->SetTextColor(220, 53, 69));
        }

        $this->pdf->SetFont('PSLKittithadaBold', '', 12);
        $this->pdf->Cell(22, 6, $sumQuantity, $bottomBorderTotalQty[$shirt_pattern_type], 0, 'C');
        $this->pdf->Ln(6);
    }

    private function renderedPatternSizeTableNew($shirt_sizes_r, $shirtPatternType) {

        $size_data = config('worksheet.size_data');

        $width_cell = [
            'size' => 14,
            'chest' => 18,
            'long' => 18,
            'qty' => 16,
        ];
        
        $heighd_cell = 6;
        
        if ($shirtPatternType == 1) {
            $width_cell = [
                'size' => 22,
                'chest' => 26,
                'long' => 26,
                'qty' => 24,
            ];
            $heighd_cell = 6.5;
        }

        $sumQuantity = 0;
        foreach ($shirt_sizes_r as $shirt_sizes_item) {
          $sumQuantity += $shirt_sizes_item['quantity'];
        }
        
        $this->pdf->SetLeftMargin(178);
        $this->pdf->SetFillColor(69, 69, 69);
        $this->pdf->SetTextColor(255, 255, 255);
        $this->pdf->SetDrawColor(0, 0, 0);
        $this->pdf->SetFont('PSLKittithadaBold', '', 16);

        $this->pdf->Cell(22, 6.5, $this->safeIconv('ไซซ์'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(26, 6.5, $this->safeIconv('รอบอก'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(26, 6.5, $this->safeIconv('ความยาว'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(24, 6.5, $this->safeIconv('จำนวน'), 1, 0, 'C', 'F');
        $this->pdf->Ln(6.5);
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->SetDrawColor(69, 69, 69);

        foreach ($shirt_sizes_r as $shirt_sizes_item) {

            if ($shirt_sizes_item['quantity'] != 0) {
                $this->pdf->SetX(178);
                $this->pdf->Cell(22, 6.5, strtoupper($shirt_sizes_item['size_name']), 'L B', 0, 'C');
                $this->pdf->Cell(26, 6.5, $shirt_sizes_item['chest'], 'L B', 0, 'C');
                $this->pdf->Cell(26, 6.5, $shirt_sizes_item['long'], 'L B', 0, 'C');
                $this->pdf->Cell(24, 6.5, $shirt_sizes_item['quantity'], 'L R B', 0, 'C');
                $this->pdf->Ln(6.5);
            }
        }

        $this->pdf->Cell(74, 6.5, $this->safeIconv('รวมทั้งหมด'), 'L B', 0, 'R');

        //if $total_quantity unequal $sum_quantity_r set text red color
        if ($this->data->total_quantity != $sumQuantity) {
            $this->pdf->SetTextColor(220, 53, 69);
        }

        $this->pdf->Cell(24, 6.5, $sumQuantity, 'R B', 0, 'C');
    }

    private function renderedShirtSizeTblMenAndWomen($shirt_sizes_r, $shirtPatternType) 
    {
        $size_data = config('worksheet.size_data');
        $shirtPatternTitlesMap = [
            2 => 'ชาย',
            3 => 'หญิง',
        ];

        $sumQuantity = 0;
        foreach ($shirt_sizes_r as $shirt_sizes_item) {
          $sumQuantity += $shirt_sizes_item['quantity'];
        }
        
        if ($shirtPatternType == 2) {
            $this->pdf->SetLeftMargin(157);
            $this->pdf->SetFillColor(69, 69, 69);
        } else {
            $this->pdf->SetLeftMargin(227);
            $this->pdf->SetFillColor(174, 2, 0);
        }

        $this->pdf->SetTextColor(255, 255, 255);
        $this->pdf->SetDrawColor(0, 0, 0);
        $this->pdf->SetFont('PSLKittithadaBold', '', 14);

        // show title pattern "ชาย" or "หญิง"
        if ($shirtPatternType !== 1) {
            $this->pdf->Cell(66, 6, $this->safeIconv($shirtPatternTitlesMap[$shirtPatternType]), 1, 1, 'C', 'F');
        }

        $this->pdf->Cell(14, 6, $this->safeIconv('ไซซ์'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(18, 6, $this->safeIconv('รอบอก'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(18, 6, $this->safeIconv('ความยาว'), 'L T B', 0, 'C', 'F');
        $this->pdf->Cell(16, 6, $this->safeIconv('จำนวน'), 1, 0, 'C', 'F');
        $this->pdf->Ln(6);
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->SetDrawColor(69, 69, 69);

        if ($shirtPatternType == 2) {
            $this->pdf->SetX(157);
        } else {
            $this->pdf->SetX(227);
        }
            
        foreach ($shirt_sizes_r as $shirt_sizes_item) { // Loop through each shirt size item from the database

            if ($shirt_sizes_item['quantity'] != 0) {
                $this->pdf->Cell(14, 6, strtoupper($shirt_sizes_item['size_name']), 'L B', 0, 'C');
                $this->pdf->Cell(18, 6, $shirt_sizes_item['chest'], 'L B', 0, 'C');
                $this->pdf->Cell(18, 6, $shirt_sizes_item['long'], 'L B', 0, 'C');
                $this->pdf->Cell(16, 6, $shirt_sizes_item['quantity'], 'L R B', 0, 'C');
                $this->pdf->Ln(6);
            } 
        }

        if ($shirtPatternType == 2) {
            $this->pdf->SetX(157);
        } else {
            $this->pdf->SetX(227);
        }

        // $this->pdf->SetFont('PSLKittithadaBold', '', 16);
        $this->pdf->Cell(50, 6, $this->safeIconv('รวมทั้งหมด'), 'L B', 0, 'R');

        //if $total_quantity unequal $sum_quantity_r set text red color
        if ($shirtPatternType == 1 && $this->data->total_quantity != $sumQuantity) {
            $this->pdf->SetTextColor(220, 53, 69);
        }

        $this->pdf->Cell(16, 6, $sumQuantity, 'R B', 0, 'C');
    }
}
