{{-- resources/views/accounting/pdf/invoice/partials/invoice-header.blade.php --}}
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
        $docTitle    = 'ใบวางบิล/ใบแจ้งหนี้';
        $docSubTitle = $invoice->document_header_type ?? 'ต้นฉบับ';
        $createdDate = $invoice->created_at ? $invoice->created_at->format('d/m/Y') : date('d/m/Y');
        $dueDate     = !empty($invoice->due_date) ? date('d/m/Y', strtotime($invoice->due_date)) : null;
        $quotationNo = (!empty($invoice->quotation) && !empty($invoice->quotation->number)) ? $invoice->quotation->number : null;
        $seller      = $invoice->manager ?? $invoice->creator;
        $sellerFirst = optional($seller)->user_firstname;
        $sellerLast  = optional($seller)->user_lastname;
        $sellerUser  = optional($seller)->username;
        $sellerDisplay = trim(($sellerFirst.' '.$sellerLast) ?: ($sellerUser ?? ''));
        $jobName = $invoice->job_name ?? $invoice->project_name ?? $invoice->work_name ?? null;
        if (is_string($jobName)) { $jobName = trim($jobName); }

        $metaRows = [
          ['label'=>'เลขที่','value'=>$invoice->number ?? 'DRAFT'],
          ['label'=>'วันที่','value'=>$createdDate],
        ];
        if ($dueDate)      $metaRows[] = ['label'=>'ครบกำหนด','value'=>$dueDate];
        if ($sellerDisplay) $metaRows[] = ['label'=>'ผู้ขาย','value'=> trim($sellerFirst) ?: $sellerUser];
        if ($quotationNo)  $metaRows[] = ['label'=>'อ้างอิง','value'=>$quotationNo];
      @endphp

      <div class="doc-header-section">
        <div class="doc-title">{{ $docTitle }}</div>
        <div class="doc-header-type">{{ $invoice->document_header_type ?? 'ต้นฉบับ' }}</div>
      </div>
      <div class="doc-meta">
        @foreach($metaRows as $row)
          <div><strong>{{ $row['label'] }}:</strong> {{ $row['value'] }}</div>
        @endforeach
        @if($jobName)
          <div><strong>ชื่องาน:</strong> {{ $jobName }}</div>
        @endif
        @if(!($isFinal ?? true))
          <div style="color:#e74c3c; font-weight:bold;">PREVIEW - ไม่ใช่เอกสารจริง</div>
        @endif
      </div>
      @if (($invoice->status ?? 'draft') === 'draft')
        <div class="badge-draft">ร่าง</div>
      @endif
    </td>
  </tr>
</table>
