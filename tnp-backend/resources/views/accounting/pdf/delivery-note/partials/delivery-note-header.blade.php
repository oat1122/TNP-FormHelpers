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
      <div class="logo-wrap">
        <x-company-logo :company-id="$sender->id ?? null" css-class="logo-img" alt="logo" :for-pdf="true" />
      </div>

      <div class="company-name">{{ $sender->legal_name ?? $sender->name ?? 'บริษัทของคุณ' }}</div>
      @if (!empty($sender->address))
        <div class="company-addr">{{ $sender->address }}</div>
      @endif
      <div class="company-meta">
        โทร: {{ $senderPhone ?: '-' }}<br>
        เลขประจำตัวผู้เสียภาษี: {{ $sender->tax_id ?? '-' }}
      </div>

      <div class="header-divider"></div><br />
      <div class="company-meta">ลูกค้า</div>

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
      @php
        $docTitle    = 'ใบส่งของ';
        $docSubTitle = $headerType ?? 'ต้นฉบับ';
        $createdDate = $deliveryNote->created_at ? \Carbon\Carbon::parse($deliveryNote->created_at)->format('d/m/Y') : date('d/m/Y');
        $deliveryDate = !empty($deliveryNote->delivery_date)
            ? \Carbon\Carbon::parse($deliveryNote->delivery_date)->format('d/m/Y')
            : null;

        $sellerFirst   = optional($deliveryNote->creator)->user_firstname;
        $sellerLast    = optional($deliveryNote->creator)->user_lastname;
        $sellerUser    = optional($deliveryNote->creator)->username;
        $sellerDisplay = trim(($sellerFirst . ' ' . $sellerLast)) ?: $sellerUser;

        $jobName = $deliveryNote->job_name ?? $deliveryNote->project_name ?? $deliveryNote->work_name ?? null;
        if (is_string($jobName)) { $jobName = trim($jobName); }

        $metaRows = [
          ['label' => 'เลขที่', 'value' => $deliveryNote->number ?? 'DRAFT'],
          ['label' => 'วันที่', 'value' => $createdDate],
        ];
        if ($deliveryDate) {
            $metaRows[] = ['label' => 'กำหนดส่ง', 'value' => $deliveryDate];
        }
        if (!empty($deliveryNote->tracking_number)) {
            $metaRows[] = ['label' => 'Tracking', 'value' => $deliveryNote->tracking_number];
        }
        if ($sellerDisplay) {
            $metaRows[] = ['label' => 'ผู้ส่ง', 'value' => $sellerDisplay];
        }
      @endphp

      <div class="doc-header-section">
        <div class="doc-title">{{ $docTitle }}</div>
        <div class="doc-header-type">{{ $docSubTitle }}</div>
      </div>
      <div class="doc-meta">
        @foreach($metaRows as $row)
          @php
            // Emphasize "กำหนดส่ง" (delivery due date) for delivery notes — mirrors invoice's meta-row-due-date treatment
            $rowClass = $row['label'] === 'กำหนดส่ง' ? 'meta-row-due-date' : '';
          @endphp
          @if(isset($row['format']) && $row['format'] === 'inline')
            <div class="{{ $rowClass }}"><strong>{{ $row['label'] }} {{ $row['value'] }}</strong></div>
          @else
            <div class="{{ $rowClass }}"><strong>{{ $row['label'] }}:</strong> {{ $row['value'] }}</div>
          @endif
        @endforeach
        @if($jobName)
          <div><strong>ชื่องาน:</strong> {{ $jobName }}</div>
        @endif
      </div>
    </td>
  </tr>
</table>
