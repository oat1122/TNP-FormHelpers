<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <style>
    @page {
      margin: 35mm 10mm 20mm 10mm; /* match config/pdf.php */
    }
    body { font-family: thsarabun, DejaVu Sans, sans-serif; font-size: 12pt; color: #111; }
    h1 { font-size: 22pt; margin: 0 0 6pt; }
    h2 { font-size: 14pt; margin: 12pt 0 6pt; }
    .header { position: fixed; left: 0; right: 0; top: -25mm; height: 25mm; }
    .footer { position: fixed; left: 0; right: 0; bottom: -15mm; height: 15mm; font-size: 10pt; color: #666; }
    .row { display: table; width: 100%; table-layout: fixed; }
    .col { display: table-cell; vertical-align: top; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .muted { color: #666; }
    .box { border: 1px solid #ddd; padding: 8pt; border-radius: 4pt; }
    .mt-4 { margin-top: 16pt; }
    .mt-2 { margin-top: 8pt; }
    .mb-2 { margin-bottom: 8pt; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { border: 1px solid #ddd; padding: 6pt; }
    .table th { background: #f5f5f5; }
    .no-border td { border: none; }
  </style>
</head>
<body>
  <div class="header">
    <div class="row">
      <div class="col" style="width: 55%">
        @php
          $logo = public_path('images/logo.png');
          if (!file_exists($logo)) { $logo = public_path('logo.png'); }
        @endphp
        @if (file_exists($logo))
          <img src="{{ $logo }}" style="height: 24mm;" />
        @endif
        <div style="margin-top: 4pt">
          <div style="font-size: 16pt; font-weight: bold">{{ $q->company->legal_name ?? $q->company->name ?? 'บริษัทของคุณ' }}</div>
          @if (!empty($q->company->address))
            <div>{{ $q->company->address }}</div>
          @endif
          <div class="muted">โทร: {{ $q->company->phone ?? '-' }}  เลขประจำตัวผู้เสียภาษี: {{ $q->company->tax_id ?? '-' }}</div>
        </div>
      </div>
      <div class="col text-right" style="width: 45%">
        <h1>ใบเสนอราคา</h1>
        <div>เลขที่: {{ $q->number ?? '-' }}</div>
        <div>วันที่: {{ now()->format('d/m/Y') }}</div>
      </div>
    </div>
  </div>

  <div class="footer text-center">
    <span class="muted">{{ $q->company->legal_name ?? $q->company->name ?? '' }} — {{ $q->company->phone ?? '' }}</span>
  </div>

  <main>
    <div class="box">
      <div class="row">
        <div class="col" style="width: 12em;">ลูกค้า:</div>
        <div class="col" style="font-weight: bold;">{{ $customer['name'] ?: '-' }}</div>
      </div>
      <div class="row">
        <div class="col" style="width: 12em;">ที่อยู่:</div>
        <div class="col">{!! nl2br(e($customer['address'] ?: '-')) !!}</div>
      </div>
      <div class="row">
        <div class="col" style="width: 12em;">เลขภาษี:</div>
        <div class="col">{{ $customer['tax_id'] ?: '-' }}</div>
      </div>
      <div class="row">
        <div class="col" style="width: 12em;">โทร:</div>
        <div class="col">{{ $customer['tel'] ?: '-' }}</div>
      </div>
    </div>

    <table class="table mt-4">
      <thead>
        <tr>
          <th style="width: 8%">#</th>
          <th>รายละเอียดงาน</th>
          <th style="width: 16%" class="text-right">จำนวน</th>
          <th style="width: 18%" class="text-right">ราคาต่อหน่วย</th>
          <th style="width: 18%" class="text-right">ยอดรวม</th>
        </tr>
      </thead>
      <tbody>
        @php $idx = 1; @endphp
        @foreach ($groups as $g)
          <tr>
            <td class="text-center">{{ $idx }}</td>
            <td style="font-weight: bold">{{ $g['name'] ?: 'ไม่ระบุชื่องาน' }}</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          @php
            $parts = array_values(array_filter([$g['pattern'] ?: null, $g['fabric'] ?: null, $g['color'] ?: null]));
          @endphp
          @if (!empty($parts))
            <tr>
              <td></td>
              <td class="muted">{{ implode(' • ', $parts) }}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          @endif

          @php $groupTotal = 0; @endphp
          @if (collect($g['rows'])->some(fn($r) => !empty($r['size'])))
            @foreach ($g['rows'] as $r)
              @php
                $qty = (float)($r['quantity'] ?? 0);
                $price = (float)($r['unit_price'] ?? 0);
                $line = $qty * $price; $groupTotal += $line;
              @endphp
              <tr>
                <td></td>
                <td>ไซซ์: {{ $r['size'] ?: '-' }}</td>
                <td class="text-right">{{ number_format($qty) }} {{ $g['unit'] }}</td>
                <td class="text-right">{{ number_format($price, 2) }}</td>
                <td class="text-right">{{ number_format($line, 2) }}</td>
              </tr>
            @endforeach
          @else
            @php $r = $g['rows'][0] ?? ['quantity' => 0, 'unit_price' => 0, 'notes' => ''];
                 $qty = (float)($r['quantity'] ?? 0); $price = (float)($r['unit_price'] ?? 0); $line = $qty * $price; $groupTotal += $line; @endphp
            <tr>
              <td></td>
              <td>{{ trim((string)($r['notes'] ?? '')) ? 'หมายเหตุ: ' . $r['notes'] : '' }}</td>
              <td class="text-right">{{ number_format($qty) }} {{ $g['unit'] }}</td>
              <td class="text-right">{{ number_format($price, 2) }}</td>
              <td class="text-right">{{ number_format($line, 2) }}</td>
            </tr>
          @endif

          <tr class="no-border">
            <td></td>
            <td colspan="3"></td>
            <td class="text-right" style="font-weight: bold">{{ number_format($groupTotal, 2) }}</td>
          </tr>
          <tr class="no-border"><td colspan="5" style="border-bottom: 1px solid #ddd;"></td></tr>
          @php $idx++; @endphp
        @endforeach
      </tbody>
    </table>

    <div class="row mt-2">
      <div class="col" style="width: 60%"></div>
      <div class="col" style="width: 40%">
        <table class="table">
          <tbody>
            <tr>
              <td class="text-right">รวมเป็นเงิน</td>
              <td class="text-right" style="width: 40%">{{ number_format($summary['subtotal'], 2) }}</td>
            </tr>
            <tr>
              <td class="text-right">ภาษีมูลค่าเพิ่ม 7%</td>
              <td class="text-right">{{ number_format($summary['tax'], 2) }}</td>
            </tr>
            <tr>
              <td class="text-right" style="font-weight: bold">จำนวนเงินรวมทั้งสิ้น</td>
              <td class="text-right" style="font-weight: bold">{{ number_format($summary['total'], 2) }}</td>
            </tr>
            <tr>
              <td class="text-right">มัดจำ</td>
              <td class="text-right">{{ number_format($summary['deposit_amount'], 2) }}</td>
            </tr>
            <tr>
              <td class="text-right">คงเหลือ</td>
              <td class="text-right">{{ number_format($summary['remaining'], 2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    @if (!empty($q->notes))
      <h2>หมายเหตุ</h2>
      <div>{!! nl2br(e($q->notes)) !!}</div>
    @endif

    <h2>เงื่อนไขการชำระเงิน</h2>
    <div>ไม่สามารถหักภาษี ณ ที่จ่ายได้ เนื่องจากเป็นการซื้อวัตถุดิบ<br>มัดจำ 50% ก่อนเริ่มงาน และชำระ 50% ก่อนส่งมอบสินค้า</div>

    <div style="margin-top: 28pt">
      <div class="row">
        <div class="col text-center">
          <div style="border-bottom: 1px solid #333; height: 24pt"></div>
          <div>ผู้สั่งซื้อสินค้า</div>
        </div>
        <div class="col" style="width: 40pt"></div>
        <div class="col text-center">
          <div style="border-bottom: 1px solid #333; height: 24pt"></div>
          <div>ผู้อนุมัติ</div>
        </div>
      </div>
    </div>
  </main>
</body>
</html>
