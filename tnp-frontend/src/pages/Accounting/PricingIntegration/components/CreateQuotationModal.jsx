import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    CardContent,
    Typography,
    TextField,
    Chip,
    DialogContent,
    DialogActions,
    Alert,
    Skeleton,
    Stack,
    Checkbox,
    Avatar,
    Fade,
    Slide,
    IconButton,
    Tooltip,
    Badge,
    LinearProgress,
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    Business as BusinessIcon,
    Close as CloseIcon,
    CheckCircleOutline as CheckCircleIcon,
    RadioButtonUnchecked as UncheckIcon,
    Info as InfoIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
} from '@mui/icons-material';
import {
    StyledDialog,
    StyledDialogTitle,
    SelectionCard,
    CustomerInfoCard,
    PrimaryButton,
    SecondaryButton,
} from './styles/QuotationStyles';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

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
            // 🔐 เพิ่ม user parameter สำหรับ access control
            const userData = JSON.parse(localStorage.getItem("userData") || "{}");
            const userUuid = userData.user_uuid || "";
            
            // เรียก API เพื่อดึงข้อมูล Pricing Requests ทั้งหมดของลูกค้า
            const response = await fetch(
                `${import.meta.env.VITE_END_POINT_URL}/pricing-requests?customer_id=${customerId}&user=${userUuid}`,
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
                const requests = data.data || [];
                setCustomerPricingRequests(requests);
                // เลือก Pricing Request ปัจจุบันเป็นค่าเริ่มต้น (ถ้ายังไม่มีใบเสนอราคา)
                const current = requests.find(pr => pr.pr_id === pricingRequest.pr_id);
                if (current && !current.is_quoted) {
                    setSelectedPricingItems([pricingRequest.pr_id]);
                } else {
                    setSelectedPricingItems([]);
                }
            }
        } catch (error) {
            console.error('Error fetching customer pricing requests:', error);
            setCustomerPricingRequests([pricingRequest]); // fallback
            setSelectedPricingItems(pricingRequest.is_quoted ? [] : [pricingRequest.pr_id]);
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

        // เพิ่ม debug
        console.log('🚀 Submitting from Modal:');
        console.log('📋 Selected Pricing Items:', selectedPricingItems);
        console.log('📊 Selected Count:', selectedPricingItems.length);
        
        const validSelections = customerPricingRequests.filter(item => 
            selectedPricingItems.includes(item.pr_id)
        );
        console.log('✅ Valid Selections:', validSelections);
        console.log('📋 Valid Selections Count:', validSelections.length);

        setIsSubmitting(true);
        try {
            const submitData = {
                pricingRequestIds: selectedPricingItems,
                customerId: pricingRequest?.customer?.cus_id,
                additional_notes: additionalNotes,
                // เพิ่มข้อมูลสำรอง
                selectedRequestsData: validSelections,
            };

            console.log('📤 Data being sent:', submitData);
            await onSubmit(submitData);
            
            // Reset
            onClose();
            setAdditionalNotes('');
            setSelectedPricingItems([]);
        } catch (error) {
            console.error('❌ Error creating quotation:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedTotal = customerPricingRequests
        .filter(item => selectedPricingItems.includes(item.pr_id))
        .reduce((sum, item) => sum + (item.pr_quantity || 0), 0);

    return (
        <StyledDialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            fullWidth
            TransitionComponent={Transition}
            TransitionProps={{ timeout: 400 }}
        >
            <StyledDialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}>
                            <BusinessIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                สร้างใบเสนอราคา
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.9rem' }}>
                                {pricingRequest?.customer?.cus_company}
                            </Typography>
                        </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Badge 
                            badgeContent={selectedPricingItems.length} 
                            color="secondary"
                            sx={{
                                '& .MuiBadge-badge': {
                                    backgroundColor: '#FFFFFF',
                                    color: '#900F0F',
                                    fontWeight: 'bold',
                                }
                            }}
                        >
                            <Chip
                                icon={<AssignmentIcon />}
                                label={`เลือกแล้ว ${selectedPricingItems.length} งาน`}
                                sx={{ 
                                    bgcolor: 'rgba(255, 255, 255, 0.15)', 
                                    color: '#FFFFFF',
                                    fontWeight: 600,
                                    '& .MuiChip-icon': { color: '#FFFFFF' }
                                }}
                            />
                        </Badge>
                        <Tooltip title="ปิด">
                            <IconButton 
                                onClick={onClose} 
                                sx={{ color: '#FFFFFF', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </StyledDialogTitle>

            <DialogContent sx={{ p: 0, position: 'relative' }}>
                {isLoadingCustomerData && (
                    <LinearProgress 
                        sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0,
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: '#B20000'
                            }
                        }} 
                    />
                )}
                
                {pricingRequest && (
                    <Box sx={{ p: 4 }}>
                        <Fade in timeout={600}>
                            <Alert 
                                severity="info" 
                                icon={<InfoIcon />}
                                sx={{ 
                                    mb: 3,
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(33, 150, 243, 0.05)',
                                    border: '1px solid rgba(33, 150, 243, 0.2)',
                                    '& .MuiAlert-icon': {
                                        color: '#1976d2'
                                    }
                                }}
                            >
                                <Typography variant="body2">
                                    เลือกงานที่ต้องการสร้างใบเสนอราคา คุณสามารถเลือกได้หลายงานเพื่อรวมในใบเสนอราคาเดียวกัน
                                </Typography>
                            </Alert>
                        </Fade>

                        {/* ข้อมูลลูกค้า */}
                        <CustomerInfoCard elevation={0}>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                                <Avatar sx={{ bgcolor: '#900F0F', width: 40, height: 40 }}>
                                    <BusinessIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight={600} color="#900F0F">
                                        ข้อมูลลูกค้า
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Customer Information
                                    </Typography>
                                </Box>
                            </Box>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        บริษัทลูกค้า
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                        {pricingRequest.customer?.cus_company}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        เลขประจำตัวผู้เสียภาษี
                                    </Typography>
                                    <Typography variant="body1">
                                        {pricingRequest.customer?.cus_tax_id}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        ที่อยู่
                                    </Typography>
                                    <Typography variant="body2">
                                        {pricingRequest.customer?.cus_address}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CustomerInfoCard>

                        {/* รายการงานของลูกค้า */}
                        <Box sx={{ mb: 3 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ bgcolor: '#B20000', width: 36, height: 36 }}>
                                        <AssignmentIcon fontSize="small" />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight={600} color="#900F0F">
                                            เลือกงานที่ต้องการสร้างใบเสนอราคา
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Select jobs to create quotation
                                        </Typography>
                                    </Box>
                                </Box>
                                {selectedTotal > 0 && (
                                    <Chip
                                        icon={<CheckCircleIcon />}
                                        label={`รวม ${selectedTotal} ชิ้น`}
                                        color="success"
                                        variant="outlined"
                                        sx={{ fontWeight: 600 }}
                                    />
                                )}
                            </Box>

                            {isLoadingCustomerData ? (
                                <Box sx={{ py: 4 }}>
                                    {[1, 2, 3].map((item) => (
                                        <Box key={item} sx={{ mb: 2 }}>
                                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                                    {customerPricingRequests.map((item, index) => (
                                        <Fade in timeout={300 + index * 100} key={item.pr_id}>
                                            <SelectionCard
                                                selected={selectedPricingItems.includes(item.pr_id)}
                                                sx={{ mb: 2, opacity: item.is_quoted ? 0.5 : 1, pointerEvents: item.is_quoted ? 'none' : 'auto' }}
                                                onClick={() => !item.is_quoted && handlePricingItemToggle(item.pr_id)}
                                            >
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                                        <Box sx={{ flex: 1 }}>
                                                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                                <Avatar
                                                                    sx={{
                                                                        bgcolor: selectedPricingItems.includes(item.pr_id) ? '#900F0F' : '#E5E7EB',
                                                                        color: selectedPricingItems.includes(item.pr_id) ? '#FFFFFF' : '#6B7280',
                                                                        width: 32,
                                                                        height: 32,
                                                                        fontSize: '0.875rem'
                                                                    }}
                                                                >
                                                                    {index + 1}
                                                                </Avatar>
                                                                <Typography variant="h6" fontWeight={600} color={selectedPricingItems.includes(item.pr_id) ? '#900F0F' : 'inherit'}>
                                                                    {item.pr_work_name}
                                                                </Typography>
                                                            </Box>
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={6} md={3}>
                                                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                                        ลาย/แบบ
                                                                    </Typography>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        {item.pr_pattern || '-'}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={6} md={3}>
                                                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                                        วัสดุ
                                                                    </Typography>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        {item.pr_fabric_type || '-'}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={6} md={3}>
                                                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                                        จำนวน
                                                                    </Typography>
                                                                    <Typography variant="body2" fontWeight={600} color="#900F0F">
                                                                        {item.pr_quantity} ชิ้น
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={6} md={3}>
                                                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                                        กำหนดส่ง
                                                                    </Typography>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        {item.pr_due_date ? new Date(item.pr_due_date).toLocaleDateString('th-TH') : '-'}
                                                                    </Typography>
                                                                </Grid>
                                                            </Grid>
                                                        </Box>
                                                        <Box sx={{ ml: 3 }}>
                                                            <Tooltip title={item.is_quoted ? 'มีใบเสนอราคาแล้ว' : (selectedPricingItems.includes(item.pr_id) ? 'คลิกเพื่อยกเลิกการเลือก' : 'คลิกเพื่อเลือก')}>
                                                                <span>
                                                                    <IconButton
                                                                        disabled={item.is_quoted}
                                                                        sx={{
                                                                            color: selectedPricingItems.includes(item.pr_id) ? '#900F0F' : '#9CA3AF',
                                                                            transform: selectedPricingItems.includes(item.pr_id) ? 'scale(1.1)' : 'scale(1)',
                                                                            transition: 'all 0.2s ease-in-out'
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handlePricingItemToggle(item.pr_id);
                                                                        }}
                                                                    >
                                                                        {selectedPricingItems.includes(item.pr_id) ? <CheckCircleIcon /> : <UncheckIcon />}
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        </Box>
                                                    </Box>
                                                    {item.is_quoted && (
                                                        <Chip label="มีใบเสนอราคาแล้ว" color="warning" size="small" sx={{ mt: 1 }} />
                                                    )}
                                                </CardContent>
                                            </SelectionCard>
                                        </Fade>
                                    ))}
                                </Box>
                            )}
                        </Box>

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="หมายเหตุเพิ่มเติม"
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            placeholder="หมายเหตุเพิ่มเติมสำหรับใบเสนอราคา..."
                            variant="outlined"
                            sx={{ 
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#900F0F',
                                    },
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#900F0F',
                                },
                            }}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ 
                p: 4, 
                pt: 2, 
                background: 'linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%)',
                borderTop: '1px solid #E5E7EB'
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                    <Box>
                        {selectedPricingItems.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                                เลือกแล้ว {selectedPricingItems.length} งาน จากทั้งหมด {customerPricingRequests.length} งาน
                            </Typography>
                        )}
                    </Box>
                    <Box display="flex" gap={2}>
                        <SecondaryButton
                            onClick={onClose}
                            disabled={isSubmitting || selectedPricingItems.length === 0}
                        >
                            ยกเลิก
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={handleSubmit}
                            disabled={isSubmitting || selectedPricingItems.length === 0}
                            startIcon={isSubmitting ? null : <AssignmentIcon />}
                        >
                            {isSubmitting ? 'กำลังสร้าง...' : `สร้างใบเสนอราคา (${selectedPricingItems.length} งาน)`}
                        </PrimaryButton>
                    </Box>
                </Box>
            </DialogActions>
        </StyledDialog>
    );
};

export default CreateQuotationModal;
