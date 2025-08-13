import React from 'react';
import { Box, Stack, Avatar } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  TNPCard,
  TNPCardContent,
  TNPHeading,
  TNPSubheading,
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
            <TNPSubheading title={data.work_name || ''}>
              {data.work_name || '-'}
            </TNPSubheading>
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

        <TNPBodyText color="text.secondary">
          ผู้สร้าง: {data.created_by_name || '-'}
        </TNPBodyText>
      </TNPCardContent>

      <TNPDivider />

      <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, bgcolor: 'background.light' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TNPSecondaryButton size="medium" startIcon={<LinkIcon />} onClick={onViewLinked}>
            ดูงาน Pricing
          </TNPSecondaryButton>
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
