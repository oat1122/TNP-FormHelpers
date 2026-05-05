{{-- Bank account info block — shared between invoice-master + invoice-deposit-after (audit P1) --}}
@if(!empty($invoice->company->account_name) || !empty($invoice->company->bank_name) || !empty($invoice->company->account_number))
  <h3 class="panel-title panel-title--sm" style="margin-top: 15pt;">ข้อมูลการชำระเงิน</h3>
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
@endif
