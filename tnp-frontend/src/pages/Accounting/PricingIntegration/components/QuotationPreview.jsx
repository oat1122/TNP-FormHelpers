import React, { useState, useMemo } from 'react';
import { Box, Paper, Typography, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Stack } from '@mui/material';
import { adaptQuotationPayloadToPreview } from '../utils/quotationAdapter';
import QuotationPDF from './QuotationPDF';
import { pdf } from '@react-pdf/renderer';
import { ensureThaiFontsRegisteredAsync } from '../../../../shared/pdf/fonts/registerThaiFonts';

// A4 printable quotation preview with logo and size from quotation_items
export default function QuotationPreview({ formData = {}, record = null, quotationNumber = '', showActions = false, onClose, previewData }) {
  const [loading, setLoading] = useState(false);
  // Keep compatibility: prefer adapter when formData/record provided; otherwise accept previewData prop
  const data = useMemo(() => {
    if (previewData) return previewData;
    return adaptQuotationPayloadToPreview({ formData, record, quotationNumber });
  }, [previewData, formData, record, quotationNumber]);
  const company = data.company || {};
  const customer = data.customer || {};
  const items = Array.isArray(data.items) ? data.items : [];

  const fmtTHB = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(n || 0));
  const fmtDate = (d) => {
    try { return (d ? new Date(d) : new Date()).toLocaleDateString('th-TH'); } catch { return ''; }
  };

  const computedSubtotal = items.reduce((sum, it) => {
    const rows = Array.isArray(it.sizeRows) ? it.sizeRows : [];
    const qty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0) || Number(it.quantity || 0) || 0;
    // Use DB unit_price directly, with fallback
    const unitPrice = Number(it.unit_price || it.unitPrice || 0);
    const lineTotal = rows.length > 0
      ? rows.reduce((s, r) => {
          const rUnit = Number(r.unit_price || r.unitPrice || 0);
          return s + Number(r.quantity || 0) * rUnit;
        }, 0)
      : unitPrice * qty;
    return sum + lineTotal;
  }, 0);

  const subtotal = Number(data.subtotal ?? computedSubtotal);
  const vat = Number(data.vat ?? subtotal * 0.07);
  const total = Number(data.total ?? subtotal + vat);
  const depositAmount = Number(data.depositAmount || 0);
  const remainingAmount = Number(data.remainingAmount ?? Math.max(total - depositAmount, 0));
  const termsText = data.terms || 'ไม่สามารถหักภาษี ณ ที่จ่ายได้ เนื่องจากเป็นการซื้อวัตถุดิบ\nมัดจำ 50% ก่อนเริ่มงาน และชำระ 50% ก่อนส่งมอบสินค้า';

  const handlePrintPDF = async () => {
    try {
      setLoading(true);
      // ✅ สำคัญ: ลงทะเบียนฟอนต์ไทยให้เสร็จก่อน gen PDF
      await ensureThaiFontsRegisteredAsync();

      // สร้าง PDF
      const instance = pdf(<QuotationPDF data={data} />);
      const blob = await instance.toBlob();

      // ดาวน์โหลดไฟล์
      const fileName = data?.quotationNumber ? `Quotation_${data.quotationNumber}.pdf` : 'Quotation.pdf';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('ไม่สามารถสร้างไฟล์ PDF ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {showActions && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button variant="contained" onClick={handlePrintPDF} disabled={loading}>{loading ? 'กำลังสร้าง PDF...' : 'พิมพ์'}</Button>
          {!!onClose && <Button variant="outlined" onClick={onClose}>ปิด</Button>}
        </Stack>
      )}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: 'auto' }} className="tnp-quotation">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <img src="/logo.png" alt="Company Logo" style={{ height: 50, objectFit: 'contain' }} />
            <Box>
              <Typography variant="h6" fontWeight={800}>{company.name || 'บริษัทของคุณ'}</Typography>
              <Typography variant="body2" color="text.secondary">{company.address || 'ที่อยู่บริษัท'}</Typography>
              <Typography variant="body2" color="text.secondary">โทร: {company.phone || '-'} {company.taxId ? `• เลขประจำตัวผู้เสียภาษี ${company.taxId}` : ''}</Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" fontWeight={900}>ใบเสนอราคา</Typography>
            {(quotationNumber || data.quotationNumber) && (
              <Typography variant="body2" color="text.secondary">เลขที่: {quotationNumber || data.quotationNumber}</Typography>
            )}
            <Typography variant="body2" color="text.secondary">วันที่: {fmtDate(data.date)}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Customer */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">ลูกค้า</Typography>
            <Typography fontWeight={700}>{customer.cus_company || customer.company || '-'}</Typography>
            <Typography variant="body2">{customer.cus_name || customer.name || ''}</Typography>
            <Typography variant="body2">{customer.cus_address || customer.address || ''}</Typography>
            <Typography variant="body2">โทร: {customer.cus_phone || customer.phone || ''}</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
        </Box>

        {/* Items */}
        <TableContainer sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow className="tnp-quotation--thead">
                <TableCell sx={{ width: 48 }}>#</TableCell>
                <TableCell>รายละเอียดงาน</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>จำนวน</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>ราคาต่อหน่วย</TableCell>
                <TableCell align="right" sx={{ width: 160 }}>ยอดรวม</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">ไม่มีรายการ</TableCell>
                </TableRow>
              ) : (
                items.map((it, idx) => {
                  const rows = Array.isArray(it.sizeRows) ? it.sizeRows : [];
                  const unit = it.unit || 'ชิ้น';
                  const unitPrice = Number(it.unit_price ?? it.unitPrice ?? 0);
                  const qtyFromRows = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
                  const qty = Number(it.quantity ?? qtyFromRows ?? 0);
                  const totalLine = Number(it.subtotal ?? (rows.length > 0
                    ? rows.reduce((s, r) => s + Number(r.quantity || 0) * Number((r.unit_price ?? r.unitPrice) || 0), 0)
                    : unitPrice * qty));

                  // Render grouped rows similar to the requested layout
                  return (
                    <React.Fragment key={it.id || idx}>
                      {/* Title row */}
                      <TableRow>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Typography fontWeight={700}>{it.name || 'ไม่ระบุชื่องาน'}</Typography>
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell />
                      </TableRow>

                      {/* Descriptor row: pattern • fabric • color */}
                      {(it.pattern || it.fabricType || it.color) && (
                        <TableRow>
                          <TableCell />
                          <TableCell colSpan={4}>
                            <Typography variant="body2" color="text.secondary">
                              {[it.pattern, it.fabricType, it.color].filter(Boolean).join(' • ')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Per-size rows when present */}
                      {rows.length > 0 ? (
                        rows.map((r, i) => {
                          const rQty = Number(r.quantity || 0);
                          const rUnit = Number((r.unit_price ?? r.unitPrice ?? unitPrice) || 0);
                          const rTotal = rQty * rUnit;
                          return (
                            <TableRow key={`r-${idx}-${i}`}>
                              <TableCell />
                              <TableCell>
                                <Typography variant="body2">ไซซ์: <strong>{r.size || '-'}</strong></Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{rQty.toLocaleString('th-TH')} {unit}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{fmtTHB(rUnit)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{fmtTHB(rTotal)}</Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        // Fallback single line when no size rows
                        <TableRow>
                          <TableCell />
                          <TableCell>
                            {it.notes && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic' }}>
                                หมายเหตุ: {it.notes}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography>{qty.toLocaleString('th-TH')} {unit}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography>{fmtTHB(unitPrice)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography>{fmtTHB(totalLine)}</Typography>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Per-item total row (bold) */}
                      <TableRow>
                        <TableCell />
                        <TableCell colSpan={3}>
                          {/* spacer or notes */}
                          {rows.length > 0 && it.notes && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              หมายเหตุ: {it.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={800}>{fmtTHB(totalLine)}</Typography>
                        </TableCell>
                      </TableRow>

                      {/* separator */}
                      <TableRow>
                        <TableCell colSpan={5} sx={{ p: 0 }}>
                          <Divider />
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Box sx={{ width: 360 }}>
            <Box className="tnp-quotation--summaryRow">
              <Typography>รวมเป็นเงิน</Typography>
              <Typography fontWeight={700}>{fmtTHB(subtotal)}</Typography>
            </Box>
            <Box className="tnp-quotation--summaryRow">
              <Typography>ภาษีมูลค่าเพิ่ม 7%</Typography>
              <Typography fontWeight={700}>{fmtTHB(vat)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box className="tnp-quotation--summaryRow">
              <Typography variant="subtitle1" fontWeight={800}>จำนวนเงินรวมทั้งสิ้น</Typography>
              <Typography variant="subtitle1" fontWeight={800}>{fmtTHB(total)}</Typography>
            </Box>
            <Box className="tnp-quotation--summaryRow" sx={{ mt: 1 }}>
              <Typography>มัดจำ</Typography>
              <Typography fontWeight={700}>{fmtTHB(depositAmount)}</Typography>
            </Box>
            <Box className="tnp-quotation--summaryRow">
              <Typography>คงเหลือ</Typography>
              <Typography fontWeight={700}>{fmtTHB(remainingAmount)}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Notes / Terms */}
        {(data.notes || termsText) && (
          <Box sx={{ mt: 2 }}>
            {data.notes && (
              <>
                <Typography variant="subtitle2" color="text.secondary">หมายเหตุ</Typography>
                <Typography variant="body2">{data.notes}</Typography>
              </>
            )}
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: data.notes ? 1 : 0 }}>
              {termsText}
            </Typography>
          </Box>
        )}

        {/* Signatures */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
          <Box sx={{ textAlign: 'center', width: '45%' }}>
            <Box className="tnp-quotation--signLine" />
            <Typography variant="body2">ผู้สั่งซื้อสินค้า</Typography>
            <Typography variant="caption" color="text.secondary">วันที่</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', width: '45%' }}>
            <Box className="tnp-quotation--signLine" />
            <Typography variant="body2">ผู้อนุมัติ</Typography>
            <Typography variant="caption" color="text.secondary">วันที่</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Print styles */}
      <style>{`
        .tnp-quotation--thead th, .tnp-quotation--thead td { background: #f5f5f5; font-weight: 700; }
        .tnp-quotation--summaryRow { display: flex; justify-content: space-between; align-items: center; }
        .tnp-quotation--signLine { border-bottom: 1px solid #777; height: 40px; margin: 0 auto 4px; width: 80%; }
  .tnp-quotation .MuiTableCell-root { vertical-align: top; }
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: #fff !important; }
          .tnp-quotation { box-shadow: none !important; border: none !important; padding: 0 !important; }
          button, .MuiButton-root, .MuiStack-root { display: none !important; }
        }
      `}</style>
    </Box>
  );
}
