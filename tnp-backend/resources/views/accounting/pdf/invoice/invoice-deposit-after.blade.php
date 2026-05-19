{{-- Invoice Deposit After Template — variant for "after-deposit" invoices. --}}
{{-- การคำนวณและแสดงผลสำหรับเอกสารมัดจำหลัง (after) --}}
{{-- แหล่งข้อมูล (จากตาราง invoices): subtotal_before_vat, deposit_amount_before_vat, has_vat (0/1), vat_percentage (ปกติ 7) --}}
{{-- สูตรการคำนวณ: --}}
{{--   1. รวมเป็นเงิน (ก่อน VAT) = subtotal_before_vat --}}
{{--   2. หักเงินมัดจำ (จากใบมัดจำก่อน, ก่อน VAT) = deposit_amount_before_vat --}}
{{--   3. จำนวนเงินหลังหักมัดจำ (ก่อน VAT) = subtotal_before_vat - deposit_amount_before_vat --}}
{{--   4. ภาษีมูลค่าเพิ่ม (VAT %) = has_vat then (จำนวนเงินหลังหักมัดจำ * vat_percentage/100) else 0 --}}
{{--   5. จำนวนเงินรวมทั้งสิ้น = จำนวนเงินหลังหักมัดจำ + ภาษีมูลค่าเพิ่ม --}}
{{-- หมายเหตุ: การคำนวณทำที่ InvoicePdfMasterService->calculateDepositAfterAmounts() — view นี้แสดงผลเท่านั้น ไม่คำนวณซ้ำ --}}
{{-- TODO P4: items grouping PHP block + financial extraction should move to service. See: docs/audits/accounting-pdf-views-2026-05-05.md --}}
@extends('accounting.pdf.invoice._layout')

@section('items-section')
  {{-- ตารางสินค้า/บริการ --}}
  <div class="mb-3">รายละเอียดสินค้า/บริการ</div>
  @php
    $groupsData=[];
    $no=1;

    // ใช้ข้อมูลจาก groups ที่สร้างจาก invoice_items
    $invoiceGroups = $groups ?? [];
  @endphp

  @if(!empty($invoiceGroups))
    @foreach($invoiceGroups as $g)
      @php
        $unit=$g['unit']??'ชิ้น';
        $meta=array_filter([$g['pattern']?:null,$g['fabric']?:null,$g['color']?:null]);
        // SECURITY: escape user-controlled item fields before concat to prevent XSS/SSRF via mPDF <img src> fetching
        $title=e($g['name']?:'ไม่ระบุชื่องาน');
        if($meta){
          $title.=' <span class="meta-light">'.e(implode(', ',$meta)).'</span>';
        }
        $items=[];
        foreach($g['rows'] as $r){
          $qty=(float)($r['quantity']??0);
          $price=(float)($r['unit_price']??0);
          $amount=$qty*$price;
          $discountAmount = (float)($r['discount_amount'] ?? 0);
          $finalAmount = max(0, $amount - $discountAmount);

          $items[]=[
            'desc'=> ($r['size']?:'-'),
            'qty'=>$qty,
            'unit'=>$unit,
            'price'=>$price,
            'amount'=>$amount,
            'discount_amount'=>$discountAmount,
            'final_amount'=>$finalAmount,
            'item_description'=>$r['item_description'] ?? null,
            'notes' => $r['notes'] ?? null,
          ];
        }
        $groupsData[]=[
          'no'=>$no,
          'title'=>$title,
          'items'=>$items
        ];
        $no++;
      @endphp
    @endforeach

    <table class="items-table slim table-numbers-sm formal">
      <colgroup>
        {{-- ปรับความกว้างคอลัมน์ --}}
        <col class="w-desc">       {{-- รายละเอียด --}}
        <col class="w-qty">        {{-- จำนวน --}}
        <col class="w-unit-price"> {{-- ราคาต่อหน่วย --}}
        <col class="w-total">      {{-- ยอดรวม --}}
      </colgroup>
      <thead>
        <tr>
          {{-- สลับหัวตาราง --}}
          <th class="desc-head text-center">รายละเอียด</th>
          <th class="text-right">จำนวน</th>
          <th class="text-right">ราคาต่อหน่วย</th>
          <th class="text-right">ยอดรวม</th>
        </tr>
      </thead>
      <tbody>
        @foreach($groupsData as $g)
          {{-- แถวหัวข้อกลุ่ม (parent) --}}
          <tr class="group-row">
            <td class="desc"><span class="group-no">{{ $g['no'] }}.</span> {!! $g['title'] !!}</td>
            <td class="num muted"></td>
            <td class="num muted"></td>
            <td class="num muted"></td>
          </tr>

          {{-- แถวรายการย่อย (child) --}}
          @foreach($g['items'] as $it)
            <tr class="item-row">
              <td class="desc child">
                {{ $it['desc'] }}
                @if(!empty($it['notes']))
                  <span class="item-note-inline" style="color: #888;"> {{ $it['notes'] }}</span>
                @endif

                {{-- @if(!empty($it['item_description']))
                  <br/><small class="item-description">{{ $it['item_description'] }}</small>
                @endif --}}
              </td>
              {{-- สลับคอลัมน์ จำนวน และ ราคาต่อหน่วย --}}
              <td class="num">{{ number_format($it['qty']) }} {{ $it['unit'] }}</td>
              <td class="num">{{ number_format($it['price'], 2) }}</td>
              <td class="num">
                @if($it['discount_amount'] > 0)
                  <div>{{ number_format($it['amount'], 2) }}</div>
                  <div class="discount-line">หัก {{ number_format($it['discount_amount'], 2) }}</div>
                  <div class="final-amount">{{ number_format($it['final_amount'], 2) }}</div>
                @else
                  {{ number_format($it['final_amount'], 2) }}
                @endif
              </td>
            </tr>
          @endforeach
        @endforeach
      </tbody>
    </table>
  @else
    <div class="no-items-box"><strong>ไม่มีรายการสินค้า/บริการ</strong></div>
  @endif
@endsection

@section('notes-content')
  @php
    $afterDepositNotes = $invoice->notes ?? '';
    if (empty($afterDepositNotes)) {
      $afterDepositNotes = "นี่เป็นใบแจ้งหนี้สำหรับยอดคงเหลือหลังจากการชำระมัดจำแล้ว";
    }
  @endphp
  {!! nl2br(e($afterDepositNotes)) !!}
@endsection

@section('summary-table')
  @php
    // Extract basic financial data from summary array
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

    // Extract deposit-after calculations from Service
    // InvoicePdfMasterService->calculateDepositAfterAmounts() ส่งมาให้
    $depositAfter = $summary['deposit_after'] ?? [];
    $isDepositAfter = (bool) ($depositAfter['is_deposit_after'] ?? false);

    if ($isDepositAfter) {
      // ใช้ข้อมูลจาก Service (ไม่คำนวณซ้ำใน View)
      // สูตรการคำนวณ:
      // 1. รวมเป็นเงิน (ก่อน VAT) = subtotal_before_vat
      $totalBeforeVat = (float) ($depositAfter['total_before_vat'] ?? 0);

      // 2. หักเงินมัดจำ (จากใบมัดจำก่อน, ก่อน VAT) = deposit_amount_before_vat
      $depositPaidBeforeVat = (float) ($depositAfter['deposit_paid_before_vat'] ?? 0);

      // 3. จำนวนเงินหลังหักมัดจำ (ก่อน VAT) = subtotal_before_vat - deposit_amount_before_vat
      $amountAfterDepositDeduction = (float) ($depositAfter['amount_after_deposit_deduction'] ?? 0);

      // 4. ภาษีมูลค่าเพิ่ม (VAT %) = has_vat ? (จำนวนเงินหลังหักมัดจำ * vat_percentage/100) : 0
      $vatOnRemaining = (float) ($depositAfter['vat_on_remaining'] ?? 0);

      // 5. จำนวนเงินรวมทั้งสิ้น = จำนวนเงินหลังหักมัดจำ + ภาษีมูลค่าเพิ่ม
      $finalTotalWithVat = (float) ($depositAfter['final_total_with_vat'] ?? 0);

      $referenceInvoiceNumber = (string) ($depositAfter['reference_invoice_number'] ?? '');

      // Override display values for deposit-after
      $vatAmount = $vatOnRemaining;
      $finalTotalAmount = $finalTotalWithVat;

      // Force showing deposit-related rows even if amounts are 0
      $showDepositDeduction = true;
    } else {
      // Use standard calculation for regular invoices
      $totalBeforeVat = $subtotal;
      $depositPaidBeforeVat = 0;
      $amountAfterDepositDeduction = 0;
      $referenceInvoiceNumber = '';
      $showDepositDeduction = false;
    }

    // Conditional display logic
    $showSpecialDiscount = $specialDiscountAmount > 0;
    $showWithholdingTax = $hasWithholdingTax && $withholdingTaxAmount > 0;
  @endphp

  <table class="summary-table formal">
    <colgroup>
      <col style="width: 45%;">
      <col style="width: 55%;">
    </colgroup>

    {{-- Show pricing mode indicator for VAT included --}}
    <!-- @if($isVatIncluded && $hasVat)
      <tr>
        <td colspan="2" style="padding: 4pt 6pt; background-color: #e3f2fd; font-size: 7pt; color: #1976d2; text-align: center;">
          <strong>โหมดราคารวม VAT:</strong> ราคาที่กรอกรวม VAT {{ $summary['vat_percentage'] ?? 7 }}% แล้ว
        </td>
      </tr>
    @endif -->

    {{-- 1. รวมเป็นเงิน (ก่อน VAT) = subtotal_before_vat --}}
    <tr>
      <td class="summary-label">{{ $isDepositAfter ? 'รวมเป็นเงิน' : 'ยอดก่อนภาษี' }}</td>
      <td class="summary-amount">
        <div class="amount-container">
          <span class="amount-main">{{ number_format($isDepositAfter ? $totalBeforeVat : $subtotal, 2) }}</span>
        </div>
      </td>
    </tr>

    {{-- 2. หักเงินมัดจำ (จากใบมัดจำก่อน, ก่อน VAT) = deposit_amount_before_vat --}}
    @if($isDepositAfter)
      <tr class="deposit-deduction-row">
        <td class="summary-label">หักเงินมัดจำ@if(!empty($referenceInvoiceNumber)) {{ $referenceInvoiceNumber }}@endif</td>
        <td class="summary-amount">
          <div class="amount-container">
            <span class="amount-main">{{ number_format($depositPaidBeforeVat, 2) }}</span>


          </div>
        </td>
      </tr>

      {{-- 3. จำนวนเงินหลังหักมัดจำ (ก่อน VAT) = subtotal_before_vat - deposit_amount_before_vat --}}
      <tr class="after-deposit-row">
        <td class="summary-label">จำนวนเงินหลังหักมัดจำ</td>
        <td class="summary-amount">
          <div class="amount-container">
            <span class="amount-main">{{ number_format($amountAfterDepositDeduction, 2) }}</span>
          </div>
        </td>
      </tr>
    @endif

    {{-- 4. ภาษีมูลค่าเพิ่ม (VAT %) = has_vat ? (จำนวนเงินหลังหักมัดจำ * vat_percentage/100) : 0 --}}
    <tr>
      <td class="summary-label">ภาษีมูลค่าเพิ่ม (VAT {{ $isDepositAfter ? ($depositAfter['vat_rate'] ?? 7) : ($summary['vat_percentage'] ?? 7) }}%)</td>
      <td class="summary-amount">
        <div class="amount-container">
          <span class="amount-main">{{ number_format($vatAmount, 2) }}</span>
        </div>
      </td>
    </tr>

    {{-- 4. Withholding Tax (conditional - only for non-deposit-after invoices) --}}
    @if(!$isDepositAfter && $showWithholdingTax)
      <tr class="withholding-tax-row">
        <td class="summary-label">หักภาษี ณ ที่จ่าย</td>
        <td class="summary-amount withholding-tax">
          <div class="amount-container">
            <span class="amount-main">{{ number_format($withholdingTaxAmount, 2) }}</span>
          </div>
        </td>
      </tr>
    @endif

    {{-- 5. จำนวนเงินรวมทั้งสิ้น = จำนวนเงินหลังหักมัดจำ + ภาษีมูลค่าเพิ่ม --}}
    <tr class="total-row">
      <td class="summary-label">จำนวนเงินรวมทั้งสิ้น</td>
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
