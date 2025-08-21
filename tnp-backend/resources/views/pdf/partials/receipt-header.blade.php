{{-- resources/views/pdf/partials/receipt-header.blade.php --}}
<table class="pdf-header">
  <tr>
    <td class="header-left">
      {{-- โลโก้บริษัท --}}
      <x-company-logo 
        :company-id="$receipt->company->id ?? null" 
        css-class="logo-img" 
        alt="logo" 
        :for-pdf="true" 
      />

      {{-- ข้อมูลบริษัท --}}
      <div class="company-name">
        {{ $receipt->company->legal_name ?? $receipt->company->name ?? 'บริษัทของคุณ' }}
      </div>

      @if (!empty($receipt->company->address))
        <div class="company-addr">
          {{ $receipt->company->address }}
        </div>
      @endif

      <div class="company-meta">
        โทร: {{ $receipt->company->phone ?? '-' }}<br>
        เลขประจำตัวผู้เสียภาษี: {{ $receipt->company->tax_id ?? '-' }}
      </div>
    </td>

    <td class="header-right">
      <div class="doc-title">
        @if($receipt->receipt_type === 'tax_invoice')
          ใบกำกับภาษี/ใบเสร็จ
        @else
          ใบเสร็จ
        @endif
      </div>

      <div class="doc-meta">
        <div><strong>เลขที่:</strong> {{ $receipt->receipt_number ?? 'DRAFT' }}</div>
        @if($receipt->receipt_type === 'tax_invoice' && $receipt->tax_invoice_number)
          <div><strong>เลขที่กำกับภาษี:</strong> {{ $receipt->tax_invoice_number }}</div>
        @endif
        <div><strong>วันที่:</strong> {{ \Carbon\Carbon::parse($receipt->payment_date ?? now())->format('d/m/Y') }}</div>
        @php
          $sellerFirst = optional($receipt->creator)->user_firstname;
          $sellerLast  = optional($receipt->creator)->user_lastname;
          $sellerUser  = optional($receipt->creator)->username;
          $sellerDisplay = trim(($sellerFirst.' '.$sellerLast) ?: $sellerUser); 
        @endphp
        @if ($sellerDisplay)
          <div><strong>ผู้ขาย:</strong> {{ $sellerFirst }}</div>
        @endif
      </div>

      @if ($receipt->status === 'draft')
        <div class="badge-draft">ร่าง</div>
      @elseif ($receipt->status === 'approved')
        <div class="badge-approved">อนุมัติแล้ว</div>
      @endif
    </td>
  </tr>
</table>

<div class="header-divider"></div>
