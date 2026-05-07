{{-- resources/views/accounting/pdf/quotation/partials/quotation-header.blade.php --}}
<table class="pdf-header">
  <tr>
    <td class="header-left">
      {{-- โลโก้บริษัท --}}
      <x-company-logo
        :company-id="$quotation->company->id ?? null"
        :logo-path="$logoPath ?? null"
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
      </div><br/>


      <div class="header-divider"></div>
      <div class="company-meta">
        ลูกค้า
      </div>

      {{-- ข้อมูลลูกค้า --}}
      @php
        use App\Helpers\PhoneNormalizer;

        $name   = trim($customer['name'] ?? '-');
        $addr   = trim($customer['address'] ?? '-');
        $phones = PhoneNormalizer::formatThaiList($customer['tel'] ?? '');
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
        {{-- $sellerName resolved in QuotationPdfMasterService::resolveSellerName() (audit C1) --}}
        @if (!empty($sellerName))
          <div><strong>ผู้ขาย:</strong> {{ $sellerName }}</div>
        @endif
      </div>
    </td>
  </tr>
</table>
