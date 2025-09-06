{{-- Footer สำหรับใบแจ้งหนี้ --}}
<div class="footer-content">
  <div class="footer-left">
    @if(!empty($invoice->company->bank_account))
      <div class="bank-info">
        <strong>ข้อมูลบัญชีธนาคาร:</strong><br>
        {{ $invoice->company->bank_account }}
      </div>
    @endif
  </div>
  
  <div class="footer-center">
    <div class="page-info">
      หน้าที่ {PAGENO} จาก {nbpg}
    </div>
  </div>
  
  <div class="footer-right">
    <div class="document-type">{{ $invoice->document_header_type ?? 'ต้นฉบับ' }}</div>
    @if(!$isFinal)
      <div class="preview-footer">PREVIEW - ไม่ใช่เอกสารจริง</div>
    @endif
  </div>
</div>
