import React, { useState, useEffect } from 'react';
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
  LinearProgress
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
  LocalShipping as DeliveryIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  CallSplit as PartialIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { deliveryNoteService, customerService } from '../../../features/Accounting';

// Status configuration
const STATUS_CONFIG = {
  draft: { label: 'ร่าง', color: 'default', bgColor: '#f5f5f5' },
  pending_review: { label: 'รอตรวจ', color: 'warning', bgColor: '#fff3e0' },
  approved: { label: 'อนุมัติแล้ว', color: 'success', bgColor: '#e8f5e8' },
  rejected: { label: 'ปฏิเสธ', color: 'error', bgColor: '#ffebee' },
  completed: { label: 'เสร็จสิ้น', color: 'info', bgColor: '#e3f2fd' },
  partial: { label: 'ส่งบางส่วน', color: 'warning', bgColor: '#fff8e1' }
};

// Mock data
const mockDeliveryNotes = [
  {
    id: 'dn-001',
    delivery_note_number: 'DN202501-0001',
    customer: { id: 'cus-001', name: 'บริษัท เทคโนโลยี จำกัด', company_name: 'เทคโนโลยี จำกัด' },
    total_quantity: 100,
    delivered_quantity: 100,
    remaining_quantity: 0,
    status: 'completed',
    delivery_date: '2025-01-20',
    receipt_id: 'rec-001',
    delivery_address: '123 ถนนสุขุมวิท เขตวัฒนา กรุงเทพมหานคร',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z'
  },
  {
    id: 'dn-002',
    delivery_note_number: 'DN202501-0002',
    customer: { id: 'cus-002', name: 'บริษัท ดิจิตอล จำกัด', company_name: 'ดิจิตอล จำกัด' },
    total_quantity: 200,
    delivered_quantity: 120,
    remaining_quantity: 80,
    status: 'partial',
    delivery_date: '2025-01-22',
    receipt_id: 'rec-002',
    delivery_address: '456 ถนนรัชดาภิเษก เขตห้วยขวาง กรุงเทพมหานคร',
    created_at: '2025-01-16T14:15:00Z',
    updated_at: '2025-01-16T14:15:00Z'
  },
  {
    id: 'dn-003',
    delivery_note_number: 'DN202501-0003',
    customer: { id: 'cus-003', name: 'บริษัท อินโนเวชั่น จำกัด', company_name: 'อินโนเวชั่น จำกัด' },
    total_quantity: 50,
    delivered_quantity: 0,
    remaining_quantity: 50,
    status: 'pending_review',
    delivery_date: '2025-01-25',
    receipt_id: 'rec-003',
    delivery_address: '789 ถนนพหลโยธิน เขตจตุจักร กรุงเทพมหานคร',
    created_at: '2025-01-17T09:45:00Z',
    updated_at: '2025-01-17T09:45:00Z'
  }
];

// Delivery Note card component
const DeliveryNoteCard = ({ deliveryNote, onAction }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const statusConfig = STATUS_CONFIG[deliveryNote.status];
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    onAction(action, deliveryNote);
    handleMenuClose();
  };

  const getDeliveryProgress = () => {
    if (deliveryNote.total_quantity === 0) return 0;
    return (deliveryNote.delivered_quantity / deliveryNote.total_quantity) * 100;
  };

  const isOverdue = () => {
    const deliveryDate = dayjs(deliveryNote.delivery_date);
    const today = dayjs();
    return deliveryDate.isBefore(today) && deliveryNote.status !== 'completed';
  };

  const isDueSoon = () => {
    const deliveryDate = dayjs(deliveryNote.delivery_date);
    const today = dayjs();
    const daysLeft = deliveryDate.diff(today, 'day');
    return daysLeft <= 3 && daysLeft >= 0 && deliveryNote.status !== 'completed';
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
        borderLeft: `4px solid ${isOverdue() ? '#f44336' : statusConfig.bgColor}`
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
              {deliveryNote.delivery_note_number}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {deliveryNote.customer.company_name || deliveryNote.customer.name}
            </Typography>
            {deliveryNote.receipt_id && (
              <Typography variant="body2" color="primary.main">
                อ้างอิง: {deliveryNote.receipt_id}
              </Typography>
            )}
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Chip 
              label={statusConfig.label}
              color={statusConfig.color}
              size="small"
            />
            {isOverdue() && (
              <Chip 
                label="เกินกำหนด"
                color="error"
                size="small"
              />
            )}
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Delivery Progress */}
        {deliveryNote.total_quantity > 0 && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                ความคืบหน้าการส่ง
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {deliveryNote.delivered_quantity}/{deliveryNote.total_quantity} ชิ้น ({getDeliveryProgress().toFixed(0)}%)
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getDeliveryProgress()} 
              sx={{ 
                height: 8, 
                borderRadius: 5,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getDeliveryProgress() === 100 ? theme.palette.success.main : theme.palette.warning.main
                }
              }}
            />
          </Box>
        )}

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">จำนวนทั้งหมด</Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {deliveryNote.total_quantity} ชิ้น
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">ส่งแล้ว</Typography>
            <Typography variant="h6" color="success.main" fontWeight="bold">
              {deliveryNote.delivered_quantity} ชิ้น
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">คงเหลือ</Typography>
            <Typography 
              variant="h6" 
              color={deliveryNote.remaining_quantity > 0 ? 'warning.main' : 'success.main'}
              fontWeight="bold"
            >
              {deliveryNote.remaining_quantity} ชิ้น
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">กำหนดส่ง</Typography>
            <Typography 
              variant="body1"
              color={isOverdue() ? 'error.main' : isDueSoon() ? 'warning.main' : 'text.primary'}
              fontWeight={isOverdue() || isDueSoon() ? 'bold' : 'normal'}
            >
              {dayjs(deliveryNote.delivery_date).format('DD/MM/YYYY')}
            </Typography>
          </Grid>
        </Grid>

        {/* Delivery Address */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ที่อยู่จัดส่ง:
          </Typography>
          <Typography variant="body2" sx={{ 
            backgroundColor: theme.palette.grey[50], 
            p: 1, 
            borderRadius: 1,
            border: `1px solid ${theme.palette.grey[200]}`
          }}>
            {deliveryNote.delivery_address}
          </Typography>
        </Box>

        {/* Warning for overdue deliveries */}
        {isOverdue() && (
          <Alert severity="error" sx={{ mt: 1 }}>
            การส่งของนี้เกินกำหนดแล้ว {dayjs().diff(dayjs(deliveryNote.delivery_date), 'day')} วัน
          </Alert>
        )}
        
        {isDueSoon() && !isOverdue() && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            การส่งของนี้จะครบกำหนดในอีก {dayjs(deliveryNote.delivery_date).diff(dayjs(), 'day')} วัน
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
            {deliveryNote.status === 'approved' && (
              <Button
                size="small"
                startIcon={<PdfIcon />}
                onClick={() => handleAction('download')}
                color="secondary"
              >
                ดาวน์โหลด PDF
              </Button>
            )}
            {deliveryNote.remaining_quantity > 0 && deliveryNote.status === 'approved' && (
              <Button
                size="small"
                startIcon={<PartialIcon />}
                onClick={() => handleAction('partial_delivery')}
                color="warning"
              >
                ส่งบางส่วน
              </Button>
            )}
            {deliveryNote.status === 'pending_review' && (
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
        <MenuItem onClick={() => handleAction('partial_delivery')} disabled={deliveryNote.remaining_quantity === 0}>
          <PartialIcon sx={{ mr: 1 }} />
          ส่งบางส่วน
        </MenuItem>
        <MenuItem onClick={() => handleAction('history')}>
          <HistoryIcon sx={{ mr: 1 }} />
          ประวัติการแก้ไข
        </MenuItem>
        <MenuItem onClick={() => handleAction('download')} disabled={deliveryNote.status !== 'approved'}>
          <PdfIcon sx={{ mr: 1 }} />
          ดาวน์โหลด PDF
        </MenuItem>
        <MenuItem onClick={() => handleAction('email')} disabled={deliveryNote.status !== 'approved'}>
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

const DeliveryNoteListPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [deliveryNotes, setDeliveryNotes] = useState(mockDeliveryNotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: new URLSearchParams(location.search).get('status') || 'all',
    customer: null,
    dateFrom: null,
    dateTo: null,
    pending_only: new URLSearchParams(location.search).get('status') === 'pending'
  });
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);

  // Load delivery notes data
  const loadDeliveryNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      // const response = await deliveryNoteService.fetchDeliveryNotes({
      //   page,
      //   per_page: 10,
      //   ...filters
      // });
      // setDeliveryNotes(response.data.data);
      // setTotalPages(response.data.last_page);
      
      // For now, use mock data with filtering
      let filteredData = mockDeliveryNotes;
      
      if (filters.status !== 'all') {
        if (filters.status === 'pending') {
          filteredData = filteredData.filter(dn => 
            dn.status === 'pending_review' || dn.remaining_quantity > 0
          );
        } else {
          filteredData = filteredData.filter(dn => dn.status === filters.status);
        }
      }
      
      if (filters.search) {
        filteredData = filteredData.filter(dn => 
          dn.delivery_note_number.toLowerCase().includes(filters.search.toLowerCase()) ||
          dn.customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          dn.customer.company_name?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      setTimeout(() => {
        setDeliveryNotes(filteredData);
        setLoading(false);
      }, 800);
      
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryNotes();
  }, [page, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  // Handle delivery note actions
  const handleDeliveryNoteAction = async (action, deliveryNote) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/accounting/delivery-notes/${deliveryNote.id}`);
          break;
        case 'edit':
          navigate(`/accounting/delivery-notes/${deliveryNote.id}/edit`);
          break;
        case 'approve':
          await deliveryNoteService.changeDeliveryNoteStatus(deliveryNote.id, 'approved', 'อนุมัติโดยระบบ');
          loadDeliveryNotes();
          break;
        case 'reject':
          await deliveryNoteService.changeDeliveryNoteStatus(deliveryNote.id, 'rejected', 'ปฏิเสธโดยระบบ');
          loadDeliveryNotes();
          break;
        case 'partial_delivery':
          navigate(`/accounting/delivery-notes/${deliveryNote.id}/partial`);
          break;
        case 'download':
          const pdfBlob = await deliveryNoteService.downloadDeliveryNotePDF(deliveryNote.id);
          const url = window.URL.createObjectURL(pdfBlob.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${deliveryNote.delivery_note_number}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          break;
        default:
          console.log(`Action ${action} not implemented yet`);
      }
    } catch (err) {
      setError(`ไม่สามารถดำเนินการได้: ${err.message}`);
    }
  };

  const handleCreateNew = () => {
    navigate('/accounting/delivery-notes/new');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            ใบส่งของ
          </Typography>
          <Box display="flex" gap={2}>
            <IconButton onClick={loadDeliveryNotes} color="primary">
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{ borderRadius: 2 }}
            >
              สร้างใบส่งของ
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
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
                        dateTo: null,
                        pending_only: false
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

        {/* Delivery Notes List */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : deliveryNotes.length > 0 ? (
          <>
            {deliveryNotes.map((deliveryNote) => (
              <DeliveryNoteCard
                key={deliveryNote.id}
                deliveryNote={deliveryNote}
                onAction={handleDeliveryNoteAction}
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
                ไม่พบใบส่งของ
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {filters.search || filters.status !== 'all' 
                  ? 'ลองเปลี่ยนเงื่อนไขการค้นหา หรือล้างตัวกรอง' 
                  : 'เริ่มต้นสร้างใบส่งของแรกของคุณ'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                สร้างใบส่งของ
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
      </Box>
    </LocalizationProvider>
  );
};

export default DeliveryNoteListPage; 