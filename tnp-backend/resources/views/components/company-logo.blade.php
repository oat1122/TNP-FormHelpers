{{-- Company Logo Component --}}
@if($forPdf && $logoPath)
    <div class="logo-wrap">
        <img class="{{ $cssClass }}" src="{{ $logoPath }}" alt="{{ $alt }}">
    </div>
@elseif(!$forPdf && $logoUrl)
    <div class="logo-wrap">
        <img class="{{ $cssClass }}" src="{{ $logoUrl }}" alt="{{ $alt }}">
    </div>
@else
    {{-- No logo available --}}
@endif
