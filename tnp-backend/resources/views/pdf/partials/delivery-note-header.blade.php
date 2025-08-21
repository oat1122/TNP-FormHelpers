{{-- resources/views/pdf/partials/delivery-note-header.blade.php --}}
<table class="pdf-header">
  <tr>
    <td class="header-left">
      {{-- โลโก้บริษัท --}}
      <x-company-logo 
        :company-id="$deliveryNote->company->id ?? null" 
        css-class="logo-img" 
        alt="logo" 
        :for-pdf="true" 
      />

      {{-- ข้อมูลบริษัท --}}
      <div class="company-name">
        {{ $deliveryNote->company->legal_name ?? $deliveryNote->company->name ?? 'บริษัทของคุณ' }}
      </div>

      @if (!empty($deliveryNote->company->address))
        <div class="company-addr">
          {{ $deliveryNote->company->address }}
        </div>
      @endif

      <div class="company-meta">
        โทร: {{ $deliveryNote->company->phone ?? '-' }}<br>
        เลขประจำตัวผู้เสียภาษี: {{ $deliveryNote->company->tax_id ?? '-' }}
      </div>
    </td>

    <td class="header-right">
      <div class="doc-title">ใบส่งของ</div>

      <div class="doc-meta">
        <div><strong>เลขที่:</strong> {{ $deliveryNote->number ?? 'DRAFT' }}</div>
        <div><strong>วันที่:</strong> {{ now()->format('d/m/Y') }}</div>
        @if ($deliveryNote->delivery_date)
          <div><strong>กำหนดส่ง:</strong> {{ \Carbon\Carbon::parse($deliveryNote->delivery_date)->format('d/m/Y') }}</div>
        @endif
        @if ($deliveryNote->tracking_number)
          <div><strong>Tracking:</strong> {{ $deliveryNote->tracking_number }}</div>
        @endif
        @php
          $sellerFirst = optional($deliveryNote->creator)->user_firstname;
          $sellerLast  = optional($deliveryNote->creator)->user_lastname;
          $sellerUser  = optional($deliveryNote->creator)->username;
          $sellerDisplay = trim(($sellerFirst.' '.$sellerLast) ?: $sellerUser); 
        @endphp
        @if ($sellerDisplay)
          <div><strong>ผู้ส่ง:</strong> {{ $sellerFirst }}</div>
        @endif
      </div>

      @if ($deliveryNote->status === 'preparing')
        <div class="badge-draft">เตรียมส่ง</div>
      @elseif ($deliveryNote->status === 'shipping')
        <div class="badge-shipping">จัดส่งแล้ว</div>
      @elseif ($deliveryNote->status === 'delivered')
        <div class="badge-delivered">ส่งสำเร็จ</div>
      @endif
    </td>
  </tr>
</table>

<div class="header-divider"></div>
