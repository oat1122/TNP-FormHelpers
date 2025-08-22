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

