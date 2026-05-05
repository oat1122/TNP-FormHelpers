{{--
  Shared header partial for invoice-family PDF docs (Receipt, TaxInvoice, +).
  Consumers must pass:
    - $invoice         — Invoice model (or compatible — uses ->company, ->manager, ->creator, ->getDocumentNumber, ->getReferenceNumber)
    - $customer        — array (name, address, tel, tax_id) — see CustomerInfoExtractor
    - $docType         — string passed to $invoice->getDocumentNumber($docType, $mode) — e.g. 'receipt', 'tax_invoice'
    - $docTitle        — string rendered in <div.doc-title> — e.g. 'ใบเสร็จรับเงิน', 'ใบกำกับภาษี'
    - $isFinal, $summary, $docNumber, $referenceNo, $mode, $options — optional context (forwarded by master service)

  Extracted from receipt-header + tax-header (95% identical) per audit accounting-pdf-views-2026-05-05 finding P5.
--}}
<table class="pdf-header">
  <tr>
    <td class="header-left">
      <div class="logo-wrap">
        <x-company-logo
          :company-id="$invoice->company->id ?? null"
          :logo-path="$logoPath ?? null"
          css-class="logo-img"
          alt="logo"
          :for-pdf="true"
        />
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
        $phones = implode(', ', array_filter(preg_split('/[,\s\/|]+/', $telRaw)));
        $taxId  = trim($customer['tax_id'] ?? '');
        if (preg_match('/^\d{13}$/', $taxId)) {
            $taxId = preg_replace('/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/', '$1-$2-$3-$4-$5', $taxId);
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
    $createdDate = $invoice->created_at ? $invoice->created_at->format('d/m/Y') : date('d/m/Y');

    // Use document number/reference passed from service; fallback to invoice helpers
    $displayDocNumber = $docNumber ?? $invoice->getDocumentNumber($docType, $mode ?? null);
    $displayReferenceNo = $referenceNo ?? $invoice->getReferenceNumber($mode ?? null);

    $seller      = $invoice->manager ?? $invoice->creator;
    $sellerFirst = optional($seller)->user_firstname;
    $sellerLast  = optional($seller)->user_lastname;
    $sellerUser  = optional($seller)->username;
    $sellerDisplay = trim(($sellerFirst.' '.$sellerLast) ?: ($sellerUser ?? ''));
    $jobName = $invoice->job_name ?? $invoice->project_name ?? $invoice->work_name ?? null;
    if (is_string($jobName)) { $jobName = trim($jobName); }

    $metaRows = [
      ['label'=>'เลขที่','value'=>$displayDocNumber],
      ['label'=>'วันที่','value'=>$createdDate],
    ];
    if ($sellerDisplay)      $metaRows[] = ['label'=>'ผู้ขาย','value'=> trim($sellerFirst) ?: $sellerUser];
    if ($displayReferenceNo) $metaRows[] = ['label'=>'อ้างอิง','value'=>$displayReferenceNo,'format'=>'inline'];
    @endphp

      <div class="doc-header-section">
        <div class="doc-title">{{ $docTitle }}</div>
        <div class="doc-header-type">{{ $invoice->document_header_type ?? 'ต้นฉบับ' }}</div>
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
