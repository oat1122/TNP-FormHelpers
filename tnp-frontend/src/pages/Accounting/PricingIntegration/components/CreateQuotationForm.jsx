import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    TextField,
    Card,
    CardContent,
    Divider,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Chip,
    InputAdornment,
    Alert,
    Stack,
    IconButton,
    Tooltip,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slide,
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    Business as BusinessIcon,
    Calculate as CalculateIcon,
    Payment as PaymentIcon,
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    Send as SendIcon,
    SaveAlt as DraftIcon,
    Info as InfoIcon,
    CalendarToday as CalendarIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon,
    Print as PrintIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PricingRequestNotesButton from './PricingRequestNotesButton';
import QuotationPreview from './QuotationPreview';
import CustomerEditCard from './CustomerEditCard';
import {
    StyledPaper,
    SectionHeader,
    InfoCard,
    PrimaryButton,
    SecondaryButton,
} from './styles/QuotationStyles';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const CreateQuotationForm = ({
    selectedPricingRequests = [],
    onBack,
    onSave,
    onSubmit
}) => {
    const [formData, setFormData] = useState({
        // Customer & Basic Info (auto-filled from PR)
        customer: {},
        pricingRequests: selectedPricingRequests,

        // Pricing Calculation
        items: [],
        subtotal: 0,
        vat: 0,
        total: 0,

        // Payment Terms
        paymentMethod: 'credit_30',
        depositPercentage: '50',
        customDepositPercentage: '',
        depositAmount: 0,
        remainingAmount: 0,
        dueDate: null,
        notes: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Calculate totals when items change
    useEffect(() => {
        const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const vat = subtotal * 0.07;
        const total = subtotal + vat;

        const depositPercentage = formData.depositPercentage === 'custom'
            ? parseFloat(formData.customDepositPercentage) || 0
            : parseFloat(formData.depositPercentage) || 0;

        const depositAmount = total * (depositPercentage / 100);
        const remainingAmount = total - depositAmount;

        setFormData(prev => ({
            ...prev,
            subtotal,
            vat,
            total,
            depositAmount,
            remainingAmount,
        }));
    }, [formData.items, formData.depositPercentage, formData.customDepositPercentage]);

    // Initialize items from pricing requests
    useEffect(() => {
        console.log('🔍 Debug CreateQuotationForm - selectedPricingRequests:', selectedPricingRequests);
        console.log('📊 จำนวน selectedPricingRequests:', selectedPricingRequests.length);

        if (selectedPricingRequests && selectedPricingRequests.length > 0) {
            // Get customer info from first pricing request
            const customer = selectedPricingRequests[0]?.customer || {};
            console.log('👤 Customer data:', customer);

            // Map all selected pricing requests to items
            const items = selectedPricingRequests.map((pr, index) => {
                console.log(`📝 Processing PR ${index + 1}:`, pr);
                return {
                    id: pr.pr_id || pr.id || `temp_${index}`,
                    pricingRequestId: pr.pr_id, // สำหรับ Notes Button
                    name: pr.pr_work_name || pr.work_name || 'ไม่ระบุชื่องาน',
                    pattern: pr.pr_pattern || pr.pattern || '',
                    fabricType: pr.pr_fabric_type || pr.fabric_type || pr.material || '',
                    color: pr.pr_color || pr.color || '',
                    size: pr.pr_sizes || pr.sizes || pr.size || '',
                    quantity: parseInt(pr.pr_quantity || pr.quantity || 1, 10),
                    unitPrice: pr.pr_unit_price ? parseFloat(pr.pr_unit_price) : 0, // Sales can adjust
                    total: (pr.pr_unit_price ? parseFloat(pr.pr_unit_price) : 0) * (parseInt(pr.pr_quantity || pr.quantity || 1, 10)),
                    notes: pr.pr_notes || pr.notes || '',
                    // เพิ่มข้อมูลดิบเผื่อต้องใช้
                    originalData: pr,
                };
            });

            console.log('✅ Processed items:', items);
            console.log('📊 จำนวน items ที่สร้างได้:', items.length);

            // Set due date to 30 days from today for credit payment
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            setFormData(prev => ({
                ...prev,
                customer,
                items,
                dueDate,
            }));
        } else {
            console.log('⚠️ No selectedPricingRequests provided or empty array');
        }
    }, [selectedPricingRequests]);

    const handleItemPriceChange = (itemId, unitPrice) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === itemId
                    ? { ...item, unitPrice: parseFloat(unitPrice) || 0, total: (parseFloat(unitPrice) || 0) * item.quantity }
                    : item
            ),
        }));
    };

    const handleItemQuantityChange = (itemId, quantity) => {
        const parsedQty = parseInt(quantity, 10) || 0;
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === itemId
                    ? {
                          ...item,
                          quantity: parsedQty,
                          total: (item.unitPrice || 0) * parsedQty,
                      }
                    : item
            ),
        }));
    };

    const handlePaymentMethodChange = (method) => {
        let dueDate = new Date();
        if (method === 'credit_30') {
            dueDate.setDate(dueDate.getDate() + 30);
        } else if (method === 'credit_60') {
            dueDate.setDate(dueDate.getDate() + 60);
        }

        setFormData(prev => ({
            ...prev,
            paymentMethod: method,
            dueDate: method === 'cash' ? null : dueDate,
        }));
    };

    const handleSubmitForm = async (action) => {
        setIsSubmitting(true);
        try {
            const submitData = {
                ...formData,
                action, // 'draft', 'review', or 'final'
            };

            if (action === 'draft') {
                await onSave(submitData);
            } else {
                await onSubmit(submitData);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(amount);
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Box sx={{ bgcolor: '#F8F9FA', minHeight: '100vh', py: 3 }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title="กลับไปหน้าเดิม">
                        <IconButton
                            onClick={onBack}
                            sx={{
                                bgcolor: '#FFFFFF',
                                color: '#B20000',
                                border: '2px solid #B20000',
                                '&:hover': {
                                    bgcolor: 'rgba(178, 0, 0, 0.05)',
                                    transform: 'translateX(-2px)',
                                },
                                transition: 'all 0.3s ease-in-out',
                            }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    </Tooltip>
                    <Box>
                        <Typography variant="h4" fontWeight={700} color="#900F0F">
                            📋 สร้างใบเสนอราคา
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            จาก {formData.items.length} งาน ({selectedPricingRequests.length} งานที่เลือก) • {formData.customer?.cus_company || 'กำลังโหลด...'}
                        </Typography>
                        {selectedPricingRequests.length !== formData.items.length && (
                            <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                                ⚠️ จำนวนงานไม่ตรงกัน กรุณาตรวจสอบ Console สำหรับ Debug
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {/* Step 1: Work Information */}
                    <Grid item xs={12}>
                        <StyledPaper>
                            <SectionHeader>
                                <Avatar sx={{ bgcolor: '#FFFFFF', color: '#900F0F' }}>
                                    <AssignmentIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight={600}>
                                        ข้อมูลจาก Pricing Request
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        ข้อมูลที่ดึงมาจากระบบ Pricing Request อัตโนมัติ
                                    </Typography>
                                </Box>
                            </SectionHeader>

                            {/* Customer Information - แก้ไขได้ */}
                            <CustomerEditCard 
                                customer={formData.customer}
                                onUpdate={(updatedCustomer) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        customer: updatedCustomer
                                    }));
                                }}
                            />

                            {/* Work Details */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight={600} color="#900F0F">
                                    รายละเอียดงาน ({formData.items.length} งาน)
                                </Typography>
                                {formData.items.length === 0 && (
                                    <Alert severity="warning" sx={{ flexGrow: 1, ml: 2 }}>
                                        ไม่พบข้อมูลงาน กรุณาตรวจสอบการเลือกงานก่อนหน้า
                                    </Alert>
                                )}
                            </Box>

                            {formData.items.length === 0 ? (
                                <InfoCard sx={{ mb: 2 }}>
                                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            🚫 ไม่พบข้อมูลงาน
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            ตรวจสอบ Console เพื่อดูรายละเอียด Debug
                                        </Typography>
                                    </CardContent>
                                </InfoCard>
                            ) : (
                                formData.items.map((item, index) => (
                                    <InfoCard key={item.id} sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Typography variant="h6" fontWeight={600} color="#900F0F">
                                                    งานที่ {index + 1}: {item.name}
                                                </Typography>
                                                <Chip
                                                    label={`${item.quantity} ชิ้น`}
                                                    color="primary"
                                                    sx={{
                                                        bgcolor: '#900F0F',
                                                        color: '#FFFFFF',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </Box>

                                            <Grid container spacing={2}>
                                                {item.pattern && (
                                                    <Grid item xs={6} md={3}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            แพทเทิร์น
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {item.pattern}
                                                        </Typography>
                                                    </Grid>
                                                )}
                                                {item.fabricType && (
                                                    <Grid item xs={6} md={3}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            ประเภทผ้า
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {item.fabricType}
                                                        </Typography>
                                                    </Grid>
                                                )}
                                                {item.color && (
                                                    <Grid item xs={6} md={3}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            สี
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {item.color}
                                                        </Typography>
                                                    </Grid>
                                                )}
                                                {item.size && (
                                                    <Grid item xs={6} md={3}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            ขนาด
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {item.size}
                                                        </Typography>
                                                    </Grid>
                                                )}
                                            </Grid>

                                            {item.notes && (
                                                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(227, 98, 100, 0.1)', borderRadius: 2 }}>
                                                    <Typography variant="caption" color="#B20000" fontWeight={600}>
                                                        หมายเหตุจาก Pricing Request:
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {item.notes}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </InfoCard>
                                ))
                            )}
                        </StyledPaper>
                    </Grid>

                    {/* Step 2: Price Calculation */}
                    <Grid item xs={12}>
                        <StyledPaper>
                            <SectionHeader>
                                <Avatar sx={{ bgcolor: '#FFFFFF', color: '#900F0F' }}>
                                    <CalculateIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight={600}>
                                        การคำนวณราคา
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        กรอกราคาต่อหน่วยสำหรับแต่ละงาน
                                    </Typography>
                                </Box>
                            </SectionHeader>

                            {/* Pricing Items */}
                            {formData.items.map((item, index) => (
                                <Card key={item.id} sx={{
                                    mb: 3,
                                    border: '2px solid #E36264',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)',
                                    boxShadow: '0 4px 20px rgba(144, 15, 15, 0.08)',
                                    transition: 'all 0.3s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 32px rgba(144, 15, 15, 0.12)',
                                    }
                                }}>
                                    <CardContent sx={{ p: 4 }}>
                                        {/* Header Section */}
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 3,
                                            pb: 2,
                                            borderBottom: '2px solid #F0F0F0'
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box>
                                                    <Typography variant="h5" fontWeight={700} color="#900F0F" sx={{ mb: 1 }}>
                                                        งานที่ {index + 1}
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight={600} color="text.primary">
                                                        {item.name}
                                                    </Typography>
                                                </Box>
                                                <PricingRequestNotesButton
                                                    pricingRequestId={item.pricingRequestId || item.pr_id}
                                                    workName={item.name}
                                                    variant="icon"
                                                    size="medium"
                                                />
                                            </Box>
                                            <Chip
                                                label={`${item.quantity} ชิ้น`}
                                                size="large"
                                                sx={{
                                                    bgcolor: '#900F0F',
                                                    color: '#FFFFFF',
                                                    fontWeight: 700,
                                                    fontSize: '1rem',
                                                    px: 2,
                                                    py: 1,
                                                    borderRadius: '20px',
                                                }}
                                            />
                                        </Box>

                                        {/* Product Details Section */}
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="h6" fontWeight={600} color="#900F0F" sx={{ mb: 2 }}>
                                                📝 รายละเอียดสินค้า
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={3}>
                                                    <Box sx={{
                                                        p: 2,
                                                        bgcolor: 'rgba(144, 15, 15, 0.05)',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(144, 15, 15, 0.1)'
                                                    }}>
                                                        <Typography variant="caption" fontWeight={600} color="#900F0F" sx={{ mb: 1, display: 'block' }}>
                                                            แพทเทิร์น
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="ระบุแพทเทิร์น"
                                                            value={item.pattern}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                items: prev.items.map(i =>
                                                                    i.id === item.id ? { ...i, pattern: e.target.value } : i
                                                                )
                                                            }))}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    bgcolor: '#FFFFFF',
                                                                    '&.Mui-focused fieldset': {
                                                                        borderColor: '#900F0F',
                                                                        borderWidth: '2px'
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <Box sx={{
                                                        p: 2,
                                                        bgcolor: 'rgba(144, 15, 15, 0.05)',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(144, 15, 15, 0.1)'
                                                    }}>
                                                        <Typography variant="caption" fontWeight={600} color="#900F0F" sx={{ mb: 1, display: 'block' }}>
                                                            ประเภทผ้า
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="ระบุประเภทผ้า"
                                                            value={item.fabricType}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                items: prev.items.map(i =>
                                                                    i.id === item.id ? { ...i, fabricType: e.target.value } : i
                                                                )
                                                            }))}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    bgcolor: '#FFFFFF',
                                                                    '&.Mui-focused fieldset': {
                                                                        borderColor: '#900F0F',
                                                                        borderWidth: '2px'
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <Box sx={{
                                                        p: 2,
                                                        bgcolor: 'rgba(144, 15, 15, 0.05)',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(144, 15, 15, 0.1)'
                                                    }}>
                                                        <Typography variant="caption" fontWeight={600} color="#900F0F" sx={{ mb: 1, display: 'block' }}>
                                                            สี
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="ระบุสี"
                                                            value={item.color}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                items: prev.items.map(i =>
                                                                    i.id === item.id ? { ...i, color: e.target.value } : i
                                                                )
                                                            }))}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    bgcolor: '#FFFFFF',
                                                                    '&.Mui-focused fieldset': {
                                                                        borderColor: '#900F0F',
                                                                        borderWidth: '2px'
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <Box sx={{
                                                        p: 2,
                                                        bgcolor: 'rgba(144, 15, 15, 0.05)',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(144, 15, 15, 0.1)'
                                                    }}>
                                                        <Typography variant="caption" fontWeight={600} color="#900F0F" sx={{ mb: 1, display: 'block' }}>
                                                            ขนาด
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="ระบุขนาด"
                                                            value={item.size}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                items: prev.items.map(i =>
                                                                    i.id === item.id ? { ...i, size: e.target.value } : i
                                                                )
                                                            }))}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    bgcolor: '#FFFFFF',
                                                                    '&.Mui-focused fieldset': {
                                                                        borderColor: '#900F0F',
                                                                        borderWidth: '2px'
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Pricing Section */}
                                        <Grid container spacing={3} alignItems="stretch">
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{
                                                    p: 3,
                                                    bgcolor: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.1) 100%)',
                                                    borderRadius: '16px',
                                                    border: '2px solid #4CAF50',
                                                    textAlign: 'center',
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    minHeight: '140px'
                                                }}>
                                                    <Typography variant="caption" fontWeight={600} color="#4CAF50" sx={{ mb: 1, display: 'block' }}>
                                                        💰 ราคาต่อหน่วย
                                                    </Typography>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        value={item.unitPrice || ''}
                                                        onChange={(e) => handleItemPriceChange(item.id, e.target.value)}
                                                        placeholder="0"
                                                        InputProps={{
                                                            startAdornment: <InputAdornment position="start">
                                                                <Typography variant="h6" fontWeight={700} color="#4CAF50">฿</Typography>
                                                            </InputAdornment>,
                                                        }}
                                                        inputProps={{
                                                            inputMode: 'decimal',
                                                            min: 0,
                                                            step: 'any'
                                                        }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: '#FFFFFF',
                                                                fontSize: '1.2rem',
                                                                fontWeight: 600,
                                                                '&.Mui-focused fieldset': {
                                                                    borderColor: '#4CAF50',
                                                                    borderWidth: '3px'
                                                                },
                                                            },
                                                            '& input': {
                                                                textAlign: 'center',
                                                                fontSize: '1.2rem',
                                                                fontWeight: 600,
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6} md={4}>
                                                <Box
                                                    sx={{
                                                        p: 3,
                                                        bgcolor: 'rgba(33, 150, 243, 0.05)',
                                                        borderRadius: '16px',
                                                        border: '2px solid #2196F3',
                                                        textAlign: 'center',
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'center',
                                                        minHeight: '140px',
                                                        gap: 1,
                                                    }}
                                                >
                                                    <Typography variant="caption" fontWeight={600} color="#2196F3" sx={{ display: 'block' }}>
                                                        📦 จำนวน
                                                    </Typography>
                                                    <TextField
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemQuantityChange(item.id, e.target.value)}
                                                        inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: '#FFFFFF',
                                                                fontSize: '1.2rem',
                                                                fontWeight: 600,
                                                                '&.Mui-focused fieldset': {
                                                                    borderColor: '#2196F3',
                                                                    borderWidth: '3px',
                                                                },
                                                            },
                                                            '& input': {
                                                                textAlign: 'center',
                                                                fontSize: '1.2rem',
                                                                fontWeight: 600,
                                                            },
                                                        }}
                                                    />
                                                    <Typography variant="body2" color="#2196F3" fontWeight={600}>
                                                        ชิ้น
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6} md={4}>
                                                <Box sx={{
                                                    p: 3,
                                                    bgcolor: 'linear-gradient(135deg, rgba(144, 15, 15, 0.05) 0%, rgba(227, 98, 100, 0.1) 100%)',
                                                    borderRadius: '16px',
                                                    border: '3px solid #900F0F',
                                                    textAlign: 'center',
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    minHeight: '140px'
                                                }}>
                                                    <Typography variant="caption" fontWeight={600} color="#900F0F" sx={{ mb: 1, display: 'block' }}>
                                                        💵 ยอดรวม
                                                    </Typography>
                                                    <Typography variant="h4" fontWeight={700} color="#900F0F">
                                                        {formatCurrency(item.total)}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))}

                            <Divider sx={{ my: 3 }} />

                            {/* Total Summary */}
                            <Card sx={{
                                background: 'linear-gradient(135deg, rgba(144, 15, 15, 0.05) 0%, rgba(227, 98, 100, 0.05) 100%)',
                                border: '2px solid #E36264',
                            }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight={600} color="#900F0F" gutterBottom>
                                        สรุปยอดเงิน
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body1">ยอดก่อนภาษี:</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body1" textAlign="right" fontWeight={600}>
                                                {formatCurrency(formData.subtotal)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body1">VAT 7%:</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body1" textAlign="right" fontWeight={600}>
                                                {formatCurrency(formData.vat)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Divider sx={{ borderColor: '#B20000' }} />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="h6" fontWeight={700} color="#900F0F">
                                                ยอดรวมทั้งสิ้น:
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="h6" textAlign="right" fontWeight={700} color="#900F0F">
                                                {formatCurrency(formData.total)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </StyledPaper>
                    </Grid>

                    {/* Step 3: Payment Terms */}
                    <Grid item xs={12}>
                        <StyledPaper>
                            <SectionHeader>
                                <Avatar sx={{ bgcolor: '#FFFFFF', color: '#900F0F' }}>
                                    <PaymentIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight={600}>
                                        เงื่อนไขการชำระเงิน
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        กำหนดเงื่อนไขการชำระเงินและเงินมัดจำ
                                    </Typography>
                                </Box>
                            </SectionHeader>

                            <Grid container spacing={3}>
                                {/* Payment Method */}
                                <Grid item xs={12} md={6}>
                                    <FormControl component="fieldset">
                                        <FormLabel
                                            component="legend"
                                            sx={{
                                                color: '#900F0F',
                                                fontWeight: 600,
                                                '&.Mui-focused': { color: '#900F0F' }
                                            }}
                                        >
                                            การชำระเงิน
                                        </FormLabel>
                                        <RadioGroup
                                            value={formData.paymentMethod}
                                            onChange={(e) => handlePaymentMethodChange(e.target.value)}
                                        >
                                            <FormControlLabel
                                                value="cash"
                                                control={<Radio sx={{ color: '#B20000', '&.Mui-checked': { color: '#900F0F' } }} />}
                                                label="เงินสด"
                                            />
                                            <FormControlLabel
                                                value="credit_30"
                                                control={<Radio sx={{ color: '#B20000', '&.Mui-checked': { color: '#900F0F' } }} />}
                                                label="เครดิต 30 วัน"
                                            />
                                            <FormControlLabel
                                                value="credit_60"
                                                control={<Radio sx={{ color: '#B20000', '&.Mui-checked': { color: '#900F0F' } }} />}
                                                label="เครดิต 60 วัน"
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                </Grid>

                                {/* Deposit */}
                                <Grid item xs={12} md={6}>
                                    <FormControl component="fieldset">
                                        <FormLabel
                                            component="legend"
                                            sx={{
                                                color: '#900F0F',
                                                fontWeight: 600,
                                                '&.Mui-focused': { color: '#900F0F' }
                                            }}
                                        >
                                            เงินมัดจำ
                                        </FormLabel>
                                        <RadioGroup
                                            value={formData.depositPercentage}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                depositPercentage: e.target.value,
                                                customDepositPercentage: e.target.value === 'custom' ? prev.customDepositPercentage : ''
                                            }))}
                                        >
                                            <FormControlLabel
                                                value="0"
                                                control={<Radio sx={{ color: '#B20000', '&.Mui-checked': { color: '#900F0F' } }} />}
                                                label="ไม่มี"
                                            />
                                            <FormControlLabel
                                                value="50"
                                                control={<Radio sx={{ color: '#B20000', '&.Mui-checked': { color: '#900F0F' } }} />}
                                                label="50%"
                                            />
                                            <FormControlLabel
                                                value="100"
                                                control={<Radio sx={{ color: '#B20000', '&.Mui-checked': { color: '#900F0F' } }} />}
                                                label="100%"
                                            />
                                            <FormControlLabel
                                                value="custom"
                                                control={<Radio sx={{ color: '#B20000', '&.Mui-checked': { color: '#900F0F' } }} />}
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <span>กำหนดเอง</span>
                                                        <TextField
                                                            size="small"
                                                            value={formData.customDepositPercentage}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                customDepositPercentage: e.target.value
                                                            }))}
                                                            disabled={formData.depositPercentage !== 'custom'}
                                                            sx={{ width: 80 }}
                                                            InputProps={{
                                                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                            }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                </Grid>

                                {/* Payment Summary */}
                                <Grid item xs={12}>
                                    <Card sx={{
                                        background: 'linear-gradient(135deg, rgba(144, 15, 15, 0.05) 0%, rgba(227, 98, 100, 0.05) 100%)',
                                        border: '2px solid #E36264',
                                    }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight={600} color="#900F0F" gutterBottom>
                                                สรุปการชำระเงิน
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body1">จำนวนมัดจำ:</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body1" textAlign="right" fontWeight={600} color="#B20000">
                                                        {formatCurrency(formData.depositAmount)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body1">ยอดคงเหลือ:</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body1" textAlign="right" fontWeight={600}>
                                                        {formatCurrency(formData.remainingAmount)}
                                                    </Typography>
                                                </Grid>
                                                {formData.dueDate && (
                                                    <>
                                                        <Grid item xs={6}>
                                                            <Typography variant="body1">วันครบกำหนด:</Typography>
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <Typography variant="body1" textAlign="right" fontWeight={600} color="#B20000">
                                                                {formatDate(formData.dueDate)}
                                                            </Typography>
                                                        </Grid>
                                                    </>
                                                )}
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Due Date Picker */}
                                {formData.paymentMethod !== 'cash' && (
                                    <Grid item xs={12} md={6}>
                                        <DatePicker
                                            label="วันครบกำหนด"
                                            value={formData.dueDate}
                                            onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    InputProps: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <CalendarIcon sx={{ color: '#B20000' }} />
                                                            </InputAdornment>
                                                        ),
                                                    },
                                                }
                                            }}
                                        />
                                    </Grid>
                                )}

                                {/* Notes */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="หมายเหตุ"
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="เช่น ราคานี้รวมค่าจัดส่งและติดตั้งแล้ว..."
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#900F0F',
                                                },
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                color: '#900F0F',
                                            },
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </StyledPaper>
                    </Grid>
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <SecondaryButton
                        size="large"
                        startIcon={<ArrowBackIcon />}
                        onClick={onBack}
                    >
                        ยกเลิก
                    </SecondaryButton>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <SecondaryButton
                            size="large"
                            startIcon={<VisibilityIcon />}
                            onClick={() => setShowPreview(true)}
                            disabled={formData.total === 0}
                        >
                            ดูตัวอย่าง
                        </SecondaryButton>

                        <SecondaryButton
                            size="large"
                            startIcon={<DraftIcon />}
                            onClick={() => handleSubmitForm('draft')}
                            disabled={isSubmitting}
                        >
                            บันทึกร่าง
                        </SecondaryButton>

                        <PrimaryButton
                            size="large"
                            startIcon={<SendIcon />}
                            onClick={() => handleSubmitForm('review')}
                            disabled={isSubmitting || formData.total === 0}
                        >
                            {isSubmitting ? 'กำลังส่ง...' : 'ส่งตรวจสอบ'}
                        </PrimaryButton>
                    </Box>
                </Box>

                {/* Summary Alert */}
                {formData.total > 0 && (
                    <Alert
                        severity="success"
                        sx={{
                            mt: 3,
                            border: '1px solid #4caf50',
                            '& .MuiAlert-icon': {
                                color: '#4caf50',
                            },
                        }}
                        icon={<CheckCircleIcon />}
                    >
                        <Typography variant="body1" fontWeight={600}>
                            ใบเสนอราคาพร้อมส่ง!
                        </Typography>
                        <Typography variant="body2">
                            ยอดรวม {formatCurrency(formData.total)} • เงินมัดจำ {formatCurrency(formData.depositAmount)} •
                            คงเหลือ {formatCurrency(formData.remainingAmount)}
                        </Typography>
                    </Alert>
                )}

                {/* Preview Modal */}
                <Dialog
                    open={showPreview}
                    onClose={() => setShowPreview(false)}
                    maxWidth="lg"
                    fullWidth
                    TransitionComponent={Transition}
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            maxHeight: '95vh',
                        },
                    }}
                >
                    <DialogTitle sx={{
                        bgcolor: '#900F0F',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}>
                        <VisibilityIcon />
                        <Typography variant="h6" fontWeight={600}>
                            ตัวอย่างใบเสนอราคา
                        </Typography>
                    </DialogTitle>

                    <DialogContent sx={{ p: 3 }}>
                        <QuotationPreview
                            formData={formData}
                            quotationNumber="QT-2025-XXX"
                            showActions={true}
                        />
                    </DialogContent>

                    <DialogActions sx={{ p: 3, bgcolor: '#F8F9FA' }}>
                        <SecondaryButton
                            startIcon={<PrintIcon />}
                            onClick={() => {
                                // Trigger custom print event
                                const event = new CustomEvent('quotation-print');
                                document.dispatchEvent(event);
                            }}
                        >
                            พิมพ์
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={() => setShowPreview(false)}
                        >
                            ปิด
                        </PrimaryButton>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default CreateQuotationForm;
