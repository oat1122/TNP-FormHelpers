{{-- Header สำหรับใบแจ้งหนี้ --}}
<div class="header-content">
  {{-- ส่วนบริษัท --}}
  <div class="company-section">
    <div class="company-logo">
      @if(!empty($invoice->company->logo_url))
        <img src="{{ $invoice->company->logo_url }}" alt="{{ $invoice->company->name ?? 'Company Logo' }}" class="logo">
      @endif
    </div>
    <div class="company-info">
      <div class="company-name">{{ $invoice->company->name ?? 'บริษัท ชื่อ' }}</div>
      <div class="company-address">
        @if(!empty($invoice->company->address))
          {{ $invoice->company->address }}
        @endif
        @if(!empty($invoice->company->phone))
          <br>โทร: {{ $invoice->company->phone }}
        @endif
        @if(!empty($invoice->company->email))
          <br>Email: {{ $invoice->company->email }}
        @endif
      </div>
    </div>
  </div>

  {{-- ข้อมูลเอกสาร --}}
  <div class="document-info">
    <div class="document-title">
      ใบแจ้งหนี้ / วางบิล
      @if(!$isFinal)
        <span class="preview-label">(PREVIEW)</span>
      @endif
    </div>
    <div class="document-number">เลขที่: {{ $invoice->number ?? 'N/A' }}</div>
    <div class="document-date">วันที่: {{ $invoice->created_at ? $invoice->created_at->format('d/m/Y') : date('d/m/Y') }}</div>
    @if(!empty($invoice->due_date))
      <div class="due-date">กำหนดชำระ: {{ date('d/m/Y', strtotime($invoice->due_date)) }}</div>
    @endif
  </div>
</div>

{{-- ข้อมูลลูกค้า --}}
<div class="customer-section">
  <div class="customer-title">ลูกค้า:</div>
  <div class="customer-details">
    @php
      $name = trim($customer['name'] ?? '-');
      $addr = trim($customer['address'] ?? '-');
      $telRaw = $customer['tel'] ?? '';
      // แยกเบอร์ด้วย , / | หรือช่องว่างหลายตัว
      $phones = implode(', ', array_filter(preg_split('/[,\s\/|]+/', $telRaw)));
      $taxId = trim($customer['tax_id'] ?? '');
      // format 13 หลักให้มีขีด (ถ้าอยากให้เหมือนทางการ)
      if (preg_match('/^\d{13}$/', $taxId)) {
          $taxId = preg_replace('/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/', '$1-$2-$3-$4-$5', $taxId);
      }
    @endphp

    <div class="customer-name">{{ $name }}</div>
    <div class="customer-address">{!! nl2br(e($addr)) !!}</div>

    @if($phones)
      <div class="customer-phone">โทร: {{ $phones }}</div>
    @endif

    @if($taxId !== '')
      <div class="customer-tax">เลขประจำตัวผู้เสียภาษี: {{ $taxId }}</div>
    @endif
  </div>
</div>
