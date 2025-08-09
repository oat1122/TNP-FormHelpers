import { Box, IconButton, Tooltip, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';

export function QuotationToolbar({ onBack, onPreview, onDraft, onSubmit, disabledSubmit }) {
  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
      <Box display="flex" alignItems="center" gap={2}>
        <Tooltip title="ย้อนกลับ">
          <IconButton onClick={onBack} size="small">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h5" fontWeight={700}>สร้างใบเสนอราคา</Typography>
      </Box>
      <Box display="flex" gap={1}>
        <Button variant="secondary" startIcon={<VisibilityIcon />} onClick={onPreview}>ดูตัวอย่าง</Button>
        <Button variant="secondary" onClick={onDraft}>บันทึกร่าง</Button>
        <Button variant="primary" disabled={disabledSubmit} onClick={onSubmit}>ส่งตรวจสอบ</Button>
      </Box>
    </Box>
  );
}

export default QuotationToolbar;
