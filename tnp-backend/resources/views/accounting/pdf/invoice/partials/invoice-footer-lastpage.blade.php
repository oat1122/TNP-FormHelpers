{{-- resources/views/accounting/pdf/invoice/partials/invoice-footer-lastpage.blade.php --}}

{{-- 1. Include a signature partial file --}}
@include('accounting.pdf.invoice.partials.invoice-signature')

{{-- 2. Include the original footer partial file --}}
@include('accounting.pdf.invoice.partials.invoice-footer')
