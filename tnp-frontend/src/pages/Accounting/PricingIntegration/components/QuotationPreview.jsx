import React from 'react';
import { Box, Paper, Typography, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Stack } from '@mui/material';

// Lightweight printable quotation preview
// Props:
// - formData: { customer, items, notes, subtotal, vat, total, depositAmount, remainingAmount }
// - quotationNumber: string
// - showActions: boolean
// - onClose?: function
export default function QuotationPreview({ formData = {}, quotationNumber = '', showActions = false, onClose }) {
  const customer = formData.customer || {};
  const items = Array.isArray(formData.items) ? formData.items : [];

  const fmtTHB = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(n || 0));

  return (
    <Box sx={{ p: 2 }}>
      {showActions && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={() => window.print()}>พิมพ์</Button>
          {!!onClose && <Button variant="text" onClick={onClose}>ปิด</Button>}
        </Stack>
      )}

      <Paper elevation={1} sx={{ p: 3, maxWidth: 1000, mx: 'auto' }} className="quotation-preview">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>ใบเสนอราคา</Typography>
            {quotationNumber && (
              <Typography variant="subtitle2" color="text.secondary">เลขที่: {quotationNumber}</Typography>
            )}
          </Box>
          <Box textAlign="right">
            <Typography variant="subtitle2" color="text.secondary">ลูกค้า</Typography>
            <Typography variant="body1" fontWeight={700}>{customer.cus_company || customer.company || '-'}</Typography>
            <Typography variant="body2">{customer.cus_name || customer.name || ''}</Typography>
            <Typography variant="body2">{customer.cus_phone || customer.phone || ''}</Typography>
            <Typography variant="body2">{customer.cus_address || customer.address || ''}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>รายละเอียดงาน</TableCell>
                <TableCell align="right">จำนวน</TableCell>
                <TableCell align="right">ราคาต่อหน่วย</TableCell>
                <TableCell align="right">ยอดรวม</TableCell>
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
                  const qty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0) || Number(it.quantity || 0) || 0;
                  const unit = it.unit || 'ชิ้น';
                  const unitPrice = Number(it.unitPrice || 0);
                  const total = rows.length > 0
                    ? rows.reduce((s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0), 0)
                    : unitPrice * qty;

                  return (
                    <TableRow key={it.id || idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{it.name || 'ไม่ระบุชื่องาน'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[it.pattern, it.fabricType, it.color, it.size].filter(Boolean).join(' • ')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{qty} {unit}</TableCell>
                      <TableCell align="right">{fmtTHB(unitPrice)}</TableCell>
                      <TableCell align="right">{fmtTHB(total)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ width: 360 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>ยอดก่อนภาษี</Typography>
              <Typography fontWeight={700}>{fmtTHB(formData.subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>VAT 7%</Typography>
              <Typography fontWeight={700}>{fmtTHB(formData.vat)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={800}>ยอดรวม</Typography>
              <Typography variant="subtitle1" fontWeight={800}>{fmtTHB(formData.total)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography>มัดจำ</Typography>
              <Typography fontWeight={700}>{fmtTHB(formData.depositAmount)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>คงเหลือ</Typography>
              <Typography fontWeight={700}>{fmtTHB(formData.remainingAmount)}</Typography>
            </Box>
          </Box>
        </Box>

        {formData.notes && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">หมายเหตุ</Typography>
            <Typography variant="body2">{formData.notes}</Typography>
          </Box>
        )}
      </Paper>

      {/* Basic print styles */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          .quotation-preview { box-shadow: none !important; border: none !important; }
          button { display: none !important; }
        }
      `}</style>
    </Box>
  );
}
