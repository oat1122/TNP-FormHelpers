<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  
  {{-- CSS is loaded separately by QuotationPdfMasterService --}}
</head>
<body>
  <div class="document-content">

    {{-- ข้อมูลลูกค้าย้ายไปหัวเอกสาร (header) — customer-box ถูก render ใน quotation-header.blade.php --}}
    {{-- TODO P4: PHP blocks here should move to QuotationPdfMasterService::buildViewData(): --}}
    {{--   - L24 items grouping → already in groupQuotationItems(), drop inline duplicate --}}
    {{--   - L116 image resolver closure → extract to PdfImageOptimizer::resolveSourceUrl() --}}
    {{--   - L213 financial field extraction → move to buildFinancialSummary() --}}
    {{--   See: docs/audits/accounting-pdf-views-2026-05-05.md (P4) --}}


    {{-- ตารางสินค้า/บริการ --}}
    <div class="mb-3">รายละเอียดสินค้า/บริการ</div>
    @php 
      $groupsData=[]; 
      $no=1; 
    @endphp
    
    @if(!empty($groups))
      @foreach($groups as $g)
        @php
          $unit=$g['unit']??'ชิ้น';
          $meta=array_filter([$g['pattern']?:null,$g['fabric']?:null,$g['color']?:null]);
          $title=($g['name']?:'ไม่ระบุชื่องาน'); 
          if($meta){
            $title.=' <span class="meta-light">'.implode(', ',$meta).'</span>';
          }
          $items=[]; 
          foreach($g['rows'] as $r){ 
            $qty=(float)($r['quantity']??0); 
            $price=(float)($r['unit_price']??0); 
            $amount=$qty*$price; 
            $items[]=[
              'desc'=> ($r['size']?:'-'),
              'notes' => $r['notes'] ?? null,
              'qty'=>$qty,
              'unit'=>$unit,
              'price'=>$price,
              'amount'=>$amount
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
    @endif

    @if(count($groupsData))
      {{--
        1. เพิ่ม class 'quotation-pdf-table' เพื่อให้ CSS ใหม่ทำงาน
      --}}
      <table class="items-table slim table-numbers-sm quotation-pdf-table formal">
        <colgroup>
          {{-- 2. เปลี่ยนไปใช้ class ความกว้างใหม่ (q-col-...) ที่ไม่ซ้ำซ้อน --}}
          {{-- ลำดับนี้คือลำดับการแสดงผลที่ถูกต้อง --}}
          <col class="q-col-desc">       {{-- รายละเอียด (55%) --}}
          <col class="q-col-qty">        {{-- จำนวน (12%) --}}
          <col class="q-col-unit-price"> {{-- ราคาต่อหน่วย (16%) --}}
          <col class="q-col-total">      {{-- ยอดรวม (17%) --}}
        </colgroup>
        <thead>
          <tr>
            {{-- ลำดับของ <th> ถูกต้องอยู่แล้ว --}}
            <th class="desc-head text-center">รายละเอียด</th>
            <th class="text-right">จำนวน</th>
            <th class="text-center">ราคาต่อหน่วย</th>
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
                </td>
                {{--
                  3. เพิ่ม Inline Style กลับมา
                     นี่เป็นวิธีที่แน่นอนที่สุดสำหรับ mPDF
                --}}
                <td class="num qty-cell">{{ number_format($it['qty']) }} {{ $it['unit'] }}</td>
                <td class="num price-cell">{{ number_format($it['price'], 2) }}</td>
                <td class="num amount-cell">{{ number_format($it['amount'], 2) }}</td>
              </tr>
            @endforeach
          @endforeach
        </tbody>
      </table>
    @else
      <div class="no-items-box"><strong>ไม่มีรายการสินค้า/บริการ</strong></div>
    @endif

    {{-- Number → Thai baht text uses @thaiBaht directive (see AppServiceProvider + AccountingHelper) --}}

    {{-- Summary and Notes Section - แยกคำอ่านออกมา --}}
    {{-- Sample Images (moved under items table) --}}
    @php
      $sampleImages = is_array($quotation->sample_images ?? null) ? $quotation->sample_images : [];
      // Prefer local filesystem path for mPDF to avoid slow HTTP fetches
      // Use image optimizer to resize large images for better PDF performance
      $optimizer = $imageOptimizer ?? null;
      $resolveImgSrc = function ($img) use ($optimizer) {
        $url = $img['url'] ?? '';
        $path = $img['path'] ?? '';
        $relative = $path ? str_replace('public/', '', $path) : '';
        $resolvedPath = '';
        
        if ($relative) {
          $publicStorage = public_path('storage/' . $relative);
          if (is_file($publicStorage)) {
            $resolvedPath = $publicStorage;
          } else {
            $absStorage = storage_path('app/' . $relative);
            if (is_file($absStorage)) {
              $resolvedPath = $absStorage;
            }
          }
        }
        
        if (!$resolvedPath && $url) {
          $resolvedPath = $url;
        }
        
        // Optimize image for PDF if optimizer is available
        if ($optimizer && $resolvedPath) {
          return $optimizer->optimizeForPdf($resolvedPath);
        }
        
        return $resolvedPath;
      };
      
      
      // Pick up to 3 images: filter for selected_for_pdf
      if (!empty($sampleImages)) {
        $selectedImages = [];
        foreach ($sampleImages as $it) {
          if (!empty($it['selected_for_pdf'])) {
            $selectedImages[] = $it;
          }
        }
        // Take only the first 3 selected
        $sampleImages = array_slice($selectedImages, 0, 3);
      }
    @endphp
    
    
    @if(count($sampleImages) > 0)
      <div class="sample-images-section">
        <div class="sample-images-title">รูปภาพตัวอย่าง</div>
        
        {{-- Use a table for robust horizontal layout in mPDF --}}
        <table class="sample-images-grid-table img-count-{{ count($sampleImages) }}">
          <tr>
            @foreach($sampleImages as $img)
              @php
                $u = $resolveImgSrc($img);
                $caption = $img['original_filename'] ?? ($img['filename'] ?? 'image');
              @endphp
              
              {{-- Each image is in its own cell with fixed 150x150px container --}}
              <td class="img-box-cell">
                @if($u)
                  <div style="width: 150px; height: 150px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                    <img src="{{ $u }}" alt="{{ $caption }}" class="sample-img" style="width: 150px; height: 150px; display: block; object-fit: cover;" />
                  </div>
                @endif
              </td>
            @endforeach
          </tr>
        </table>

      </div>
    @endif

    <div style="page-break-inside: avoid;">
      <div class="summary-notes-wrapper">
        <table class="summary-notes-table">
          <colgroup>
            <col style="width: 42%;">
            <col style="width: 58%;">
          </colgroup>
          <tr>
            {{-- Notes Section (Left) --}}
            <td class="panel-box panel-notes formal">
              <h3 class="panel-title panel-title--sm">หมายเหตุ</h3>
              <div class="panel-content">
                {!! !empty($quotation->notes) ? nl2br(e($quotation->notes)) : 'ไม่มีหมายเหตุ' !!}
              </div>
            </td>
            
            {{-- Summary Section (Right) --}}
            <td class="panel-box">
              
              @php
                // Extract financial data directly from database fields
                $subtotal = (float) ($quotation->subtotal ?? 0);
                // Support both Invoice (vat_amount) and Quotation (tax_amount) models
                $taxAmount = (float) ($quotation->vat_amount ?? $quotation->tax_amount ?? 0);
                $specialDiscountAmount = (float) ($quotation->special_discount_amount ?? 0);
                $hasWithholdingTax = (bool) ($quotation->has_withholding_tax ?? false);
                $withholdingTaxAmount = (float) ($quotation->withholding_tax_amount ?? 0);
                $finalTotalAmount = (float) ($quotation->final_total_amount ?? 0);
                
                // VAT settings
                $hasVat = (bool) ($quotation->has_vat ?? true);
                $vatPercentage = (float) ($quotation->vat_percentage ?? 7);
                
                // Conditional display logic
                $showSpecialDiscount = $specialDiscountAmount > 0;
                $showWithholdingTax = $hasWithholdingTax && $withholdingTaxAmount > 0;
                $showVat = $hasVat && $taxAmount > 0;
              @endphp

              <table class="summary-table formal">
                <colgroup>
                  <col style="width: 45%;">
                  <col style="width: 55%;">
                </colgroup>
                
                {{-- 1. Subtotal (ก่อน VAT) --}}
                <tr>
                  <td class="summary-label">รวมเป็นเงิน</td>
                  <td class="summary-amount">
                    <div class="amount-container">
                      <span class="amount-main">{{ number_format($subtotal, 2) }}</span>
                    </div>
                  </td>
                </tr>
                
                {{-- 3. Special Discount (conditional: show only if amount > 0) --}}
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
                
                {{-- 2. VAT (conditional: show only if has_vat = 1) --}}
                @if($showVat)
                  <tr>
                    <td class="summary-label">ภาษีมูลค่าเพิ่ม (VAT {{ number_format($vatPercentage, 0) }}%)</td>
                    <td class="summary-amount">
                      <div class="amount-container">
                        <span class="amount-main">{{ number_format($taxAmount, 2) }}</span>
                      </div>
                    </td>
                  </tr>
                @endif

                

                {{-- 4. Withholding Tax (conditional: show only if flag true AND amount > 0) --}}
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
                    <div class="reading-full-width">
                      (@thaiBaht($finalTotalAmount))
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      {{-- Spacer to reserve 45mm for signature area (sig height 30mm + 15mm gap to footer line; see BasePdfMasterService::renderSignatureAdaptive) --}}
      <div style="height: 45mm;"></div>
    </div>

  </div>
</body>
</html>
