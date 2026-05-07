{{--
  Shared layout for invoice-family PDF docs (invoice-master, invoice-deposit-after).
  Extracted per audit accounting-pdf-views-2026-05-05 finding P1.

  Sections to override:
    @section('items-section')   — items table HTML (each variant has different column layout)
    @section('notes-content')   — content of the left "หมายเหตุ" panel
    @section('summary-table')   — right-side <table.summary-table> with VAT / total rows

  All variants share: HTML head/body, summary-notes-wrapper colgroup,
                     bank account info block (_bank-account.blade.php),
                     trailing 35mm signature spacer.
--}}
<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">

  {{-- CSS is loaded separately by InvoicePdfMasterService --}}
</head>
<body>
  <div class="document-content">

    @yield('items-section')

    {{-- Number → Thai baht text uses @thaiBaht directive (see AppServiceProvider + AccountingHelper) --}}

    {{-- Summary and Notes Section --}}
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
              @yield('notes-content')
            </div>

            @include('accounting.pdf.invoice.partials._bank-account')
          </td>

          {{-- Summary Section (Right) --}}
          <td class="panel-box">
            @yield('summary-table')
          </td>
        </tr>
      </table>
    </div>

    {{-- Spacer to reserve 45mm for signature area (sig height 30mm + 15mm gap to footer line; see BasePdfMasterService::renderSignatureAdaptive) --}}
    <div style="height: 45mm; page-break-inside: avoid;"></div>

  </div>
</body>
</html>
