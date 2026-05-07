{{-- TODO P4: financial-extraction PHP blocks at L60, L93 should move to InvoicePdfMasterService::buildFinancialSummary() --}}
{{-- See: docs/audits/accounting-pdf-views-2026-05-05.md --}}
@extends('accounting.pdf.invoice._layout')

@section('items-section')
  {{-- ตารางสินค้า/บริการ — flat summary (2-col)
       $invoiceItems — built by InvoicePdfMasterService::buildViewData() via
       Calculator::buildPdfItemsForType() (audit C2). Each item is one summary
       line (e.g. "1. รับมัดจำ / อ้างอิงจาก ...") with its total amount.
       Styles in invoice-body.css (loaded last to win cascade). --}}

  <div class="mb-3">รายละเอียดสินค้า/บริการ</div>

  @if(!empty($invoiceItems))
    @php $no = 1; @endphp
    <table class="invb-items">
      <colgroup>
        <col style="width: 78%;">
        <col style="width: 22%;">
      </colgroup>
      <thead>
        <tr>
          <th class="invb-th-desc">รายละเอียด</th>
          <th class="invb-th-num">จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        @foreach($invoiceItems as $item)
          @php
            $rawDesc = $item['description'] ?? $item['item_description'] ?? '-';
            // Split into title (first line) + body (rest) — bold title, gray body
            $parts = preg_split('/\r\n|\r|\n/', (string) $rawDesc, 2);
            $itemTitle = trim($parts[0] ?? '-');
            $itemBody = isset($parts[1]) ? trim($parts[1]) : '';
            $itemAmount = $item['amount'] ?? (($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0));
            $hasBody = $itemBody !== '';
          @endphp
          {{-- Row 1: title + amount — both columns share pink bg + red bottom border --}}
          <tr class="invb-title-row">
            <td class="invb-title-cell">
              <span class="invb-summary-no">{{ $no++ }}.</span>{{ $itemTitle }}
            </td>
            <td class="invb-amount">{{ number_format($itemAmount, 2) }}</td>
          </tr>
          {{-- Row 2: subtitle — no bg + gray bottom border on both cells --}}
          @if($hasBody)
            <tr class="invb-subtitle-row">
              <td class="invb-subtitle-cell">{!! nl2br(e($itemBody)) !!}</td>
              <td class="invb-subtitle-amount"></td>
            </tr>
          @endif
        @endforeach
      </tbody>
    </table>
  @else
    <div class="no-items-box"><strong>ไม่มีรายการสินค้า/บริการ</strong></div>
  @endif
@endsection

@section('notes-content')
  {!! !empty($invoice->notes) ? nl2br(e($invoice->notes)) : 'ไม่มีหมายเหตุ' !!}
@endsection

@section('summary-table')
  @php
    // Extract financial data from summary array
    $pricingMode = $summary['pricing_mode'] ?? 'net';
    $isVatIncluded = $pricingMode === 'vat_included';

    // For VAT included mode: use subtotal as display amount (it already includes VAT)
    // For Net mode: use subtotal as is
    if ($isVatIncluded) {
      // In VAT included mode, subtotal already includes VAT, so we show it as-is
      $subtotal = (float) ($summary['subtotal'] ?? 0);
    } else {
      // In Net mode, subtotal is before VAT
      $subtotal = (float) ($summary['subtotal'] ?? 0);
    }

    $vatAmount = (float) ($summary['vat_amount'] ?? 0);
    $specialDiscountAmount = (float) ($summary['special_discount_amount'] ?? 0);
    $hasVat = (bool) ($summary['has_vat'] ?? true);
    $hasWithholdingTax = (bool) ($summary['has_withholding_tax'] ?? false);
    $withholdingTaxAmount = (float) ($summary['withholding_tax_amount'] ?? 0);
    $finalTotalAmount = (float) ($summary['final_total_amount'] ?? 0);

    // Conditional display logic
    $showSpecialDiscount = $specialDiscountAmount > 0;
    $showWithholdingTax = $hasWithholdingTax && $withholdingTaxAmount > 0;
  @endphp

  <table class="summary-table formal">
    <colgroup>
      <col style="width: 45%;">
      <col style="width: 55%;">
    </colgroup>

    @php
      // หากเป็นใบมัดจำ ให้คำนวณสรุปใหม่จากยอดมัดจำก่อน VAT
      // แต่ต้องคำนึงถึง pricing_mode ด้วย!
      if (($invoice->type ?? null) === 'deposit' && !empty($invoice->quotation)) {
        $depositMode = $invoice->deposit_mode ?? 'percentage';
        $vatPct = (float) ($summary['vat_percentage'] ?? $invoice->vat_percentage ?? 7);
        $hasVat = (bool) ($invoice->has_vat ?? true);
        $withholdingPct = (float) ($invoice->withholding_tax_percentage ?? 0);
        $hasWithholdingTax = (bool) ($invoice->has_withholding_tax ?? false);
        $quotationPricingMode = $invoice->quotation->pricing_mode ?? 'net';

        // base pre-VAT = subtotal - special discount; fallback total - vat - special
        $qSubtotal = (float) ($invoice->quotation->subtotal ?? 0);
        $qSpecial  = (float) ($invoice->quotation->special_discount_amount ?? 0);

        // คำนวณ base ตาม pricing_mode ของ quotation
        if ($quotationPricingMode === 'vat_included') {
          // ถ้า quotation เป็น vat_included, subtotal รวม VAT แล้ว
          // ต้องแยก VAT ออกก่อน
          $qNetSubtotal = (float) ($invoice->quotation->net_subtotal ?? 0);
          if ($qNetSubtotal > 0) {
            $preVatBase = max(0, round($qNetSubtotal - $qSpecial, 2));
          } else {
            // fallback: คำนวณจาก subtotal
            $vatMultiplier = 1 + ($vatPct / 100);
            $netAmount = round($qSubtotal / $vatMultiplier, 2);
            $preVatBase = max(0, round($netAmount - $qSpecial, 2));
          }
        } else {
          // Net mode: subtotal เป็นยอดก่อน VAT อยู่แล้ว
          $preVatBase = max(0, round($qSubtotal - $qSpecial, 2));
          if ($preVatBase <= 0) {
            $qTotal = (float) ($invoice->quotation->total_amount ?? 0);
            $qVat   = (float) ($invoice->quotation->vat_amount ?? 0);
            $preVatBase = max(0, round($qTotal - $qVat - $qSpecial, 2));
          }
        }

        if ($depositMode === 'percentage') {
          $pct = max(0, min(100, (float) ($invoice->deposit_percentage ?? 0)));
          $depositSubtotal = round($preVatBase * ($pct/100), 2);
        } else {
          // amount mode: ถือว่าเป็นยอดก่อน VAT ที่จะใช้คิด VAT ตรงๆ
          $depositSubtotal = (float) ($invoice->deposit_amount ?? 0);
        }

        // สร้างค่าใหม่เพื่อทับของเดิมสำหรับการแสดงผล
        // ถ้า invoice เป็น vat_included, ต้องแสดง gross amount (รวม VAT)
        if ($isVatIncluded) {
          // คำนวณ VAT
          $vatAmount = $hasVat ? round($depositSubtotal * ($vatPct/100), 2) : 0;
          // subtotal ที่แสดง = net + VAT (gross amount)
          $subtotal = $depositSubtotal + $vatAmount;
          $finalTotalAmount = max(0, round($subtotal - $withholdingTaxAmount, 2));
        } else {
          // Net mode: แสดง net amount
          $subtotal = $depositSubtotal;
          $vatAmount = $hasVat ? round($depositSubtotal * ($vatPct/100), 2) : 0;
          $withholdingTaxAmount = $hasWithholdingTax ? round($depositSubtotal * ($withholdingPct/100), 2) : 0;
          $finalTotalAmount = max(0, round($depositSubtotal + $vatAmount - $withholdingTaxAmount, 2));
        }

        $specialDiscountAmount = 0; // ส่วนลดพิเศษได้รวมในฐาน pre-VAT แล้ว
        $showSpecialDiscount = false;
      }
    @endphp

    {{-- Show pricing mode indicator for VAT included --}}
    <!-- @if($isVatIncluded && $hasVat)
      <tr>
        <td colspan="2" style="padding: 4pt 6pt; background-color: #e3f2fd; font-size: 7pt; color: #1976d2; text-align: center;">
          <strong>โหมดราคารวม VAT:</strong> ราคาที่กรอกรวม VAT {{ $summary['vat_percentage'] ?? 7 }}% แล้ว
        </td>
      </tr>
    @endif -->

    {{-- 1. Subtotal (ยอดก่อนภาษี) --}}
    <tr>
      <td class="summary-label">ยอดก่อนภาษี</td>
      <td class="summary-amount">
        <div class="amount-container">
          <span class="amount-main">{{ number_format($subtotal, 2) }}</span>
        </div>
      </td>
    </tr>

    {{-- 2. Special Discount (conditional) --}}
    @if($showSpecialDiscount)
      <tr class="discount-row">
        <td class="summary-label">ส่วนลดพิเศษ</td>
        <td class="summary-amount discount">
          <div class="amount-container">
            <span class="amount-main">{{ number_format($specialDiscountAmount, 2) }}</span>
          </div>
        </td>
      </tr>
    @endif

    {{-- 3. VAT --}}
    <tr>
      <td class="summary-label">ภาษีมูลค่าเพิ่ม (VAT {{ $summary['vat_percentage'] ?? 7 }}%)</td>
      <td class="summary-amount">
        <div class="amount-container">
          <span class="amount-main">{{ number_format($vatAmount, 2) }}</span>
        </div>
      </td>
    </tr>

    {{-- 4. Withholding Tax (conditional) --}}
    @if($showWithholdingTax)
      <tr class="withholding-tax-row">
        <td class="summary-label">หักภาษี ณ ที่จ่าย</td>
        <td class="summary-amount withholding-tax">
          <div class="amount-container">
            <span class="amount-main">{{ number_format($withholdingTaxAmount, 2) }}</span>
          </div>
        </td>
      </tr>
    @endif

    {{-- Final Total --}}
    <tr class="total-row">
      <td class="summary-label">รวมเป็นเงินทั้งสิ้น</td>
      <td class="summary-amount">
        <div class="amount-container">
          <span class="amount-main {{ $finalTotalAmount > 999999 ? 'large-amount' : '' }}">
            {{ number_format($finalTotalAmount, 2) }}
          </span>
        </div>
      </td>
    </tr>

    {{-- Thai text conversion using final_total_amount --}}
    <tr class="reading-row">
      <td colspan="2" class="reading-cell">
        <div class="reading-full-width">(@thaiBaht($finalTotalAmount))</div>
      </td>
    </tr>
  </table>
@endsection
