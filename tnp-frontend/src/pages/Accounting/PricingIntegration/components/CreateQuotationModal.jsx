import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Skeleton,
    Stack,
    Paper,
    Checkbox,
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
} from '@mui/icons-material';

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

export default CreateQuotationModal;
