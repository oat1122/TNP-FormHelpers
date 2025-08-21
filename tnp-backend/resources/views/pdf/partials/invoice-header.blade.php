{{-- resources/views/pdf/partials/invoice-header.blade.php --}}
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
      </div>
    </td>

    <td class="header-right">
      <div class="doc-title">ใบแจ้งหนี้</div>

      <div class="doc-meta">
        <div><strong>เลขที่:</strong> {{ $invoice->number ?? 'DRAFT' }}</div>
        <div><strong>วันที่:</strong> {{ now()->format('d/m/Y') }}</div>
        @if ($invoice->due_date)
          <div><strong>กำหนดชำระ:</strong> {{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}</div>
        @endif
        @php
          $sellerFirst = optional($invoice->creator)->user_firstname;
          $sellerLast  = optional($invoice->creator)->user_lastname;
          $sellerUser  = optional($invoice->creator)->username;
          $sellerDisplay = trim(($sellerFirst.' '.$sellerLast) ?: $sellerUser); 
        @endphp
        @if ($sellerDisplay)
          <div><strong>ผู้ขาย:</strong> {{ $sellerFirst }}</div>
        @endif
      </div>

      @if ($invoice->status === 'draft')
        <div class="badge-draft">ร่าง</div>
      @endif
    </td>
  </tr>
</table>

<div class="header-divider"></div>
