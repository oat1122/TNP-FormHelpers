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
  const paidAmount = formatTHB(invoice?.paid_amount || 0);
  const remainingAmount = formatTHB((invoice?.total_amount || 0) - (invoice?.paid_amount || 0));

  return (
    <TNPCard>
      <TNPCardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box flex={1}>
            <TNPHeading variant="h6">{invoice?.customer_company || 'ไม่ระบุบริษัท'}</TNPHeading>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.5} flexWrap="wrap">
              {invoice?.number && (
                <TNPCountChip 
                  icon={<DescriptionIcon sx={{ fontSize: '1rem' }} />} 
                  label={invoice.number} 
                  size="small" 
                />
              )}
              <Chip 
                size="small" 
                color="primary" 
                variant="outlined"
                label={typeLabels[invoice?.type] || invoice?.type || 'ไม่ระบุประเภท'} 
              />
            </Stack>
          </Box>
          <TNPStatusChip 
            label={invoice?.status || 'draft'} 
            size="small" 
            statuscolor={statusColor[invoice?.status] || 'default'} 
          />
        </Box>

        {/* ข้อมูลทางการเงิน */}
        <Box mb={2}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <RequestQuoteIcon fontSize="small" color="primary" />
              <TNPBodyText><strong>ยอดเงินรวม:</strong> {amountText}</TNPBodyText>
            </Stack>
            
            {invoice?.paid_amount > 0 && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText color="success.main"><strong>ชำระแล้ว:</strong> {paidAmount}</TNPBodyText>
              </Stack>
            )}
            
            {(invoice?.total_amount - (invoice?.paid_amount || 0)) > 0 && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText color="warning.main"><strong>คงเหลือ:</strong> {remainingAmount}</TNPBodyText>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* ข้อมูลวันที่ */}
        <Box mb={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <EventIcon fontSize="small" color="action" />
              <TNPBodyText>วันที่ออก: {formatDate(invoice?.invoice_date)}</TNPBodyText>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <EventIcon fontSize="small" color="error" />
              <TNPBodyText>ครบกำหนด: {formatDate(invoice?.due_date)}</TNPBodyText>
            </Stack>
          </Stack>
        </Box>

        {/* ข้อมูลเพิ่มเติม */}
        {(invoice?.quotation_number || invoice?.customer_contact) && (
          <Box mb={2}>
            <Stack spacing={0.5}>
              {invoice?.quotation_number && (
                <TNPBodyText variant="caption" color="text.secondary">
                  อ้างอิงใบเสนอราคา: {invoice.quotation_number}
                </TNPBodyText>
              )}
              {invoice?.customer_contact && (
                <TNPBodyText variant="caption" color="text.secondary">
                  ผู้ติดต่อ: {invoice.customer_contact}
                </TNPBodyText>
              )}
            </Stack>
          </Box>
        )}

        {/* ปุ่มดำเนินการ */}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onDownloadPDF && (
            <Button 
              size="small" 
              variant="outlined" 
              onClick={onDownloadPDF}
              startIcon={<DescriptionIcon />}
            >
              ดาวน์โหลด PDF
            </Button>
          )}
          {onView && (
            <Button 
              size="small" 
              variant="contained" 
              onClick={onView}
              color="primary"
            >
              ดูรายละเอียด
            </Button>
          )}
        </Stack>
      </TNPCardContent>
      <TNPDivider />
    </TNPCard>
  );
};

export default InvoiceCard;

