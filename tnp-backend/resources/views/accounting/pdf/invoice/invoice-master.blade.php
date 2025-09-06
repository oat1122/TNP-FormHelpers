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
    @endphp
    
    @if(!empty($items))
      <table class="items-table">
        <thead>
          <tr>
            <th class="item-no">ลำดับ</th>
            <th class="item-desc">รายการ</th>
            <th class="item-qty">จำนวน</th>
            <th class="item-unit">หน่วย</th>
            <th class="item-price">ราคาต่อหน่วย</th>
            <th class="item-total">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          @foreach($items as $item)
            <tr>
              <td class="item-no">{{ $no++ }}</td>
              <td class="item-desc">{{ $item['description'] ?? $item['item_description'] ?? '-' }}</td>
              <td class="item-qty">{{ number_format($item['quantity'] ?? 0) }}</td>
              <td class="item-unit">{{ $item['unit'] ?? 'ชิ้น' }}</td>
              <td class="item-price">{{ number_format($item['unit_price'] ?? 0, 2) }}</td>
              <td class="item-total">{{ number_format(($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0), 2) }}</td>
            </tr>
          @endforeach
        </tbody>
      </table>
    @else
      <div class="no-items">ไม่มีรายการสินค้า/บริการ</div>
    @endif

    {{-- สรุปราคา --}}
    <div class="summary-section">
      <table class="summary-table">
        <tr>
          <td class="summary-label">รวมเป็นเงิน</td>
          <td class="summary-value">{{ number_format($summary['subtotal'] ?? 0, 2) }} บาท</td>
        </tr>
        
        @if(($summary['special_discount_percentage'] ?? 0) > 0)
          <tr>
            <td class="summary-label">ส่วนลดพิเศษ {{ $summary['special_discount_percentage'] }}%</td>
            <td class="summary-value">{{ number_format($summary['special_discount_amount'] ?? 0, 2) }} บาท</td>
          </tr>
        @endif

        @if($summary['has_vat'] ?? false)
          <tr>
            <td class="summary-label">ภาษีมูลค่าเพิ่ม {{ $summary['vat_percentage'] ?? 7 }}%</td>
            <td class="summary-value">{{ number_format($summary['vat_amount'] ?? 0, 2) }} บาท</td>
          </tr>
        @endif

        @if($summary['has_withholding_tax'] ?? false)
          <tr>
            <td class="summary-label">หัก ณ ที่จ่าย {{ $summary['withholding_tax_percentage'] ?? 0 }}%</td>
            <td class="summary-value">-{{ number_format($summary['withholding_tax_amount'] ?? 0, 2) }} บาท</td>
          </tr>
        @endif

        <tr class="summary-total">
          <td class="summary-label"><strong>จำนวนเงินรวมทั้งสิ้น</strong></td>
          <td class="summary-value"><strong>{{ number_format($summary['final_total_amount'] ?? 0, 2) }} บาท</strong></td>
        </tr>
      </table>
    </div>

    {{-- ข้อมูลเพิ่มเติม --}}
    @if(!empty($invoice->notes))
      <div class="notes-section">
        <div class="notes-title">หมายเหตุ:</div>
        <div class="notes-content">{!! nl2br(e($invoice->notes)) !!}</div>
      </div>
    @endif

    {{-- ข้อมูลการชำระเงิน --}}
    <div class="payment-info">
      @if(!empty($invoice->payment_method))
        <div class="payment-line">วิธีการชำระเงิน: {{ $invoice->payment_method }}</div>
      @endif
      
      @if(!empty($invoice->payment_terms))
        <div class="payment-line">เงื่อนไขการชำระ: {{ $invoice->payment_terms }}</div>
      @endif
      
      @if(!empty($invoice->due_date))
        <div class="payment-line">กำหนดชำระ: {{ date('d/m/Y', strtotime($invoice->due_date)) }}</div>
      @endif
    </div>

  </div>
</body>
</html>
