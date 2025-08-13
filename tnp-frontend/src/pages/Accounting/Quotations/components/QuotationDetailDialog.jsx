import React from 'react';
import { Dialog, DialogContent, Box, Typography, CircularProgress } from '@mui/material';
import { useGetQuotationQuery } from '../../../../features/Accounting/accountingApi';
import CreateQuotationForm from '../../PricingIntegration/components/quotation/CreateQuotationForm/CreateQuotationForm';

// Map quotation payload to selectedPricingRequests expected by CreateQuotationForm
const mapQuotationToSelectedPRs = (q) => {
  if (!q) return [];
  const data = q.data || q;
  const customer = data.customer || {
    cus_company: data.customer_name,
    cus_tax_id: data.customer_tax_id,
    cus_address: data.customer_address,
    cus_phone: data.customer_phone,
    cus_email: data.customer_email,
  };
  const items = Array.isArray(data.items) ? data.items : [];
  const prs = items.map((it, idx) => ({
    pr_id: it.pricing_request_id || it.pr_id || `qitem_${idx}`,
    pr_work_name: it.work_name || it.name || it.description || '-',
    work_name: it.work_name || it.name || it.description || '-',
    pr_pattern: it.pattern || '',
    pr_fabric_type: it.fabric_type || it.material || '',
    pr_color: it.color || '',
    pr_sizes: it.size || '',
    pr_quantity: it.quantity || 0,
    pr_unit_price: it.unit_price || 0,
    pr_notes: it.notes || '',
    customer,
  }));
  if (!prs.length) return [{ pr_id: 'empty', pr_work_name: '-', customer }];
  prs[0].customer = customer;
  return prs;
};

const QuotationDetailDialog = ({ open, onClose, quotationId }) => {
  const { data, isLoading, error } = useGetQuotationQuery(quotationId, { skip: !open || !quotationId });

  const selectedPricingRequests = React.useMemo(() => mapQuotationToSelectedPRs(data), [data]);

  // Render CreateQuotationForm directly; name hydration will be handled inside the form per item

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent dividers sx={{ p: 0 }}>
        {isLoading ? (
          <Box display="flex" alignItems="center" gap={1} p={2}>
            <CircularProgress size={22} />
            <Typography variant="body2">กำลังโหลดรายละเอียดใบเสนอราคา…</Typography>
          </Box>
        ) : error ? (
          <Box p={2}><Typography color="error">ไม่สามารถโหลดข้อมูลได้</Typography></Box>
        ) : (
          <CreateQuotationForm
            selectedPricingRequests={selectedPricingRequests}
            onBack={onClose}
            onSave={() => {}}
            onSubmit={() => {}}
            readOnly
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuotationDetailDialog;
