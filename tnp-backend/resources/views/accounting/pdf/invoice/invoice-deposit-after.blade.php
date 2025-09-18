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
          <col style="width: 42%;">
          <col style="width: 58%;">
        </colgroup>
        <tr>
          {{-- Notes Section (Left) --}}
          <td class="panel-box panel-notes">
            <h3 class="panel-title panel-title--sm">หมายเหตุ</h3>   
            <div class="panel-content">
              @php
                $afterDepositNotes = $invoice->notes ?? '';
                if (empty($afterDepositNotes)) {
                  $afterDepositNotes = "นี่เป็นใบแจ้งหนี้สำหรับยอดคงเหลือหลังจากการชำระมัดจำแล้ว";
                }
              @endphp
              {!! nl2br(e($afterDepositNotes)) !!}
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
                // สำหรับใบแจ้งหนี้หลังมัดจำ - คำนวณจากใบเสนอราคาทั้งหมด หักด้วยเงินมัดจำ
                $originalQuotationTotal = 0;
                $depositAmountPaid = 0;
                $referenceInvoiceNumber = '';
                
                if (($invoice->type ?? null) === 'deposit' && !empty($invoice->quotation)) {
                  // ยอดเดิมจากใบเสนอราคา
                  $originalQuotationTotal = (float) ($invoice->quotation->final_total_amount ?? 0);
                  
                  // หาใบแจ้งหนี้มัดจำที่อ้างอิงใบเสนอราคาเดียวกัน
                  $depositInvoice = null;
                  if (!empty($invoice->quotation->id)) {
                    // สมมติว่ามีการส่ง $relatedDepositInvoice มาด้วย หรือต้อง query หา
                    // ในกรณีนี้ใช้ข้อมูลจาก invoice เดิม
                    $depositAmountPaid = (float) ($invoice->paid_amount ?? 0);
                    $referenceInvoiceNumber = ''; // จะต้องหาจาก database หรือส่งมาด้วย
                  }
                  
                  // คำนวณยอดคงเหลือ
                  $remainingAmount = max(0, $originalQuotationTotal - $depositAmountPaid);
                  
                  // ใช้ยอดคงเหลือเป็นฐานในการคำนวณ VAT
                  $vatPct = (float) ($summary['vat_percentage'] ?? $invoice->vat_percentage ?? 7);
                  $hasVat = (bool) ($invoice->has_vat ?? true);
                  
                  // คำนวณ VAT จากยอดคงเหลือ (ถ้ายอดคงเหลือรวม VAT แล้ว ต้องแยกออกมา)
                  if ($hasVat && $vatPct > 0) {
                    // หากยอดคงเหลือรวม VAT แล้ว ให้แยก VAT ออกมา
                    $subtotalBeforeVat = round($remainingAmount / (1 + ($vatPct / 100)), 2);
                    $vatAmount = round($remainingAmount - $subtotalBeforeVat, 2);
                    $subtotal = $subtotalBeforeVat;
                  } else {
                    $subtotal = $remainingAmount;
                    $vatAmount = 0;
                  }
                  
                  $specialDiscountAmount = 0;
                  $showSpecialDiscount = false;
                  $withholdingTaxAmount = 0;
                  $showWithholdingTax = false;
                  $finalTotalAmount = $remainingAmount;
                }
              @endphp

              {{-- แสดงข้อมูลอ้างอิงใบแจ้งหนี้หลัก --}}
              @if(($invoice->type ?? null) === 'deposit' && !empty($invoice->quotation))
                <tr class="reference-row">
                  <td class="summary-label">อ้างอิง</td>
                  <td class="summary-amount">
                    <div class="amount-container">
                      <span class="amount-main">{{ $invoice->quotation->number ?? 'N/A' }}</span>
                    </div>
                  </td>
                </tr>
              @endif

              {{-- 1. รวมเป็นเงิน (ยอดเดิมจากใบเสนอราคา) --}}
              <tr>
                <td class="summary-label">รวมเป็นเงิน</td>
                <td class="summary-amount">
                  <div class="amount-container">
                    <span class="amount-main">{{ number_format($originalQuotationTotal > 0 ? $originalQuotationTotal : $subtotal, 2) }}</span>
                  </div>
                </td>
              </tr>
              
              {{-- 2. หักเงินมัดจำ (สำหรับ after deposit) --}}
              @if(($invoice->type ?? null) === 'deposit' && $depositAmountPaid > 0)
                <tr class="deposit-deduction-row">
                  <td class="summary-label">หักเงินมัดจำ @if(!empty($referenceInvoiceNumber))({{ $referenceInvoiceNumber }})@endif</td>
                  <td class="summary-amount discount">
                    <div class="amount-container">
                      <span class="amount-main">{{ number_format($depositAmountPaid, 2) }}</span>
                    </div>
                  </td>
                </tr>
                
                {{-- 3. จำนวนเงินหลังหักมัดจำ --}}
                <tr class="after-deposit-row">
                  <td class="summary-label">จำนวนเงินหลังหักมัดจำ</td>
                  <td class="summary-amount">
                    <div class="amount-container">
                      <span class="amount-main">{{ number_format($subtotal, 2) }}</span>
                    </div>
                  </td>
                </tr>
              @endif
              
              {{-- 4. VAT --}}
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
                <td class="summary-label">จำนวนเงินรวมทั้งสิ้น</td>
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