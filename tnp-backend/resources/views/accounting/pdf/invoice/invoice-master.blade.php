{{-- TODO P4: financial-extraction PHP blocks at L60, L93 should move to InvoicePdfMasterService::buildFinancialSummary() --}}
{{-- See: docs/audits/accounting-pdf-views-2026-05-05.md --}}
@extends('accounting.pdf.invoice._layout')

@section('items-section')
  {{-- ตารางสินค้า/บริการ — $invoiceItems built by InvoicePdfMasterService::buildViewData() via Calculator::buildPdfItemsForType() (audit C2) --}}
  <div class="mb-3">รายละเอียดสินค้า/บริการ</div>
  @php $no = 1; @endphp

  @if(!empty($invoiceItems))
    {{-- ตารางแบบ 2 คอลัมน์สำหรับ invoice-master --}}
    <table class="items-table slim table-numbers-sm invoice-items">
      <colgroup>
        {{-- ปรับความกว้าง: รายละเอียด(78%) + ยอดรวม(22%) --}}
        <col style="width: 78%;">  {{-- รายละเอียด --}}
        <col style="width: 22%;">  {{-- จำนวนเงิน --}}
      </colgroup>
      <thead>
        <tr>
          {{-- ลบ th ลำดับ --}}
          <th class="text-left">รายละเอียด</th>
          <th class="text-right">จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        @foreach($invoiceItems as $item)
          <tr>
            {{-- ลบ td ลำดับ, เพิ่ม $no หน้า desc --}}
            <td class="desc"><span class="item-no">{{ $no++ }}.</span> {!! nl2br(e($item['description'] ?? $item['item_description'] ?? '-')) !!}</td>
            <td class="num">{{ number_format($item['amount'] ?? (($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0)), 2) }}</td>
          </tr>
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

  <table class="summary-table">
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
