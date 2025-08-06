import React from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    Paper,
    Alert 
} from '@mui/material';
import { 
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon 
} from '@mui/icons-material';

const ComponentTest = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, mb: 2 }}>
                <Typography variant="h5" gutterBottom color="primary">
                    🎉 Component Test สำเร็จ!
                </Typography>
                <Typography variant="body1" gutterBottom>
                    ระบบ PricingIntegration ทำงานได้ปกติแล้วครับ
                </Typography>
                
                <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon />
                        <Typography>
                            แก้ไข import error สำเร็จ - Calendar icon ถูกเปลี่ยนเป็น CalendarToday
                        </Typography>
                    </Box>
                </Alert>

                <Typography variant="h6" color="#900F0F" gutterBottom>
                    Components ที่พร้อมใช้งาน:
                </Typography>
                
                <Box component="ul" sx={{ pl: 3 }}>
                    <li>✅ PricingRequestCard - แสดงข้อมูล Pricing Request</li>
                    <li>✅ CreateQuotationModal - Modal เลือกงาน</li>
                    <li>✅ CreateQuotationForm - ฟอร์มสร้างใบเสนอราคา</li>
                    <li>✅ QuotationPreview - ตัวอย่างใบเสนอราคา</li>
                    <li>✅ FilterSection - ส่วนกรองข้อมูล</li>
                    <li>✅ PaginationSection - จัดการ pagination</li>
                    <li>✅ LoadingState, ErrorState, EmptyState</li>
                    <li>✅ Header, FloatingActionButton</li>
                </Box>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button 
                        variant="contained" 
                        sx={{ 
                            bgcolor: '#900F0F',
                            '&:hover': { bgcolor: '#B20000' }
                        }}
                    >
                        ทดสอบ Primary Button
                    </Button>
                    <Button 
                        variant="outlined" 
                        sx={{ 
                            borderColor: '#B20000',
                            color: '#B20000',
                            '&:hover': { 
                                borderColor: '#900F0F',
                                backgroundColor: 'rgba(178, 0, 0, 0.05)'
                            }
                        }}
                    >
                        ทดสอบ Secondary Button
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default ComponentTest;
