import React from 'react';
import { Box, Stack, Typography, Chip, Button } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import { TNPCard, TNPCardContent, TNPHeading, TNPBodyText, TNPStatusChip, TNPCountChip, TNPDivider } from '../../PricingIntegration/components/styles/StyledComponents';

const typeLabels = {
  full_amount: 'เต็มจำนวน',
  remaining: 'ยอดคงเหลือ (หักมัดจำ)',
  deposit: 'มัดจำ',
  partial: 'บางส่วน (กำหนดเอง)'
};

const statusColor = {
  draft: 'default',
  pending: 'warning',
  pending_review: 'warning',
  approved: 'success',
  rejected: 'error',
  sent: 'info',
  partial_paid: 'warning',
  fully_paid: 'success',
  overdue: 'error',
};

const formatTHB = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(n || 0));
const formatDate = (d) => {
  if (!d) return '-';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('th-TH');
  } catch { return '-'; }
};

const InvoiceCard = ({ invoice, onView, onDownloadPDF }) => {
  const amountText = formatTHB(invoice?.total_amount);

  return (
    <TNPCard>
      <TNPCardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box>
            <TNPHeading variant="h6">{invoice?.customer_company || '-'}</TNPHeading>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
              {invoice?.number && (
                <TNPCountChip icon={<DescriptionIcon sx={{ fontSize: '1rem' }} />} label={invoice.number} size="small" />
              )}
              <Chip size="small" color="default" label={typeLabels[invoice?.type] || invoice?.type || '-'} />
            </Stack>
          </Box>
          <TNPStatusChip label={invoice?.status || 'draft'} size="small" statuscolor={statusColor[invoice?.status] || 'default'} />
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" mt={1.5}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <RequestQuoteIcon fontSize="small" color="action" />
              <TNPBodyText>ยอดสุทธิ: {amountText}</TNPBodyText>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <EventIcon fontSize="small" color="action" />
              <TNPBodyText>ครบกำหนด: {formatDate(invoice?.due_date)}</TNPBodyText>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1}>
            {onDownloadPDF && (
              <Button size="small" variant="outlined" onClick={onDownloadPDF}>PDF</Button>
            )}
            {onView && (
              <Button size="small" variant="contained" onClick={onView}>รายละเอียด</Button>
            )}
          </Stack>
        </Stack>
      </TNPCardContent>
      <TNPDivider />
    </TNPCard>
  );
};

export default InvoiceCard;

