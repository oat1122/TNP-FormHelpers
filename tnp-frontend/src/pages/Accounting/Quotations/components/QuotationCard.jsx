import React from 'react';
import { Box, Stack, Avatar, Typography, Collapse, Button, Chip, Grid } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useGetPricingRequestAutofillQuery } from '../../../../features/Accounting/accountingApi';
import PricingRequestNotesButton from '../../PricingIntegration/components/PricingRequestNotesButton';
import {
  TNPCard,
  TNPCardContent,
  TNPHeading,
  TNPBodyText,
  TNPStatusChip,
  TNPCountChip,
  TNPPrimaryButton,
  TNPSecondaryButton,
  TNPDivider,
} from '../../PricingIntegration/components/styles/StyledComponents';

const statusColor = {
  draft: 'default',
  pending_review: 'warning',
  approved: 'success',
  rejected: 'error',
  sent: 'info',
  completed: 'success',
};

const QuotationCard = ({ data, onDownloadPDF, onViewLinked, onViewDetail }) => {
  const amountText = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(data.total_amount || 0));
  const [showAll, setShowAll] = React.useState(false);
  // collect linked PR ids from this quotation
  const detail = data; // data may already contain items
  const prIds = React.useMemo(() => {
    const set = new Set();
    if (Array.isArray(detail?.items)) {
      detail.items.forEach((it) => { if (it?.pricing_request_id) set.add(it.pricing_request_id); });
    }
    if (detail?.primary_pricing_request_id) set.add(detail.primary_pricing_request_id);
    if (Array.isArray(detail?.primary_pricing_request_ids)) detail.primary_pricing_request_ids.forEach((id) => set.add(id));
    return Array.from(set);
  }, [detail]);
  return (
    <TNPCard>
      <TNPCardContent>
        {/* Header: Customer info to match PricingIntegration style */}
        <Box display="flex" alignItems="center" mb={2.5}>
          <Avatar
            sx={{
              bgcolor: 'secondary.main',
              width: 48,
              height: 48,
              mr: 2,
              boxShadow: '0 2px 8px rgba(178, 0, 0, 0.2)',
            }}
          >
            <BusinessIcon sx={{ fontSize: '1.5rem' }} />
          </Avatar>
          <Box flex={1} minWidth={0}>
            <TNPHeading variant="h6">
              {data.customer?.cus_company || data.customer_name || '-'}
            </TNPHeading>
            {/* Jobs list under PR codes */}
          </Box>
        </Box>

        {/* Chips: status and amount */}
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2.5}>
          <TNPStatusChip
            label={data.status || 'draft'}
            size="small"
            statuscolor={statusColor[data.status] || 'default'}
          />
          <TNPCountChip label={`ยอดรวม: ${amountText}`} size="small" />
          {data.number && (
            <TNPCountChip icon={<DescriptionIcon sx={{ fontSize: '1rem' }} />} label={data.number} size="small" />
          )}
        </Stack>

        <TNPBodyText color="text.secondary">ผู้สร้าง: {data.created_by_name || '-'}</TNPBodyText>

        {/* PR entries with job names */}
        {prIds.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Stack spacing={1.2}>
              {prIds.slice(0, 3).map((id, idx) => (
                <PRRow key={id} prId={id} order={idx + 1} items={Array.isArray(data.items) ? data.items : []} />
              ))}
            </Stack>
            {prIds.length > 3 && (
              <>
                <Collapse in={showAll}>
                  <Stack spacing={1.2} sx={{ mt: 1 }}>
                    {prIds.slice(3).map((id, idx) => (
                      <PRRow key={id} prId={id} order={3 + idx + 1} items={Array.isArray(data.items) ? data.items : []} />
                    ))}
                  </Stack>
                </Collapse>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Button size="small" onClick={() => setShowAll((v) => !v)} sx={{ textTransform: 'none' }}>
                    {showAll ? 'ย่อ' : 'ดูเพิ่มเติม'}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}
      </TNPCardContent>

      <TNPDivider />

      <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, bgcolor: 'background.light' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TNPSecondaryButton size="medium" onClick={onDownloadPDF} disabled={data.status !== 'approved'}>
            ดาวน์โหลด PDF
          </TNPSecondaryButton>
        </Box>
        <TNPPrimaryButton size="medium" variant="contained" startIcon={<VisibilityIcon />} onClick={onViewDetail}>
          ดูรายละเอียด
        </TNPPrimaryButton>
      </Box>
    </TNPCard>
  );
};

export default QuotationCard;

// Build Pricing view URL dynamically (mirrors LinkedPricingDialog)
const getPricingViewUrl = (prId) => {
  if (import.meta.env.DEV) {
    return `/pricing/view/${encodeURIComponent(prId)}`;
  }
  const apiBase = import.meta.env.VITE_END_POINT_URL;
  try {
    if (apiBase) {
      const u = new URL(apiBase);
      const cleanedHost = u.host
        .replace(/^api\./, '')
        .replace(/-api(?=\.|:)/, '');
      return `${u.protocol}//${cleanedHost}/pricing/view/${encodeURIComponent(prId)}`;
    }
  } catch (e) {
    // fallback below
  }
  return `/pricing/view/${encodeURIComponent(prId)}`;
};

// PR row with code + status chip and job name below
const PRRow = ({ prId, items }) => {
  const { data, isLoading } = useGetPricingRequestAutofillQuery(prId, { skip: !prId });
  const pr = data?.data || data || {};
  const prNo = pr.pr_no || pr.pr_number || `#${String(prId).slice(-6)}`;
  const workName = pr.pr_work_name || pr.work_name || '-';
  const [open, setOpen] = React.useState(false);
  const handleToggle = () => setOpen((v) => !v);
  const handleButtonClick = (e) => { e.stopPropagation(); };
  const relatedItems = Array.isArray(items)
    ? items.filter((it) => it?.pricing_request_id === prId || it?.pricing_request_id === pr?.id)
    : [];
  const imgUrl = pr?.pr_image || pr?.image_url || pr?.image;
  return (
    <Box
      onClick={handleToggle}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 1.25,
        py: 1,
        bgcolor: 'background.paper',
        '&:hover': { borderColor: 'primary.light', boxShadow: 1 },
        cursor: 'pointer',
      }}
   >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          minWidth: 0,
        }}
      >
        {/* Left: PR code + job name (two lines) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
            #{prNo.toString().replace(/^#/, '')}
          </Typography>
          <Typography variant="body1" noWrap sx={{ color: 'text.secondary', minWidth: 0 }}>
            {isLoading ? 'กำลังโหลด…' : workName}
          </Typography>
        </Box>

        {/* Right: Notes button + original link, vertically centered */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
          <PricingRequestNotesButton
            pricingRequestId={prId}
            workName={workName}
            size="small"
            showCount={false}
          />
          <Button
            variant="outlined"
            size="small"
            href={getPricingViewUrl(prId)}
            target="_blank"
            rel="noopener"
            sx={{
              textTransform: 'none',
              px: 1.25,
              py: 0.25,
              borderRadius: 1.5,
              alignSelf: 'center',
            }}
            onClick={handleButtonClick}
          >
            ดูใบงานต้น ฉบับ
          </Button>
        </Box>
      </Box>
      {/* Expanded details */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: imgUrl ? '1fr 160px' : '1fr' }, gap: 1.25 }}>
          <Stack spacing={0.75}>
            {relatedItems.length === 0 && (
              <Typography variant="body2" color="text.secondary">ไม่มีรายละเอียดรายการสำหรับงานนี้</Typography>
            )}
            {relatedItems.map((it) => (
              <Box key={it.id || `${prId}-${it.sequence_order}`} sx={{ p: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="body2"><strong>รายการ:</strong> {it.item_name || it.name || '-'}</Typography>
                <Typography variant="body2"><strong>ลำดับ:</strong> {it.sequence_order ?? '-'}</Typography>
                <Typography variant="body2"><strong>แพทเทิร์น:</strong> {it.pattern ?? '-'}</Typography>
                <Typography variant="body2"><strong>ผ้า:</strong> {it.fabric_type ?? '-'}</Typography>
                <Typography variant="body2"><strong>สี:</strong> {it.color ?? '-'}</Typography>
                <Typography variant="body2"><strong>ไซส์:</strong> {it.size ?? '-'}</Typography>
                <Typography variant="body2"><strong>ราคา/หน่วย:</strong> {it.unit_price ?? '-'}</Typography>
                <Typography variant="body2"><strong>จำนวน:</strong> {it.quantity ?? '-'}</Typography>
                <Typography variant="body2"><strong>รวม:</strong> {it.subtotal ?? '-'}</Typography>
              </Box>
            ))}
          </Stack>
          {imgUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <Box component="img" src={imgUrl} alt={workName} sx={{ maxWidth: 160, maxHeight: 160, borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
