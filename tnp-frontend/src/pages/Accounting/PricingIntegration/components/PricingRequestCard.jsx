import React from 'react';
import {
    Box,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Chip,
    Avatar,
    Stack,
    Divider,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';

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

export default PricingRequestCard;
