import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    TextField,
    InputAdornment,
    Chip,
    Avatar,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Skeleton,
    Fab,
    Tooltip,
    Stack,
    Divider,
    Paper,
    Badge,
    Checkbox,
    Pagination,
    LinearProgress,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
    Visibility as ViewIcon,
    Assignment as AssignmentIcon,
    CalendarToday as CalendarIcon,
    Business as BusinessIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { th } from 'date-fns/locale';
import accountingTheme from '../theme/accountingTheme';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectFilters,
    setFilters,
    resetFilters,
    openModal,
    addNotification,
} from '../../../features/Accounting/accountingSlice';
import {
    useGetCompletedPricingRequestsQuery,
    useGetPricingRequestAutofillQuery,
    useCreateQuotationFromMultiplePricingMutation,
} from '../../../features/Accounting/accountingApi';

// Pricing Request Card Component
const PricingRequestCard = ({ request, onCreateQuotation, onViewDetails }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'complete':
            case 'ได้ราคาแล้ว': return 'success';
            case 'pending':
            case 'รอทำราคา': return 'warning';
            case 'in_progress':
            case 'กำลังทำราคา': return 'info';
            default: return 'primary';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'ไม่ระบุ';
        try {
            return new Date(dateString).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 20px rgba(144, 15, 15, 0.15)',
                },
                transition: 'all 0.3s ease-in-out',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
            }}
        >
            <CardContent sx={{ flexGrow: 1 }}>
                {/* Header with Status */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div" color="primary" fontWeight={600}>
                        {request.pr_id?.slice(-8) || 'PR-XXXX'}
                    </Typography>
                    <Chip
                        label={request.pr_status || 'Complete'}
                        color={getStatusColor(request.pr_status)}
                        size="small"
                        icon={<CheckCircleIcon />}
                    />
                </Box>

                {/* Company Info */}
                <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                        sx={{
                            bgcolor: 'secondary.main',
                            width: 40,
                            height: 40,
                            mr: 2,
                        }}
                    >
                        <BusinessIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={500}>
                            {request.customer?.cus_company || 'ไม่ระบุบริษัท'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {[
                                request.customer?.cus_firstname,
                                request.customer?.cus_lastname
                            ].filter(Boolean).join(' ') || 'ไม่ระบุชื่อ'}
                        </Typography>
                    </Box>
                </Box>

                {/* Work Details */}
                <Box mb={2}>
                    <Typography variant="body2" color="primary" fontWeight={500} gutterBottom>
                        {request.pr_work_name || 'ชื่องานไม่ระบุ'}
                    </Typography>

                    <Stack spacing={1}>
                        {request.pr_pattern && (
                            <Typography variant="caption" color="text.secondary">
                                <strong>แพทเทิร์น:</strong> {request.pr_pattern}
                            </Typography>
                        )}

                        {request.pr_fabric_type && (
                            <Typography variant="caption" color="text.secondary">
                                <strong>ผ้า:</strong> {request.pr_fabric_type}
                            </Typography>
                        )}

                        {request.pr_color && (
                            <Typography variant="caption" color="text.secondary">
                                <strong>สี:</strong> {request.pr_color}
                            </Typography>
                        )}

                        {request.pr_sizes && (
                            <Typography variant="caption" color="text.secondary">
                                <strong>ขนาด:</strong> {request.pr_sizes}
                            </Typography>
                        )}
                    </Stack>
                </Box>

                {/* Quantity and Date */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Chip
                        label={`จำนวน: ${request.pr_quantity || 0} ชิ้น`}
                        variant="outlined"
                        size="small"
                        color="primary"
                    />
                    <Box display="flex" alignItems="center">
                        <ScheduleIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                            เสร็จเมื่อ: {request.pr_due_date ? formatDate(request.pr_due_date) : 'ไม่ระบุ'}
                        </Typography>
                    </Box>
                </Box>

                {/* Special Features */}
                {(request.pr_silk || request.pr_dft || request.pr_embroider || request.pr_sub || request.pr_other_screen) && (
                    <Box mb={2}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            <strong>คุณสมบัติพิเศษ:</strong>
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {request.pr_silk && <Chip label="Silk Screen" size="small" variant="outlined" />}
                            {request.pr_dft && <Chip label="DFT" size="small" variant="outlined" />}
                            {request.pr_embroider && <Chip label="ปัก" size="small" variant="outlined" />}
                            {request.pr_sub && <Chip label="Sub" size="small" variant="outlined" />}
                            {request.pr_other_screen && <Chip label="อื่นๆ" size="small" variant="outlined" />}
                        </Stack>
                    </Box>
                )}

                {/* Completion Date */}
                <Box display="flex" alignItems="center" mt={2}>
                    <ScheduleIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                    <Typography variant="caption" color="success.main">
                        เสร็จเมื่อ: {formatDate(request.pr_completed_date || request.created_at)}
                    </Typography>
                </Box>
            </CardContent>

            <Divider />

            <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => onViewDetails(request)}
                    color="inherit"
                >
                    ดูรายละเอียด
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AssignmentIcon />}
                    onClick={() => onCreateQuotation(request)}
                    sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 6px 12px rgba(144, 15, 15, 0.25)',
                        },
                        transition: 'all 0.2s ease-in-out',
                    }}
                >
                    สร้างใบเสนอราคา
                </Button>
            </CardActions>
        </Card>
    );
};

// Create Quotation Modal Component
const CreateQuotationModal = ({ open, onClose, pricingRequest, onSubmit }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [selectedPricingItems, setSelectedPricingItems] = useState([]);
    const [customerPricingRequests, setCustomerPricingRequests] = useState([]);
    const [isLoadingCustomerData, setIsLoadingCustomerData] = useState(false);

    // ดึงข้อมูล Pricing Requests ทั้งหมดของลูกค้าเมื่อเปิด Modal
    useEffect(() => {
        if (open && pricingRequest?.customer?.cus_id) {
            fetchCustomerPricingRequests(pricingRequest.customer.cus_id);
        }
    }, [open, pricingRequest]);

    const fetchCustomerPricingRequests = async (customerId) => {
        setIsLoadingCustomerData(true);
        try {
            // เรียก API เพื่อดึงข้อมูล Pricing Requests ทั้งหมดของลูกค้า
            const response = await fetch(
                `${import.meta.env.VITE_END_POINT_URL}/pricing-requests?customer_id=${customerId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`,
                    },
                }
            );
            const data = await response.json();

            if (data.success) {
                setCustomerPricingRequests(data.data || []);
                // เลือก Pricing Request ปัจจุบันเป็นค่าเริ่มต้น
                setSelectedPricingItems([pricingRequest.pr_id]);
            }
        } catch (error) {
            console.error('Error fetching customer pricing requests:', error);
            setCustomerPricingRequests([pricingRequest]); // fallback
            setSelectedPricingItems([pricingRequest.pr_id]);
        } finally {
            setIsLoadingCustomerData(false);
        }
    };

    const handlePricingItemToggle = (prId) => {
        setSelectedPricingItems(prev =>
            prev.includes(prId)
                ? prev.filter(id => id !== prId)
                : [...prev, prId]
        );
    };

    const handleSubmit = async () => {
        if (selectedPricingItems.length === 0) {
            alert('กรุณาเลือกอย่างน้อย 1 งาน');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                pricingRequestIds: selectedPricingItems,
                customerId: pricingRequest?.customer?.cus_id,
                additional_notes: additionalNotes,
            });
            onClose();
            setAdditionalNotes('');
            setSelectedPricingItems([]);
        } catch (error) {
            console.error('Error creating quotation:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedTotal = customerPricingRequests
        .filter(item => selectedPricingItems.includes(item.pr_id))
        .reduce((sum, item) => sum + (item.pr_quantity || 0), 0);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, maxHeight: '90vh' },
            }}
        >
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">
                        สร้างใบเสนอราคาสำหรับ {pricingRequest?.customer?.cus_company}
                    </Typography>
                    <Chip
                        label={`เลือก ${selectedPricingItems.length} งาน`}
                        sx={{ bgcolor: 'primary.light', color: 'white' }}
                    />
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {pricingRequest && (
                    <Box sx={{ p: 3 }}>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            เลือกงานที่ต้องการสร้างใบเสนอราคา (สามารถเลือกได้หลายงาน)
                        </Alert>

                        {/* ข้อมูลลูกค้า */}
                        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        บริษัทลูกค้า
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                        {pricingRequest.customer?.cus_company}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        เลขประจำตัวผู้เสียภาษี
                                    </Typography>
                                    <Typography variant="body1">
                                        {pricingRequest.customer?.cus_tax_id}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        ที่อยู่
                                    </Typography>
                                    <Typography variant="body2">
                                        {pricingRequest.customer?.cus_address}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* รายการงานของลูกค้า */}
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                            เลือกงานที่ต้องการสร้างใบเสนอราคา
                            {selectedTotal > 0 && (
                                <Chip
                                    label={`รวม ${selectedTotal} ชิ้น`}
                                    color="secondary"
                                    size="small"
                                    sx={{ ml: 2 }}
                                />
                            )}
                        </Typography>

                        {isLoadingCustomerData ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Skeleton variant="text" width={300} height={40} />
                                    <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 1 }} />
                                    <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 1 }} />
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                {customerPricingRequests.map((item, index) => (
                                    <Card
                                        key={item.pr_id}
                                        sx={{
                                            mb: 2,
                                            border: selectedPricingItems.includes(item.pr_id) ? 2 : 1,
                                            borderColor: selectedPricingItems.includes(item.pr_id) ? 'primary.main' : 'grey.300',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: 'grey.50'
                                            }
                                        }}
                                        onClick={() => handlePricingItemToggle(item.pr_id)}
                                    >
                                        <CardContent sx={{ pb: 2 }}>
                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                                        {item.pr_work_name}
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={6} md={3}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                ลาย/แบบ
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {item.pr_pattern || '-'}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={6} md={3}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                วัสดุ
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {item.pr_fabric_type || '-'}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={6} md={3}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                จำนวน
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {item.pr_quantity} ชิ้น
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={6} md={3}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                กำหนดส่ง
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {item.pr_due_date ? new Date(item.pr_due_date).toLocaleDateString('th-TH') : '-'}
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                                <Box sx={{ ml: 2 }}>
                                                    <Checkbox
                                                        checked={selectedPricingItems.includes(item.pr_id)}
                                                        color="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePricingItemToggle(item.pr_id);
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="หมายเหตุเพิ่มเติม"
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            placeholder="หมายเหตุเพิ่มเติมสำหรับใบเสนอราคา..."
                            sx={{ mt: 3 }}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0, bgcolor: 'grey.50' }}>
                <Button onClick={onClose} disabled={isSubmitting} size="large">
                    ยกเลิก
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedPricingItems.length === 0}
                    startIcon={isSubmitting ? null : <AssignmentIcon />}
                    size="large"
                    sx={{ minWidth: 180 }}
                >
                    {isSubmitting ? 'กำลังสร้าง...' : `สร้างใบเสนอราคา (${selectedPricingItems.length} งาน)`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Component
const PricingIntegration = () => {
    const dispatch = useDispatch();
    const filters = useSelector(selectFilters);

    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPricingRequest, setSelectedPricingRequest] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // API Queries
    const {
        data: pricingRequests,
        isLoading,
        error,
        refetch,
        isFetching,
    } = useGetCompletedPricingRequestsQuery({
        search: searchQuery,
        date_start: dateRange.start,
        date_end: dateRange.end,
        customer_id: selectedCustomer?.id,
        page: currentPage,
        per_page: itemsPerPage,
    });

    // Debug logs
    useEffect(() => {
        console.log('🔍 PricingIntegration Debug Info:', {
            isLoading,
            isFetching,
            error,
            currentPage,
            itemsPerPage,
            pricingRequests,
            apiUrl: `${import.meta.env.VITE_END_POINT_URL}/pricing-requests`,
            responseStructure: pricingRequests ? Object.keys(pricingRequests) : 'No data',
            dataArray: pricingRequests?.data || 'No data array',
            dataLength: pricingRequests?.data?.length || 0,
            pagination: pricingRequests?.pagination || 'No pagination',
            totalPages: pricingRequests?.pagination ? Math.ceil(pricingRequests.pagination.total / itemsPerPage) : 0,
            sampleRecord: pricingRequests?.data?.[0] || 'No records'
        });
    }, [isLoading, isFetching, error, pricingRequests, currentPage, itemsPerPage]);

    const [createQuotationFromMultiplePricing] = useCreateQuotationFromMultiplePricingMutation();

    // Event Handlers
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset to first page on search
        dispatch(setFilters({ searchQuery: query }));
    }, [dispatch]);

    const handlePageChange = useCallback((event, newPage) => {
        setCurrentPage(newPage);
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page
    }, []);

    const handleRefresh = useCallback(() => {
        refetch();
        dispatch(addNotification({
            type: 'success',
            title: 'รีเฟรชข้อมูล',
            message: 'ข้อมูลถูกอัปเดตแล้ว',
        }));
    }, [refetch, dispatch]);

    const handleCreateQuotation = (pricingRequest) => {
        setSelectedPricingRequest(pricingRequest);
        setShowCreateModal(true);
    };

    const handleViewDetails = (pricingRequest) => {
        dispatch(addNotification({
            type: 'info',
            title: 'ดูรายละเอียด',
            message: `กำลังแสดงรายละเอียด ${pricingRequest.pr_number}`,
        }));
        // TODO: Implement view details modal or navigation
    };

    const handleSubmitQuotation = async (data) => {
        try {
            const result = await createQuotationFromMultiplePricing(data).unwrap();

            dispatch(addNotification({
                type: 'success',
                title: 'สร้างใบเสนอราคาสำเร็จ',
                message: `สร้างใบเสนอราคา ${result.quotation_number || 'ใหม่'} เรียบร้อยแล้ว`,
            }));

            setShowCreateModal(false);
            setSelectedPricingRequest(null);

            // Refresh data
            refetch();
        } catch (error) {
            dispatch(addNotification({
                type: 'error',
                title: 'เกิดข้อผิดพลาด',
                message: error.data?.message || error.message || 'ไม่สามารถสร้างใบเสนอราคาได้',
            }));
        }
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setDateRange({ start: null, end: null });
        setSelectedCustomer(null);
        dispatch(resetFilters());
    };

    return (
        <ThemeProvider theme={accountingTheme}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
                <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
                    {/* Header */}
                    <Box sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        py: 3,
                        background: 'linear-gradient(135deg, #900F0F 0%, #B20000 100%)',
                    }}>
                        <Container maxWidth="xl">
                            <Typography variant="h4" component="h1" gutterBottom>
                                📊 งานใหม่จากระบบ Pricing
                            </Typography>
                            <Typography variant="subtitle1">
                                เลือกงานที่เสร็จสมบูรณ์แล้วเพื่อสร้างใบเสนอราคา
                            </Typography>
                        </Container>
                    </Box>

                    <Container maxWidth="xl" sx={{ py: 4 }}>
                        {/* Filters Section */}
                        <Paper sx={{ p: 3, mb: 4 }}>
                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        placeholder="ค้นหาด้วยชื่อบริษัท, หมายเลข PR, หรือชื่องาน"
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <DatePicker
                                        label="วันที่เริ่มต้น"
                                        value={dateRange.start}
                                        onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                                        slotProps={{ textField: { fullWidth: true } }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <DatePicker
                                        label="วันที่สิ้นสุด"
                                        value={dateRange.end}
                                        onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                                        slotProps={{ textField: { fullWidth: true } }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={2}>
                                    <Stack direction="row" spacing={1}>
                                        <Tooltip title="รีเฟรชข้อมูล">
                                            <IconButton
                                                onClick={handleRefresh}
                                                color="primary"
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    '&:hover': { bgcolor: 'primary.dark' },
                                                }}
                                            >
                                                <RefreshIcon />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="ล้างตัวกรอง">
                                            <IconButton
                                                onClick={handleResetFilters}
                                                color="secondary"
                                            >
                                                <FilterIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Content */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
                            </Alert>
                        )}

                        {/* Pricing Requests Grid */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" color="primary">
                                    Pricing Request ที่พร้อมออกใบเสนอราคา
                                    {pricingRequests?.pagination && (
                                        <Badge
                                            badgeContent={pricingRequests.pagination.total}
                                            color="secondary"
                                            sx={{ ml: 2 }}
                                            max={999}
                                        />
                                    )}
                                </Typography>

                                {/* Items per page selector */}
                                {pricingRequests?.pagination && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            แสดง:
                                        </Typography>
                                        <TextField
                                            select
                                            size="small"
                                            value={itemsPerPage}
                                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                            SelectProps={{ native: true }}
                                            sx={{ minWidth: 80 }}
                                        >
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                            <option value={200}>200</option>
                                        </TextField>
                                        <Typography variant="body2" color="text.secondary">
                                            รายการ
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Pagination info */}
                            {pricingRequests?.pagination && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        แสดง {pricingRequests.pagination.from || 0} - {pricingRequests.pagination.to || 0} จาก {pricingRequests.pagination.total} รายการ
                                        {isFetching && (
                                            <Chip
                                                label="กำลังโหลด..."
                                                size="small"
                                                color="primary"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Typography>
                                    {isFetching && (
                                        <LinearProgress
                                            sx={{ mt: 1, borderRadius: 1 }}
                                            color="primary"
                                        />
                                    )}
                                </Box>
                            )}
                        </Box>

                        {isLoading ? (
                            <Grid container spacing={3}>
                                {[...Array(6)].map((_, index) => (
                                    <Grid item xs={12} sm={6} lg={4} key={index}>
                                        <Card>
                                            <CardContent>
                                                <Skeleton variant="text" width="60%" height={32} />
                                                <Skeleton variant="text" width="80%" />
                                                <Skeleton variant="text" width="40%" />
                                                <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : error ? (
                            <Paper sx={{ p: 6, textAlign: 'center' }}>
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        เกิดข้อผิดพลาดในการดึงข้อมูล
                                    </Typography>
                                    <Typography variant="body2">
                                        {error?.data?.message || error?.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'}
                                    </Typography>
                                    {process.env.NODE_ENV === 'development' && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                            <Typography variant="caption" component="pre">
                                                {JSON.stringify(error, null, 2)}
                                            </Typography>
                                        </Box>
                                    )}
                                </Alert>
                                <Button
                                    variant="contained"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleRefresh}
                                    color="error"
                                >
                                    ลองใหม่อีกครั้ง
                                </Button>
                            </Paper>
                        ) : pricingRequests?.data?.length > 0 ? (
                            <>
                                <Grid container spacing={3}>
                                    {pricingRequests.data.map((request) => (
                                        <Grid item xs={12} sm={6} lg={4} key={request.pr_id}>
                                            <PricingRequestCard
                                                request={request}
                                                onCreateQuotation={handleCreateQuotation}
                                                onViewDetails={handleViewDetails}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Pagination */}
                                {pricingRequests?.pagination && pricingRequests.pagination.last_page > 1 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                หน้า {pricingRequests.pagination.current_page} จาก {pricingRequests.pagination.last_page}
                                            </Typography>
                                            <Pagination
                                                count={pricingRequests.pagination.last_page}
                                                page={pricingRequests.pagination.current_page}
                                                onChange={handlePageChange}
                                                color="primary"
                                                size="medium"
                                                showFirstButton
                                                showLastButton
                                                disabled={isFetching}
                                                sx={{
                                                    '& .MuiPaginationItem-root': {
                                                        '&.Mui-selected': {
                                                            backgroundColor: 'primary.main',
                                                            color: 'white',
                                                            '&:hover': {
                                                                backgroundColor: 'primary.dark',
                                                            },
                                                        },
                                                    },
                                                }}
                                            />
                                        </Paper>
                                    </Box>
                                )}
                            </>
                        ) : (
                            <Paper sx={{ p: 6, textAlign: 'center' }}>
                                <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    ไม่พบข้อมูล Pricing Request
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={3}>
                                    ยังไม่มี Pricing Request ที่เสร็จสมบูรณ์แล้ว หรือลองปรับเปลี่ยนเงื่อนไขการค้นหา
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleRefresh}
                                >
                                    รีเฟรชข้อมูล
                                </Button>
                            </Paper>
                        )}
                    </Container>

                    {/* Create Quotation Modal */}
                    <CreateQuotationModal
                        open={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        pricingRequest={selectedPricingRequest}
                        onSubmit={handleSubmitQuotation}
                    />

                    {/* Floating Action Button */}
                    <Fab
                        color="primary"
                        aria-label="refresh"
                        sx={{
                            position: 'fixed',
                            bottom: 16,
                            right: 16,
                        }}
                        onClick={handleRefresh}
                    >
                        <RefreshIcon />
                    </Fab>
                </Box>
            </LocalizationProvider>
        </ThemeProvider>
    );
};

export default PricingIntegration;
