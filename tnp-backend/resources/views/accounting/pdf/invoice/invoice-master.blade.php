<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  
  {{-- CSS is loaded separately by InvoicePdfMasterService --}}
</head>
<body>
  <div class="document-content">

      

    {{-- ตารางสินค้า/บริการ --}}
    <div class="mb-3">รายละเอียดสินค้า/บริการ</div>
    @php 
      $no = 1; 
      
      // ตรวจสอบประเภทใบแจ้งหนี้และสร้างรายการตามประเภท
      $invoiceItems = [];
      
    if ($invoice->type === 'deposit' && !empty($invoice->quotation)) {
          // กรณีเรียกเก็บเงินมัดจำ
          $depositDescription = "รับมัดจำ";
      if (!empty($invoice->quotation->number)) {
        $depositDescription .= "\nอ้างอิงจากใบเสนอราคาเลขที่ " . $invoice->quotation->number;
        if (!empty($invoice->quotation->final_total_amount)) {
          // ปรับถ้อยคำให้ชัดเจนตามที่ต้องการ
          $depositDescription .= "\nใบเสนอราคาดังกล่าวมีมูลค่า " . number_format($invoice->quotation->final_total_amount, 2) . " บาท";
        }
      }
      // คำนวณยอดมัดจำเพื่อแสดง: ใช้ฐานก่อน VAT เมื่อโหมดเป็น percentage
      $depositAmountDisplay = null;
      $depositMode = $invoice->deposit_mode ?? 'percentage';
      if ($depositMode === 'percentage') {
        $subtotal = (float)($invoice->quotation->subtotal ?? 0);
        $special  = (float)($invoice->quotation->special_discount_amount ?? 0);
        $preVatBase = max(0, round($subtotal - $special, 2));
        if ($preVatBase <= 0) {
          $total = (float)($invoice->quotation->total_amount ?? 0);
          $vat   = (float)($invoice->quotation->vat_amount ?? 0);
          $preVatBase = max(0, round($total - $vat - $special, 2));
        }
        $pct = max(0, min(100, (float)($invoice->deposit_percentage ?? 0)));
        $depositAmountDisplay = round($preVatBase * ($pct/100), 2);
      } else {
        $depositAmountDisplay = (float)($invoice->deposit_amount ?? $invoice->final_total_amount ?? 0);
      }
          
      $invoiceItems[] = [
              'description' => $depositDescription,
              'quantity' => 1,
              'unit' => 'รายการ',
        'unit_price' => $depositAmountDisplay,
        'amount' => $depositAmountDisplay
          ];
      } elseif ($invoice->type === 'remaining' && !empty($invoice->quotation)) {
          // กรณีเรียกเก็บเงินส่วนที่เหลือ
          $remainingDescription = "รับเงินส่วนที่เหลือ";
          if (!empty($invoice->quotation->number)) {
              $remainingDescription .= "\nอ้างอิงจากใบเสนอราคาเลขที่ " . $invoice->quotation->number;
              if (!empty($invoice->quotation->final_total_amount)) {
                  $remainingDescription .= "\nใบเสนอราคามูลค่า " . number_format($invoice->quotation->final_total_amount, 2) . " บาท";
              }
              if (!empty($invoice->paid_amount)) {
                  $remainingDescription .= "\nหักเงินมัดจำที่รับแล้ว " . number_format($invoice->paid_amount, 2) . " บาท";
              }
          }
          
          $invoiceItems[] = [
              'description' => $remainingDescription,
              'quantity' => 1,
              'unit' => 'รายการ',
              'unit_price' => $invoice->final_total_amount,
              'amount' => $invoice->final_total_amount
          ];
      } elseif ($invoice->type === 'partial' && !empty($invoice->quotation)) {
          // กรณีเรียกเก็บบางส่วน
          $partialDescription = "รับชำระบางส่วน";
          if (!empty($invoice->quotation->number)) {
              $partialDescription .= "\nอ้างอิงจากใบเสนอราคาเลขที่ " . $invoice->quotation->number;
              if (!empty($invoice->quotation->final_total_amount)) {
                  $partialDescription .= "\nใบเสนอราคามูลค่า " . number_format($invoice->quotation->final_total_amount, 2) . " บาท";
              }
          }
          
          $invoiceItems[] = [
              'description' => $partialDescription,
              'quantity' => 1,
              'unit' => 'รายการ',
              'unit_price' => $invoice->final_total_amount,
              'amount' => $invoice->final_total_amount
          ];
      } else {
          // กรณีปกติ ใช้ items ที่มีอยู่
          $invoiceItems = $items;
      }
    @endphp
    
    @if(!empty($invoiceItems))
      <table class="items-table slim table-numbers-sm invoice-items">
        <colgroup>
          <col class="w-no">
          <col class="w-desc">
          <col class="w-total">
        </colgroup>
        <thead>
          <tr>
            <th class="desc-head text-left">ลำดับ</th>
            <th class="text-left">รายละเอียด</th>
            <th class="text-right">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          @foreach($invoiceItems as $item)
            <tr>
              <td class="num">{{ $no++ }}</td>
              <td class="desc">{!! nl2br(e($item['description'] ?? $item['item_description'] ?? '-')) !!}</td>
              <td class="num">{{ number_format($item['amount'] ?? (($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0)), 2) }}</td>
            </tr>
          @endforeach
        </tbody>
      </table>
    @else
      <div class="no-items-box"><strong>ไม่มีรายการสินค้า/บริการ</strong></div>
    @endif

    {{-- Helper: แปลงตัวเลขเป็นข้อความไทยแบบบาทสตางค์ --}}
    @php
      $thaiBahtText=function($number){
        $number=(float)$number; 
        $txtnum1=['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า']; 
        $txtnum2=['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
        
        $toWords=function($numStr) use (&$toWords,$txtnum1,$txtnum2){ 
          $len=strlen($numStr); 
          if($len>7){
            $head=substr($numStr,0,$len-6); 
            $tail=substr($numStr,-6); 
            return $toWords(ltrim($head,'0')).'ล้าน'.$toWords(str_pad($tail,6,'0',STR_PAD_LEFT));
          }
          
          $result=''; 
          for($i=0;$i<$len;$i++){ 
            $n=(int)$numStr[$i]; 
            $pos=$len-$i-1; 
            if($n===0) continue; 
            if($pos===0&&$n===1&&$len>1){
              $result.='เอ็ด';
            } elseif($pos===1&&$n===2){
              $result.='ยี่';
            } elseif($pos===1&&$n===1){ 
              // skip
            } else { 
              $result.=$txtnum1[$n]; 
            } 
            $result.=$txtnum2[$pos]??''; 
          }
          return $result===''?'ศูนย์':$result; 
        };
        
        $formatted=number_format($number,2,'.',''); 
        [$intPart,$decPart]=explode('.',$formatted); 
        $intPart=ltrim($intPart,'0'); 
        $text=($intPart===''?'ศูนย์':$toWords($intPart)).'บาท'; 
        $dec=(int)$decPart; 
        $text.=$dec===0?'ถ้วน':$toWords(str_pad((string)$dec,2,'0',STR_PAD_LEFT)).'สตางค์'; 
        return $text; 
      };
    @endphp

    {{-- Summary and Notes Section --}}
    <div class="summary-notes-wrapper">
      <table class="summary-notes-table">
        <colgroup>
          <col style="width: 40%;">
          <col style="width: 55%;">
        </colgroup>
        <tr>
          {{-- Notes Section (Left) --}}
          <td class="panel-box panel-notes">
            <h3 class="panel-title panel-title--sm">หมายเหตุ</h3>   
            <div class="panel-content">
              {!! !empty($invoice->notes) ? nl2br(e($invoice->notes)) : 'ไม่มีหมายเหตุ' !!}
            </div><br/>

            {{-- ข้อมูลการชำระเงิน --}}
            @if(!empty($invoice->payment_method) || !empty($invoice->payment_terms) || !empty($invoice->due_date))
              <h3 class="panel-title panel-title--sm" style="margin-top: 15pt;">ข้อมูลการชำระเงิน</h3> 
              <div class="panel-content">
                @if(!empty($invoice->payment_method))
                  <div>วิธีการชำระเงิน: {{ $invoice->payment_method }}</div>
                @endif
                
                @if(!empty($invoice->payment_terms))
                  <div>เงื่อนไขการชำระ: {{ $invoice->payment_terms }}</div>
                @endif
                
                @if(!empty($invoice->due_date))
                  <div>กำหนดชำระ: {{ date('d/m/Y', strtotime($invoice->due_date)) }}</div>
                @endif
              </div>
            @endif
          </td>
          
          {{-- Summary Section (Right) --}}
          <td class="panel-box">
            
            @php
              // Extract financial data from summary array
              $subtotal = (float) ($summary['subtotal'] ?? 0);
              $vatAmount = (float) ($summary['vat_amount'] ?? 0);
              $specialDiscountAmount = (float) ($summary['special_discount_amount'] ?? 0);
              $hasWithholdingTax = (bool) ($summary['has_withholding_tax'] ?? false);
              $withholdingTaxAmount = (float) ($summary['withholding_tax_amount'] ?? 0);
              $finalTotalAmount = (float) ($summary['final_total_amount'] ?? 0);
              
              // Conditional display logic
              $showSpecialDiscount = $specialDiscountAmount > 0;
              $showWithholdingTax = $hasWithholdingTax && $withholdingTaxAmount > 0;
            @endphp

            <table class="summary-table">
              <colgroup>
                <col style="width: 45%;">
                <col style="width: 55%;">
              </colgroup>
              
              @php
                // หากเป็นใบมัดจำ ให้คำนวณสรุปใหม่จากยอดมัดจำก่อน VAT
                if (($invoice->type ?? null) === 'deposit' && !empty($invoice->quotation)) {
                  $depositMode = $invoice->deposit_mode ?? 'percentage';
                  $vatPct = (float) ($summary['vat_percentage'] ?? $invoice->vat_percentage ?? 7);
                  $hasVat = (bool) ($invoice->has_vat ?? true);
                  $withholdingPct = (float) ($invoice->withholding_tax_percentage ?? 0);
                  $hasWithholdingTax = (bool) ($invoice->has_withholding_tax ?? false);

                  // base pre-VAT = subtotal - special discount; fallback total - vat - special
                  $qSubtotal = (float) ($invoice->quotation->subtotal ?? 0);
                  $qSpecial  = (float) ($invoice->quotation->special_discount_amount ?? 0);
                  $preVatBase = max(0, round($qSubtotal - $qSpecial, 2));
                  if ($preVatBase <= 0) {
                    $qTotal = (float) ($invoice->quotation->total_amount ?? 0);
                    $qVat   = (float) ($invoice->quotation->vat_amount ?? 0);
                    $preVatBase = max(0, round($qTotal - $qVat - $qSpecial, 2));
                  }

                  if ($depositMode === 'percentage') {
                    $pct = max(0, min(100, (float) ($invoice->deposit_percentage ?? 0)));
                    $depositSubtotal = round($preVatBase * ($pct/100), 2);
                  } else {
                    // amount mode: ถือว่าเป็นยอดก่อน VAT ที่จะใช้คิด VAT ตรงๆ
                    $depositSubtotal = (float) ($invoice->deposit_amount ?? 0);
                  }

                  // สร้างค่าใหม่เพื่อทับของเดิมสำหรับการแสดงผล
                  $subtotal = $depositSubtotal;
                  $specialDiscountAmount = 0; // ส่วนลดพิเศษได้รวมในฐาน pre-VAT แล้ว
                  $showSpecialDiscount = false;
                  $vatAmount = $hasVat ? round($depositSubtotal * ($vatPct/100), 2) : 0;
                  $withholdingTaxAmount = $hasWithholdingTax ? round($depositSubtotal * ($withholdingPct/100), 2) : 0;
                  $finalTotalAmount = max(0, round($depositSubtotal + $vatAmount - $withholdingTaxAmount, 2));
                }
              @endphp

              {{-- 1. Subtotal (ก่อน VAT) --}}
              <tr>
                <td class="summary-label">รวมเป็นเงิน</td>
                <td class="summary-amount">
                  <div class="amount-container">
                    <span class="amount-main">{{ number_format($subtotal, 2) }}</span>
                  </div>
                </td>
              </tr>
              
              {{-- 2. Special Discount (conditional) --}}
              @if($showSpecialDiscount)
                <tr class="discount-row">
                  <td class="summary-label">ส่วนลดพิเศษ</td>
                  <td class="summary-amount discount">
                    <div class="amount-container">
                      <span class="amount-main">{{ number_format($specialDiscountAmount, 2) }}</span>
                    </div>
                  </td>
                </tr>
              @endif
              
              {{-- 3. VAT --}}
              <tr>
                <td class="summary-label">ภาษีมูลค่าเพิ่ม (VAT {{ $summary['vat_percentage'] ?? 7 }}%)</td>
                <td class="summary-amount">
                  <div class="amount-container">
                    <span class="amount-main">{{ number_format($vatAmount, 2) }}</span>
                  </div>
                </td>
              </tr>

              {{-- 4. Withholding Tax (conditional) --}}
              @if($showWithholdingTax)
                <tr class="withholding-tax-row">
                  <td class="summary-label">หักภาษี ณ ที่จ่าย</td>
                  <td class="summary-amount withholding-tax">
                    <div class="amount-container">
                      <span class="amount-main">{{ number_format($withholdingTaxAmount, 2) }}</span>
                    </div>
                  </td>
                </tr>
              @endif
              
              {{-- Final Total --}}
              <tr class="total-row">
                <td class="summary-label">รวมเป็นเงินทั้งสิ้น</td>
                <td class="summary-amount">
                  <div class="amount-container">
                    <span class="amount-main {{ $finalTotalAmount > 999999 ? 'large-amount' : '' }}">
                      {{ number_format($finalTotalAmount, 2) }}
                    </span>
                  </div>
                </td>
              </tr>

              {{-- Thai text conversion using final_total_amount --}}
              <tr class="reading-row">
                <td colspan="2" class="reading-cell">
                  <div class="reading-full-width">({{ $thaiBahtText($finalTotalAmount) }})</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    {{-- Signature spacer: กันไม่ให้เนื้อหามาชนพื้นที่ลายเซ็นคงที่ด้านล่างหน้า --}}
    <div class="signature-spacer"></div>

  </div>
</body>
</html>
