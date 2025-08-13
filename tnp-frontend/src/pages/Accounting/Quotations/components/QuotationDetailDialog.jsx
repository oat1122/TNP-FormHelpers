import React, { useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, CircularProgress, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useGetQuotationQuery } from '../../../../features/Accounting/accountingApi';
import QuotationPreview from '../../PricingIntegration/components/QuotationPreview';

const Title = styled(DialogTitle)({
  background: 'linear-gradient(135deg, #900F0F 0%, #B20000 100%)',
  color: '#fff',
  fontWeight: 700,
});

// Map backend quotation payload to QuotationPreview formData shape
const mapToPreviewData = (q) => {
  if (!q) return null;
  const data = q.data || q;
  const customer = data.customer || {};
  const total = Number(data.total_amount ?? data.total ?? 0);
  const subtotal = Number(
    data.subtotal_amount ??
    data.subtotal ??
    (Array.isArray(data.items) ? data.items.reduce((s, it) => s + Number(it.total || it.amount || 0), 0) : 0)
  );
  const vat = Number(data.vat_amount ?? data.vat ?? Math.max(0, total - subtotal));
  const depositPct = Number(data.deposit_percentage ?? 0);
  const depositAmount = depositPct > 0 ? Math.round((total * depositPct) / 100) : Number(data.deposit_amount ?? 0);
  const remainingAmount = Math.max(0, total - depositAmount);

  const items = (data.items || []).map((it, idx) => ({
    id: it.id || `item_${idx}`,
    name: it.name || it.description || '-',
    pattern: it.pattern || it.pr_pattern || '',
    fabricType: it.fabric_type || it.pr_fabric_type || it.material || '',
    color: it.color || it.pr_color || '',
    size: it.size || it.pr_sizes || '',
    quantity: Number(it.quantity || 0),
    unitPrice: Number(it.unit_price || it.price_per_unit || 0),
    total: Number(it.total || it.amount || (Number(it.quantity || 0) * Number(it.unit_price || 0))),
    sizeRows: Array.isArray(it.size_rows)
      ? it.size_rows.map((r, rIdx) => ({
          uuid: r.uuid || `${it.id || idx}-row-${rIdx}`,
          size: r.size || '',
          quantity: Number(r.quantity || 0),
          unitPrice: Number(r.unit_price || 0),
        }))
      : [],
  }));

  return {
    formData: {
      customer: {
        cus_company: customer.cus_company || data.customer_name || '-',
        cus_tax_id: customer.cus_tax_id || data.customer_tax_id || '',
        cus_address: customer.cus_address || data.customer_address || '',
        cus_phone: customer.cus_phone || data.customer_phone || '',
        cus_email: customer.cus_email || data.customer_email || '',
      },
      items,
      paymentMethod: data.payment_method || 'credit_30',
      depositPercentage: String(depositPct || 0),
      customDepositPercentage: '',
      dueDate: data.due_date || null,
      notes: data.notes || '',
      subtotal,
      vat,
      total,
      depositAmount,
      remainingAmount,
    },
    quotationNumber: data.number || data.quotation_number || data.code || '',
  };
};

const QuotationDetailDialog = ({ open, onClose, quotationId }) => {
  const { data, isLoading, error } = useGetQuotationQuery(quotationId, { skip: !open || !quotationId });

  const viewData = useMemo(() => mapToPreviewData(data), [data]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>รายละเอียดใบเสนอราคา</DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={22} />
            <Typography variant="body2">กำลังโหลดรายละเอียดใบเสนอราคา…</Typography>
          </Box>
        ) : error ? (
          <Typography color="error">ไม่สามารถโหลดข้อมูลได้</Typography>
        ) : viewData ? (
          <QuotationPreview formData={viewData.formData} quotationNumber={viewData.quotationNumber} showActions />
        ) : (
          <Typography variant="body2">ไม่พบข้อมูลใบเสนอราคา</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" sx={{
          background: 'linear-gradient(135deg, #900F0F 0%, #B20000 100%)',
          color: '#fff'
        }}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuotationDetailDialog;
