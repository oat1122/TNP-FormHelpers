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
      $groupsData=[]; 
      $no=1; 
      
      // ใช้ข้อมูลจาก groups ที่สร้างจาก invoice_items
      $invoiceGroups = $groups ?? [];
    @endphp
    
    @if(!empty($invoiceGroups))
      @foreach($invoiceGroups as $g)
        @php
          $unit=$g['unit']??'ชิ้น';
          $meta=array_filter([$g['pattern']?:null,$g['fabric']?:null,$g['color']?:null]);
          $title=($g['name']?:'ไม่ระบุชื่องาน'); 
          if($meta){
            $title.=' <span class="meta-light">'.implode(', ',$meta).'</span>';
          }
          $items=[]; 
          foreach($g['rows'] as $r){ 
            $qty=(float)($r['quantity']??0); 
            $price=(float)($r['unit_price']??0); 
            $amount=$qty*$price; 
            $discountAmount = (float)($r['discount_amount'] ?? 0);
            $finalAmount = max(0, $amount - $discountAmount);
            
            $items[]=[
              'desc'=> ($r['size']?:'-'),
              'qty'=>$qty,
              'unit'=>$unit,
              'price'=>$price,
              'amount'=>$amount,
              'discount_amount'=>$discountAmount,
              'final_amount'=>$finalAmount,
              'item_description'=>$r['item_description'] ?? null
            ]; 
          }
          $groupsData[]=[
            'no'=>$no,
            'title'=>$title,
            'items'=>$items
          ]; 
          $no++;
        @endphp
      @endforeach

      <table class="items-table slim table-numbers-sm">
        <colgroup>
          <col class="w-desc">  {{-- รายละเอียด --}}
          <col class="w-unit-price">  {{-- Unit Price --}}
          <col class="w-qty">  {{-- Qnt --}}
          <col class="w-total">  {{-- Total --}}
        </colgroup>
        <thead>
          <tr>
            <th class="desc-head text-center">รายละเอียด</th>
            <th class="text-right">ราคาต่อหน่วย</th>
            <th class="text-right">จำนวน</th>
            <th class="text-right">ยอดรวม</th>
          </tr>
        </thead>
        <tbody>
          @foreach($groupsData as $g)
            {{-- แถวหัวข้อกลุ่ม (parent) --}}
            <tr class="group-row">
              <td class="desc"><span class="group-no">{{ $g['no'] }}.</span> {!! $g['title'] !!}</td>
              <td class="num muted"></td>
              <td class="num muted"></td>
              <td class="num muted"></td>
            </tr>

            {{-- แถวรายการย่อย (child) --}}
            @foreach($g['items'] as $it)
              <tr class="item-row">
                <td class="desc child">
                  {{ $it['desc'] }}
                  @if(!empty($it['item_description']))
                    <br/><small class="item-description">{{ $it['item_description'] }}</small>
                  @endif
                </td>
                <td class="num">{{ number_format($it['price'], 2) }}</td>
                <td class="num">{{ number_format($it['qty']) }} {{ $it['unit'] }}</td>
                <td class="num">
                  @if($it['discount_amount'] > 0)
                    <div>{{ number_format($it['amount'], 2) }}</div>
                    <div class="discount-line">หัก {{ number_format($it['discount_amount'], 2) }}</div>
                    <div class="final-amount">{{ number_format($it['final_amount'], 2) }}</div>
                  @else
                    {{ number_format($it['final_amount'], 2) }}
                  @endif
                </td>
              </tr>
            @endforeach
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
            <h3 class="panel-title panel-title--sm">หมายเหตุ</h3> <br/>  
            <div class="panel-content">
              @php
                $afterDepositNotes = $invoice->notes ?? '';
                if (empty($afterDepositNotes)) {
                  $afterDepositNotes = "นี่เป็นใบแจ้งหนี้สำหรับยอดคงเหลือหลังจากการชำระมัดจำแล้ว";
                }
              @endphp
              {!! nl2br(e($afterDepositNotes)) !!}
            </div>


          </td>
          
          {{-- Summary Section (Right) - เน้นยอดคงเหลือ --}}
          <td class="panel-box">
            
            {{-- ข้อมูลการชำระเงิน --}}
            <h3 class="panel-title panel-title--sm">ข้อมูลการชำระเงิน</h3>
            <div class="panel-content" style="margin-bottom: 15pt;">
              @php
                // สร้างข้อมูลการเรียกเก็บเงินมัดจำหลัง
                $depositChargeInfo = '';
                if ($invoice->type === 'deposit' && !empty($invoice->quotation)) {
                  $depositChargeInfo = "รับเงินส่วนที่เหลือหลังจากชำระมัดจำ";
                  if (!empty($invoice->quotation->number)) {
                    $depositChargeInfo .= "\nอ้างอิงจากใบเสนอราคาเลขที่ " . $invoice->quotation->number;
                    if (!empty($invoice->quotation->final_total_amount)) {
                      $depositChargeInfo .= "\nใบเสนอราคาดังกล่าวมีมูลค่า " . number_format($invoice->quotation->final_total_amount, 2) . " บาท";
                      
                      // คำนวณยอดมัดจำเพื่อแสดงยอดคงเหลือ
                      $depositAmountDisplay = 0;
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
                        $depositAmountDisplay = (float)($invoice->deposit_amount ?? 0);
                      }
                      
                      // แสดงยอดมัดจำที่ชำระไปแล้ว
                      if ($depositAmountDisplay > 0) {
                        $depositChargeInfo .= "\nหักเงินมัดจำที่ชำระไปแล้ว " . number_format($depositAmountDisplay, 2) . " บาท";
                      }
                      
                      // คำนวณยอดคงเหลือ
                      $remainingAmount = max(0, $invoice->quotation->final_total_amount - $depositAmountDisplay);
                      if ($remainingAmount > 0) {
                        $depositChargeInfo .= "\nยอดคงเหลือที่ต้องชำระ " . number_format($remainingAmount, 2) . " บาท";
                      }
                    }
                  }
                } elseif ($invoice->type === 'remaining' && !empty($invoice->quotation)) {
                  $depositChargeInfo = "รับเงินส่วนที่เหลือ";
                  if (!empty($invoice->quotation->number)) {
                    $depositChargeInfo .= "\nอ้างอิงจากใบเสนอราคาเลขที่ " . $invoice->quotation->number;
                    if (!empty($invoice->quotation->final_total_amount)) {
                      $depositChargeInfo .= "\nใบเสนอราคามูลค่า " . number_format($invoice->quotation->final_total_amount, 2) . " บาท";
                    }
                    if (!empty($invoice->paid_amount)) {
                      $depositChargeInfo .= "\nหักเงินมัดจำที่รับแล้ว " . number_format($invoice->paid_amount, 2) . " บาท";
                    }
                  }
                } elseif ($invoice->type === 'partial' && !empty($invoice->quotation)) {
                  $depositChargeInfo = "รับชำระบางส่วน";
                  if (!empty($invoice->quotation->number)) {
                    $depositChargeInfo .= "\nอ้างอิงจากใบเสนอราคาเลขที่ " . $invoice->quotation->number;
                    if (!empty($invoice->quotation->final_total_amount)) {
                      $depositChargeInfo .= "\nใบเสนอราคามูลค่า " . number_format($invoice->quotation->final_total_amount, 2) . " บาท";
                    }
                  }
                }
              @endphp
              
              @if(!empty($depositChargeInfo))
                <div><strong>รายการ:</strong> {!! nl2br(e($depositChargeInfo)) !!}</div>
                <div><strong>จำนวนเงิน:</strong> {{ number_format($invoice->final_total_amount ?? 0, 2) }} บาท</div>
                <br/>
              @endif
              
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
                // After Deposit Mode: คำนวณยอดคงเหลือจากใบเสนอราคาทั้งหมด หักมัดจำ
                if (($invoice->type ?? null) === 'deposit' && !empty($invoice->quotation)) {
                  // ใช้ยอดจากใบแจ้งหนี้โดยตรง (เพราะเป็นยอดคงเหลือแล้ว)
                  $subtotal = $finalTotalAmount;
                  $vatAmount = 0; // ยอดคงเหลือรวม VAT แล้ว
                  $specialDiscountAmount = 0;
                  $showSpecialDiscount = false;
                  $withholdingTaxAmount = 0;
                  $showWithholdingTax = false;
                }
              @endphp

              {{-- 1. Subtotal (ยอดคงเหลือ) --}}
              <tr>
                <td class="summary-label">ยอดคงเหลือที่ต้องชำระ</td>
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
              
              {{-- 3. VAT (ถ้ามี) --}}
              @if($vatAmount > 0)
                <tr>
                  <td class="summary-label">ภาษีมูลค่าเพิ่ม (VAT {{ $summary['vat_percentage'] ?? 7 }}%)</td>
                  <td class="summary-amount">
                    <div class="amount-container">
                      <span class="amount-main">{{ number_format($vatAmount, 2) }}</span>
                    </div>
                  </td>
                </tr>
              @endif

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