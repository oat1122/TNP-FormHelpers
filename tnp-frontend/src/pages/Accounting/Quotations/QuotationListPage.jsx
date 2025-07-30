import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  CircularProgress,
  Alert,
  Stack,
  Grid,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  useTheme,
  useMediaQuery,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { quotationService, customerService } from '../../../features/Accounting';

// Status configuration ตาม doce.md
const STATUS_CONFIG = {
  draft: { label: 'ร่าง', color: 'default', bgColor: '#f5f5f5' },
  pending_review: { label: 'รอตรวจ', color: 'warning', bgColor: '#fff3e0' },
  approved: { label: 'อนุมัติแล้ว', color: 'success', bgColor: '#e8f5e8' },
  rejected: { label: 'ปฏิเสธ', color: 'error', bgColor: '#ffebee' },
  completed: { label: 'เสร็จสิ้น', color: 'info', bgColor: '#e3f2fd' }
};

// Mock data - จะต้องเปลี่ยนเป็นข้อมูลจริงจาก API
const mockQuotations = [
  {
    id: 'qt-001',
    quotation_number: 'QT202501-0001',
    customer: { id: 'cus-001', name: 'บริษัท เทคโนโลยี จำกัด', company_name: 'เทคโนโลยี จำกัด' },
    total_amount: 125000,
    status: 'pending_review',
    valid_until: '2025-02-15',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z'
  },
  {
    id: 'qt-002',
    quotation_number: 'QT202501-0002',
    customer: { id: 'cus-002', name: 'บริษัท ดิจิตอล จำกัด', company_name: 'ดิจิตอล จำกัด' },
    total_amount: 85000,
    status: 'approved',
    valid_until: '2025-02-20',
    created_at: '2025-01-16T14:15:00Z',
    updated_at: '2025-01-16T14:15:00Z'
  },
  {
    id: 'qt-003',
    quotation_number: 'QT202501-0003',
    customer: { id: 'cus-003', name: 'บริษัท อินโนเวชั่น จำกัด', company_name: 'อินโนเวชั่น จำกัด' },
    total_amount: 95000,
    status: 'draft',
    valid_until: '2025-02-25',
    created_at: '2025-01-17T09:45:00Z',
    updated_at: '2025-01-17T09:45:00Z'
  }
];

// Quotation card component
const QuotationCard = ({ quotation, onAction }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const statusConfig = STATUS_CONFIG[quotation.status];
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    onAction(action, quotation);
    handleMenuClose();
  };

  const isExpiringSoon = () => {
    const validUntil = dayjs(quotation.valid_until);
    const today = dayjs();
    const daysLeft = validUntil.diff(today, 'day');
    return daysLeft <= 7 && daysLeft >= 0;
  };

  const isExpired = () => {
    const validUntil = dayjs(quotation.valid_until);
    const today = dayjs();
    return validUntil.isBefore(today);
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        '&:hover': { 
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        },
        borderLeft: `4px solid ${statusConfig.bgColor}`
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
              {quotation.quotation_number}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {quotation.customer.company_name || quotation.customer.name}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label={statusConfig.label}
              color={statusConfig.color}
              size="small"
            />
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">ยอดรวม</Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              ฿{quotation.total_amount.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">ใช้ได้ถึง</Typography>
            <Typography 
              variant="body1"
              color={isExpired() ? 'error.main' : isExpiringSoon() ? 'warning.main' : 'text.primary'}
              fontWeight={isExpired() || isExpiringSoon() ? 'bold' : 'normal'}
            >
              {dayjs(quotation.valid_until).format('DD/MM/YYYY')}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">สร้างเมื่อ</Typography>
            <Typography variant="body1">
              {dayjs(quotation.created_at).format('DD/MM/YYYY HH:mm')}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">อัปเดต</Typography>
            <Typography variant="body1">
              {dayjs(quotation.updated_at).format('DD/MM/YYYY HH:mm')}
            </Typography>
          </Grid>
        </Grid>

        {/* Warning for expiring quotations */}
        {isExpiringSoon() && !isExpired() && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            ใบเสนอราคานี้จะหมดอายุในอีก {dayjs(quotation.valid_until).diff(dayjs(), 'day')} วัน
          </Alert>
        )}
        
        {isExpired() && (
          <Alert severity="error" sx={{ mt: 1 }}>
            ใบเสนอราคานี้หมดอายุแล้ว
          </Alert>
        )}

        {/* Quick action buttons */}
        <Box mt={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => handleAction('view')}
            >
              ดูรายละเอียด
            </Button>
            {quotation.status === 'approved' && (
              <Button
                size="small"
                startIcon={<PdfIcon />}
                onClick={() => handleAction('download')}
                color="secondary"
              >
                ดาวน์โหลด PDF
              </Button>
            )}
            {quotation.status === 'pending_review' && (
              <>
                <Button
                  size="small"
                  startIcon={<ApproveIcon />}
                  onClick={() => handleAction('approve')}
                  color="success"
                >
                  อนุมัติ
                </Button>
                <Button
                  size="small"
                  startIcon={<RejectIcon />}
                  onClick={() => handleAction('reject')}
                  color="error"
                >
                  ปฏิเสธ
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </CardContent>

      {/* Action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ViewIcon sx={{ mr: 1 }} />
          ดูรายละเอียด
        </MenuItem>
        <MenuItem onClick={() => handleAction('edit')}>
          <EditIcon sx={{ mr: 1 }} />
          แก้ไข
        </MenuItem>
        <MenuItem onClick={() => handleAction('duplicate')}>
          <AddIcon sx={{ mr: 1 }} />
          คัดลอก
        </MenuItem>
        <MenuItem onClick={() => handleAction('history')}>
          <HistoryIcon sx={{ mr: 1 }} />
          ประวัติการแก้ไข
        </MenuItem>
        <MenuItem onClick={() => handleAction('download')} disabled={quotation.status !== 'approved'}>
          <PdfIcon sx={{ mr: 1 }} />
          ดาวน์โหลด PDF
        </MenuItem>
        <MenuItem onClick={() => handleAction('email')} disabled={quotation.status !== 'approved'}>
          <EmailIcon sx={{ mr: 1 }} />
          ส่งอีเมล
        </MenuItem>
        <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          ลบ
        </MenuItem>
      </Menu>
    </Card>
  );
};

const QuotationListPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [quotations, setQuotations] = useState(mockQuotations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: new URLSearchParams(location.search).get('status') || 'all',
    customer: null,
    dateFrom: null,
    dateTo: null
  });
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);

  // Load quotations data
  const loadQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      // สร้าง params สำหรับ API
      const params = {
        page,
        per_page: 10,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.customer && { customer_id: filters.customer.id }),
        ...(filters.dateFrom && { date_from: filters.dateFrom.format('YYYY-MM-DD') }),
        ...(filters.dateTo && { date_to: filters.dateTo.format('YYYY-MM-DD') })
      };

      const response = await quotationService.fetchQuotations(params);
      
      // ตรวจสอบ response structure
      if (response.data && response.data.data) {
        setQuotations(response.data.data);
        setTotalPages(response.data.last_page || 1);
      } else {
        // Fallback to mock data if API response is not in expected format
        console.warn('API response format unexpected, using mock data');
        let filteredData = mockQuotations;
        
        if (filters.status !== 'all') {
          filteredData = filteredData.filter(q => q.status === filters.status);
        }
        
        if (filters.search) {
          filteredData = filteredData.filter(q => 
            q.quotation_number.toLowerCase().includes(filters.search.toLowerCase()) ||
            q.customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            q.customer.company_name?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }
        
        setQuotations(filteredData);
        setTotalPages(1);
      }
      
    } catch (err) {
      console.error('Error loading quotations:', err);
      
      // ถ้า API error ให้ใช้ mock data และแสดง warning
      if (err.response) {
        // API returned error response
        setError(`เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: ${err.response.status} ${err.response.statusText}`);
      } else if (err.request) {
        // Network error
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } else {
        // Other error
        setError(`เกิดข้อผิดพลาด: ${err.message}`);
      }
      
      // Use mock data as fallback
      let filteredData = mockQuotations;
      
      if (filters.status !== 'all') {
        filteredData = filteredData.filter(q => q.status === filters.status);
      }
      
      if (filters.search) {
        filteredData = filteredData.filter(q => 
          q.quotation_number.toLowerCase().includes(filters.search.toLowerCase()) ||
          q.customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          q.customer.company_name?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      setQuotations(filteredData);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [page, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  // Handle quotation actions
  const handleQuotationAction = async (action, quotation) => {
    try {
      setLoading(true);
      
      switch (action) {
        case 'view':
          navigate(`/accounting/quotations/${quotation.id}`);
          break;
          
        case 'edit':
          navigate(`/accounting/quotations/${quotation.id}/edit`);
          break;
          
        case 'approve':
          try {
            await quotationService.changeQuotationStatus(quotation.id, 'approved', 'อนุมัติโดยระบบ');
            setError(null);
            setSuccessMessage('อนุมัติใบเสนอราคาเรียบร้อยแล้ว');
            await loadQuotations(); // Reload data
          } catch (apiError) {
            console.error('Error approving quotation:', apiError);
            setError('ไม่สามารถอนุมัติใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง');
          }
          break;
          
        case 'reject':
          try {
            await quotationService.changeQuotationStatus(quotation.id, 'rejected', 'ปฏิเสธโดยระบบ');
            setError(null);
            setSuccessMessage('ปฏิเสธใบเสนอราคาเรียบร้อยแล้ว');
            await loadQuotations(); // Reload data
          } catch (apiError) {
            console.error('Error rejecting quotation:', apiError);
            setError('ไม่สามารถปฏิเสธใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง');
          }
          break;
          
        case 'download':
          try {
            const pdfBlob = await quotationService.downloadQuotationPDF(quotation.id);
            const url = window.URL.createObjectURL(pdfBlob.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${quotation.quotation_number}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setSuccessMessage('ดาวน์โหลด PDF เรียบร้อยแล้ว');
          } catch (apiError) {
            console.error('Error downloading PDF:', apiError);
            setError('ไม่สามารถดาวน์โหลด PDF ได้ กรุณาลองใหม่อีกครั้ง');
          }
          break;
          
        case 'delete':
          if (window.confirm('คุณต้องการลบใบเสนอราคานี้หรือไม่?')) {
            try {
              await quotationService.deleteQuotation(quotation.id);
              setError(null);
              setSuccessMessage('ลบใบเสนอราคาเรียบร้อยแล้ว');
              await loadQuotations(); // Reload data
            } catch (apiError) {
              console.error('Error deleting quotation:', apiError);
              setError('ไม่สามารถลบใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง');
            }
          }
          break;
          
        case 'history':
          try {
            const historyResponse = await quotationService.getQuotationHistory(quotation.id);
            console.log('Quotation history:', historyResponse.data);
            // TODO: Implement history modal/page
            setError('ฟีเจอร์ประวัติการแก้ไขยังไม่พร้อมใช้งาน');
          } catch (apiError) {
            console.error('Error getting quotation history:', apiError);
            setError('ไม่สามารถโหลดประวัติการแก้ไขได้');
          }
          break;
          
        case 'duplicate':
          // TODO: Implement duplication logic
          setError('ฟีเจอร์คัดลอกใบเสนอราคายังไม่พร้อมใช้งาน');
          break;
          
        case 'email':
          // TODO: Implement email functionality
          setError('ฟีเจอร์ส่งอีเมลยังไม่พร้อมใช้งาน');
          break;
          
        default:
          console.log(`Action ${action} not implemented yet`);
          setError(`การดำเนินการ ${action} ยังไม่พร้อมใช้งาน`);
      }
    } catch (err) {
      console.error('Error in handleQuotationAction:', err);
      setError(`เกิดข้อผิดพลาดในการดำเนินการ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/accounting/quotations/new');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            ใบเสนอราคา
          </Typography>
          <Box display="flex" gap={2}>
            <IconButton onClick={loadQuotations} color="primary">
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{ borderRadius: 2 }}
            >
              สร้างใบเสนอราคา
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Search and Filter Bar */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                fullWidth
                placeholder="ค้นหาเลขที่เอกสาร หรือชื่อลูกค้า..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: { md: 400 } }}
              />
              
              <Button
                variant={showFilters ? "contained" : "outlined"}
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ minWidth: 120 }}
              >
                ตัวกรอง
              </Button>
            </Stack>

            {/* Advanced Filters */}
            {showFilters && (
              <Box mt={3} pt={3} borderTop={1} borderColor="divider">
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Autocomplete
                      options={[]} // จะต้องโหลดข้อมูลลูกค้าจาก API
                      value={filters.customer}
                      onChange={(event, newValue) => handleFilterChange('customer', newValue)}
                      renderInput={(params) => (
                        <TextField {...params} label="เลือกลูกค้า" fullWidth />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="วันที่เริ่มต้น"
                      value={filters.dateFrom}
                      onChange={(newValue) => handleFilterChange('dateFrom', newValue)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="วันที่สิ้นสุด"
                      value={filters.dateTo}
                      onChange={(newValue) => handleFilterChange('dateTo', newValue)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setFilters({
                        search: '',
                        status: 'all',
                        customer: null,
                        dateFrom: null,
                        dateTo: null
                      })}
                    >
                      ล้างตัวกรอง
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Quotations List */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : quotations.length > 0 ? (
          <>
            {quotations.map((quotation) => (
              <QuotationCard
                key={quotation.id}
                quotation={quotation}
                onAction={handleQuotationAction}
              />
            ))}
            
            {/* Pagination */}
            <Box display="flex" justifyContent="center" mt={4}>
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
                ไม่พบใบเสนอราคา
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {filters.search || filters.status !== 'all' 
                  ? 'ลองเปลี่ยนเงื่อนไขการค้นหา หรือล้างตัวกรอง' 
                  : 'เริ่มต้นสร้างใบเสนอราคาแรกของคุณ'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                สร้างใบเสนอราคา
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            onClick={handleCreateNew}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSuccessMessage(null)} 
            severity="success" 
            sx={{ width: '100%' }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default QuotationListPage; 