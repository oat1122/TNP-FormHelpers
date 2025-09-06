{{-- ส่วนลายเซ็น --}}
<div class="signature-section">
  <div class="signature-container">
    {{-- ลายเซ็นลูกค้า --}}
    <div class="signature-box">
      <div class="signature-title">ลายเซ็นลูกค้า</div>
      @if(!empty($invoice->signature_customer_image))
        <div class="signature-image">
          <img src="{{ $invoice->signature_customer_image }}" alt="ลายเซ็นลูกค้า">
        </div>
      @else
        <div class="signature-placeholder">
          ( _________________________ )
        </div>
      @endif
      <div class="signature-date">วันที่ ................................</div>
    </div>

    {{-- ลายเซ็นบริษัท --}}
    <div class="signature-box">
      <div class="signature-title">ผู้อนุมัติ</div>
      @if(!empty($invoice->signature_company_image))
        <div class="signature-image">
          <img src="{{ $invoice->signature_company_image }}" alt="ลายเซ็นบริษัท">
        </div>
      @else
        <div class="signature-placeholder">
          ( _________________________ )
        </div>
      @endif
      <div class="signature-date">วันที่ ................................</div>
    </div>
  </div>
</div>
