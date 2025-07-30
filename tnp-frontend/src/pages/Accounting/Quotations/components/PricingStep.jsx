import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  Avatar,
  Pagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { pricingIntegrationService } from '../../../../features/Accounting';

const PricingStep = ({ data, onChange, loading: parentLoading }) => {
  const [pricingRequests, setPricingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(data.pricingRequest);
  const [previewDialog, setPreviewDialog] = useState({ open: false, request: null });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    customer_id: '',
    date_from: null,
    date_to: null
  });

  useEffect(() => {
    loadPricingRequests();
  }, [page, filters]);

  useEffect(() => {
    setSelectedRequest(data.pricingRequest);
  }, [data.pricingRequest]);

  const loadPricingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        per_page: 6,
        ...(filters.search && { search: filters.search }),
        ...(filters.customer_id && { customer_id: filters.customer_id }),
        ...(filters.date_from && { date_from: filters.date_from.format('YYYY-MM-DD') }),
        ...(filters.date_to && { date_to: filters.date_to.format('YYYY-MM-DD') })
      };

      const response = await pricingIntegrationService.getCompletedPricingRequests(params);
      
      if (response.data && response.data.data) {
        setPricingRequests(response.data.data.data || []);
        setTotalPages(response.data.data.last_page || 1);
      }
    } catch (err) {
      console.error('Error loading pricing requests:', err);
      setError('ไม่สามารถโหลดรายการการขอราคาได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRequest = async (request) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get detailed information about the pricing request
      const response = await pricingIntegrationService.getPricingRequestDetails(request.pr_id);
      
      if (response.data && response.data.data) {
        const pricingDetails = response.data.data;
        
        setSelectedRequest(request);
        
        // Notify parent component
        onChange({
          pricingRequest: request,
          pricingDetails: pricingDetails
        });
      }
    } catch (err) {
      console.error('Error getting pricing request details:', err);
      setError('ไม่สามารถโหลดรายละเอียดการขอราคาได้');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewRequest = async (request) => {
    try {
      setLoading(true);
      const response = await pricingIntegrationService.getPricingRequestSummary(request.pr_id);
      
      if (response.data && response.data.data) {
        setPreviewDialog({
          open: true,
          request: { ...request, details: response.data.data }
        });
      }
    } catch (err) {
      console.error('Error loading request preview:', err);
      setError('ไม่สามารถโหลดรายละเอียดการขอราคาได้');
    } finally {
      setLoading(false);
    }
  };

  const PricingRequestCard = ({ request, isSelected }) => (
    <Card 
      sx={{ 
        mb: 2,
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        '&:hover': { 
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
              {request.pr_no}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {request.pr_work_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ลูกค้า: {request.pricing_customer?.cus_company || request.pricing_customer?.cus_name || 'ไม่ระบุ'}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label="พร้อมสร้างใบเสนอราคา"
              color="success"
              size="small"
            />
            {isSelected && (
              <Chip 
                label="เลือกแล้ว"
                color="primary"
                size="small"
                icon={<CheckCircleIcon />}
              />
            )}
          </Box>
        </Box>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">วันที่สร้าง</Typography>
            <Typography variant="body1">
              {dayjs(request.pr_created_date).format('DD/MM/YYYY')}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">อัปเดตล่าสุด</Typography>
            <Typography variant="body1">
              {dayjs(request.pr_updated_date).format('DD/MM/YYYY')}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">สถานะ</Typography>
            <Typography variant="body1" color="success.main" fontWeight="bold">
              {request.pricing_status?.ms_name || 'เสร็จสิ้น'}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">ราคาล่าสุด</Typography>
            <Typography variant="body1" color="primary.main" fontWeight="bold">
              {request.latest_price ? `฿${request.latest_price.toLocaleString()}` : 'ยังไม่ได้ระบุ'}
            </Typography>
          </Grid>
        </Grid>

        <Box display="flex" gap={1} mt={2}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => handlePreviewRequest(request)}
            variant="outlined"
          >
            ดูรายละเอียด
          </Button>
          <Button
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleSelectRequest(request)}
            variant={isSelected ? "contained" : "outlined"}
            color="primary"
            disabled={loading}
          >
            {isSelected ? 'เลือกแล้ว' : 'เลือก'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const PreviewDialog = () => (
    <Dialog 
      open={previewDialog.open} 
      onClose={() => setPreviewDialog({ open: false, request: null })}
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        รายละเอียดการขอราคา: {previewDialog.request?.pr_no}
      </DialogTitle>
      <DialogContent>
        {previewDialog.request?.details && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  ข้อมูลลูกค้า
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="ชื่อบริษัท" 
                      secondary={previewDialog.request?.details.customer?.company_name || 'ไม่ระบุ'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="ชื่อผู้ติดต่อ" 
                      secondary={previewDialog.request?.details.customer?.name || 'ไม่ระบุ'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="อีเมล" 
                      secondary={previewDialog.request?.details.customer?.email || 'ไม่ระบุ'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  ข้อมูลงาน
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="ชื่องาน" 
                      secondary={previewDialog.request?.pr_work_name} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="จำนวน" 
                      secondary={`${previewDialog.request?.details.quantity || 0} ชิ้น`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="ราคาที่เสนอ" 
                      secondary={previewDialog.request?.details.suggested_price ? `฿${previewDialog.request.details.suggested_price.toLocaleString()}` : 'ยังไม่ได้ระบุ'} 
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
            
            {previewDialog.request?.details.notes && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  หมายเหตุ
                </Typography>
                <Typography variant="body2">
                  {previewDialog.request.details.notes}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPreviewDialog({ open: false, request: null })}>
          ปิด
        </Button>
        <Button 
          onClick={() => {
            handleSelectRequest(previewDialog.request);
            setPreviewDialog({ open: false, request: null });
          }}
          variant="contained"
        >
          เลือกรายการนี้
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Typography variant="h5" gutterBottom>
          เลือกหลักฐานการขอราคาจากระบบ Pricing
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          เลือกรายการขอราคาที่เสร็จสิ้นแล้วเพื่อสร้างใบเสนอราคา ระบบจะนำข้อมูลมาเติมอัตโนมัติ
        </Typography>

        {/* Search and Filter */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder="ค้นหาเลขที่งาน หรือชื่องาน..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, search: e.target.value }));
                    setPage(1);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="วันที่เริ่มต้น"
                  value={filters.date_from}
                  onChange={(newValue) => {
                    setFilters(prev => ({ ...prev, date_from: newValue }));
                    setPage(1);
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="วันที่สิ้นสุด"
                  value={filters.date_to}
                  onChange={(newValue) => {
                    setFilters(prev => ({ ...prev, date_to: newValue }));
                    setPage(1);
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setFilters({
                      search: '',
                      customer_id: '',
                      date_from: null,
                      date_to: null
                    });
                    setPage(1);
                  }}
                >
                  ล้างตัวกรอง
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Selected Request Info */}
        {selectedRequest && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              เลือกแล้ว: {selectedRequest.pr_no}
            </Typography>
            <Typography variant="body2">
              {selectedRequest.pr_work_name} - {selectedRequest.pricing_customer?.cus_company || selectedRequest.pricing_customer?.cus_name}
            </Typography>
          </Alert>
        )}

        {/* Pricing Requests List */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : pricingRequests.length > 0 ? (
          <>
            {pricingRequests.map((request) => (
              <PricingRequestCard
                key={request.pr_id}
                request={request}
                isSelected={selectedRequest?.pr_id === request.pr_id}
              />
            ))}
            
            {/* Pagination */}
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          </>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                ไม่พบรายการขอราคา
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                ไม่มีรายการขอราคาที่เสร็จสิ้นแล้วและพร้อมสร้างใบเสนอราคา
              </Typography>
              <Button variant="outlined" onClick={loadPricingRequests}>
                รีเฟรช
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Preview Dialog */}
        <PreviewDialog />
      </Box>
    </LocalizationProvider>
  );
};

export default PricingStep; 