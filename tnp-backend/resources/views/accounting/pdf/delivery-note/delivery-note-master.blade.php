<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  {{-- CSS is loaded separately by DeliveryNotePdfMasterService --}}
</head>
<body>
  <div class="document-content">

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
          // SECURITY: escape user-controlled item fields before concat to prevent XSS/SSRF via mPDF <img src> fetching
          $title=e($g['name']?:'ไม่ระบุชื่องาน');
          if($meta){
            $title.=' <span class="meta-light">'.e(implode(', ',$meta)).'</span>';
          }
          $items=[];
          foreach(($g['rows']??[]) as $r){
            $qty=(float)($r['quantity']??0);
            $items[]=[
              'desc'=> ($r['size']?:'-'),
              'qty'=>$qty,
              'unit'=>$unit,
              'note'=> trim((string)($r['description']??'')),
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
      <table class="items-table slim table-numbers-sm formal">
        <colgroup>
          <col class="w-desc">
          <col class="w-qty">
          <col class="w-unit">
        </colgroup>
        <thead>
          <tr>
            <th class="desc-head text-center">รายละเอียด</th>
            <th class="text-right">จำนวน</th>
            <th class="text-right">หน่วย</th>
          </tr>
        </thead>
        <tbody>
          @foreach($groupsData as $g)
            {{-- แถวหัวข้อกลุ่ม (parent) --}}
            <tr class="group-row">
              <td class="desc"><span class="group-no">{{ $g['no'] }}.</span> {!! $g['title'] !!}</td>
              <td class="num muted"></td>
              <td class="num muted"></td>
            </tr>

            {{-- แถวรายการย่อย (child) --}}
            @foreach($g['items'] as $it)
              <tr class="item-row">
                <td class="desc child">
                  {{ $it['desc'] }}
                  @if (!empty($it['note']))
                    <div class="meta-light">{{ $it['note'] }}</div>
                  @endif
                </td>
                <td class="num">{{ number_format($it['qty']) }}</td>
                <td class="num">{{ $it['unit'] }}</td>
              </tr>
            @endforeach
          @endforeach
        </tbody>
      </table>
    @else
      <div class="no-items-box"><strong>ไม่มีรายการสินค้า/บริการ</strong></div>
    @endif

    {{-- หมายเหตุ — uses same panel-notes pattern as invoice _layout
         (panel-box.panel-notes.formal → panel-title + panel-content). Styled by
         pdf-doc-master.css `.panel-notes.formal` rules. --}}
    @if(!empty($deliveryNote->notes))
      <div class="summary-notes-wrapper">
        <div class="panel-box panel-notes formal">
          <h3 class="panel-title panel-title--sm">หมายเหตุ</h3>
          <div class="panel-content">{!! nl2br(e($deliveryNote->notes)) !!}</div>
        </div>
      </div>
    @endif

  </div>
</body>
</html>
