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
    
    // Resolve logo path - ใช้ logo จาก public folder
    const getLogoPath = () => {
        // ไฟล์ logo อยู่ใน public/logo.png จึงเข้าถึงได้โดยตรงจาก /logo.png
        return '/logo.png';
    };

    const resolvedLogo = getLogoPath();
    const [logoError, setLogoError] = React.useState(false);

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
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={7}>
                    <Box display="flex" alignItems="center" gap={3}>
                        {!logoError ? (
                            <Box
                                component="img"
                                src={resolvedLogo}
                                alt="THANA Plus Logo"
                                onError={(e) => {
                                    console.log('Logo failed to load:', e.currentTarget.src); // Debug log
                                    if (!e.currentTarget.dataset.fallback) {
                                        e.currentTarget.dataset.fallback = '1';
                                        e.currentTarget.src = '/images/logo.png';
                                        console.log('Trying fallback:', '/images/logo.png'); // Debug log
                                    } else {
                                        console.log('Fallback also failed, showing placeholder'); // Debug log
                                        setLogoError(true);
                                    }
                                }}
                                sx={{ 
                                    height: 64, 
                                    width: 'auto',
                                    objectFit: 'contain'
                                }}
                            />
                        ) : (
                            // Logo placeholder when both primary and fallback fail
                            <Box
                                sx={{
                                    height: 64,
                                    width: 180,
                                    bgcolor: '#900F0F',
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '1rem'
                                    }}
                                >
                                    THANA PLUS
                                </Typography>
                            </Box>
                        )}
                        <Box>
                            <Typography 
                                variant="h5" 
                                fontWeight={700}
                                sx={{ 
                                    color: '#1a1a1a',
                                    mb: 0.5,
                                    letterSpacing: '0.5px'
                                }}
                            >
                                บริษัท ธน พลัส 153 จำกัด (สำนักงานใหญ่)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
                                503 ถนนสุโขทัย เขตดุสิต แขวงสวนจิตรลดา จ.กรุงเทพฯ 10300
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
                                เลขประจำตัวผู้เสียภาษี 0105553095785
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
                                โทร. 02-668-2976
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
                                เบอร์มือถือ 081-323-4533, 096-936-6311
                            </Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: '#900F0F',
                                    fontWeight: 500
                                }}
                            >
                                https://thanaplus.com/
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={5}>
                    <InfoBox sx={{ 
                        border: '2px solid #900F0F',
                        bgcolor: 'rgba(144, 15, 15, 0.02)'
                    }}>
                        <Typography 
                            variant="h5" 
                            align="right" 
                            sx={{ 
                                color: '#900F0F', 
                                fontWeight: 700, 
                                mb: 2,
                                letterSpacing: '1px'
                            }}
                        >
                            ใบเสนอราคา
                        </Typography>
                        <Grid container spacing={1}>
                            <Grid item xs={5}>
                                <Typography variant="body2" fontWeight={600} color="text.secondary">
                                    เลขที่
                                </Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography variant="body2" align="right" fontWeight={600}>
                                    {quotationNumber || 'QT-2025-XXX'}
                                </Typography>
                            </Grid>
                            <Grid item xs={5}>
                                <Typography variant="body2" fontWeight={600} color="text.secondary">
                                    วันที่
                                </Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography variant="body2" align="right" fontWeight={600}>
                                    {quotationDate}
                                </Typography>
                            </Grid>
                            {formData.sellerName && (
                                <>
                                    <Grid item xs={5}>
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                                            ผู้ขาย
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={7}>
                                        <Typography variant="body2" align="right" fontWeight={600}>
                                            {formData.sellerName}
                                        </Typography>
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </InfoBox>
                </Grid>
            </Grid>

            {/* Quotation Info */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                    <Typography 
                        variant="h6" 
                        color="#900F0F" 
                        fontWeight={700} 
                        gutterBottom
                        sx={{ borderBottom: '2px solid #900F0F', pb: 1, mb: 2 }}
                    >
                        ข้อมูลลูกค้า
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                        {formData.customer?.cus_company}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        เลขที่ผู้เสียภาษี: {formData.customer?.cus_tax_id}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
                        {formData.customer?.cus_address}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                        โทร: {formData.customer?.cus_phone}
                    </Typography>
                    <Typography variant="body2">
                        อีเมล: {formData.customer?.cus_email}
                    </Typography>
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{ textAlign: 'right' }}>
                        {formData.dueDate && (
                            <Typography variant="body1" color="text.secondary" fontWeight={600} sx={{ mb: 2 }}>
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
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                px: 2,
                                py: 1
                            }}
                        />
                    </Box>
                </Grid>
            </Grid>

            <Divider sx={{ my: 3, borderColor: '#900F0F', borderWidth: 2 }} />

            {/* Items Table */}
            <Typography 
                variant="h6" 
                color="#900F0F" 
                fontWeight={700} 
                gutterBottom
                sx={{ borderBottom: '2px solid #900F0F', pb: 1, mb: 2 }}
            >
                รายการสินค้า/บริการ
            </Typography>
            
            <TableContainer 
                component={Paper} 
                sx={{ 
                    mb: 3, 
                    border: '2px solid #900F0F',
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                <Table sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(144, 15, 15, 0.1)' } }}>
                    <TableHead>
                        <TableRow sx={{ 
                            bgcolor: '#900F0F',
                            '& .MuiTableCell-head': {
                                borderBottom: 'none'
                            }
                        }}>
                            <TableCell sx={{ 
                                fontWeight: 700, 
                                color: '#FFFFFF', 
                                width: 80,
                                fontSize: '1rem',
                                py: 2
                            }}>
                                #
                            </TableCell>
                            <TableCell sx={{ 
                                fontWeight: 700, 
                                color: '#FFFFFF',
                                fontSize: '1rem',
                                py: 2
                            }}>
                                รายละเอียด
                            </TableCell>
                            <TableCell sx={{ 
                                fontWeight: 700, 
                                color: '#FFFFFF', 
                                textAlign: 'center', 
                                width: 140,
                                fontSize: '1rem',
                                py: 2
                            }}>
                                จำนวน
                            </TableCell>
                            <TableCell sx={{ 
                                fontWeight: 700, 
                                color: '#FFFFFF', 
                                textAlign: 'right', 
                                width: 160,
                                fontSize: '1rem',
                                py: 2
                            }}>
                                ราคาต่อหน่วย
                            </TableCell>
                            <TableCell sx={{ 
                                fontWeight: 700, 
                                color: '#FFFFFF', 
                                textAlign: 'right', 
                                width: 180,
                                fontSize: '1rem',
                                py: 2
                            }}>
                                ยอดรวม
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {formData.items?.map((item, index) => {
                            const hasSizes = Array.isArray(item.sizeRows) && item.sizeRows.length > 0;
                            const rows = hasSizes ? item.sizeRows : [];
                            const sumQty = hasSizes ? rows.reduce((s, r) => s + Number(r.quantity || 0), 0) : Number(item.quantity || 0);
                            const isEven = index % 2 === 0;
                            return (
                                <React.Fragment key={item.id}>
                                    <TableRow sx={{ 
                                        bgcolor: isEven ? '#FFFFFF' : 'rgba(144, 15, 15, 0.03)',
                                        '&:hover': { bgcolor: 'rgba(144, 15, 15, 0.05)' },
                                        '& .MuiTableCell-root': { py: 2 }
                                    }}>
                                        <TableCell sx={{ 
                                            fontWeight: 700, 
                                            fontSize: '1.1rem',
                                            color: '#900F0F'
                                        }}>
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="h6" fontWeight={700} sx={{ 
                                                    mb: 0.5,
                                                    color: '#1a1a1a',
                                                    fontSize: '1.1rem'
                                                }}>
                                                    {item.name}
                                                </Typography>
                                                {[item.pattern, item.fabricType, item.color, item.size]
                                                    .filter(Boolean).length > 0 && (
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        flexWrap: 'wrap', 
                                                        gap: 1, 
                                                        mt: 1 
                                                    }}>
                                                        {[item.pattern, item.fabricType, item.color, item.size]
                                                            .filter(Boolean)
                                                            .map((spec, idx) => (
                                                                <Chip
                                                                    key={idx}
                                                                    label={spec}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: 'rgba(144, 15, 15, 0.1)',
                                                                        color: '#900F0F',
                                                                        fontWeight: 500,
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                />
                                                            ))
                                                        }
                                                    </Box>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ 
                                            textAlign: 'center', 
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                            color: '#900F0F'
                                        }}>
                                            <Box sx={{ 
                                                bgcolor: 'rgba(144, 15, 15, 0.1)', 
                                                borderRadius: 1, 
                                                py: 0.5, 
                                                px: 1,
                                                display: 'inline-block',
                                                minWidth: 80
                                            }}>
                                                {sumQty.toLocaleString()} ชิ้น
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ 
                                            textAlign: 'right', 
                                            fontWeight: 600,
                                            fontSize: '1rem'
                                        }}>
                                            {hasSizes ? (
                                                <Typography sx={{ 
                                                    color: 'text.secondary',
                                                    fontStyle: 'italic',
                                                    fontSize: '1.2rem'
                                                }}>
                                                    —
                                                </Typography>
                                            ) : (
                                                <Typography sx={{ fontWeight: 600 }}>
                                                    {formatCurrency(item.unitPrice)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ 
                                            textAlign: 'right', 
                                            fontWeight: 700, 
                                            color: '#900F0F',
                                            fontSize: '1.1rem'
                                        }}>
                                            <Box sx={{
                                                bgcolor: 'rgba(144, 15, 15, 0.1)',
                                                borderRadius: 1,
                                                py: 0.5,
                                                px: 1,
                                                display: 'inline-block',
                                                minWidth: 120
                                            }}>
                                                {formatCurrency(item.total)}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    {hasSizes && rows.map((r, rIdx) => (
                                        <TableRow key={r.uuid || `${item.id}-row-${rIdx}`} sx={{ 
                                            bgcolor: isEven ? 'rgba(144, 15, 15, 0.02)' : 'rgba(144, 15, 15, 0.05)',
                                            borderLeft: '4px solid rgba(144, 15, 15, 0.3)',
                                            '& .MuiTableCell-root': { py: 1.5 }
                                        }}>
                                            <TableCell sx={{ 
                                                borderLeft: '4px solid #900F0F',
                                                pl: 2
                                            }} />
                                            <TableCell>
                                                <Box sx={{ pl: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        bgcolor: '#900F0F'
                                                    }} />
                                                    <Typography variant="body1" sx={{ 
                                                        fontWeight: 600,
                                                        color: '#666'
                                                    }}>
                                                        ขนาด: {r.size || '-'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <Typography sx={{ 
                                                    fontWeight: 600,
                                                    color: '#900F0F'
                                                }}>
                                                    {Number(r.quantity || 0).toLocaleString()} ชิ้น
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Typography sx={{ fontWeight: 600 }}>
                                                    {formatCurrency(Number(r.unitPrice || 0))}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Typography sx={{ 
                                                    fontWeight: 700,
                                                    color: '#900F0F'
                                                }}>
                                                    {formatCurrency(Number(r.quantity || 0) * Number(r.unitPrice || 0))}
                                                </Typography>
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
                        p: 3, 
                        bgcolor: 'rgba(144, 15, 15, 0.05)',
                        border: '2px solid #900F0F',
                        borderRadius: 2
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body1" fontWeight={600}>รวมเป็นเงิน</Typography>
                            <Typography variant="body1" fontWeight={700}>
                                {formatCurrency(formData.subtotal)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body1" fontWeight={600}>ภาษีมูลค่าเพิ่ม 7%</Typography>
                            <Typography variant="body1" fontWeight={700}>
                                {formatCurrency(formData.vat)}
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 2, borderColor: '#900F0F', borderWidth: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ color: '#900F0F' }}>
                                จำนวนเงินรวมทั้งสิ้น
                            </Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ color: '#900F0F' }}>
                                {formatCurrency(formData.total)}
                            </Typography>
                        </Box>
                        
                        {formData.depositAmount > 0 && (
                            <>
                                <Divider sx={{ my: 2, borderColor: '#900F0F', borderWidth: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" sx={{ color: '#900F0F', fontWeight: 600 }}>
                                        เงินมัดจำ:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#900F0F', fontWeight: 700 }}>
                                        {formatCurrency(formData.depositAmount)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" fontWeight={600}>คงเหลือ:</Typography>
                                    <Typography variant="body2" fontWeight={700}>
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
                <Box sx={{ mt: 4 }}>
                    <Typography 
                        variant="h6" 
                        color="#900F0F" 
                        fontWeight={700} 
                        gutterBottom
                        sx={{ borderBottom: '2px solid #900F0F', pb: 1, mb: 2 }}
                    >
                        หมายเหตุ
                    </Typography>
                    <Paper sx={{ 
                        p: 3, 
                        bgcolor: '#F8F9FA', 
                        border: '2px solid #900F0F',
                        borderRadius: 2
                    }}>
                        <Typography variant="body1" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                            {formData.notes}
                        </Typography>
                    </Paper>
                </Box>
            )}

            {/* Footer */}
            <Box sx={{ mt: 5, pt: 4, borderTop: '3px solid #900F0F' }}>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ textAlign: 'center' }}>
                            ใบเสนอราคานี้มีผลบังคับใช้ 30 วัน • ราคาดังกล่าวยังไม่รวมค่าจัดส่ง (ถ้ามี)
                        </Typography>
                    </Grid>
                </Grid>
                <Grid container spacing={4}>
                    <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary" gutterBottom fontWeight={600}>
                                ผู้สั่งซื้อสินค้า
                            </Typography>
                            <Box sx={{ height: 80, borderBottom: '2px solid #900F0F', mb: 2, mt: 3 }}></Box>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                ( _________________________ )
                            </Typography>
                            <Typography variant="body2" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                วันที่ ____________
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary" gutterBottom fontWeight={600}>
                                ผู้อนุมัติ
                            </Typography>
                            <Box sx={{ height: 80, borderBottom: '2px solid #900F0F', mb: 2, mt: 3 }}></Box>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                ( _________________________ )
                            </Typography>
                            <Typography variant="body2" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                วันที่ ____________
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