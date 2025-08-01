import React, { useState, useEffect } from 'react';
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
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import DocumentStatusBadge from '../../components/DocumentStatusBadge';
import { pricingIntegrationService } from '../../../../features/Accounting';

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
  const [loading, setLoading] = useState(false);
  const [pricingRequestData, setPricingRequestData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch pricing request details when dialog opens
  useEffect(() => {
    if (!open || !selectedRequest) {
      setPricingRequestData(null);
      setError(null);
      return;
    }

    const fetchPricingRequestDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const requestId = selectedRequest.id || selectedRequest.pr_id;
        console.log('Fetching pricing request details for ID:', requestId);
        
        const response = await pricingIntegrationService.getPricingRequestDetails(requestId);
        
        if (response.data?.status === 'success') {
          console.log('Pricing request details loaded:', response.data.data);
          setPricingRequestData(response.data.data.pricing_request);
        } else {
          throw new Error(response.data?.message || 'Failed to load pricing request details');
        }
      } catch (err) {
        console.error('Error fetching pricing request details:', err);
        setError(err.message || 'ไม่สามารถโหลดข้อมูลได้');
        // Fallback to selectedRequest data
        setPricingRequestData(selectedRequest);
      } finally {
        setLoading(false);
      }
    };

    fetchPricingRequestDetails();
  }, [open, selectedRequest]);

  if (!selectedRequest) return null;

  // Use fetched data if available, otherwise fallback to selectedRequest
  const displayData = pricingRequestData || selectedRequest;
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
            {displayData.work_name || displayData.pr_work_name || displayData.product_name} 
            ({displayData.no || displayData.pr_no || displayData.id || displayData.pr_id})
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>กำลังโหลดข้อมูล...</Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography>{error}</Typography>
          </Alert>
        )}

        {!loading && (
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
                  {displayData.no || displayData.pr_no || displayData.id || displayData.pr_id || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">ชื่องาน (pr_work_name)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {displayData.work_name || displayData.pr_work_name || displayData.product_name || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">รูปแบบงาน (pr_pattern)</Typography>
                <Typography variant="body1">
                  {displayData.pattern || displayData.pr_pattern || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">จำนวน (pr_quantity)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {(displayData.quantity || displayData.pr_quantity || getQuantity(selectedRequest) || 0).toLocaleString()} ชิ้น
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">กำหนดส่ง (pr_due_date)</Typography>
                <Typography variant="body1" color={
                  (displayData.due_date || displayData.pr_due_date) && new Date(displayData.due_date || displayData.pr_due_date) < new Date() 
                    ? 'error.main' 
                    : 'text.primary'
                } sx={{ fontWeight: 600 }}>
                  {formatDueDate(displayData.due_date || displayData.pr_due_date)}
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
                  {displayData.fabric_type || displayData.pr_fabric_type || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">สี (pr_color)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {displayData.color || displayData.pr_color || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">ไซส์ (pr_sizes)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {displayData.sizes || displayData.pr_sizes || '-'}
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
                  {displayData.silk_work || displayData.pr_silk || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">งาน DTF (pr_dft)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {displayData.dft_work || displayData.pr_dft || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">งานปัก (pr_embroider)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {displayData.embroider_work || displayData.pr_embroider || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">งานซับ (pr_sub)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {displayData.sub_work || displayData.pr_sub || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">งานอื่นๆ (pr_other_screen)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {displayData.other_screen || displayData.pr_other_screen || '-'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* Image Section */}
          {(displayData.image_url || displayData.pr_image) && (
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
                        src={displayData.image_url || displayData.pr_image}
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
                  {displayData.latest_price && displayData.quantity ? 
                    formatCurrency(displayData.latest_price / displayData.quantity) : 
                    formatCurrency(getEffectiveUnitPrice(selectedRequest))}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">ราคารวม</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {displayData.latest_price ? 
                    formatCurrency(displayData.latest_price) : 
                    formatCurrency(getEffectiveTotalPrice(selectedRequest))}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="text.secondary">จำนวนรวม</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {(displayData.quantity || displayData.pr_quantity || getQuantity(selectedRequest) || 0).toLocaleString()} ชิ้น
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
                        {displayData.no || displayData.pr_no || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">งาน:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, ml: 1 }}>
                        {displayData.work_name || displayData.pr_work_name || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">วัสดุ:</Typography>
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {[
                          (displayData.fabric_type || displayData.pr_fabric_type) && `ผ้า: ${displayData.fabric_type || displayData.pr_fabric_type}`,
                          (displayData.color || displayData.pr_color) && `สี: ${displayData.color || displayData.pr_color}`,
                          (displayData.sizes || displayData.pr_sizes) && `ไซส์: ${displayData.sizes || displayData.pr_sizes}`
                        ].filter(Boolean).join(', ') || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">จำนวน:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, ml: 1, color: 'primary.main' }}>
                        {(displayData.quantity || displayData.pr_quantity || getQuantity(selectedRequest) || 0).toLocaleString()} ชิ้น
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">ราคา:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, ml: 1, color: 'success.main' }}>
                        {displayData.latest_price ? 
                          formatCurrency(displayData.latest_price) : 
                          formatCurrency(getEffectiveTotalPrice(selectedRequest))}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">กำหนดส่ง:</Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600, 
                        ml: 1,
                        color: (displayData.due_date || displayData.pr_due_date) && new Date(displayData.due_date || displayData.pr_due_date) < new Date() 
                          ? 'error.main' 
                          : 'text.primary'
                      }}>
                        {formatDueDate(displayData.due_date || displayData.pr_due_date)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Special Work Summary */}
                {((displayData.silk_work || displayData.pr_silk) || (displayData.dft_work || displayData.pr_dft) || (displayData.embroider_work || displayData.pr_embroider) || 
                  (displayData.sub_work || displayData.pr_sub) || (displayData.other_screen || displayData.pr_other_screen)) && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">งานพิเศษ:</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {[
                        (displayData.silk_work || displayData.pr_silk) && `สกรีน: ${displayData.silk_work || displayData.pr_silk}`,
                        (displayData.dft_work || displayData.pr_dft) && `DTF: ${displayData.dft_work || displayData.pr_dft}`,
                        (displayData.embroider_work || displayData.pr_embroider) && `ปัก: ${displayData.embroider_work || displayData.pr_embroider}`,
                        (displayData.sub_work || displayData.pr_sub) && `ซับ: ${displayData.sub_work || displayData.pr_sub}`,
                        (displayData.other_screen || displayData.pr_other_screen) && `อื่นๆ: ${displayData.other_screen || displayData.pr_other_screen}`
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
                      Request ID: {displayData.id || displayData.pr_id || selectedRequest.id || selectedRequest.pr_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Pattern: {displayData.pattern || displayData.pr_pattern || 'ไม่ระบุ'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          </Grid>
        )}
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
