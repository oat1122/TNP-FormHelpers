<?php

namespace App\Services\WorksheetPDF;

use App\Services\WorksheetService;

class OrderLayout 
{
    use PdfEncodingHelper;

    protected $worksheetService;
    protected $path;
    protected $pdf;
    protected $data;
    protected $work_id;             // work id for display
    protected $fabric_factory;
    protected $fabric_name;         // fabric name
    protected $fabric_no;           // fabric number
    protected $fabric_color;        // fabric color
    protected $fabric_color_no;     // fabric color number
    protected $type_shirt_th;

    public function __construct($pdf, $worksheet_data) 
    {
        $translate_type_shirt = [
            't-shirt' => 'เสื้อยืด',
            'polo-shirt' => 'เสื้อโปโล'
        ];

        $this->path = public_path();
        $this->worksheetService = new WorksheetService;
        $this->pdf = $pdf;
        $this->data = $worksheet_data;
        $this->work_id = $worksheet_data->work_id;

        $this->pdf->SetMargins(0, 0, 15);
        $this->pdf->SetTitle('Order ' . $this->work_id);
        $this->pdf->AddFont('PSLKittithada', '', 'PSLKittithada.php');
        $this->pdf->AddFont('PSLKittithadaBold', '', 'PSLKittithadaBold.php');
        
        $this->type_shirt_th = $translate_type_shirt[$worksheet_data->type_shirt];

        // fabric data
        $this->fabric_factory = $worksheet_data->fabric->fabric_factory;
        $this->fabric_name = $worksheet_data->fabric->fabric_name;
        $this->fabric_no = $worksheet_data->fabric->fabric_no;
        $this->fabric_color = $worksheet_data->fabric->fabric_color;
        $this->fabric_color_no = $worksheet_data->fabric->fabric_color_no;
    }

    public function Header()
    {
        $this->pdf->AddPage();

        // Logo Thana Plus
        $this->pdf->Image($this->path . '/images/logo.png', 13, 10, 35);

        // Title order sheet
        $this->pdf->SetFont('PSLKittithadaBold', '', 22);
        $this->pdf->SetY(10);
        $this->pdf->SetLeftMargin(150);
        $this->pdf->Cell(45, 8, $this->safeIconv('ใบสั่งผลิต' . $this->type_shirt_th), 0, 1, 'R');
        $this->pdf->SetFont('PSLKittithadaBold', '', 14);
        $this->pdf->Cell(45, 6, $this->safeIconv('เลขใบงาน ') . $this->work_id, 0, 0, 'R');
        $this->pdf->SetLeftMargin(13);
        $this->pdf->Ln(13);
    }

    public function OrderDataSection()
    {
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(33, 8, $this->safeIconv('รายการสั่งผลิต : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(0, 8, $this->safeIconv($this->type_shirt_th.'  สี '.$this->fabric_color), 0, 1);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(12, 8, $this->safeIconv('เซล : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(0, 8, $this->safeIconv(ucfirst($this->data->nwsCreatedBy?->user_nickname)), 0, 1);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(21, 8, $this->safeIconv('ชื่อลูกค้า : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(0, 8, $this->safeIconv($this->data->customer->cus_name), 0, 1);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(24, 8, $this->safeIconv('ที่อยู่ลูกค้า : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->MultiCell(0, 7, $this->safeIconv($this->data->customer->cus_address), 0);
        $this->pdf->Ln(7);
        $this->pdf->SetFillColor(200, 200, 200);
        $this->pdf->Cell(182, 0.3, '', 0, 0, 'C', 'F');
    }

    public function FabricDataSection()
    {
        $this->pdf->Ln(6);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(24, 8, $this->safeIconv('ประเภทเสื้อ : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(0, 8, $this->safeIconv($this->type_shirt_th), 0, 1);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(11, 8, $this->safeIconv('ผ้า : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(0, 8, $this->safeIconv(
            $this->fabric_name.' '.$this->fabric_no.'  สี '.$this->fabric_color.' '.$this->fabric_color_no
            .'  ร้าน '.$this->fabric_factory), 0, 1);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(32, 8, $this->safeIconv('รายละเอียดเสื้อ : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->MultiCell(0, 7, $this->safeIconv($this->data->shirt_detail), 0);
        $this->pdf->Ln(7);

        // Horizontal line 2 between row
        $this->pdf->SetFillColor(200, 200, 200);
        $this->pdf->Cell(182, 0.3, '', 0, 0, 'C', 'F');
    }

    public function ScreenDataSection($arr_data)
    {
        [$sum_screen_position, $screen_quantity] = $arr_data;
        $screen_data = config('worksheet.screen_data');

        $this->pdf->Ln(6);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(26, 8, $this->safeIconv('สกรีน / ปัก : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(17, 8, $this->safeIconv($sum_screen_position.'  จุด'), 0, 0);

        foreach ($screen_quantity as $key_screen => $value_screen) {

            $w = $screen_data['order_width'][$key_screen];
            $title = $screen_data['title'][$key_screen];
    
            if($value_screen != 0) {
                $this->pdf->SetFont('PSLKittithada', '', 18);
                $this->pdf->Cell($w, 8, $this->safeIconv($title.' : '), 0);
                $this->pdf->Cell(8, 8, $value_screen.',', 0);
            };
        }
        
        $this->pdf->Ln(10);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(35, 8, $this->safeIconv('รายละเอียดสกรีน : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->MultiCell(0, 8, $this->safeIconv($this->data->shirtScreen->screen_detail), 0);

        if ($this->data->type_shirt == 'polo-shirt')
        {
            $this->PoloDataSection($this->data->poloDetail);
        }

        $this->pdf->Ln(7);

        // Horizontal line 4 between row
        $this->pdf->SetFillColor(200, 200, 200);
        $this->pdf->Cell(182, 0.3, '', 0, 0, 'C', 'F');
        $this->pdf->Ln(5);
    }

    public function ExampleDataSection($arr_data)
    {
        [$pattern_type, $sum_example_qty, $example_shirt_filter] = $arr_data;

        if ($this->pdf->GetY() > 229) {
            $this->Header();
        }

        if ($sum_example_qty != 0) {
            $this->pdf->SetFont('PSLKittithadaBold', '', 18);
            $this->pdf->Cell(19, 10, $this->safeIconv('ตัวอย่าง'), 0, 1);
            $this->pdf->Ln(3);

            if ($pattern_type == 1) {
                $this->renderedExShirtTable([$example_shirt_filter, 1]);
            } else {
                $this->renderedExShirtTable([$example_shirt_filter['men'], 2]);
                $this->renderedExShirtTable([$example_shirt_filter['women'], 3]);
            }

        } else {
            $this->pdf->SetFont('PSLKittithadaBold', '', 18);
            $this->pdf->Cell(19, 10, $this->safeIconv('ตัวอย่าง :'), 0);
            $this->pdf->SetFont('PSLKittithada', '', 18);
            $this->pdf->Cell(19, 10, $this->safeIconv('ไม่มีการขอตัวอย่าง'), 0, 1);
            $this->pdf->Ln(3);
        }

        // Horizontal line 5 between row
        $this->pdf->SetFillColor(200, 200, 200);
        $this->pdf->Cell(182, 0.3, $this->safeIconv(' '), 0, 0, 'C', 'F');
    }

    public function ShirtSizesDataSection($arr_data)
    {
        [$pattern_type, $pattern_name, $pattern_sizes_filter, $sum_example_qty] = $arr_data;
        $size_tag_r = $this->data->size_tag == 1 ? 'ติด' : 'ไม่ติด';
        

        if ($this->pdf->GetY() > 228 || $pattern_type !== 1 && $sum_example_qty > 0) {
            $this->Header();
        }

        $this->pdf->Ln(7);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(24, 8, $this->safeIconv('ติดป้ายไซซ์ : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(56, 8, $this->safeIconv($size_tag_r), 0);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(18, 8, $this->safeIconv('แพ็คกิ้ง : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(0, 8, $this->safeIconv($this->data->packaging), 0, 1);
        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(42, 10, $this->safeIconv('รายละเอียดเพิ่มเติม : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(0, 10, $this->safeIconv('แพทเทิน : ') . $pattern_name, 0);
        $this->pdf->Ln(15);

        if ($pattern_type == 1) {
            $this->renderedShirtSizeTable([$pattern_sizes_filter, 1]);

        } else {
            $this->renderedShirtSizeTable([$pattern_sizes_filter['men'], 2]);
            $this->pdf->Ln(20);
            $this->renderedShirtSizeTable([$pattern_sizes_filter['women'], 3]);
        }
    }

    public function PoloDataSection($data)
    {
        $convert_polo_data = config('worksheet.polo_data');
        $collar_r = $convert_polo_data['collar'][$data->collar];
        $collar_type_r = $data->other_collar_type != '' ? $data->other_collar_type : $convert_polo_data['collar_type'][$data->collar_type];
        $button_r = $convert_polo_data['button'][$data->button];
        $placket_r = $data->other_placket != '' ? $data->other_placket : $convert_polo_data['placket'][$data->placket];
        $sleeve_r = $convert_polo_data['sleeve'][$data->sleeve];
        $pocket_r = $convert_polo_data['pocket'][$data->pocket];
        $bottom_hem_detail_r = $this->worksheetService->checkPoloDetailValue($data->bottom_hem, $data->bottom_hem_detail);
        $back_seam_detail_r = $this->worksheetService->checkPoloDetailValue($data->back_seam, $data->back_seam_detail);
        $side_vents_detail_r = $this->worksheetService->checkPoloDetailValue($data->side_vents, $data->side_vents_detail);
        $polo_embroiders_r = $data->poloEmbroiders;

        $tailoring_r = [
            'รายละเอียดปกคอ' => $data->collar_type_detail, 
            'ชื่อสาป' => $placket_r, 
            'สาปนอก' => $data->outer_placket_detail, 
            'สาปใน' => $data->inner_placket_detail,
            'รายละเอียดกระดุม' => $data->other_button,
            'สีกระดุม' => $data->button_color,
            'รูปแบบแขน' => $sleeve_r,
            'รายละเอียดแขน' => $data->sleeve_detail,
            'รูปแบบกระเป๋า' => $pocket_r,
            'รายละเอียดกระเป๋า' => $data->pocket_detail,
            'ชายซ้อน / ชายเบิล' => $bottom_hem_detail_r,
            'วงพระจันทร์' => $back_seam_detail_r,
            'ผ่าข้าง' => $side_vents_detail_r
        ];

        $this->pdf->SetFont('PSLKittithadaBold', '', 18);
        $this->pdf->Cell(63, 8, $this->safeIconv('รูปแบบปก | ชนิดปกคอ | กระดุม : '), 0);
        $this->pdf->SetFont('PSLKittithada', '', 18);
        $this->pdf->Cell(0, 8, $this->safeIconv($collar_r.'  |  '.$collar_type_r.'  |  กระดุมแบบ '.$button_r), 0, 1);
        $this->pdf->Ln(2);

        foreach ($tailoring_r as $key => $value) {

            $w = $convert_polo_data['width'][$key];
    
            if($value != '') {
                $this->pdf->SetFont('PSLKittithadaBold', '', 18);
                $this->pdf->Cell($w, 7, $this->safeIconv($key).' : ', 0, 0);
                $this->pdf->SetFont('PSLKittithada', '', 18);
                $this->pdf->MultiCell(0, 7, $this->safeIconv($value), 0, 0);
                $this->pdf->Ln(3);
                
                if ($this->pdf->GetY() > 266) 
                {
                    $this->Header();
                } 
            }
        }

        if (count($polo_embroiders_r) > 0) {
        
            // Horizontal line 3 between row
            $this->pdf->Ln(5);
            $this->pdf->SetFillColor(200, 200, 200);
            $this->pdf->Cell(182, 0.3, '', 0, 0, 'C', 'F');
            $this->pdf->Ln(5);
            
            if ($this->pdf->GetY() > 206 && count($polo_embroiders_r) > 4 || $this->pdf->GetY() > 229) 
            {
                $this->Header();
            } 
            
            $this->pdf->SetDrawColor(200, 200, 200);
            $this->pdf->SetFont('PSLKittithadaBold', '', 18);
            $this->pdf->Cell(19, 10, $this->safeIconv('ตำแหน่งลายปัก'), 0, 1);
            $this->pdf->Ln(4);
            $this->pdf->SetX(22);
            $this->pdf->SetFillColor(246, 246, 246);
            $this->pdf->Cell(20, 10, $this->safeIconv('ลำดับ'), 1, 0, 'C', 'F');
            $this->pdf->Cell(55, 10, $this->safeIconv('ตำแหน่ง'), 1, 0, 'C', 'F');
            $this->pdf->Cell(90, 10, $this->safeIconv('ขนาด'), 1, 1, 'C', 'F');
            $i = 1;
            
            foreach($polo_embroiders_r as $key => $value) {

                $embroider_position_r = $convert_polo_data['embroider_position'][$value['embroider_position']];
                
                $this->pdf->SetX(22);
                $this->pdf->SetFont('PSLKittithada', '', 18);
                $this->pdf->Cell(20, 10, $i, 1, 0, 'C');
                $this->pdf->Cell(55, 10, $this->safeIconv($embroider_position_r), 1, 0, 'C');
                // $this->pdf->Cell(90, 10, $this->safeIconv($value['embroider_size']), 1, 1, 'C');
                $this->pdf->MultiCell(90, 10, $this->safeIconv($value['embroider_size']), 1);
    
                $i++;
            }
        }
    }

    private function renderedShirtSizeTable($arr_data) {

        [$pattern_sizes_filter, $patternType] = $arr_data;
        $pattern_sizes_len = count($pattern_sizes_filter);

        $shirtPatternTitlesMap = [
            2 => 'ชาย',
            3 => 'หญิง',
        ];

        $sum_quantity = 0;
        foreach ($pattern_sizes_filter as $shirt_sizes_item) {
          $sum_quantity += $shirt_sizes_item['quantity'];
        }

        $this->pdf->SetDrawColor(200, 200, 200);
        $this->pdf->SetFont('PSLKittithadaBold', '', 16);
        
        if ($patternType !== 1) {
            $this->pdf->SetX(15);
            $this->pdf->SetFillColor(246, 246, 246);
            $this->pdf->Cell(($pattern_sizes_len * 13) + 25, 10, $this->safeIconv($shirtPatternTitlesMap[$patternType]), 1, 0, 'C', 'F');
            $this->pdf->Ln(10);
        }
        
        $this->pdf->SetX(15);
        $this->pdf->SetFillColor(246, 246, 246);
        $this->pdf->Cell(25, 10, $this->safeIconv('ไซซ์'), 1, 0, 'C', 'F');
        $this->pdf->SetFont('PSLKittithada', '', 16);
        $i = 0;

        foreach ($pattern_sizes_filter as $shirt_size_item) {
            $this->pdf->Cell(13, 10, strtoupper($shirt_size_item['size_name']), 1, 0, 'C');
            $i++;
        }

        $this->pdf->Ln(10);
        $this->pdf->SetX(15);
        $this->pdf->SetFillColor(246, 246, 246);
        $this->pdf->SetFont('PSLKittithadaBold', '', 16);
        $this->pdf->Cell(25, 10, $this->safeIconv('จำนวน'), 1, 0, 'C', 'F');
        $this->pdf->SetFont('PSLKittithada', '', 16);
        
        foreach ($pattern_sizes_filter as $shirt_size_item) {
            $this->pdf->Cell(13, 10, $shirt_size_item['quantity'], 1, 0, 'C');
        }

        $w3 = $i*13;
        $this->pdf->Ln(10);
        $this->pdf->SetX(15);
        $this->pdf->SetFont('PSLKittithadaBold', '', 16);
        $this->pdf->SetFillColor(246, 246, 246);
        $this->pdf->Cell(25, 10, $this->safeIconv('รวมทั้งหมด'), 1, 0, 'C', 'F');

        if ($patternType == 1) {
            ($this->data->total_quantity != $sum_quantity && $this->pdf->SetTextColor(220, 53, 69));
        }

        $this->pdf->Cell($w3, 10, $sum_quantity, 1, 0, 'C');   
    }

    private function renderedExShirtTable($arr_data) {

        [$example_shirt_filter, $pattern_type] = $arr_data;

        $shirtPatternTitlesMap = [
            2 => 'ชาย',
            3 => 'หญิง',
        ];

        $sum_quantity = 0;
        $example_shirt_len = 0;
        foreach ($example_shirt_filter as $shirt_sizes_item) {
          $sum_quantity += (int)$shirt_sizes_item['ex_quantity'];

          if ($shirt_sizes_item['ex_quantity'] !== '') {
            $example_shirt_len++; 
          }
        }

        $this->pdf->SetDrawColor(200, 200, 200);
        $this->pdf->SetLineWidth(0.4);

        if ($pattern_type !== 1) {
            $this->pdf->SetX(15);
            $this->pdf->SetFillColor(246, 246, 246);
            $this->pdf->Cell(($example_shirt_len * 14) + 25, 10, $this->safeIconv($shirtPatternTitlesMap[$pattern_type]), 1, 0, 'C', 'F');
            $this->pdf->Ln(10);
        }

        $this->pdf->SetX(15);
        $this->pdf->SetFont('PSLKittithadaBold', '', 16);
        $this->pdf->SetFillColor(246, 246, 246);
        $this->pdf->Cell(25, 10, $this->safeIconv('ไซซ์'), 1, 0, 'C', 'F');
        $this->pdf->SetFont('PSLKittithada', '', 16);
        $i = 0;

        foreach ($example_shirt_filter as $example_item) {

            if ($example_item['ex_quantity'] !== '') {
                $this->pdf->Cell(14, 10, strtoupper($example_item['ex_size_name']), 1, 0, 'C');
                $i++;
            }
        }
        
        $this->pdf->Ln(10);
        $this->pdf->SetX(15);
        $this->pdf->SetFont('PSLKittithadaBold', '', 16);
        $this->pdf->SetFillColor(246, 246, 246);
        $this->pdf->Cell(25, 10, $this->safeIconv('จำนวน'), 1, 0, 'C', 'F');
        $this->pdf->SetFont('PSLKittithada', '', 16);

        foreach ($example_shirt_filter as $example_item) {
            
            if ($example_item['ex_quantity'] !== '') {
                $this->pdf->Cell(14, 10, $example_item['ex_quantity'], 1, 0, 'C');
            }
        }
        
        $w2 = $i*14;
        $this->pdf->Ln(10);
        $this->pdf->SetX(15);
        $this->pdf->SetFont('PSLKittithadaBold', '', 16);
        $this->pdf->SetFillColor(246, 246, 246);
        $this->pdf->Cell(25, 10, $this->safeIconv('รวมทั้งหมด'), 1, 0, 'C', 'F');
        $this->pdf->Cell($w2, 10, $sum_quantity, 1, 1, 'C');
        $this->pdf->Ln(9);

    }

}
