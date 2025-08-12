import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  useGetQuotationQuery,
  useGetPricingRequestAutofillQuery,
} from '../../../../features/Accounting/accountingApi';
import PricingRequestNotesButton from '../../PricingIntegration/components/PricingRequestNotesButton';

const Title = styled(DialogTitle)({
  background: 'linear-gradient(135deg, #900F0F 0%, #B20000 100%)',
  color: '#fff',
  fontWeight: 700,
});

const PRDetailRow = ({ prId }) => {
  const { data, isLoading } = useGetPricingRequestAutofillQuery(prId, { skip: !prId });
  if (isLoading) {
    return (
      <ListItem>
        <CircularProgress size={20} sx={{ mr: 2 }} />
        <Typography variant="body2">กำลังโหลดข้อมูล PR...</Typography>
      </ListItem>
    );
  }
  const pr = data?.data || data;
  const prNo = pr?.pr_no || pr?.pr_number || prId?.slice(-6) || 'PR';
  const workName = pr?.pr_work_name || pr?.work_name || 'ไม่ระบุชื่องาน';
  return (
    <ListItem divider>
      <ListItemText
        primary={<Typography fontWeight={700}>#{prNo} • {workName}</Typography>}
        secondary={pr?.pr_status ? `สถานะ: ${pr.pr_status}` : null}
      />
      <Stack direction="row" spacing={1}>
        <Chip label={`PR NO: ${prNo}`} size="small" />
        <PricingRequestNotesButton pricingRequestId={prId} workName={workName} variant="chip" showCount={false} />
      </Stack>
    </ListItem>
  );
};

const LinkedPricingDialog = ({ open, onClose, quotationId }) => {
  const { data, isLoading, error } = useGetQuotationQuery(quotationId, { skip: !open || !quotationId });

  const prIds = useMemo(() => {
    const set = new Set();
    const q = data?.data || data;
    if (!q) return [];
    if (Array.isArray(q?.items)) {
      q.items.forEach((it) => { if (it.pricing_request_id) set.add(it.pricing_request_id); });
    }
    if (q?.primary_pricing_request_id) set.add(q.primary_pricing_request_id);
    // sometimes backend may return array
    const multi = q?.primary_pricing_request_ids;
    if (Array.isArray(multi)) multi.forEach((id) => set.add(id));
    return Array.from(set);
  }, [data]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Title>งาน Pricing ที่อ้างอิง</Title>
      <DialogContent dividers>
        {isLoading ? (
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={22} />
            <Typography variant="body2">กำลังโหลดรายละเอียดใบเสนอราคา...</Typography>
          </Box>
        ) : error ? (
          <Typography color="error">ไม่สามารถโหลดข้อมูลได้</Typography>
        ) : prIds.length === 0 ? (
          <Typography variant="body2">ไม่มีการอ้างอิง Pricing Request</Typography>
        ) : (
          <List>
            {prIds.map((id) => (
              <PRDetailRow key={id} prId={id} />
            ))}
          </List>
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

export default LinkedPricingDialog;
