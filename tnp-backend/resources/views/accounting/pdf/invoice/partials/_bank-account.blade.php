{{-- Bank account info block — shared between invoice-master + invoice-deposit-after (audit P1) --}}
@if(!empty($invoice->company->account_name) || !empty($invoice->company->bank_name) || !empty($invoice->company->account_number))
  {{-- mPDF collapses empty <div></div> to 0 height — must contain &nbsp; to
       force the spacer to render. Use a <table> with explicit cell heights
       which mPDF respects 100%. --}}
  <table class="bank-account-separator" cellpadding="0" cellspacing="0">
    <tr>
      <td class="bank-account-spacer-top">&nbsp;</td>
    </tr>
    <tr>
      <td class="bank-account-divider-cell">&nbsp;</td>
    </tr>
    <tr>
      <td class="bank-account-spacer-bottom">&nbsp;</td>
    </tr>
  </table>
  <div class="bank-account-section">
    <h3 class="bank-account-title">ข้อมูลการชำระเงิน</h3>
    <div class="panel-content">
      @if(!empty($invoice->company->account_name))
        <div>ชื่อบัญชี: {{ $invoice->company->account_name }}</div>
      @endif

      @if(!empty($invoice->company->bank_name))
        <div>ชื่อธนาคาร: {{ $invoice->company->bank_name }}</div>
      @endif

      @if(!empty($invoice->company->account_number))
        <div>เลขบัญชี: {{ $invoice->company->account_number }}</div>
      @endif
    </div>
  </div>
@endif
