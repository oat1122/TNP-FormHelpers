{{-- resources/views/accounting/pdf/tax-invoice/partials/tax-header.blade.php --}}
<table class="pdf-header">
  <tr>
    <td class="header-left">
      <div class="logo-wrap">
        <x-company-logo :company-id="$invoice->company->id ?? null" css-class="logo-img" alt="logo" :for-pdf="true" />
      </div>

      <div class="company-name">{{ $invoice->company->legal_name ?? $invoice->company->name ?? 'บริษัทของคุณ' }}</div>
      @if (!empty($invoice->company->address))
        <div class="company-addr">{{ $invoice->company->address }}</div>
      @endif
      <div class="company-meta">
        โทร: {{ $invoice->company->phone ?? '-' }}<br>
        เลขประจำตัวผู้เสียภาษี: {{ $invoice->company->tax_id ?? '-' }}
      </div>

      <div class="header-divider"></div><br />
      <div class="company-meta">ลูกค้า</div>

      @php
        $name   = trim($customer['name'] ?? '-');
        $addr   = trim($customer['address'] ?? '-');
        $telRaw = $customer['tel'] ?? '';
        $phones = implode(', ', array_filter(preg_split('/[,\\s\/|]+/', $telRaw)));
        $taxId  = trim($customer['tax_id'] ?? '');
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
    @php
    $docTitle    = 'ใบกำกับภาษี';
    $docSubTitle = $invoice->document_header_type ?? 'ต้นฉบับ';
    $createdDate = $invoice->created_at ? $invoice->created_at->format('d/m/Y') : date('d/m/Y');
    $dueDate     = !empty($invoice->due_date) ? date('d/m/Y', strtotime($invoice->due_date)) : null;

    // Select number by deposit_display_order
    $mode = strtolower($invoice->deposit_display_order ?? 'before');
    $rawNumber = $mode === 'after'
      ? ($invoice->number_after ?? null)
      : ($invoice->number_before ?? null);

    // Map invoice prefix to TAXA/TAXB for display
    $docNumber = $rawNumber;
    if (is_string($docNumber)) {
      if (str_starts_with($docNumber, 'INVA')) {
        $docNumber = 'TAXA' . substr($docNumber, 4);
      } elseif (str_starts_with($docNumber, 'INVB')) {
        $docNumber = 'TAXB' . substr($docNumber, 4);
      }
    }
    if (empty($docNumber)) { $docNumber = 'DRAFT'; }

    // Reference uses the same selected number (unmapped)
    $referenceNo = $rawNumber ?: null;

    $seller      = $invoice->manager ?? $invoice->creator;
        $sellerFirst = optional($seller)->user_firstname;
        $sellerLast  = optional($seller)->user_lastname;
        $sellerUser  = optional($seller)->username;
        $sellerDisplay = trim(($sellerFirst.' '.$sellerLast) ?: ($sellerUser ?? ''));
        $jobName = $invoice->job_name ?? $invoice->project_name ?? $invoice->work_name ?? null;
        if (is_string($jobName)) { $jobName = trim($jobName); }

        $metaRows = [
      ['label'=>'เลขที่','value'=>$docNumber],
          ['label'=>'วันที่','value'=>$createdDate],
        ];
        if ($dueDate)       $metaRows[] = ['label'=>'ครบกำหนด','value'=>$dueDate];
        if ($sellerDisplay) $metaRows[] = ['label'=>'ผู้ขาย','value'=> trim($sellerFirst) ?: $sellerUser];
        if ($referenceNo)   $metaRows[] = ['label'=>'อ้างอิง','value'=>$referenceNo,'format'=>'inline'];
      @endphp

      <div class="doc-header-section">
        <div class="doc-title">{{ $docTitle }}</div>
        <div class="doc-header-type">{{ $docSubTitle }}</div>
      </div>
      <div class="doc-meta">
        @foreach($metaRows as $row)
          @if(isset($row['format']) && $row['format'] === 'inline')
            <div><strong>{{ $row['label'] }} {{ $row['value'] }}</strong></div>
          @else
            <div><strong>{{ $row['label'] }}:</strong> {{ $row['value'] }}</div>
          @endif
        @endforeach
        @if($jobName)
          <div><strong>ชื่องาน:</strong> {{ $jobName }}</div>
        @endif
      </div>
    </td>
  </tr>
</table>
