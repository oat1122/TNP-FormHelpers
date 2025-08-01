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
  Chip,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import DocumentStatusBadge from '../../components/DocumentStatusBadge';

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
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ViewIcon fontSize="small" />
              ข้อมูลทั่วไป
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">เลขที่ใบขอราคา (pr_no)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {selectedRequest.pr_no || selectedRequest.id || selectedRequest.pr_id || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">ชื่องาน (pr_work_name)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedRequest.pr_work_name || selectedRequest.product_name || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">รูปแบบงาน (pr_pattern)</Typography>
                <Typography variant="body1">
                  {selectedRequest.pr_pattern || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">จำนวน (pr_quantity)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {getQuantity(selectedRequest).toLocaleString()} ชิ้น
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">กำหนดส่ง (pr_due_date)</Typography>
                <Typography variant="body1" color={
                  selectedRequest.pr_due_date && new Date(selectedRequest.pr_due_date) < new Date() 
                    ? 'error.main' 
                    : 'text.primary'
                } sx={{ fontWeight: 600 }}>
                  {formatDueDate(selectedRequest.pr_due_date)}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Fabric and Material Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              ข้อมูลผ้าและวัสดุ
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">ชนิดผ้า (pr_fabric_type)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedRequest.pr_fabric_type || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">สี (pr_color)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedRequest.pr_color || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">ไซส์ (pr_sizes)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedRequest.pr_sizes || '-'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Special Work Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              รายละเอียดงานพิเศษ
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">งานสกรีน (pr_silk)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedRequest.pr_silk || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">งาน DTF (pr_dft)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedRequest.pr_dft || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">งานปัก (pr_embroider)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedRequest.pr_embroider || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">งานซับ (pr_sub)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedRequest.pr_sub || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">งานอื่นๆ (pr_other_screen)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedRequest.pr_other_screen || '-'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Image Section */}
          {selectedRequest.pr_image && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon fontSize="small" />
                  รูปภาพอ้างอิง (pr_image)
                </Typography>
                <Card variant="outlined" sx={{ maxWidth: 400, mx: 'auto' }}>
                  <CardContent>
                    <Box sx={{ textAlign: 'center' }}>
                      <img
                        src={selectedRequest.pr_image}
                        alt="Pricing Request Image"
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          maxHeight: '300px',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <Box sx={{ display: 'none', py: 2 }}>
                        <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          ไม่สามารถโหลดรูปภาพได้
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Divider sx={{ width: '100%', my: 2 }} />
            </>
          )}

          {/* Pricing Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              ข้อมูลราคาและสถานะ
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">ราคาต่อชิ้น</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatCurrency(getEffectiveUnitPrice(selectedRequest))}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">ราคารวม</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatCurrency(getEffectiveTotalPrice(selectedRequest))}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">จำนวนรวม</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {getQuantity(selectedRequest).toLocaleString()} ชิ้น
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">สถานะ</Typography>
                <DocumentStatusBadge 
                  status="approved" 
                  customLabel="ได้ราคาแล้ว"
                  size="small"
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Summary Card */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  สรุปข้อมูลการขอราคา
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">เลขที่:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, ml: 1 }}>
                        {selectedRequest.pr_no || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">งาน:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, ml: 1 }}>
                        {selectedRequest.pr_work_name || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">วัสดุ:</Typography>
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {[
                          selectedRequest.pr_fabric_type && `ผ้า: ${selectedRequest.pr_fabric_type}`,
                          selectedRequest.pr_color && `สี: ${selectedRequest.pr_color}`,
                          selectedRequest.pr_sizes && `ไซส์: ${selectedRequest.pr_sizes}`
                        ].filter(Boolean).join(', ') || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">จำนวน:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, ml: 1, color: 'primary.main' }}>
                        {getQuantity(selectedRequest).toLocaleString()} ชิ้น
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">ราคา:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, ml: 1, color: 'success.main' }}>
                        {formatCurrency(getEffectiveTotalPrice(selectedRequest))}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">กำหนดส่ง:</Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600, 
                        ml: 1,
                        color: selectedRequest.pr_due_date && new Date(selectedRequest.pr_due_date) < new Date() 
                          ? 'error.main' 
                          : 'text.primary'
                      }}>
                        {formatDueDate(selectedRequest.pr_due_date)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Special Work Summary */}
                {(selectedRequest.pr_silk || selectedRequest.pr_dft || selectedRequest.pr_embroider || 
                  selectedRequest.pr_sub || selectedRequest.pr_other_screen) && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">งานพิเศษ:</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {[
                        selectedRequest.pr_silk && `สกรีน: ${selectedRequest.pr_silk}`,
                        selectedRequest.pr_dft && `DTF: ${selectedRequest.pr_dft}`,
                        selectedRequest.pr_embroider && `ปัก: ${selectedRequest.pr_embroider}`,
                        selectedRequest.pr_sub && `ซับ: ${selectedRequest.pr_sub}`,
                        selectedRequest.pr_other_screen && `อื่นๆ: ${selectedRequest.pr_other_screen}`
                      ].filter(Boolean).join(', ') || 'ไม่มี'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Notes Summary */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              หมายเหตุและข้อมูลเพิ่มเติม
            </Typography>
            {!latestNote ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography>ไม่มี notes สำหรับรายการนี้</Typography>
              </Alert>
            ) : (
              <Card variant="outlined" sx={{ mb: 2 }}>
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
            
            {/* Additional Information */}
            <Card variant="outlined" sx={{ bgcolor: 'info.50' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom color="info.main">
                  ข้อมูลระบบ
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Request ID: {selectedRequest.id || selectedRequest.pr_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Pattern: {selectedRequest.pr_pattern || 'ไม่ระบุ'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          ข้อมูลจาก: tnpdb.pricing_requests
        </Typography>
        <Button onClick={onClose} variant="contained">
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PricingRequestDetailsDialog;
