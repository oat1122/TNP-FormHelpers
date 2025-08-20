<!doctype html>
<html lang="th">
<head>
	<meta charset="utf-8">
	<title>ใบเสนอราคา {{ $quotation->number ?? 'DRAFT' }}</title>
	<style>
		/* Base Styles */
		body {
			font-family: 'thsarabun', 'DejaVu Sans', sans-serif;
			font-size: 12pt; /* smaller, cleaner */
			line-height: 1.35;
			color: #333;
			margin: 0;
			padding: 0;
		}

		/* Typography */
	h1 { font-size: 20pt; font-weight: bold; margin: 0 0 8pt; color: #2c3e50; }
	h2 { font-size: 16pt; font-weight: bold; margin: 12pt 0 6pt; color: #34495e; }
	h3 { font-size: 13pt; font-weight: bold; margin: 10pt 0 6pt; color: #34495e; }

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
			margin: 8pt 0;
			font-size: 11pt;
		}

		.table th,
		.table td {
			border: 1px solid #bdc3c7;
			padding: 8pt;
			text-align: left;
		}

	.table thead th { background: #eef2f5; color: #2c3e50; font-weight: bold; text-align: center; }
	.table tfoot td { background: #fafbfc; }
	thead { display: table-header-group; }
	tfoot { display: table-footer-group; }
	tr { page-break-inside: avoid; }

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
			font-size: 12pt;
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

	.summary-table .total-row { background: #e7f1ff; color: #1b5eaa; font-weight: bold; }

	/* Items Table (clean, horizontal separators) */
	.items-table { border-collapse: collapse; width: 100%; }
	.items-table th,
	.items-table td { padding: 6pt 8pt; border-bottom: 1px solid #bdc3c7; }
	.items-table thead th { border-bottom: 2px solid #9fb3c8; }
	.items-table .num { width: 7%; text-align: center; }
	.items-table .desc { width: 53%; }
	.items-table .qty  { width: 14%; text-align: center; }
	.items-table .price{ width: 13%; text-align: right; }
	.items-table .amount{ width: 13%; text-align: right; }
	.row-title td { font-weight: bold; background: #fafbfc; }
	.row-meta td { color: #6c757d; font-size: 10.5pt; }
	.row-item td.desc { padding-left: 14pt; }
	.meta-light { color: #6e7b88; font-weight: normal; }
	.group-body { page-break-inside: avoid; }
	/* Container row that holds all detail rows as a nested table */
	.row-group > td.group-cell { border-bottom: 0; padding: 0 8pt 10pt; }
	.group-box { page-break-inside: avoid; }
	.group-inner { width: 100%; border-collapse: collapse; }
	.group-inner td { padding: 6pt 0; border-bottom: 1px solid #e3e9ef; }
	.group-inner .title { font-weight: bold; background: #fafbfc; border-top: 2px solid #dee5ed; }
	/* plain number before title, add clearer gap before title */
	.num-badge { display: inline-block; margin-right: 10pt; font-weight: bold; }
	.group-inner .desc { width: 53%; padding-left: 14pt; }
	.group-inner .qty { width: 14%; text-align: center; }
	.group-inner .price { width: 16%; text-align: right; }
	.group-inner .amount { width: 17%; text-align: right; }

		/* Status Indicators */
		.status-draft { color: #f39c12; }
		.status-approved { color: #27ae60; }
		.status-sent { color: #3498db; }
		.status-completed { color: #8e44ad; }

		/* Signature Section */
	.signature-section { margin-top: 36pt; page-break-inside: avoid; }
		.signature-box { width: 200pt; height: 60pt; border-bottom: 1pt solid #333; margin-bottom: 8pt; }

		/* Terms and Conditions */
		.terms {
			background: #f8f9fa;
			border-left: 4pt solid #3498db;
			padding: 12pt;
			margin: 20pt 0;
			font-size: 12pt;
			line-height: 1.5;
		}
		.terms h3 { margin-top: 0; color: #3498db; }

		/* Page Break Control */
		.page-break-before { page-break-before: always; }
		.page-break-after { page-break-after: always; }
		.page-break-avoid { page-break-inside: avoid; }

		@media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; } }
	</style>
</head>
<body>
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

		{{-- ตารางสินค้าแบบรวมเหมือนตัวอย่าง --}}
		<h3 class="mb-3">รายละเอียดสินค้า/บริการ</h3>
		@php
			$groupsData = [];
			$no = 1;
		@endphp
		@if (!empty($groups))
			@foreach ($groups as $g)
				@php
					$unit = $g['unit'] ?? 'ชิ้น';
					$meta = array_filter([$g['pattern'] ?: null, $g['fabric'] ?: null, $g['color'] ?: null]);
					$title = ($g['name'] ?: 'ไม่ระบุชื่องาน');
					if ($meta) { $title .= ' <span class="meta-light">' . implode(' • ', $meta) . '</span>'; }
					$items = [];
					foreach ($g['rows'] as $r) {
						$qty = (float)($r['quantity'] ?? 0);
						$price = (float)($r['unit_price'] ?? 0);
						$amount = $qty * $price;
						$items[] = [
							'desc' => 'ไซซ์: ' . ($r['size'] ?: '-'),
							'qty' => $qty,
							'unit' => $unit,
							'price' => $price,
							'amount' => $amount,
						];
					}
					$groupsData[] = [
						'no' => $no,
						'title' => $title,
						'items' => $items,
					];
					$no++;
				@endphp
			@endforeach
		@endif

		@if (count($groupsData))
			<table class="items-table">
				<thead>
					<tr>
						<th class="num">#</th>
						<th class="desc">รายละเอียดงาน</th>
						<th class="qty">จำนวน</th>
						<th class="price">ราคาต่อหน่วย</th>
						<th class="amount">ยอดรวม</th>
					</tr>
				</thead>
				@foreach ($groupsData as $g)
					<tbody class="group-body">
						<tr class="row-group">
							<td class="group-cell" colspan="5">
								<div class="group-box">
									<table class="group-inner">
										<tbody>
											<tr>
												<td class="desc title" colspan="4"><span class="num-badge">{{ $g['no'] }}</span>&nbsp;{!! $g['title'] !!}</td>
											</tr>
											@foreach ($g['items'] as $it)
												<tr>
													<td class="desc">{{ $it['desc'] }}</td>
													<td class="qty">{{ number_format($it['qty']) }} {{ $it['unit'] }}</td>
													<td class="price">{{ number_format($it['price'], 2) }} บาท</td>
													<td class="amount">{{ number_format($it['amount'], 2) }}</td>
												</tr>
											@endforeach
										</tbody>
									</table>
								</div>
							</td>
						</tr>
					</tbody>
				@endforeach
			</table>
		@else
			<div class="highlight-box text-center"><strong>ไม่มีรายการสินค้า/บริการ</strong></div>
		@endif

		{{-- สรุปยอดเงิน --}}
		<div class="mt-4 page-break-avoid">
			<h3 class="mb-3">สรุปยอดเงิน</h3>
			<table class="summary-table">
				<tr><td class="label">รวมเป็นเงิน</td><td class="amount">{{ number_format($summary['subtotal'], 2) }}</td></tr>
				<tr><td class="label">ภาษีมูลค่าเพิ่ม 7%</td><td class="amount">{{ number_format($summary['tax'], 2) }}</td></tr>
				<tr class="total-row"><td class="label">จำนวนเงินรวมทั้งสิ้น</td><td class="amount">{{ number_format($summary['total'], 2) }}</td></tr>
				@if ($summary['deposit_amount'] > 0)
					<tr><td class="label">มัดจำ ({{ $summary['deposit_percentage'] }}%)</td><td class="amount">{{ number_format($summary['deposit_amount'], 2) }}</td></tr>
					<tr><td class="label">คงเหลือ</td><td class="amount">{{ number_format($summary['remaining'], 2) }}</td></tr>
				@endif
			</table>
		</div>

		@if (!empty($quotation->notes))
			<div class="mt-4">
				<h3>หมายเหตุ</h3>
				<div class="info-box">{!! nl2br(e($quotation->notes)) !!}</div>
			</div>
		@endif

		

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
