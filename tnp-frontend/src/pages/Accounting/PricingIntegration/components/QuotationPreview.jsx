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
    Button,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Print as PrintIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
// Import print styles
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

const CompanyHeader = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #900F0F 0%, #B20000 100%)',
    color: '#FFFFFF',
    padding: '24px',
    margin: '-32px -32px 24px -32px',
    borderRadius: '8px 8px 0 0',
    textAlign: 'center',
    className: 'company-header', // For print styling
    '@media print': {
        margin: '-15mm -10mm 12pt -10mm',
        padding: '12pt',
        borderRadius: 0,
    },
}));

const QuotationPreview = ({ formData, quotationNumber, showActions = false }) => {
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

    const handlePrint = () => {
        // เตรียมสำหรับการพิมพ์แบบ A4
        const printWindow = window.open('', '_blank');
        const quotationElement = document.querySelector('.quotation-preview');
        
        if (printWindow && quotationElement) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>ใบเสนอราคา ${quotationNumber || 'QT-2025-XXX'}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        @page {
                            size: A4;
                            margin: 10mm 15mm 10mm 15mm;
                        }
                        
                        body {
                            font-family: 'Kanit', 'Arial', sans-serif;
                            margin: 0;
                            padding: 0;
                            background: white;
                            color: #000;
                            font-size: 11pt;
                            line-height: 1.3;
                        }
                        
                        .quotation-content {
                            width: 100%;
                            max-width: none;
                            padding: 0;
                            box-shadow: none;
                            border-radius: 0;
                        }
                        
                        .company-header {
                            background: linear-gradient(135deg, #900F0F 0%, #B20000 100%) !important;
                            color: white !important;
                            padding: 12pt !important;
                            margin-bottom: 12pt !important;
                            text-align: center;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        .brand-color {
                            color: #900F0F !important;
                        }
                        
                        table {
                            border-collapse: collapse !important;
                            width: 100% !important;
                            font-size: 10pt !important;
                        }
                        
                        table th,
                        table td {
                            border: 1px solid #B20000 !important;
                            padding: 6pt 8pt !important;
                            text-align: left !important;
                        }
                        
                        table th {
                            background-color: rgba(144, 15, 15, 0.1) !important;
                            font-weight: bold !important;
                        }
                        
                        .summary-box {
                            border: 2px solid #B20000 !important;
                            padding: 8pt !important;
                            background: rgba(144, 15, 15, 0.05) !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        .print-hide {
                            display: none !important;
                        }
                    </style>
                </head>
                <body>
                    <div class="quotation-content">
                        ${quotationElement.innerHTML}
                    </div>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            
            // Wait for content to load then print
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const handleDownloadPDF = () => {
        // สำหรับการดาวน์โหลด PDF จะใช้ browser print to PDF
        window.print();
    };

    const today = new Date();
    const quotationDate = formatDate(today);

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
                    <Tooltip title="พิมพ์ใบเสนอราคา">
                        <IconButton 
                            onClick={handlePrint}
                            sx={{ 
                                bgcolor: '#900F0F', 
                                color: 'white',
                                '&:hover': { bgcolor: '#B20000' }
                            }}
                        >
                            <PrintIcon />
                        </IconButton>
                    </Tooltip>
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
            {/* Company Header */}
            <CompanyHeader className="company-header">
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
                    <Paper className="summary-box" sx={{ 
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
                            <Typography variant="h6" fontWeight={700} className="brand-color">
                                ยอดรวมทั้งสิ้น:
                            </Typography>
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
        </Box>
    );
};

export default QuotationPreview;
