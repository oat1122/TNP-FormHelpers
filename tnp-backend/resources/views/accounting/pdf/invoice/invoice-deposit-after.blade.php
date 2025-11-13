{{-- 
  ========================================
  Invoice Deposit After Template (Updated)
  ========================================
  
  การคำนวณและแสดงผลสำหรับเอกสารมัดจำหลัง (after):
  
  แหล่งข้อมูล (จากตาราง invoices):
  - subtotal_before_vat : ยอดก่อน VAT
  - deposit_amount_before_vat : ยอดมัดจำก่อน VAT (จากใบมัดจำก่อน)
  - has_vat (0/1), vat_percentage (ปกติ 7)
  
  สูตรการคำนวณ:
  1. รวมเป็นเงิน (ก่อน VAT) = subtotal_before_vat
  2. หักเงินมัดจำ (จากใบมัดจำก่อน, ก่อน VAT) = deposit_amount_before_vat
  3. จำนวนเงินหลังหักมัดจำ (ก่อน VAT) = subtotal_before_vat - deposit_amount_before_vat
  4. ภาษีมูลค่าเพิ่ม (VAT %) = has_vat ? (จำนวนเงินหลังหักมัดจำ * vat_percentage/100) : 0
  5. จำนวนเงินรวมทั้งสิ้น = จำนวนเงินหลังหักมัดจำ + ภาษีมูลค่าเพิ่ม
  
  หมายเหตุ: การคำนวณทำที่ InvoicePdfMasterService->calculateDepositAfterAmounts()
  View นี้แสดงผลเท่านั้น ไม่คำนวณซ้ำ
--}}
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
              'item_description'=>$r['item_description'] ?? null,
              'notes' => $r['notes'] ?? null,
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
          {{-- ปรับความกว้างคอลัมน์ --}}
          <col class="w-desc">       {{-- รายละเอียด --}}
          <col class="w-qty">        {{-- จำนวน --}}
          <col class="w-unit-price"> {{-- ราคาต่อหน่วย --}}
          <col class="w-total">      {{-- ยอดรวม --}}
        </colgroup>
        <thead>
          <tr>
            {{-- สลับหัวตาราง --}}
            <th class="desc-head text-center">รายละเอียด</th>
            <th class="text-right">จำนวน</th>
            <th class="text-right">ราคาต่อหน่วย</th>
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
                  @if(!empty($it['notes']))
                    <span class="item-note-inline" style="color: #888;"> {{ $it['notes'] }}</span>
                  @endif

                  {{-- @if(!empty($it['item_description']))
                    <br/><small class="item-description">{{ $it['item_description'] }}</small>
                  @endif --}}
                </td>
                {{-- สลับคอลัมน์ จำนวน และ ราคาต่อหน่วย --}}
                <td class="num">{{ number_format($it['qty']) }} {{ $it['unit'] }}</td>
                <td class="num">{{ number_format($it['price'], 2) }}</td>
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
            @if(!empty($invoice->company->account_name) || !empty($invoice->company->bank_name) || !empty($invoice->company->account_number))
              <h3 class="panel-title panel-title--sm" style="margin-top: 15pt;">ข้อมูลการชำระเงิน</h3> 
              <div class="panel-content">
                @if(!empty($invoice->company->account_name))
                  <div>ชื่อบัญชี: {{ $invoice->company->account_name }}</div>
                @endif
                
                @if(!empty($invoice->company->bank_name))
                  <div>ชื่อธนาคาร: {{ $invoice->company->bank_name }}</div>
                @endif
                
                @if(!empty($invoice->company->account_number))
                  <div>เลขบัญชี: {{ $invoice->company->account_number }}</div>
                @endif
              </div>
            @endif
          </td>
          
          {{-- Summary Section (Right) --}}
          <td class="panel-box">
            
            @php
              // Extract basic financial data from summary array
              $subtotal = (float) ($summary['subtotal'] ?? 0);
              $vatAmount = (float) ($summary['vat_amount'] ?? 0);
              $specialDiscountAmount = (float) ($summary['special_discount_amount'] ?? 0);
              $hasWithholdingTax = (bool) ($summary['has_withholding_tax'] ?? false);
              $withholdingTaxAmount = (float) ($summary['withholding_tax_amount'] ?? 0);
              $finalTotalAmount = (float) ($summary['final_total_amount'] ?? 0);
              
              // Extract deposit-after calculations from Service
              // InvoicePdfMasterService->calculateDepositAfterAmounts() ส่งมาให้
              $depositAfter = $summary['deposit_after'] ?? [];
              $isDepositAfter = (bool) ($depositAfter['is_deposit_after'] ?? false);
              
              if ($isDepositAfter) {
                // ใช้ข้อมูลจาก Service (ไม่คำนวณซ้ำใน View)
                // สูตรการคำนวณ:
                // 1. รวมเป็นเงิน (ก่อน VAT) = subtotal_before_vat
                $totalBeforeVat = (float) ($depositAfter['total_before_vat'] ?? 0);
                
                // 2. หักเงินมัดจำ (จากใบมัดจำก่อน, ก่อน VAT) = deposit_amount_before_vat
                $depositPaidBeforeVat = (float) ($depositAfter['deposit_paid_before_vat'] ?? 0);
                
                // 3. จำนวนเงินหลังหักมัดจำ (ก่อน VAT) = subtotal_before_vat - deposit_amount_before_vat
                $amountAfterDepositDeduction = (float) ($depositAfter['amount_after_deposit_deduction'] ?? 0);
                
                // 4. ภาษีมูลค่าเพิ่ม (VAT %) = has_vat ? (จำนวนเงินหลังหักมัดจำ * vat_percentage/100) : 0
                $vatOnRemaining = (float) ($depositAfter['vat_on_remaining'] ?? 0);
                
                // 5. จำนวนเงินรวมทั้งสิ้น = จำนวนเงินหลังหักมัดจำ + ภาษีมูลค่าเพิ่ม
                $finalTotalWithVat = (float) ($depositAfter['final_total_with_vat'] ?? 0);
                
                $referenceInvoiceNumber = (string) ($depositAfter['reference_invoice_number'] ?? '');
                
                // Override display values for deposit-after
                $vatAmount = $vatOnRemaining;
                $finalTotalAmount = $finalTotalWithVat;
                
                // Force showing deposit-related rows even if amounts are 0
                $showDepositDeduction = true;
              } else {
                // Use standard calculation for regular invoices
                $totalBeforeVat = $subtotal;
                $depositPaidBeforeVat = 0;
                $amountAfterDepositDeduction = 0;
                $referenceInvoiceNumber = '';
                $showDepositDeduction = false;
              }
              
              // Conditional display logic
              $showSpecialDiscount = $specialDiscountAmount > 0;
              $showWithholdingTax = $hasWithholdingTax && $withholdingTaxAmount > 0;
            @endphp

            <table class="summary-table">
              <colgroup>
                <col style="width: 45%;">
                <col style="width: 55%;">
              </colgroup>

              

              {{-- 1. รวมเป็นเงิน (ก่อน VAT) = subtotal_before_vat --}}
              <tr>
                <td class="summary-label">รวมเป็นเงิน </td>
                <td class="summary-amount">
                  <div class="amount-container">
                    <span class="amount-main">{{ number_format($isDepositAfter ? $totalBeforeVat : $subtotal, 2) }}</span>
                  </div>
                </td>
              </tr>
              
              {{-- 2. หักเงินมัดจำ (จากใบมัดจำก่อน, ก่อน VAT) = deposit_amount_before_vat --}}
              @if($isDepositAfter)
                <tr class="deposit-deduction-row">
                  <td class="summary-label">หักเงินมัดจำ@if(!empty($referenceInvoiceNumber)) {{ $referenceInvoiceNumber }}@endif</td>
                  <td class="summary-amount">
                    <div class="amount-container">
                      <span class="amount-main">{{ number_format($depositPaidBeforeVat, 2) }}</span>
                      
                      
                    </div>
                  </td>
                </tr>
                
                {{-- 3. จำนวนเงินหลังหักมัดจำ (ก่อน VAT) = subtotal_before_vat - deposit_amount_before_vat --}}
                <tr class="after-deposit-row">
                  <td class="summary-label">จำนวนเงินหลังหักมัดจำ</td>
                  <td class="summary-amount">
                    <div class="amount-container">
                      <span class="amount-main">{{ number_format($amountAfterDepositDeduction, 2) }}</span>
                    </div>
                  </td>
                </tr>
              @endif
              
              {{-- 4. ภาษีมูลค่าเพิ่ม (VAT %) = has_vat ? (จำนวนเงินหลังหักมัดจำ * vat_percentage/100) : 0 --}}
              <tr>
                <td class="summary-label">ภาษีมูลค่าเพิ่ม (VAT {{ $isDepositAfter ? ($depositAfter['vat_rate'] ?? 7) : ($summary['vat_percentage'] ?? 7) }}%)</td>
                <td class="summary-amount">
                  <div class="amount-container">
                    <span class="amount-main">{{ number_format($vatAmount, 2) }}</span>
                  </div>
                </td>
              </tr>

              {{-- 4. Withholding Tax (conditional - only for non-deposit-after invoices) --}}
              @if(!$isDepositAfter && $showWithholdingTax)
                <tr class="withholding-tax-row">
                  <td class="summary-label">หักภาษี ณ ที่จ่าย</td>
                  <td class="summary-amount withholding-tax">
                    <div class="amount-container">
                      <span class="amount-main">{{ number_format($withholdingTaxAmount, 2) }}</span>
                    </div>
                  </td>
                </tr>
              @endif
              
              {{-- 5. จำนวนเงินรวมทั้งสิ้น = จำนวนเงินหลังหักมัดจำ + ภาษีมูลค่าเพิ่ม --}}
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

    {{-- Spacer to reserve space for signature (prevent content from overlapping signature area) --}}
    <div style="height: 35mm; page-break-inside: avoid;"></div>

  </div>
</body>
</html>