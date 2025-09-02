import React from 'react';
import { Box, Stack, Chip, Button } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import PaletteIcon from '@mui/icons-material/Palette';
import ChecklistIcon from '@mui/icons-material/Checklist';
import PaymentIcon from '@mui/icons-material/Payment';
import { TNPCard, TNPCardContent, TNPHeading, TNPBodyText, TNPStatusChip, TNPCountChip, TNPDivider } from '../../PricingIntegration/components/styles/StyledComponents';

const typeLabels = {
  full_amount: 'เต็มจำนวน',
  remaining: 'ยอดคงเหลือ (หลังหักมัดจำ)',
  deposit: 'มัดจำ',
  partial: 'เรียกเก็บบางส่วน'
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
  const subtotalText = formatTHB(invoice?.subtotal);
  const taxText = formatTHB(invoice?.tax_amount);
  const paidAmount = formatTHB(invoice?.paid_amount || 0);
  const remainingAmount = formatTHB((invoice?.total_amount || 0) - (invoice?.paid_amount || 0));

  const companyName = invoice?.customer_company || invoice?.customer?.cus_company || '-';
  const quotationNumber = invoice?.quotation_number || invoice?.quotation?.number || null;
  const contactName = [invoice?.customer_firstname, invoice?.customer_lastname]
    .filter(Boolean).join(' ');

  return (
    <TNPCard>
      <TNPCardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box flex={1}>
            <TNPHeading variant="h6">{companyName}</TNPHeading>
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
                label={typeLabels[invoice?.type] || invoice?.type || '-'} 
              />
            </Stack>
          </Box>
          <TNPStatusChip 
            label={invoice?.status || 'draft'} 
            size="small" 
            statuscolor={statusColor[invoice?.status] || 'default'} 
          />
        </Box>

        <Box mb={2}>
          <Stack spacing={1}>
            {!!contactName && (
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action" />
                <TNPBodyText>{contactName}</TNPBodyText>
              </Stack>
            )}
            {invoice?.customer_tax_id && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <BusinessIcon fontSize="small" color="action" />
                <TNPBodyText variant="caption" color="text.secondary">
                  เลขประจำตัวผู้เสียภาษี: {invoice.customer_tax_id}
                </TNPBodyText>
              </Stack>
            )}
            {invoice?.customer_email && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText variant="caption" color="text.secondary">
                  Email: {invoice.customer_email}
                </TNPBodyText>
              </Stack>
            )}
            {invoice?.customer_tel_1 && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText variant="caption" color="text.secondary">
                  โทร: {invoice.customer_tel_1}
                </TNPBodyText>
              </Stack>
            )}
          </Stack>
        </Box>

        <Box mb={2}>
          <Stack spacing={1}>
            {invoice?.work_name && (
              <Stack direction="row" spacing={1} alignItems="center">
                <WorkIcon fontSize="small" color="primary" />
                <TNPBodyText><strong>ชื่องาน:</strong> {invoice.work_name}</TNPBodyText>
              </Stack>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ ml: 3 }}>
              {invoice?.fabric_type && (
                <TNPBodyText variant="caption" color="text.secondary">
                  ชนิดผ้า: {invoice.fabric_type}
                </TNPBodyText>
              )}
              {invoice?.pattern && (
                <TNPBodyText variant="caption" color="text.secondary">
                  แพทเทิร์น: {invoice.pattern}
                </TNPBodyText>
              )}
              {invoice?.color && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PaletteIcon sx={{ fontSize: '0.875rem' }} color="action" />
                  <TNPBodyText variant="caption" color="text.secondary">
                    {invoice.color}
                  </TNPBodyText>
                </Stack>
              )}
            </Stack>
            {(invoice?.sizes || invoice?.quantity) && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <ChecklistIcon fontSize="small" color="action" />
                <TNPBodyText variant="caption" color="text.secondary">
                  {invoice?.sizes && `ไซซ์: ${invoice.sizes}`}
                  {invoice?.sizes && invoice?.quantity ? ' | ' : ''}
                  {invoice?.quantity && `จำนวน: ${invoice.quantity}`}
                </TNPBodyText>
              </Stack>
            )}
          </Stack>
        </Box>

        <Box mb={2}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <RequestQuoteIcon fontSize="small" color="primary" />
              <TNPBodyText><strong>ราคารวม:</strong> {amountText}</TNPBodyText>
            </Stack>
            {invoice?.subtotal > 0 && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText variant="caption" color="text.secondary">ราคาก่อนภาษี: {subtotalText}</TNPBodyText>
              </Stack>
            )}
            {invoice?.tax_amount > 0 && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText variant="caption" color="text.secondary">ภาษีมูลค่าเพิ่ม: {taxText}</TNPBodyText>
              </Stack>
            )}
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

        {(invoice?.payment_method || invoice?.payment_terms) && (
          <Box mb={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PaymentIcon fontSize="small" color="action" />
              <Stack spacing={0.5}>
                {invoice?.payment_method && (
                  <TNPBodyText variant="caption" color="text.secondary">วิธีชำระเงิน: {invoice.payment_method}</TNPBodyText>
                )}
                {invoice?.payment_terms && (
                  <TNPBodyText variant="caption" color="text.secondary">เงื่อนไขการชำระ: {invoice.payment_terms}</TNPBodyText>
                )}
              </Stack>
            </Stack>
          </Box>
        )}

        <Box mb={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <EventIcon fontSize="small" color="action" />
              <TNPBodyText>สร้างเมื่อ: {formatDate(invoice?.created_at)}</TNPBodyText>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <EventIcon fontSize="small" color="error" />
              <TNPBodyText>วันครบกำหนด: {formatDate(invoice?.due_date)}</TNPBodyText>
            </Stack>
          </Stack>
        </Box>

        {(quotationNumber || invoice?.customer_address || invoice?.notes || (invoice?.document_header_type && invoice.document_header_type !== 'ต้นฉบับ')) && (
          <Box mb={2}>
            <Stack spacing={0.5}>
              {quotationNumber && (
                <TNPBodyText variant="caption" color="text.secondary">อ้างอิงใบเสนอราคา: {quotationNumber}</TNPBodyText>
              )}
              {invoice?.customer_address && (
                <TNPBodyText variant="caption" color="text.secondary">
                  ที่อยู่ใบกำกับ: {invoice.customer_address}{invoice?.customer_zip_code ? ` ${invoice.customer_zip_code}` : ''}
                </TNPBodyText>
              )}
              {invoice?.notes && (
                <TNPBodyText variant="caption" color="text.secondary">หมายเหตุ: {invoice.notes}</TNPBodyText>
              )}
              {invoice?.document_header_type && invoice.document_header_type !== 'ต้นฉบับ' && (
                <TNPBodyText variant="caption" color="primary.main">ประเภทหัวกระดาษ: {invoice.document_header_type}</TNPBodyText>
              )}
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onDownloadPDF && (
            <Button size="small" variant="outlined" onClick={onDownloadPDF} startIcon={<DescriptionIcon />}>
              ดาวน์โหลด PDF
            </Button>
          )}
          {onView && (
            <Button size="small" variant="contained" onClick={onView} color="primary">
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

