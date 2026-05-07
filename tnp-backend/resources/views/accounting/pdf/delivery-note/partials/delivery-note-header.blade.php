{{-- resources/views/accounting/pdf/delivery-note/partials/delivery-note-header.blade.php --}}
@php
  use App\Helpers\PhoneNormalizer;

  // เลือกบริษัทผู้ส่งตาม sender_company_id ถ้ามี ไม่งั้นใช้ company ปกติ
  $sender = $deliveryNote->senderCompany ?? $deliveryNote->company ?? null;

  // Format own company phone
  $senderPhone = PhoneNormalizer::formatThaiList($sender->phone ?? '');

  // Customer info
  $name   = trim($customer['name'] ?? '-');
  $addr   = trim($customer['address'] ?? '-');
  $phones = PhoneNormalizer::formatThaiList($customer['tel'] ?? '');
  $taxId  = trim($customer['tax_id'] ?? '');
  // format 13 หลักให้มีขีด (ถ้าอยากให้เหมือนทางการ)
  if (preg_match('/^\d{13}$/', $taxId)) {
      $taxId = preg_replace('/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/', '$1-$2-$3-$4-$5', $taxId);
  }
@endphp

<table class="pdf-header">
  <tr>
    <td class="header-left">
      {{-- โลโก้บริษัท --}}
      <x-company-logo
        :company-id="$sender->id ?? null"
        css-class="logo-img"
        alt="logo"
        :for-pdf="true"
      />

      {{-- ข้อมูลบริษัท (ผู้ส่ง) — same .party-box markup as customer below for consistent styling --}}
      <div class="party-box">
        <div class="party-name">{{ $sender->legal_name ?? $sender->name ?? 'บริษัทของคุณ' }}</div>
        @if (!empty($sender->address))
          <div class="party-line">{{ $sender->address }}</div>
        @endif
        @if ($senderPhone)
          <div class="party-line muted">โทร: {{ $senderPhone }}</div>
        @endif
        @if (!empty($sender->tax_id))
          <div class="party-line muted">เลขประจำตัวผู้เสียภาษี: {{ $sender->tax_id }}</div>
        @endif
      </div>

      <div class="header-divider"></div>
      <div class="party-label">ลูกค้า</div>

      {{-- ข้อมูลลูกค้า --}}
      <div class="party-box">
        <div class="party-name">{{ $name }}</div>
        <div class="party-line">{!! nl2br(e($addr)) !!}</div>
        @if($phones)
          <div class="party-line muted">โทร: {{ $phones }}</div>
        @endif
        @if($taxId !== '')
          <div class="party-line muted">เลขประจำตัวผู้เสียภาษี: {{ $taxId }}</div>
        @endif
      </div>
    </td>

    <td class="header-right">
      <div class="doc-title">ใบส่งของ</div>
      @if(!empty($headerType))
        <div class="doc-subtitle">{{ $headerType }}</div>
      @endif

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

      {{-- ไม่แสดงสถานะ --}}
    </td>
  </tr>
</table>

<div class="header-divider"></div>
