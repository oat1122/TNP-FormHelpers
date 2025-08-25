<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  
  {{-- CSS is loaded separately by QuotationPdfMasterService --}}
</head>
<body>
  <div class="document-content">

    {{-- ข้อมูลลูกค้า --}}
    @php
      $name   = trim($customer['name'] ?? '-');
      $addr   = trim($customer['address'] ?? '-');
      $telRaw = $customer['tel'] ?? '';
      // แยกเบอร์ด้วย , / | หรือช่องว่างหลายตัว
      $phones = implode(', ', array_filter(preg_split('/[,\s\/|]+/', $telRaw)));
      $taxId  = trim($customer['tax_id'] ?? '');
      // format 13 หลักให้มีขีด (ถ้าอยากให้เหมือนทางการ)
      if (preg_match('/^\d{13}$/', $taxId)) {
          $taxId = preg_replace('/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/', '$1-$2-$3-$4-$5', $taxId);
      }
    @endphp

    <div class="customer-box mb-4">
      <div class="customer-name">{{ $name }}</div>
      <div class="customer-line">{!! nl2br(e($addr)) !!}</div>

      @if($phones)
        <div class="customer-line muted">โทร: {{ $phones }}</div>
      @endif

      @if($taxId !== '')
        <div class="customer-line muted">เลขประจำตัวผู้เสียภาษี: {{ $taxId }}</div>
      @endif
    </div>

    {{-- ตารางสินค้า/บริการ --}}
    <div class="mb-3">รายละเอียดสินค้า/บริการ</div>
    @php 
      $groupsData=[]; 
      $no=1; 
    @endphp
    
    @if(!empty($groups))
      @foreach($groups as $g)
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
            $items[]=[
              'desc'=>'ไซซ์: '.($r['size']?:'-'),
              'qty'=>$qty,
              'unit'=>$unit,
              'price'=>$price,
              'amount'=>$amount
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
    @endif

    @if(count($groupsData))
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
              <td class="desc">{!! $g['title'] !!}</td>
              <td class="num muted"></td>
              <td class="num muted"></td>
              <td class="num muted"></td>
            </tr>

            {{-- แถวรายการย่อย (child) --}}
            @foreach($g['items'] as $it)
              <tr class="item-row">
                <td class="desc child">{{ $it['desc'] }} </td>
                <td class="num">{{ number_format($it['price'], 2) }}</td>
                <td class="num">{{ number_format($it['qty']) }} {{ $it['unit'] }}</td>
                <td class="num">{{ number_format($it['amount'], 2) }}</td>
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

    {{-- Summary and Notes Section - แยกคำอ่านออกมา --}}
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
              {!! !empty($quotation->notes) ? nl2br(e($quotation->notes)) : 'ไม่มีหมายเหตุ' !!}
            </div>
          </td>
          
          {{-- Summary Section (Right) --}}
          <td class="panel-box">
            <h3 class="panel-title panel-title--sm center">สรุปยอดเงิน</h3>
            <table class="summary-table">
              <colgroup>
                <col style="width: 45%;">
                <col style="width: 55%;">
              </colgroup>
              {{-- Subtotal --}}
              <tr>
                <td class="summary-label">รวมเป็นเงิน</td>
                <td class="summary-amount">
                  <div class="amount-container">
                    <span class="amount-main">{{ number_format($summary['subtotal'] ?? 0, 2) }} บาท</span>
                  </div>
                </td>
              </tr>
              
              {{-- Tax --}}
              <tr>
                <td class="summary-label">ภาษีมูลค่าเพิ่ม 7%</td>
                <td class="summary-amount">
                  <div class="amount-container">
                    <span class="amount-main">{{ number_format($summary['tax'] ?? 0, 2) }} บาท</span>
                  </div>
                </td>
              </tr>
              
              {{-- Total before discount --}}
              <tr>
                <td class="summary-label">รวมก่อนส่วนลด</td>
                <td class="summary-amount">
                  <div class="amount-container">
                    <span class="amount-main">{{ number_format($summary['total_before_discount'] ?? 0, 2) }} บาท</span>
                  </div>
                </td>
              </tr>

              {{-- Special Discount (conditional) --}}
              @if(($summary['special_discount_amount'] ?? 0) > 0)
              <tr class="discount-row">
                <td class="summary-label">
                  ส่วนลดพิเศษ
                  @if(($summary['special_discount_percentage'] ?? 0) > 0)
                    ({{ number_format($summary['special_discount_percentage'], 2) }}%)
                  @endif
                </td>
                <td class="summary-amount discount">
                  <div class="amount-container">
                    <span class="amount-main">-{{ number_format($summary['special_discount_amount'], 2) }} บาท</span>
                  </div>
                </td>
              </tr>
              @endif

              {{-- Withholding Tax (conditional) --}}
              @if($summary['has_withholding_tax'] ?? false)
              <tr class="withholding-tax-row">
                <td class="summary-label">
                  หักภาษี ณ ที่จ่าย ({{ number_format($summary['withholding_tax_percentage'] ?? 0, 2) }}%)
                </td>
                <td class="summary-amount withholding-tax">
                  <div class="amount-container">
                    <span class="amount-main">-{{ number_format($summary['withholding_tax_amount'] ?? 0, 2) }} บาท</span>
                  </div>
                </td>
              </tr>
              @endif
              
              {{-- Final Total --}}
              <tr class="total-row">
                <td class="summary-label">รวมเป็นเงินทั้งสิ้น</td>
                <td class="summary-amount">
                  <div class="amount-container">
                    <span class="amount-main {{ ($summary['final_total'] ?? 0) > 999999 ? 'large-amount' : '' }}">
                      {{ number_format($summary['final_total'] ?? 0, 2) }} บาท
                    </span>
                  </div>
                </td>
              </tr>

              {{-- Deposit Information (conditional) --}}
              @if(($summary['deposit_amount'] ?? 0) > 0)
              <tr class="deposit-row">
                <td class="summary-label">
                  เงินมัดจำ
                  @if(($summary['deposit_mode'] ?? 'percentage') === 'percentage')
                    ({{ number_format($summary['deposit_percentage'] ?? 0, 0) }}%)
                  @endif
                </td>
                <td class="summary-amount deposit">
                  <div class="amount-container">
                    <span class="amount-main">{{ number_format($summary['deposit_amount'], 2) }} บาท</span>
                  </div>
                </td>
              </tr>
              @endif

              {{-- Thai text conversion using final_total --}}
              <tr class="reading-row">
                <td colspan="2" class="reading-cell">
                  <div class="reading-full-width">
                    ({{ $thaiBahtText($summary['final_total'] ?? 0) }})
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

  {{-- Signature spacer: กันไม่ให้เนื้อหามาชนพื้นที่ลายเซ็นคงที่ด้านล่างหน้า --}}
  {{-- signature injected by service dynamically --}}
  <div class="signature-spacer"></div>

  </div>
</body>
</html>