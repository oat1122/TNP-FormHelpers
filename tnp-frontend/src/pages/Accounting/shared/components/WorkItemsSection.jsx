import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Chip,
} from '@mui/material';
import { Section, SectionHeader, InfoCard, tokens } from '../../PricingIntegration/components/quotation/styles/quotationTheme';

/**
 * WorkItemsSection (Shared Component)
 * Display work items/groups summary
 */
const WorkItemsSection = ({
  items = [],
  title = 'รายละเอียดงาน',
  icon,
  children,
}) => {
  return (
    <Section>
      <SectionHeader>
        {icon && (
          <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
            {icon}
          </Avatar>
        )}
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">รายการงานและรายละเอียด</Typography>
        </Box>
      </SectionHeader>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
            {title} ({items.length})
          </Typography>
        </Box>

        {items.length === 0 ? (
          <InfoCard sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">ไม่พบข้อมูลงาน</Typography>
          </InfoCard>
        ) : (
          children || (
            items.map((item, idx) => (
              <WorkItemCard key={item.id || idx} item={item} index={idx} />
            ))
          )
        )}
      </Box>
    </Section>
  );
};

// Default work item card component
const WorkItemCard = React.memo(function WorkItemCard({ item, index }) {
  const name = item.name || item.item_name || item.work_name || '-';
  const pattern = item.pattern || '';
  const fabric = item.fabricType || item.fabric_type || '';
  const color = item.color || '';
  const size = item.size || item.sizes || '';
  const totalQty = Array.isArray(item.sizeRows) 
    ? item.sizeRows.reduce((s, r) => s + Number(r.quantity || 0), 0)
    : (item.quantity || 0);
  const unit = item.unit || 'ชิ้น';

  return (
    <InfoCard sx={{ p: 2, mb: 1.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
          งานที่ {index + 1}: {name}
        </Typography>
        <Chip 
          label={`${totalQty} ${unit}`} 
          size="small" 
          variant="outlined" 
          sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} 
        />
      </Box>
      <Grid container spacing={1}>
        {pattern && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">แพทเทิร์น</Typography>
            <Typography variant="body2" fontWeight={500}>{pattern}</Typography>
          </Grid>
        )}
        {fabric && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">ประเภทผ้า</Typography>
            <Typography variant="body2" fontWeight={500}>{fabric}</Typography>
          </Grid>
        )}
        {color && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">สี</Typography>
            <Typography variant="body2" fontWeight={500}>{color}</Typography>
          </Grid>
        )}
        {size && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">ขนาด</Typography>
            <Typography variant="body2" fontWeight={500}>{size}</Typography>
          </Grid>
        )}
      </Grid>
    </InfoCard>
  );
});

export default WorkItemsSection;
export { WorkItemCard };
