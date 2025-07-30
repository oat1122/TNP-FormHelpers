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
  useMediaQuery
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
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { receiptService, customerService } from '../../../features/Accounting';

// Status configuration
const STATUS_CONFIG = {
  draft: { label: 'ร่าง', color: 'default', bgColor: '#f5f5f5' },
  pending_review: { label: 'รอตรวจ', color: 'warning', bgColor: '#fff3e0' },
  approved: { label: 'อนุมัติแล้ว', color: 'success', bgColor: '#e8f5e8' },
  rejected: { label: 'ปฏิเสธ', color: 'error', bgColor: '#ffebee' },
  completed: { label: 'เสร็จสิ้น', color: 'info', bgColor: '#e3f2fd' }
};

// Mock data
const mockReceipts = [
  {
    id: 'rec-001',
    receipt_number: 'REC202501-0001',
    customer: { id: 'cus-001', name: 'บริษัท เทคโนโลยี จำกัด', company_name: 'เทคโนโลยี จำกัด' },
    total_amount: 125000,
    vat_amount: 8750,
    net_amount: 116250,
    status: 'approved',
    invoice_id: 'inv-001',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z'
  },
  {
    id: 'rec-002',
    receipt_number: 'REC202501-0002',
    customer: { id: 'cus-002', name: 'บริษัท ดิจิตอล จำกัด', company_name: 'ดิจิตอล จำกัด' },
    total_amount: 85000,
    vat_amount: 5950,
    net_amount: 79050,
    status: 'completed',
    invoice_id: 'inv-002',
    created_at: '2025-01-16T14:15:00Z',
    updated_at: '2025-01-16T14:15:00Z'
  },
  {
    id: 'rec-003',
    receipt_number: 'REC202501-0003',
    customer: { id: 'cus-003', name: 'บริษัท อินโนเวชั่น จำกัด', company_name: 'อินโนเวชั่น จำกัด' },
    total_amount: 95000,
    vat_amount: 6650,
    net_amount: 88350,
    status: 'pending_review',
    invoice_id: 'inv-003',
    created_at: '2025-01-17T09:45:00Z',
    updated_at: '2025-01-17T09:45:00Z'
  }
];

// Receipt card component
const ReceiptCard = ({ receipt, onAction }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const statusConfig = STATUS_CONFIG[receipt.status];
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    onAction(action, receipt);
    handleMenuClose();
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
              {receipt.receipt_number}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {receipt.customer.company_name || receipt.customer.name}
            </Typography>
            {receipt.invoice_id && (
              <Typography variant="body2" color="primary.main">
                อ้างอิง: {receipt.invoice_id}
              </Typography>
            )}
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
              ฿{receipt.total_amount.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">ภาษีมูลค่าเพิ่ม</Typography>
            <Typography variant="body1" color="warning.main" fontWeight="medium">
              ฿{receipt.vat_amount.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">ยอดสุทธิ</Typography>
            <Typography variant="body1" color="success.main" fontWeight="medium">
              ฿{receipt.net_amount.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">สร้างเมื่อ</Typography>
            <Typography variant="body1">
              {dayjs(receipt.created_at).format('DD/MM/YYYY HH:mm')}
            </Typography>
          </Grid>
        </Grid>

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
            {receipt.status === 'approved' && (
              <Button
                size="small"
                startIcon={<PdfIcon />}
                onClick={() => handleAction('download')}
                color="secondary"
              >
                ดาวน์โหลด PDF
              </Button>
            )}
            {receipt.status === 'completed' && (
              <Button
                size="small"
                startIcon={<ReceiptIcon />}
                onClick={() => handleAction('create_delivery')}
                color="info"
              >
                สร้างใบส่งของ
              </Button>
            )}
            {receipt.status === 'pending_review' && (
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
        <MenuItem onClick={() => handleAction('history')}>
          <HistoryIcon sx={{ mr: 1 }} />
          ประวัติการแก้ไข
        </MenuItem>
        <MenuItem onClick={() => handleAction('download')} disabled={receipt.status !== 'approved'}>
          <PdfIcon sx={{ mr: 1 }} />
          ดาวน์โหลด PDF
        </MenuItem>
        <MenuItem onClick={() => handleAction('email')} disabled={receipt.status !== 'approved'}>
          <EmailIcon sx={{ mr: 1 }} />
          ส่งอีเมล
        </MenuItem>
        <MenuItem onClick={() => handleAction('create_delivery')} disabled={receipt.status !== 'completed'}>
          <ReceiptIcon sx={{ mr: 1 }} />
          สร้างใบส่งของ
        </MenuItem>
        <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          ลบ
        </MenuItem>
      </Menu>
    </Card>
  );
};

const ReceiptListPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [receipts, setReceipts] = useState(mockReceipts);
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
    dateTo: null
  });
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);

  // Load receipts data
  const loadReceipts = async () => {
    setLoading(true);
    setError(null);
    try {
      // const response = await receiptService.fetchReceipts({
      //   page,
      //   per_page: 10,
      //   ...filters
      // });
      // setReceipts(response.data.data);
      // setTotalPages(response.data.last_page);
      
      // For now, use mock data with filtering
      let filteredData = mockReceipts;
      
      if (filters.status !== 'all') {
        filteredData = filteredData.filter(r => r.status === filters.status);
      }
      
      if (filters.search) {
        filteredData = filteredData.filter(r => 
          r.receipt_number.toLowerCase().includes(filters.search.toLowerCase()) ||
          r.customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          r.customer.company_name?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      setTimeout(() => {
        setReceipts(filteredData);
        setLoading(false);
      }, 800);
      
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, [page, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  // Handle receipt actions
  const handleReceiptAction = async (action, receipt) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/accounting/receipts/${receipt.id}`);
          break;
        case 'edit':
          navigate(`/accounting/receipts/${receipt.id}/edit`);
          break;
        case 'approve':
          await receiptService.changeReceiptStatus(receipt.id, 'approved', 'อนุมัติโดยระบบ');
          loadReceipts();
          break;
        case 'reject':
          await receiptService.changeReceiptStatus(receipt.id, 'rejected', 'ปฏิเสธโดยระบบ');
          loadReceipts();
          break;
        case 'create_delivery':
          navigate(`/accounting/delivery-notes/new?receipt_id=${receipt.id}`);
          break;
        case 'download':
          const pdfBlob = await receiptService.downloadReceiptPDF(receipt.id);
          const url = window.URL.createObjectURL(pdfBlob.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${receipt.receipt_number}.pdf`;
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
    navigate('/accounting/receipts/new');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            ใบเสร็จ/ใบกำกับภาษี
          </Typography>
          <Box display="flex" gap={2}>
            <IconButton onClick={loadReceipts} color="primary">
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{ borderRadius: 2 }}
            >
              สร้างใบเสร็จ/ใบกำกับภาษี
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

        {/* Receipts List */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : receipts.length > 0 ? (
          <>
            {receipts.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                onAction={handleReceiptAction}
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
                ไม่พบใบเสร็จ/ใบกำกับภาษี
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {filters.search || filters.status !== 'all' 
                  ? 'ลองเปลี่ยนเงื่อนไขการค้นหา หรือล้างตัวกรอง' 
                  : 'เริ่มต้นสร้างใบเสร็จ/ใบกำกับภาษีแรกของคุณ'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                สร้างใบเสร็จ/ใบกำกับภาษี
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

export default ReceiptListPage; 