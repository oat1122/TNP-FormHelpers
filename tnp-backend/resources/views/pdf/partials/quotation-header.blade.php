{{-- resources/views/pdf/partials/quotation-header.blade.php --}}
<table class="pdf-header">
  <tr>
    <td class="header-left">
      {{-- โลโก้บริษัท --}}
      <x-company-logo 
        :company-id="$quotation->company->id ?? null" 
        css-class="logo-img" 
        alt="logo" 
        :for-pdf="true" 
      />

      {{-- ข้อมูลบริษัท --}}
      <div class="company-name">
        {{ $quotation->company->legal_name ?? $quotation->company->name ?? 'บริษัทของคุณ' }}
      </div>

      @if (!empty($quotation->company->address))
        <div class="company-addr">
          {{ $quotation->company->address }}
        </div>
      @endif

      <div class="company-meta">
        โทร: {{ $quotation->company->phone ?? '-' }}<br>
        เลขประจำตัวผู้เสียภาษี: {{ $quotation->company->tax_id ?? '-' }}
      </div>


      <div class="header-divider"></div>
      <div class="company-meta">
        ลูกค้า 
      </div>

      {{-- ข้อมูลลูกค้า --}}
      @php
        $name   = trim($customer['name'] ?? '-');
        $addr   = trim($customer['address'] ?? '-');
        $telRaw = $customer['tel'] ?? '';
        // แยกเบอร์ด้วย , / | หรือช่องว่างหลายตัว
        $phones = implode(', ', array_filter(preg_split('/[,\\s\\/|]+/', $telRaw)));
        $taxId  = trim($customer['tax_id'] ?? '');
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
      <div class="doc-title">ใบเสนอราคา</div>

      <div class="doc-meta">
        <div><strong>เลขที่:</strong> {{ $quotation->number ?? 'DRAFT' }}</div>
        <div><strong>วันที่:</strong> {{ now()->format('d/m/Y') }}</div>
        @if ($quotation->due_date)
          <div><strong>กำหนดส่ง:</strong> {{ \Carbon\Carbon::parse($quotation->due_date)->format('d/m/Y') }}</div>
        @endif
         <!-- เอาแค่ ชื่อจริงพอถ้าเอสนามสกุลด้วยมันจะล้น บรรทัด -->
        @php
          $sellerFirst = optional($quotation->creator)->user_firstname;
         
           $sellerLast  = optional($quotation->creator)->user_lastname;
          $sellerUser  = optional($quotation->creator)->username;
          $sellerDisplay = trim(($sellerFirst.' '.$sellerLast) ?: $sellerUser); 
        @endphp
        @if ($sellerDisplay)
          <div><strong>ผู้ขาย:</strong> {{ $sellerFirst }}</div>
        @endif
      </div>

      @if ($quotation->status === 'draft')
        <div class="badge-draft">ร่าง</div>
      @endif
    </td>
  </tr>
</table>
