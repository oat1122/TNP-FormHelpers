import React from 'react';
import { Card, CardContent, CardActions, Box, Typography, Chip, Button, Stack } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import DescriptionIcon from '@mui/icons-material/Description';

const statusColor = {
  draft: 'default',
  pending_review: 'warning',
  approved: 'success',
  rejected: 'error',
  sent: 'info',
  completed: 'success',
};

const QuotationCard = ({ data, onSelect, onDownloadPDF, onViewLinked }) => {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, '&:hover': { boxShadow: 3 } }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <DescriptionIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>{data.number || 'QT-XXXX'}</Typography>
          </Stack>
          <Chip size="small" label={data.status} color={statusColor[data.status] || 'default'} />
        </Box>
        <Typography variant="body2" color="text.secondary">
          ลูกค้า: {data.customer?.cus_company || data.customer_name || '-'}
        </Typography>
        <Typography variant="body2" color="text.secondary">ยอดรวม: {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(data.total_amount || 0))}</Typography>
        {data.work_name && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>งาน: {data.work_name}</Typography>
        )}
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button size="small" onClick={onSelect}>ตรวจสอบ</Button>
        <Button size="small" disabled={data.status !== 'approved'} onClick={onDownloadPDF}>ดาวน์โหลด PDF</Button>
  <Button size="small" startIcon={<LinkIcon />} onClick={onViewLinked}>ดูงาน Pricing</Button>
      </CardActions>
    </Card>
  );
};

export default QuotationCard;
