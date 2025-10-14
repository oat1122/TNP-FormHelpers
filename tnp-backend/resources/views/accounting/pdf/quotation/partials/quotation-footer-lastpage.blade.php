{{-- resources/views/accounting/pdf/quotation/partials/quotation-footer-lastpage.blade.php --}}

{{-- 1. Include a signature partial file --}}
@include('accounting.pdf.quotation.partials.quotation-signature')

{{-- 2. Include the original footer partial file --}}
@include('accounting.pdf.quotation.partials.quotation-footer')
