{{-- resources/views/accounting/pdf/invoice/partials/invoice-header.blade.php --}}
<table class="pdf-header">
  <tr>
    <td class="header-left">
      {{-- โลโก้บริษัท --}}
      <x-company-logo 
        :company-id="$invoice->company->id ?? null" 
        css-class="logo-img" 
        alt="logo" 
        :for-pdf="true" 
      />

      {{-- ข้อมูลบริษัท --}}
      <div class="company-name">
        {{ $invoice->company->legal_name ?? $invoice->company->name ?? 'บริษัทของคุณ' }}
      </div>

      @if (!empty($invoice->company->address))
        <div class="company-addr">
          {{ $invoice->company->address }}
        </div>
      @endif

      <div class="company-meta">
        โทร: {{ $invoice->company->phone ?? '-' }}<br>
        เลขประจำตัวผู้เสียภาษี: {{ $invoice->company->tax_id ?? '-' }}
      </div><br/>

      <div class="header-divider"></div>
      <div class="company-meta">
        ลูกค้า 
      </div>

      {{-- ข้อมูลลูกค้า --}}
      @php
        $name = trim($customer['name'] ?? '-');
        $addr = trim($customer['address'] ?? '-');
        $telRaw = $customer['tel'] ?? '';
        // แยกเบอร์ด้วย , / | หรือช่องว่างหลายตัว
        $phones = implode(', ', array_filter(preg_split('/[,\\s\\/|]+/', $telRaw)));
        $taxId = trim($customer['tax_id'] ?? '');
        // format 13 หลักให้มีขีด (ถ้าอยากให้เหมือนทางการ)
        if (preg_match('/^\\d{13}$/', $taxId)) {
            $taxId = preg_replace('/(\\d{1})(\\d{4})(\\d{5})(\\d{2})(\\d{1})/', '$1-$2-$3-$4-$5', $taxId);
        }
      @endphp

      <div class="customer-box">
        <div class="customer-name">{{ $name }}</div>
        <div class="customer-line">{!! nl2br(e($addr)) !!}</div>

        @if($phones)
          <div class="customer-line muted">โทร: {{ $phones }}</div>
        @endif

        @if($taxId !== '')
          <div class="customer-line muted">เลขประจำตัวผู้เสียภาษี: {{ $taxId }}</div>
        @endif
      </div>

    </td>

    <td class="header-right">
      <div class="doc-title">
        ใบแจ้งหนี้ / วางบิล
        
      </div>

      <div class="doc-meta">
        <div><strong>เลขที่:</strong> {{ $invoice->number ?? 'DRAFT' }}</div>
        <div><strong>วันที่:</strong> {{ $invoice->created_at ? $invoice->created_at->format('d/m/Y') : date('d/m/Y') }}</div>
        @if (!empty($invoice->due_date))
          <div><strong>กำหนดชำระ:</strong> {{ date('d/m/Y', strtotime($invoice->due_date)) }}</div>
        @endif
        
        {{-- อ้างอิงใบเสนอราคา --}}
        @if (!empty($invoice->quotation) && !empty($invoice->quotation->number))
          <div><strong>อ้างอิง:</strong> {{ $invoice->quotation->number }}</div>
        @endif
        
        {{-- ข้อมูลผู้ขาย --}}
        @php
          // ใช้ relationship manager (จาก inv_manage_by) หรือ creator ถ้าไม่มี manager
          $seller = $invoice->manager ?? $invoice->creator;
          $sellerFirst = optional($seller)->user_firstname;
          $sellerLast = optional($seller)->user_lastname;
          $sellerUser = optional($seller)->username;
          $sellerDisplay = trim(($sellerFirst.' '.$sellerLast) ?: $sellerUser); 
        @endphp
        @if ($sellerDisplay)
          <!-- แสดงแค่ชื่อจริงพอ -->
        <div><strong>ผู้ขาย:</strong> {{ trim($sellerFirst ) ?: $sellerUser }}</div>
        @endif
      </div>

      @if (($invoice->status ?? 'draft') === 'draft')
        <div class="badge-draft">ร่าง</div>
      @endif
    </td>
  </tr>
</table>
