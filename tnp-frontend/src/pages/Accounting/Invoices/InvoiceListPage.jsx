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
  Payment as PaymentIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { invoiceService, customerService } from '../../../features/Accounting';

// Status configuration
const STATUS_CONFIG = {
  draft: { label: 'ร่าง', color: 'default', bgColor: '#f5f5f5' },
  pending_review: { label: 'รอตรวจ', color: 'warning', bgColor: '#fff3e0' },
  approved: { label: 'อนุมัติแล้ว', color: 'success', bgColor: '#e8f5e8' },
  rejected: { label: 'ปฏิเสธ', color: 'error', bgColor: '#ffebee' },
  completed: { label: 'เสร็จสิ้น', color: 'info', bgColor: '#e3f2fd' },
  overdue: { label: 'เกินกำหนด', color: 'error', bgColor: '#ffcdd2' }
};

// Payment status configuration
const PAYMENT_STATUS_CONFIG = {
  unpaid: { label: 'ยังไม่ชำระ', color: 'warning' },
  partially_paid: { label: 'ชำระบางส่วน', color: 'info' },
  paid: { label: 'ชำระแล้ว', color: 'success' },
  overdue: { label: 'เกินกำหนด', color: 'error' }
};

// Mock data
const mockInvoices = [
  {
    id: 'inv-001',
    invoice_number: 'INV202501-0001',
    customer: { id: 'cus-001', name: 'บริษัท เทคโนโลยี จำกัด', company_name: 'เทคโนโลยี จำกัด' },
    total_amount: 125000,
    paid_amount: 0,
    status: 'approved',
    payment_status: 'unpaid',
    due_date: '2025-02-15',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z'
  },
  {
    id: 'inv-002',
    invoice_number: 'INV202501-0002',
    customer: { id: 'cus-002', name: 'บริษัท ดิจิตอล จำกัด', company_name: 'ดิจิตอล จำกัด' },
    total_amount: 85000,
    paid_amount: 42500,
    status: 'completed',
    payment_status: 'partially_paid',
    due_date: '2025-01-20',
    created_at: '2025-01-16T14:15:00Z',
    updated_at: '2025-01-16T14:15:00Z'
  },
  {
    id: 'inv-003',
    invoice_number: 'INV202501-0003',
    customer: { id: 'cus-003', name: 'บริษัท อินโนเวชั่น จำกัด', company_name: 'อินโนเวชั่น จำกัด' },
    total_amount: 95000,
    paid_amount: 95000,
    status: 'completed',
    payment_status: 'paid',
    due_date: '2025-01-10',
    created_at: '2025-01-17T09:45:00Z',
    updated_at: '2025-01-17T09:45:00Z'
  }
];

// Invoice card component
const InvoiceCard = ({ invoice, onAction }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const statusConfig = STATUS_CONFIG[invoice.status];
  const paymentStatusConfig = PAYMENT_STATUS_CONFIG[invoice.payment_status];
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    onAction(action, invoice);
    handleMenuClose();
  };

  const isOverdue = () => {
    const dueDate = dayjs(invoice.due_date);
    const today = dayjs();
    return dueDate.isBefore(today) && invoice.payment_status !== 'paid';
  };

  const isDueSoon = () => {
    const dueDate = dayjs(invoice.due_date);
    const today = dayjs();
    const daysLeft = dueDate.diff(today, 'day');
    return daysLeft <= 7 && daysLeft >= 0 && invoice.payment_status !== 'paid';
  };

  const getOutstandingAmount = () => {
    return invoice.total_amount - (invoice.paid_amount || 0);
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
              {invoice.invoice_number}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {invoice.customer.company_name || invoice.customer.name}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Chip 
              label={statusConfig.label}
              color={statusConfig.color}
              size="small"
            />
            <Chip 
              label={paymentStatusConfig.label}
              color={paymentStatusConfig.color}
              size="small"
            />
            {isOverdue() && (
              <Chip 
                label="เกินกำหนด"
                color="error"
                size="small"
                icon={<WarningIcon />}
              />
            )}
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">ยอดรวม</Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              ฿{invoice.total_amount.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">ยอดคงเหลือ</Typography>
            <Typography 
              variant="h6" 
              color={getOutstandingAmount() > 0 ? 'warning.main' : 'success.main'}
              fontWeight="bold"
            >
              ฿{getOutstandingAmount().toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">กำหนดชำระ</Typography>
            <Typography 
              variant="body1"
              color={isOverdue() ? 'error.main' : isDueSoon() ? 'warning.main' : 'text.primary'}
              fontWeight={isOverdue() || isDueSoon() ? 'bold' : 'normal'}
            >
              {dayjs(invoice.due_date).format('DD/MM/YYYY')}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">สร้างเมื่อ</Typography>
            <Typography variant="body1">
              {dayjs(invoice.created_at).format('DD/MM/YYYY')}
            </Typography>
          </Grid>
        </Grid>

        {/* Warning for overdue invoices */}
        {isOverdue() && (
          <Alert severity="error" sx={{ mt: 1 }}>
            ใบแจ้งหนี้นี้เกินกำหนดชำระแล้ว {dayjs().diff(dayjs(invoice.due_date), 'day')} วัน
          </Alert>
        )}
        
        {isDueSoon() && !isOverdue() && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            ใบแจ้งหนี้นี้จะครบกำหนดชำระในอีก {dayjs(invoice.due_date).diff(dayjs(), 'day')} วัน
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
            {invoice.status === 'approved' && (
              <Button
                size="small"
                startIcon={<PdfIcon />}
                onClick={() => handleAction('download')}
                color="secondary"
              >
                ดาวน์โหลด PDF
              </Button>
            )}
            {invoice.payment_status !== 'paid' && (
              <Button
                size="small"
                startIcon={<PaymentIcon />}
                onClick={() => handleAction('record_payment')}
                color="success"
              >
                บันทึกการชำระ
              </Button>
            )}
            {invoice.status === 'pending_review' && (
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
        <MenuItem onClick={() => handleAction('record_payment')}>
          <PaymentIcon sx={{ mr: 1 }} />
          บันทึกการชำระเงิน
        </MenuItem>
        <MenuItem onClick={() => handleAction('history')}>
          <HistoryIcon sx={{ mr: 1 }} />
          ประวัติการแก้ไข
        </MenuItem>
        <MenuItem onClick={() => handleAction('download')} disabled={invoice.status !== 'approved'}>
          <PdfIcon sx={{ mr: 1 }} />
          ดาวน์โหลด PDF
        </MenuItem>
        <MenuItem onClick={() => handleAction('email')} disabled={invoice.status !== 'approved'}>
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

const InvoiceListPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [invoices, setInvoices] = useState(mockInvoices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: new URLSearchParams(location.search).get('status') || 'all',
    payment_status: '',
    customer: null,
    dateFrom: null,
    dateTo: null,
    overdue_only: new URLSearchParams(location.search).get('status') === 'overdue'
  });
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);

  // Load invoices data
  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      // const response = await invoiceService.fetchInvoices({
      //   page,
      //   per_page: 10,
      //   ...filters
      // });
      // setInvoices(response.data.data);
      // setTotalPages(response.data.last_page);
      
      // For now, use mock data with filtering
      let filteredData = mockInvoices;
      
      // Status filtering
      if (filters.status !== 'all') {
        if (filters.status === 'overdue') {
          filteredData = filteredData.filter(inv => {
            const dueDate = dayjs(inv.due_date);
            const today = dayjs();
            return dueDate.isBefore(today) && inv.payment_status !== 'paid';
          });
        } else {
          filteredData = filteredData.filter(inv => inv.status === filters.status);
        }
      }

      // Payment status filtering
      if (filters.payment_status) {
        filteredData = filteredData.filter(inv => inv.payment_status === filters.payment_status);
      }
      
      // Search filtering
      if (filters.search) {
        filteredData = filteredData.filter(inv => 
          inv.invoice_number.toLowerCase().includes(filters.search.toLowerCase()) ||
          inv.customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          inv.customer.company_name?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      setTimeout(() => {
        setInvoices(filteredData);
        setLoading(false);
      }, 800);
      
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [page, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  // Handle invoice actions
  const handleInvoiceAction = async (action, invoice) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/accounting/invoices/${invoice.id}`);
          break;
        case 'edit':
          navigate(`/accounting/invoices/${invoice.id}/edit`);
          break;
        case 'approve':
          await invoiceService.changeInvoiceStatus(invoice.id, 'approved', 'อนุมัติโดยระบบ');
          loadInvoices();
          break;
        case 'reject':
          await invoiceService.changeInvoiceStatus(invoice.id, 'rejected', 'ปฏิเสธโดยระบบ');
          loadInvoices();
          break;
        case 'record_payment':
          navigate(`/accounting/invoices/${invoice.id}/payment`);
          break;
        case 'download':
          const pdfBlob = await invoiceService.downloadInvoicePDF(invoice.id);
          const url = window.URL.createObjectURL(pdfBlob.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${invoice.invoice_number}.pdf`;
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
    navigate('/accounting/invoices/new');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            ใบแจ้งหนี้
          </Typography>
          <Box display="flex" gap={2}>
            <IconButton onClick={loadInvoices} color="primary">
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{ borderRadius: 2 }}
            >
              สร้างใบแจ้งหนี้
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
                    <FormControl fullWidth>
                      <InputLabel>สถานะการชำระ</InputLabel>
                      <Select
                        value={filters.payment_status}
                        label="สถานะการชำระ"
                        onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                      >
                        <MenuItem value="">ทั้งหมด</MenuItem>
                        <MenuItem value="unpaid">ยังไม่ชำระ</MenuItem>
                        <MenuItem value="partially_paid">ชำระบางส่วน</MenuItem>
                        <MenuItem value="paid">ชำระแล้ว</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
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
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setFilters({
                        search: '',
                        status: 'all',
                        payment_status: '',
                        customer: null,
                        dateFrom: null,
                        dateTo: null,
                        overdue_only: false
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

        {/* Invoices List */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : invoices.length > 0 ? (
          <>
            {invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onAction={handleInvoiceAction}
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
                ไม่พบใบแจ้งหนี้
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {filters.search || filters.status !== 'all' 
                  ? 'ลองเปลี่ยนเงื่อนไขการค้นหา หรือล้างตัวกรอง' 
                  : 'เริ่มต้นสร้างใบแจ้งหนี้แรกของคุณ'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                สร้างใบแจ้งหนี้
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

export default InvoiceListPage; 