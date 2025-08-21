<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  
  {{-- CSS is loaded separately by QuotationPdfMasterService --}}
</head>
<body>
  <div class="document-content">

    {{-- ข้อมูลลูกค้า --}}
    <div class="info-box mb-4">
      <h3 class="mb-3">ข้อมูลลูกค้า</h3>
      <table>
        <tr>
          <td style="width:25%"><strong>ลูกค้า:</strong></td>
          <td>{{ $customer['name'] ?: '-' }}</td>
        </tr>
        <tr>
          <td><strong>ที่อยู่:</strong></td>
          <td>{!! nl2br(e($customer['address'] ?: '-')) !!}</td>
        </tr>
        <tr>
          <td><strong>เลขภาษี:</strong></td>
          <td>{{ $customer['tax_id'] ?: '-' }}</td>
        </tr>
        <tr>
          <td><strong>โทรศัพท์:</strong></td>
          <td>{{ $customer['tel'] ?: '-' }}</td>
        </tr>
      </table>
    </div>

    {{-- ตารางสินค้า/บริการ --}}
    <h3 class="mb-3">รายละเอียดสินค้า/บริการ</h3>
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
      <table class="items-table slim">
        <colgroup>
          <col style="width:60%">  {{-- รายละเอียด --}}
          <col style="width:15%">  {{-- Unit Price --}}
          <col style="width:10%">  {{-- Qnt --}}
          <col style="width:15%">  {{-- Total --}}
        </colgroup>
        <thead>
          <tr>
            <th class="desc-head">รายละเอียด</th>
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
              <td class="num muted">-</td>
              <td class="num muted">-</td>
              <td class="num muted">-</td>
            </tr>

            {{-- แถวรายการย่อย (child) --}}
            @foreach($g['items'] as $it)
              <tr class="item-row">
                <td class="desc child">{{ $it['desc'] }} <span class="reading">(หน่วย: {{ $it['unit'] }})</span></td>
                <td class="num">{{ number_format($it['price'], 2) }}</td>
                <td class="num">{{ number_format($it['qty']) }}</td>
                <td class="num">{{ number_format($it['amount'], 2) }}</td>
              </tr>
            @endforeach
          @endforeach
        </tbody>
      </table>
    @else
      <div style="text-align:center; padding:20pt; border:1px solid #dee2e6; background:#f8f9fa;">
        <strong>ไม่มีรายการสินค้า/บริการ</strong>
      </div>
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

    {{-- Summary and Notes Section (Fixed Layout) --}}
    <div class="summary-notes-container">
      <table class="summary-notes-wrapper">
        <tr>
          {{-- Notes Section --}}
          <td class="notes-cell">
            <h3>หมายเหตุ</h3>
            <div class="notes-section">
              {!! !empty($quotation->notes) ? nl2br(e($quotation->notes)) : 'ไม่มีหมายเหตุ' !!}
            </div>
          </td>
          
          {{-- Spacer --}}
          <td class="spacer-cell"></td>
          
          {{-- Summary Section --}}
          <td class="summary-cell">
            <h3 class="summary-header">สรุปยอดเงิน</h3>
            <div class="summary-section">
              {{-- Subtotal --}}
              <table class="summary-row">
                <tr>
                  <td class="summary-label">รวมเป็นเงิน</td>
                  <td class="summary-amount">{{ number_format($summary['subtotal'] ?? 0, 2) }} บาท</td>
                </tr>
              </table>
              
              {{-- Tax --}}
              <table class="summary-row">
                <tr>
                  <td class="summary-label">ภาษีมูลค่าเพิ่ม 7%</td>
                  <td class="summary-amount">{{ number_format($summary['tax'] ?? 0, 2) }} บาท</td>
                </tr>
              </table>
              
              {{-- Total --}}
              <table class="summary-row total-row">
                <tr>
                  <td class="summary-label">รวมเป็นเงินทั้งสิ้น</td>
                  <td class="summary-amount">
                    {{ number_format($summary['total'] ?? 0, 2) }} บาท
                    <div class="reading">({{ $thaiBahtText($summary['total'] ?? 0) }})</div>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>
    </div>

    {{-- ลายเซ็น --}}
    <div class="signature-section">
      <table class="signature-table">
        <tr>
          <td class="signature-cell">
            <div class="signature-box"></div>
            <div><strong>ผู้สั่งซื้อสินค้า</strong></div>
            <div style="margin-top:8pt;">(_______________________)</div>
            <div class="text-muted" style="margin-top:8pt;">วันที่: _______________</div>
          </td>
          <td class="signature-cell">
            <div class="signature-box"></div>
            <div><strong>ผู้อนุมัติ</strong></div>
            <div style="margin-top:8pt;">(_______________________)</div>
            <div class="text-muted" style="margin-top:8pt;">วันที่: _______________</div>
          </td>
        </tr>
      </table>
    </div>

  </div>
</body>
</html>