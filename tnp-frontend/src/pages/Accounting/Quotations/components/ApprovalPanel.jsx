import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Button,
  Stack,
  TextField,
  Chip,
  Grid,
  Paper,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { useGetQuotationQuery } from '../../../../features/Accounting/accountingApi';
import useQuotationDetails from '../hooks/useQuotationDetails';
import { formatTHB, joinAttrs } from '../utils/format';

const ApprovalPanel = ({ quotation, onApprove, onReject, onSendBack, onMarkSent, onDownloadPDF, onUploadEvidence, onSubmitForReview, onOpenLinkedPricing }) => {
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState([]);
  const [desc, setDesc] = useState('');

  // Fetch full quotation details for richer view
  const { q, prIds } = useQuotationDetails(quotation);
  const status = q?.status || 'draft';
  const canApprove = status === 'pending_review';
  const canReject = status === 'pending_review';
  const canSendBack = status === 'pending_review';
  const canDownload = status === 'approved';
  const canUpload = status === 'approved' || status === 'sent' || status === 'completed';
  const canSubmitForReview = status === 'draft';

  const fmt = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' });
  const statusColorMap = {
    draft: 'default',
    pending_review: 'warning',
    approved: 'success',
    rejected: 'error',
    sent: 'info',
    completed: 'success',
  };
  const statusColor = statusColorMap[status] || 'default';

  if (!quotation) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700}>เลือกใบเสนอราคา</Typography>
        <Typography variant="body2" color="text.secondary">เลือกจากด้านซ้ายเพื่อทำการตรวจสอบ</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700}>ตรวจสอบใบเสนอราคา</Typography>
      <Typography variant="body2" color="text.secondary">{q?.number} • {q?.customer?.cus_company || q?.work_name || '-'}</Typography>

      <Box mt={2}>
  <Chip size="small" color={statusColor} label={`สถานะ: ${status}`} sx={{ mr: 1 }} />
  <Chip size="small" label={`ยอดรวม: ${formatTHB(q?.total_amount)}`} />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Detail sections */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>ข้อมูลลูกค้า</Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2">บริษัท: {q?.customer?.cus_company || '-'}</Typography>
              <Typography variant="body2">ชื่องาน: {q?.work_name || '-'}</Typography>
              <Typography variant="body2">ผู้สร้าง: {q?.created_by_name || q?.created_by || '-'}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>สรุปยอด</Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2">ก่อนภาษี: {formatTHB(q?.subtotal)}</Typography>
              <Typography variant="body2">ภาษี: {formatTHB(q?.tax_amount)}</Typography>
              <Typography variant="body2" fontWeight={700}>รวมทั้งสิ้น: {formatTHB(q?.total_amount)}</Typography>
              <Typography variant="body2">มัดจำ: {q?.deposit_percentage ? `${q.deposit_percentage}%` : '0%'} ({formatTHB(q?.deposit_amount)})</Typography>
              <Typography variant="body2">เงื่อนไขชำระเงิน: {q?.payment_terms || '-'}</Typography>
              <Typography variant="body2">ครบกำหนด: {q?.due_date || '-'}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2">รายการสินค้า/งาน</Typography>
              <Stack direction="row" spacing={1}>
                <Chip size="small" label={`จำนวน ${Array.isArray(q?.items) ? q.items.length : 0} รายการ`} />
                {prIds.length > 0 && (
                  <Tooltip title="ดูงาน Pricing ที่อ้างอิง">
                    <Button size="small" variant="outlined" onClick={() => onOpenLinkedPricing?.(q.id)}>
                      ดูงาน Pricing ({prIds.length})
                    </Button>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>รายการ</TableCell>
                  <TableCell>รายละเอียด</TableCell>
                  <TableCell align="right">จำนวน</TableCell>
                  <TableCell align="right">หน่วย</TableCell>
                  <TableCell align="right">ราคา/หน่วย</TableCell>
                  <TableCell align="right">ส่วนลด</TableCell>
                  <TableCell align="right">รวม</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                    {(q?.items || []).map((it, idx) => {
                  const discount = Number(it.discount_amount || 0) || 0;
                  const subtotal = Number(it.unit_price || 0) * Number(it.quantity || 0);
                  const total = subtotal - discount;
                      const detail = joinAttrs([it.pattern, it.fabric_type, it.color, it.size]);
                  return (
                    <TableRow key={it.id || idx}>
                      <TableCell>{it.sequence_order || idx + 1}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600} variant="body2">{it.item_name}</Typography>
                        {it.item_description && (
                          <Typography variant="caption" color="text.secondary">{it.item_description}</Typography>
                        )}
                      </TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{detail || '-'}</Typography></TableCell>
                      <TableCell align="right">{Number(it.quantity || 0)}</TableCell>
                      <TableCell align="right">{it.unit || 'ชิ้น'}</TableCell>
                      <TableCell align="right">{fmt.format(Number(it.unit_price || 0))}</TableCell>
                      <TableCell align="right">{discount ? `-${fmt.format(discount)}` : '-'}</TableCell>
                      <TableCell align="right">{fmt.format(total)}</TableCell>
                    </TableRow>
                  );
                })}
                {(!q.items || q.items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">ไม่มีรายการ</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>หมายเหตุการตรวจสอบ</Typography>
      <TextField
        fullWidth
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="ข้อเสนอแนะ/หมายเหตุ..."
        multiline
        minRows={3}
      />

      <Stack spacing={1} mt={2}>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="primary" disabled={!canSubmitForReview} onClick={() => onSubmitForReview?.(q.id)}>ส่งตรวจสอบ</Button>
          <Button variant="contained" color="success" disabled={!canApprove} onClick={() => onApprove?.(q.id, notes)}>อนุมัติ</Button>
          <Button variant="outlined" color="warning" disabled={!canSendBack} onClick={() => onSendBack?.(q.id, reason || 'กรุณาปรับรายละเอียดบางรายการ')}>ส่งกลับแก้ไข</Button>
          <Button variant="outlined" color="error" disabled={!canReject} onClick={() => onReject?.(q.id, reason || 'ไม่ผ่านเงื่อนไขเครดิต')}>ปฏิเสธ</Button>
        </Stack>
        <TextField
          fullWidth
          size="small"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="เหตุผล (สำหรับส่งกลับ/ปฏิเสธ)"
        />
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>การส่งให้ลูกค้า</Typography>
      <Stack direction="row" spacing={1}>
        <Button disabled={!canDownload} onClick={() => onDownloadPDF?.(q.id)}>ดาวน์โหลด PDF</Button>
        <Button disabled={q.status !== 'approved'} onClick={() => onMarkSent?.(q.id, { delivery_method: 'email' })}>บันทึกว่าจัดส่งแล้ว</Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>แนบหลักฐาน</Typography>
      <TextField
        fullWidth
        size="small"
        placeholder="คำอธิบายไฟล์ (ถ้ามี)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        sx={{ mb: 1 }}
      />
      <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
      <Stack direction="row" spacing={1} mt={1}>
        <Button disabled={!canUpload || files.length === 0} variant="outlined" onClick={() => onUploadEvidence?.(q.id, files, desc)}>อัปโหลดหลักฐาน</Button>
      </Stack>
    </Box>
  );
};

export default ApprovalPanel;
