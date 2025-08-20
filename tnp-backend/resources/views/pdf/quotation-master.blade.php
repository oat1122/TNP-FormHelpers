<!doctype html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <title>ใบเสนอราคา {{ $quotation->number ?? 'DRAFT' }}</title>
    <style>
        /* Base Styles */
        body {
            font-family: 'thsarabun', 'DejaVu Sans', sans-serif;
            font-size: 14pt;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }

        /* Typography */
        h1 { font-size: 24pt; font-weight: bold; margin: 0 0 10pt; color: #2c3e50; }
        h2 { font-size: 18pt; font-weight: bold; margin: 15pt 0 8pt; color: #34495e; }
        h3 { font-size: 16pt; font-weight: bold; margin: 12pt 0 6pt; color: #34495e; }

        /* Layout Utilities */
        .row { display: table; width: 100%; table-layout: fixed; margin-bottom: 5pt; }
        .col { display: table-cell; vertical-align: top; padding: 2pt; }
        .col-6 { width: 50%; }
        .col-4 { width: 33.33%; }
        .col-8 { width: 66.67%; }
        .col-3 { width: 25%; }
        .col-9 { width: 75%; }

        /* Text Alignment */
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }

        /* Spacing */
        .mb-2 { margin-bottom: 8pt; }
        .mb-3 { margin-bottom: 12pt; }
        .mb-4 { margin-bottom: 16pt; }
        .mt-2 { margin-top: 8pt; }
        .mt-3 { margin-top: 12pt; }
        .mt-4 { margin-top: 16pt; }
        .p-2 { padding: 8pt; }
        .p-3 { padding: 12pt; }

        /* Colors */
        .text-muted { color: #7f8c8d; }
        .text-primary { color: #3498db; }
        .text-success { color: #27ae60; }
        .text-danger { color: #e74c3c; }

        /* Boxes and Borders */
        .border { border: 1px solid #bdc3c7; }
        .border-top { border-top: 1px solid #bdc3c7; }
        .border-bottom { border-bottom: 1px solid #bdc3c7; }
        .rounded { border-radius: 4pt; }
        .shadow { box-shadow: 0 2pt 4pt rgba(0,0,0,0.1); }

        .info-box {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6pt;
            padding: 12pt;
            margin-bottom: 15pt;
        }

        .highlight-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4pt;
            padding: 10pt;
            margin: 8pt 0;
        }

        /* Tables */
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 10pt 0;
            font-size: 13pt;
        }

        .table th,
        .table td {
            border: 1px solid #bdc3c7;
            padding: 8pt;
            text-align: left;
        }

        .table th {
            background: #34495e;
            color: white;
            font-weight: bold;
            text-align: center;
        }

        .table tbody tr:nth-child(even) {
            background: #f8f9fa;
        }

        .table tbody tr:hover {
            background: #e8f4f8;
        }

        /* Summary Table */
        .summary-table {
            width: 100%;
            max-width: 400pt;
            margin-left: auto;
            font-size: 14pt;
        }

        .summary-table td {
            border: 1px solid #bdc3c7;
            padding: 8pt;
        }

        .summary-table .label {
            background: #ecf0f1;
            font-weight: bold;
            width: 60%;
        }

        .summary-table .amount {
            text-align: right;
            width: 40%;
        }

        .summary-table .total-row {
            background: #3498db;
            color: white;
            font-weight: bold;
        }

        /* Item Groups */
        .item-group {
            margin-bottom: 15pt;
            border: 1px solid #e9ecef;
            border-radius: 6pt;
            overflow: hidden;
        }

        .item-group-header {
            background: #f1f2f6;
            padding: 10pt;
            border-bottom: 1px solid #e9ecef;
            font-weight: bold;
            font-size: 15pt;
        }

        .item-group-details {
            background: #f8f9fa;
            padding: 8pt 10pt;
            font-size: 12pt;
            color: #6c757d;
            border-bottom: 1px solid #e9ecef;
        }

        .item-rows {
            background: white;
        }

        .item-total {
            background: #e8f4f8;
            padding: 8pt 10pt;
            text-align: right;
            font-weight: bold;
            border-top: 1px solid #bdc3c7;
        }

        /* Status Indicators */
        .status-draft { color: #f39c12; }
        .status-approved { color: #27ae60; }
        .status-sent { color: #3498db; }
        .status-completed { color: #8e44ad; }

        /* Watermark for Preview */
        .preview-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72pt;
            color: rgba(231, 76, 60, 0.1);
            z-index: -1;
            font-weight: bold;
        }

        /* Signature Section */
        .signature-section {
            margin-top: 40pt;
            page-break-inside: avoid;
        }

        .signature-box {
            width: 200pt;
            height: 60pt;
            border-bottom: 1pt solid #333;
            margin-bottom: 8pt;
        }

        /* Terms and Conditions */
        .terms {
            background: #f8f9fa;
            border-left: 4pt solid #3498db;
            padding: 12pt;
            margin: 20pt 0;
            font-size: 12pt;
            line-height: 1.5;
        }

        .terms h3 {
            margin-top: 0;
            color: #3498db;
        }

        /* Page Break Control */
        .page-break-before { page-break-before: always; }
        .page-break-after { page-break-after: always; }
        .page-break-avoid { page-break-inside: avoid; }

        /* Print Optimizations */
        @media print {
            .no-print { display: none; }
            body { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    {{-- Watermark สำหรับเอกสาร Preview --}}
    @if (!$isFinal && ($options['showWatermark'] ?? true))
        <div class="preview-watermark">PREVIEW</div>
    @endif

    {{-- เนื้อหาหลักของเอกสาร --}}
    <div class="document-content">
        
        {{-- ส่วนข้อมูลลูกค้า --}}
        <div class="info-box mb-4">
            <h3 class="mb-3">ข้อมูลลูกค้า</h3>
            <div class="row">
                <div class="col" style="width: 25%"><strong>ลูกค้า:</strong></div>
                <div class="col">{{ $customer['name'] ?: '-' }}</div>
            </div>
            <div class="row">
                <div class="col" style="width: 25%"><strong>ที่อยู่:</strong></div>
                <div class="col">{!! nl2br(e($customer['address'] ?: '-')) !!}</div>
            </div>
            <div class="row">
                <div class="col" style="width: 25%"><strong>เลขภาษี:</strong></div>
                <div class="col">{{ $customer['tax_id'] ?: '-' }}</div>
            </div>
            <div class="row">
                <div class="col" style="width: 25%"><strong>โทรศัพท์:</strong></div>
                <div class="col">{{ $customer['tel'] ?: '-' }}</div>
            </div>
        </div>

        {{-- ตารางรายการสินค้า/บริการ --}}
        <h3 class="mb-3">รายละเอียดสินค้า/บริการ</h3>
        
        @if (!empty($groups))
            @foreach ($groups as $index => $group)
                <div class="item-group page-break-avoid">
                    {{-- หัวข้อกลุ่มสินค้า --}}
                    <div class="item-group-header">
                        {{ $index + 1 }}. {{ $group['name'] ?: 'ไม่ระบุชื่องาน' }}
                    </div>

                    {{-- รายละเอียดเพิ่มเติม --}}
                    @php
                        $details = array_filter([
                            $group['pattern'] ?: null,
                            $group['fabric'] ?: null,
                            $group['color'] ?: null
                        ]);
                    @endphp
                    @if (!empty($details))
                        <div class="item-group-details">
                            {{ implode(' • ', $details) }}
                        </div>
                    @endif

                    {{-- ตารางรายการย่อย --}}
                    <div class="item-rows">
                        <table class="table" style="margin: 0;">
                            <thead>
                                <tr>
                                    <th style="width: 30%">รายการ</th>
                                    <th style="width: 15%" class="text-center">จำนวน</th>
                                    <th style="width: 20%" class="text-right">ราคาต่อหน่วย</th>
                                    <th style="width: 20%" class="text-right">ยอดรวม</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php $groupTotal = 0; @endphp
                                @if (collect($group['rows'])->some(fn($r) => !empty($r['size'])))
                                    {{-- แสดงแยกตามไซส์ --}}
                                    @foreach ($group['rows'] as $row)
                                        @php
                                            $qty = (float)($row['quantity'] ?? 0);
                                            $price = (float)($row['unit_price'] ?? 0);
                                            $lineTotal = $qty * $price;
                                            $groupTotal += $lineTotal;
                                        @endphp
                                        <tr>
                                            <td>ไซส์: {{ $row['size'] ?: '-' }}</td>
                                            <td class="text-center">{{ number_format($qty) }} {{ $group['unit'] }}</td>
                                            <td class="text-right">{{ number_format($price, 2) }}</td>
                                            <td class="text-right">{{ number_format($lineTotal, 2) }}</td>
                                        </tr>
                                    @endforeach
                                @else
                                    {{-- แสดงรวมในบรรทัดเดียว --}}
                                    @php
                                        $row = $group['rows'][0] ?? ['quantity' => 0, 'unit_price' => 0, 'notes' => ''];
                                        $qty = (float)($row['quantity'] ?? 0);
                                        $price = (float)($row['unit_price'] ?? 0);
                                        $lineTotal = $qty * $price;
                                        $groupTotal += $lineTotal;
                                        $notes = trim((string)($row['notes'] ?? ''));
                                    @endphp
                                    <tr>
                                        <td>{{ $notes ? 'หมายเหตุ: ' . $notes : '-' }}</td>
                                        <td class="text-center">{{ number_format($qty) }} {{ $group['unit'] }}</td>
                                        <td class="text-right">{{ number_format($price, 2) }}</td>
                                        <td class="text-right">{{ number_format($lineTotal, 2) }}</td>
                                    </tr>
                                @endif
                            </tbody>
                        </table>
                    </div>

                    {{-- ยอดรวมกลุ่ม --}}
                    <div class="item-total">
                        ยอดรวม: {{ number_format($groupTotal, 2) }} บาท
                    </div>
                </div>
            @endforeach
        @else
            <div class="highlight-box text-center">
                <strong>ไม่มีรายการสินค้า/บริการ</strong>
            </div>
        @endif

        {{-- สรุปยอดเงิน --}}
        <div class="mt-4 page-break-avoid">
            <h3 class="mb-3">สรุปยอดเงิน</h3>
            <table class="summary-table">
                <tr>
                    <td class="label">รวมเป็นเงิน</td>
                    <td class="amount">{{ number_format($summary['subtotal'], 2) }}</td>
                </tr>
                <tr>
                    <td class="label">ภาษีมูลค่าเพิ่ม 7%</td>
                    <td class="amount">{{ number_format($summary['tax'], 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td class="label">จำนวนเงินรวมทั้งสิ้น</td>
                    <td class="amount">{{ number_format($summary['total'], 2) }}</td>
                </tr>
                @if ($summary['deposit_amount'] > 0)
                    <tr>
                        <td class="label">มัดจำ ({{ $summary['deposit_percentage'] }}%)</td>
                        <td class="amount">{{ number_format($summary['deposit_amount'], 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label">คงเหลือ</td>
                        <td class="amount">{{ number_format($summary['remaining'], 2) }}</td>
                    </tr>
                @endif
            </table>
        </div>

        {{-- หมายเหตุ --}}
        @if (!empty($quotation->notes))
            <div class="mt-4">
                <h3>หมายเหตุ</h3>
                <div class="info-box">
                    {!! nl2br(e($quotation->notes)) !!}
                </div>
            </div>
        @endif

        {{-- เงื่อนไขการชำระเงิน --}}
        <div class="terms page-break-avoid">
            <h3>เงื่อนไขการชำระเงิน</h3>
            <p>• ไม่สามารถหักภาษี ณ ที่จ่ายได้ เนื่องจากเป็นการซื้อวัตถุดิบ</p>
            <p>• มัดจำ 50% ก่อนเริ่มงาน และชำระ 50% ก่อนส่งมอบสินค้า</p>
            <p>• ราคานี้รวมค่าขนส่งแล้ว</p>
            <p>• ใบเสนอราคานี้มีอายุ 30 วัน นับจากวันที่ออกใบเสนอราคา</p>
        </div>

        {{-- ลายเซ็น --}}
        <div class="signature-section">
            <div class="row">
                <div class="col-6 text-center">
                    <div class="signature-box"></div>
                    <strong>ผู้สั่งซื้อสินค้า</strong>
                    <div class="text-muted mt-2">วันที่: _______________</div>
                </div>
                <div class="col-6 text-center">
                    <div class="signature-box"></div>
                    <strong>ผู้อนุมัติ</strong>
                    <div class="text-muted mt-2">วันที่: _______________</div>
                </div>
            </div>
        </div>

    </div>
</body>
</html>