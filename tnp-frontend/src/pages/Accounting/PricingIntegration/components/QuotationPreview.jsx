import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
// Note: CSS import might cause issues in some setups
// import './styles.css';

const PreviewPaper = styled(Paper)(({ theme }) => ({
    background: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '32px',
    maxWidth: '210mm', // A4 width
    margin: '0 auto',
}));

const CompanyHeader = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #900F0F 0%, #B20000 100%)',
    color: '#FFFFFF',
    padding: '24px',
    margin: '-32px -32px 24px -32px',
    borderRadius: '8px 8px 0 0',
    textAlign: 'center',
}));

const QuotationPreview = ({ formData, quotationNumber }) => {
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

    const today = new Date();
    const quotationDate = formatDate(today);

    return (
        <PreviewPaper elevation={3} className="quotation-preview">
            {/* Company Header */}
            <CompanyHeader>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    TNP Form Helpers
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    ใบเสนอราคา / QUOTATION
                </Typography>
            </CompanyHeader>

            {/* Quotation Info */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                    <Typography variant="h6" color="#900F0F" fontWeight={600} gutterBottom>
                        ข้อมูลลูกค้า
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                        {formData.customer?.cus_company}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        เลขที่ผู้เสียภาษี: {formData.customer?.cus_tax_id}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {formData.customer?.cus_address}
                    </Typography>
                    <Typography variant="body2">
                        โทร: {formData.customer?.cus_phone} | อีเมล: {formData.customer?.cus_email}
                    </Typography>
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="#900F0F" fontWeight={600}>
                            {quotationNumber || 'QT-2025-XXX'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            วันที่: {quotationDate}
                        </Typography>
                        {formData.dueDate && (
                            <Typography variant="body2" color="text.secondary">
                                วันครบกำหนด: {formatDate(formData.dueDate)}
                            </Typography>
                        )}
                        <Chip 
                            label={
                                formData.paymentMethod === 'cash' ? 'เงินสด' :
                                formData.paymentMethod === 'credit_30' ? 'เครดิต 30 วัน' :
                                formData.paymentMethod === 'credit_60' ? 'เครดิต 60 วัน' : 'ไม่ระบุ'
                            }
                            sx={{ 
                                mt: 1,
                                bgcolor: '#900F0F', 
                                color: '#FFFFFF',
                                fontWeight: 600,
                            }}
                        />
                    </Box>
                </Grid>
            </Grid>

            <Divider sx={{ my: 3, borderColor: '#B20000' }} />

            {/* Items Table */}
            <Typography variant="h6" color="#900F0F" fontWeight={600} gutterBottom>
                รายการสินค้า/บริการ
            </Typography>
            
            <TableContainer component={Paper} sx={{ mb: 3, border: '1px solid #E36264' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(144, 15, 15, 0.05)' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#900F0F' }}>ลำดับ</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#900F0F' }}>รายการ</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#900F0F', textAlign: 'center' }}>จำนวน</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#900F0F', textAlign: 'right' }}>ราคา/หน่วย</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#900F0F', textAlign: 'right' }}>รวม</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {formData.items?.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <Typography variant="body1" fontWeight={600}>
                                        {item.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {[item.pattern, item.fabricType, item.color, item.size]
                                            .filter(Boolean)
                                            .join(' • ')}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    {item.quantity} ชิ้น
                                </TableCell>
                                <TableCell sx={{ textAlign: 'right' }}>
                                    {formatCurrency(item.unitPrice)}
                                </TableCell>
                                <TableCell sx={{ textAlign: 'right', fontWeight: 600 }}>
                                    {formatCurrency(item.total)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Summary */}
            <Grid container spacing={2}>
                <Grid item xs={8}></Grid>
                <Grid item xs={4}>
                    <Paper sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(144, 15, 15, 0.05)',
                        border: '1px solid #E36264',
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">ยอดก่อนภาษี:</Typography>
                            <Typography variant="body1" fontWeight={600}>
                                {formatCurrency(formData.subtotal)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">VAT 7%:</Typography>
                            <Typography variant="body1" fontWeight={600}>
                                {formatCurrency(formData.vat)}
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 1, borderColor: '#B20000' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight={700} color="#900F0F">
                                ยอดรวมทั้งสิ้น:
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color="#900F0F">
                                {formatCurrency(formData.total)}
                            </Typography>
                        </Box>
                        
                        {formData.depositAmount > 0 && (
                            <>
                                <Divider sx={{ my: 1, borderColor: '#B20000' }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="#B20000">เงินมัดจำ:</Typography>
                                    <Typography variant="body2" color="#B20000" fontWeight={600}>
                                        {formatCurrency(formData.depositAmount)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">คงเหลือ:</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {formatCurrency(formData.remainingAmount)}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Notes */}
            {formData.notes && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" color="#900F0F" fontWeight={600} gutterBottom>
                        หมายเหตุ
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#F8F9FA', border: '1px solid #E36264' }}>
                        <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                            {formData.notes}
                        </Typography>
                    </Paper>
                </Box>
            )}

            {/* Footer */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid #E36264' }}>
                <Grid container spacing={3}>
                    <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                            ใบเสนอราคานี้มีผลบังคับใช้ 30 วัน
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ราคาดังกล่าวยังไม่รวมค่าจัดส่ง (ถ้ามี)
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                ผู้อนุมัติ
                            </Typography>
                            <Box sx={{ height: 60, borderBottom: '1px solid #B20000', mb: 1 }}></Box>
                            <Typography variant="caption" color="text.secondary">
                                ( _________________________ )
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </PreviewPaper>
    );
};

export default QuotationPreview;
