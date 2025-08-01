import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as ViewIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import DocumentStatusBadge from './DocumentStatusBadge';

const PricingRequestDetailsDialog = ({
  open,
  onClose,
  selectedRequest,
  formatCurrency,
  formatDueDate,
  getQuantity,
  getEffectiveUnitPrice,
  getEffectiveTotalPrice,
  pricingNotes,
  getLatestNote,
  getNoteTypeName,
  getNoteTypeColor,
  formatDateTime,
  onViewNotes
}) => {
  if (!selectedRequest) return null;

  const requestId = selectedRequest.id || selectedRequest.pr_id;
  const notes = pricingNotes[requestId] || [];
  const latestNote = getLatestNote(requestId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewIcon />
            รายละเอียดการขอราคา
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedRequest.pr_work_name || selectedRequest.product_name} 
            ({selectedRequest.pr_no || selectedRequest.id || selectedRequest.pr_id})
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              ข้อมูลทั่วไป
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">เลขที่ใบขอราคา</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedRequest.pr_no || selectedRequest.id || selectedRequest.pr_id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">ชื่องาน</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedRequest.pr_work_name || selectedRequest.product_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">รูปแบบงาน</Typography>
                <Typography variant="body1">
                  {selectedRequest.pr_pattern || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">จำนวน</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {getQuantity(selectedRequest).toLocaleString()} ชิ้น
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">กำหนดส่ง</Typography>
                <Typography variant="body1" color={
                  selectedRequest.pr_due_date && new Date(selectedRequest.pr_due_date) < new Date() 
                    ? 'error.main' 
                    : 'text.primary'
                }>
                  {formatDueDate(selectedRequest.pr_due_date)}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Fabric Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              ข้อมูลผ้าและสี
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">ชนิดผ้า</Typography>
                <Typography variant="body1">
                  {selectedRequest.pr_fabric_type || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">สี</Typography>
                <Typography variant="body1">
                  {selectedRequest.pr_color || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">ไซส์</Typography>
                <Typography variant="body1">
                  {selectedRequest.pr_sizes || '-'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Special Work */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              งานพิเศษ
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">งานสกรีน</Typography>
                <Typography variant="body1">
                  {selectedRequest.pr_silk || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">งาน DTF</Typography>
                <Typography variant="body1">
                  {selectedRequest.pr_dft || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">งานปัก</Typography>
                <Typography variant="body1">
                  {selectedRequest.pr_embroider || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">งานซับ</Typography>
                <Typography variant="body1">
                  {selectedRequest.pr_sub || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">งานอื่นๆ</Typography>
                <Typography variant="body1">
                  {selectedRequest.pr_other_screen || '-'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Pricing Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              ข้อมูลราคา
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">ราคาต่อชิ้น</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatCurrency(getEffectiveUnitPrice(selectedRequest))}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">ราคารวม</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatCurrency(getEffectiveTotalPrice(selectedRequest))}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">สถานะ</Typography>
                <DocumentStatusBadge 
                  status="approved" 
                  customLabel="ได้ราคาแล้ว"
                  size="small"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Notes Summary */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Notes ล่าสุด
            </Typography>
            {!latestNote ? (
              <Alert severity="info">
                <Typography>ไม่มี notes สำหรับรายการนี้</Typography>
              </Alert>
            ) : (
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Chip 
                      label={getNoteTypeName(latestNote.type)}
                      color={getNoteTypeColor(latestNote.type)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(latestNote.created_date)}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {latestNote.text}
                  </Typography>
                  {notes.length > 1 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => {
                          onClose();
                          setTimeout(() => onViewNotes(selectedRequest), 100);
                        }}
                      >
                        ดูประวัติ Notes ทั้งหมด ({notes.length} รายการ)
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PricingRequestDetailsDialog;
