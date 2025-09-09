{{-- resources/views/accounting/pdf/invoice/partials/invoice-header.blade.php --}}
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
      </div><br/>

      <div class="header-divider"></div>
      <div class="company-meta">
        ลูกค้า 
      </div>

      {{-- ข้อมูลลูกค้า --}}
      @php
        $name = trim($customer['name'] ?? '-');
        $addr = trim($customer['address'] ?? '-');
        $telRaw = $customer['tel'] ?? '';
        // แยกเบอร์ด้วย , / | หรือช่องว่างหลายตัว
        $phones = implode(', ', array_filter(preg_split('/[,\\s\\/|]+/', $telRaw)));
        $taxId = trim($customer['tax_id'] ?? '');
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
      @php
        // เตรียมค่าตัวแปรแสดงผล
        $docTitle = 'ใบวางบิล / ใบแจ้งหนี้'; // เรียงตามตัวอย่างภาพ
        $docSubTitle = $invoice->document_header_type ?? 'ต้นฉบับ';
        $createdDate = $invoice->created_at ? $invoice->created_at->format('d/m/Y') : date('d/m/Y');
        $dueDate = !empty($invoice->due_date) ? date('d/m/Y', strtotime($invoice->due_date)) : null;
        $quotationNo = (!empty($invoice->quotation) && !empty($invoice->quotation->number)) ? $invoice->quotation->number : null;
        $seller = $invoice->manager ?? $invoice->creator;
        $sellerFirst = optional($seller)->user_firstname;
        $sellerLast = optional($seller)->user_lastname;
        $sellerUser = optional($seller)->username;
        $sellerDisplay = trim(($sellerFirst.' '.$sellerLast) ?: ($sellerUser ?? ''));
        // ค่าชื่องาน (ถ้าไม่มีให้เป็น -)
        $jobName = $invoice->job_name ?? $invoice->project_name ?? $invoice->work_name ?? null;
        if (is_string($jobName)) { $jobName = trim($jobName); }

        $metaRows = [
          ['label' => 'เลขที่',      'value' => $invoice->number ?? 'DRAFT'],
          ['label' => 'วันที่',       'value' => $createdDate],
        ];
        if ($dueDate) {
          $metaRows[] = ['label' => 'ครบกำหนด', 'value' => $dueDate];
        }
        if ($sellerDisplay) {
          // ใช้ชื่อจริง (เฉพาะชื่อ) ตามตัวอย่าง (ถ้าไม่มีใช้ username)
          $metaRows[] = ['label' => 'ผู้ขาย', 'value' => trim($sellerFirst) ?: $sellerUser];
        }
        if ($quotationNo) {
          $metaRows[] = ['label' => 'อ้างอิง', 'value' => $quotationNo];
        }
      @endphp

      <div class="doc-header-block">
        <div class="doc-title-combo" style="text-align:center; margin-bottom:4px;">
          <span class="doc-title" style="display:inline-block; letter-spacing:.3px; white-space:nowrap;">{{ $docTitle }}</span><br>
          <span class="doc-subtitle" style="display:inline-block; font-size:10pt; margin-top:1px; color:#333; white-space:nowrap; font-weight:500;">{{ $docSubTitle }}
            @if(!($isFinal ?? true))
              <br><span style="color:#e74c3c; font-weight:600; font-size:8.2pt;">PREVIEW - ไม่ใช่เอกสารจริง</span>
            @endif
          </span>
        </div>

  <table class="doc-meta-table" width="100%" cellpadding="0" cellspacing="0" style="width:100%; margin-top:6px; border-collapse:collapse; font-size:9pt;">
          @foreach($metaRows as $row)
            <tr>
              <td class="meta-label" style="width:38%; padding:2px 0; font-weight:600; text-align:left; white-space:nowrap;">{{ $row['label'] }}</td>
              <td class="meta-value" style="padding:2px 0; text-align:left;">{{ $row['value'] }}</td>
            </tr>
          @endforeach
        </table>

  <div class="meta-divider" style="border-top:1px solid #aaa; margin:6px 0 5px; width:100%;"></div>

        @if($jobName)
          <table class="doc-extra-table" width="100%" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:9pt;">
            <tr>
              <td style="width:38%; padding:2px 0; font-weight:600; text-align:left; white-space:nowrap;">ชื่องาน</td>
              <td style="padding:2px 0; text-align:left;">{{ $jobName }}</td>
            </tr>
          </table>
        @endif

        @if (($invoice->status ?? 'draft') === 'draft')
          <div class="badge-draft" style="display:inline-block; margin-top:6px; background:#999; color:#fff; padding:2px 8px; font-size:11px; border-radius:3px;">ร่าง</div>
        @endif
      </div>
    </td>
  </tr>
</table>
