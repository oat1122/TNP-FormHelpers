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
    IconButton,
    Tooltip,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
// Import print styles (if any overrides are defined)
import './styles.css';

const PreviewPaper = styled(Paper)(({ theme }) => ({
    background: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '32px',
    maxWidth: '210mm', // A4 width
    minHeight: '297mm', // A4 height
    margin: '0 auto',
    position: 'relative',
    // Ensure proper A4 aspect ratio
    '@media screen': {
        width: '210mm',
        boxSizing: 'border-box',
    },
    // Print optimizations
    '@media print': {
        maxWidth: 'none',
        width: '100%',
        margin: 0,
        padding: '15mm 10mm',
        boxShadow: 'none',
        borderRadius: 0,
        pageBreakInside: 'avoid',
    },
}));

// Header info box style
const InfoBox = styled(Box)(({ theme }) => ({
    border: '1px solid #D0D5DD',
    borderRadius: 8,
    padding: '12px 16px',
}));

const QuotationPreview = ({ formData, quotationNumber, showActions = false }) => {
    // useEffect สำหรับ listen การ print event จาก parent
    React.useEffect(() => {
        const handlePrintEvent = () => window.print();
        document.addEventListener('quotation-print', handlePrintEvent);
        return () => document.removeEventListener('quotation-print', handlePrintEvent);
    }, []);

    // Helpers
    const formatCurrency = (amount) =>
        new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(amount || 0));

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handlePrint = () => window.print();

    const handleDownloadPDF = () => {
        // สำหรับการดาวน์โหลด PDF จะใช้ browser print to PDF
        window.print();
    };

    const today = new Date();
    const quotationDate = formatDate(today);
    // Resolve logo path from backend public with fallback to local /images
    const backendBase = (import.meta?.env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
    const resolvedLogo = backendBase ? `${backendBase}/images/logo.png` : '/images/logo.png';

    return (
        <Box sx={{ position: 'relative' }}>
            {/* Action Buttons - แสดงเฉพาะใน screen */}
            {showActions && (
                <Box className="print-hide" sx={{ 
                    position: 'absolute', 
                    top: -60, 
                    right: 0, 
                    display: 'flex', 
                    gap: 1,
                    zIndex: 10 
                }}>
                    <Tooltip title="ดาวน์โหลด PDF">
                        <IconButton 
                            onClick={handleDownloadPDF}
                            sx={{ 
                                bgcolor: '#B20000', 
                                color: 'white',
                                '&:hover': { bgcolor: '#900F0F' }
                            }}
                        >
                            <DownloadIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
            
        <PreviewPaper elevation={3} className="quotation-preview">
            {/* Letterhead */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={7}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box
                            component="img"
                            src={resolvedLogo}
                            alt="Company Logo"
                            onError={(e) => {
                                if (!e.currentTarget.dataset.fallback) {
                                    e.currentTarget.dataset.fallback = '1';
                                    e.currentTarget.src = '/images/logo.png';
                                } else {
                                    e.currentTarget.style.display = 'none';
                                }
                            }}
                            sx={{ height: 56, width: 'auto' }}
                        />
                        <Box>
                            <Typography variant="h6" fontWeight={700}>บริษัท ธน พลัส 153 จำกัด (สำนักงานใหญ่)</Typography>
                            <Typography variant="body2" color="text.secondary">
                                503 ถนนสุโขทัย เขตดุสิต แขวงสวนจิตรลดา จ.กรุงเทพฯ 10300
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                เลขประจำตัวผู้เสียภาษี 0105553095785
                            </Typography>
                            <Typography variant="body2" color="text.secondary">โทร. 02-668-2976</Typography>
                            <Typography variant="body2" color="text.secondary">เบอร์มือถือ 081-323-4533,096-936-6311</Typography>
                            <Typography variant="body2" color="text.secondary">https://thanaplus.com/</Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={5}>
                    <InfoBox>
                        <Typography variant="h6" align="right" sx={{ color: '#900F0F', fontWeight: 700, mb: 1 }}>
                            ใบเสนอราคา
                        </Typography>
                        <Grid container>
                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">เลขที่</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2" align="right">{quotationNumber || 'QT-2025-XXX'}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">วันที่</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2" align="right">{quotationDate}</Typography></Grid>
                            {formData.sellerName && (
                                <>
                                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">ผู้ขาย</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2" align="right">{formData.sellerName}</Typography></Grid>
                                </>
                            )}
                        </Grid>
                    </InfoBox>
                </Grid>
            </Grid>

            {/* Quotation Info */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                    <Typography variant="h6" color="#900F0F" fontWeight={600} gutterBottom>ข้อมูลลูกค้า</Typography>
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
                        {formData.dueDate && (
                            <Typography variant="body2" color="text.secondary">วันครบกำหนด: {formatDate(formData.dueDate)}</Typography>
                        )}
                        <Chip 
                            label={
                                formData.paymentMethod === 'cash' ? 'เงินสด' :
                                formData.paymentMethod === 'credit_30' ? 'เครดิต 30 วัน' :
                                formData.paymentMethod === 'credit_60' ? 'เครดิต 60 วัน' : 'ไม่ระบุ'
                            }
                            sx={{ mt: 1, bgcolor: '#900F0F', color: '#FFFFFF', fontWeight: 600 }}
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
                            <TableCell sx={{ fontWeight: 600, color: '#900F0F', width: 64 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#900F0F' }}>รายละเอียด</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#900F0F', textAlign: 'center', width: 120 }}>จำนวน</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#900F0F', textAlign: 'right', width: 140 }}>ราคาต่อหน่วย</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#900F0F', textAlign: 'right', width: 160 }}>ยอดรวม</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {formData.items?.map((item, index) => {
                            const hasSizes = Array.isArray(item.sizeRows) && item.sizeRows.length > 0;
                            const rows = hasSizes ? item.sizeRows : [];
                            const sumQty = hasSizes ? rows.reduce((s, r) => s + Number(r.quantity || 0), 0) : Number(item.quantity || 0);
                            return (
                                <React.Fragment key={item.id}>
                                    <TableRow>
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
                                            {sumQty} ชิ้น
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                            {hasSizes ? '—' : formatCurrency(item.unitPrice)}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right', fontWeight: 600 }}>
                                            {formatCurrency(item.total)}
                                        </TableCell>
                                    </TableRow>
                                    {hasSizes && rows.map((r, rIdx) => (
                                        <TableRow key={r.uuid || `${item.id}-row-${rIdx}`}>
                                            <TableCell />
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    ขนาด: {r.size || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                {Number(r.quantity || 0)} ชิ้น
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                {formatCurrency(Number(r.unitPrice || 0))}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                {formatCurrency(Number(r.quantity || 0) * Number(r.unitPrice || 0))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Summary */}
            <Grid container spacing={2}>
                <Grid item xs={8}></Grid>
                <Grid item xs={4}>
                    <Paper className="summary-box" sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(144, 15, 15, 0.05)',
                        border: '1px solid #E36264',
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">รวมเป็นเงิน</Typography>
                            <Typography variant="body1" fontWeight={600}>
                                {formatCurrency(formData.subtotal)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">ภาษีมูลค่าเพิ่ม 7%</Typography>
                            <Typography variant="body1" fontWeight={600}>
                                {formatCurrency(formData.vat)}
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 1, borderColor: '#B20000' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight={700} className="brand-color">จำนวนเงินรวมทั้งสิ้น</Typography>
                            <Typography variant="h6" fontWeight={700} className="brand-color">
                                {formatCurrency(formData.total)}
                            </Typography>
                        </Box>
                        
                        {formData.depositAmount > 0 && (
                            <>
                                <Divider sx={{ my: 1, borderColor: '#B20000' }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" className="brand-color">เงินมัดจำ:</Typography>
                                    <Typography variant="body2" className="brand-color" fontWeight={600}>
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
                    <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                            ใบเสนอราคานี้มีผลบังคับใช้ 30 วัน • ราคาดังกล่าวยังไม่รวมค่าจัดส่ง (ถ้ามี)
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>ผู้สั่งซื้อสินค้า</Typography>
                            <Box sx={{ height: 60, borderBottom: '1px solid #B20000', mb: 1 }}></Box>
                            <Typography variant="caption" color="text.secondary">( _________________________ )</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>วันที่ ____________</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>ผู้อนุมัติ</Typography>
                            <Box sx={{ height: 60, borderBottom: '1px solid #B20000', mb: 1 }}></Box>
                            <Typography variant="caption" color="text.secondary">( _________________________ )</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>วันที่ ____________</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </PreviewPaper>
        </Box>
    );
};

export default QuotationPreview;
