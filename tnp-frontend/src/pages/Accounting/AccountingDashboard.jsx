import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Tabs,
    Tab,
    Button,
    Chip,
    IconButton,
    Badge,
    Avatar,
    Divider,
    Stack,
    LinearProgress,
    Paper,
    CardActions,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Assignment as AssignmentIcon,
    Receipt as ReceiptIcon,
    LocalShipping as DeliveryIcon,
    AccountBalance as InvoiceIcon,
    Add as AddIcon,
    Notifications as NotificationsIcon,
    Dashboard as DashboardIcon,
    MoreVert as MoreVertIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import accountingTheme from './theme/accountingTheme';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectActiveStep,
    selectDashboardStats,
    selectUnreadNotifications,
    setActiveStep,
    addNotification
} from '../../features/Accounting/accountingSlice';
import { useGetDashboardStatsQuery } from '../../features/Accounting/accountingApi';

// Custom Hook สำหรับ Dashboard Data
const useDashboardData = () => {
    const { data: stats, isLoading, error } = useGetDashboardStatsQuery();

    return {
        stats: stats || {
            totalQuotations: 0,
            pendingApprovals: 0,
            completedDeliveries: 0,
            monthlyRevenue: 0,
            recentActivities: [],
        },
        isLoading,
        error,
    };
};

// Dashboard Stats Card Component
const StatsCard = ({ icon: Icon, title, value, subtitle, color = 'primary', trend, onClick }) => (
    <Card
        sx={{
            height: '100%',
            cursor: onClick ? 'pointer' : 'default',
            '&:hover': onClick ? {
                transform: 'translateY(-2px)',
                boxShadow: 4,
            } : {},
            transition: 'all 0.2s ease-in-out',
        }}
        onClick={onClick}
    >
        <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="h4" component="div" color={`${color}.main`} fontWeight={600}>
                        {value?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                    {trend && (
                        <Box display="flex" alignItems="center" mt={1}>
                            <TrendingUpIcon
                                fontSize="small"
                                color={trend > 0 ? 'success' : 'error'}
                                sx={{ mr: 0.5 }}
                            />
                            <Typography
                                variant="caption"
                                color={trend > 0 ? 'success.main' : 'error.main'}
                            >
                                {trend > 0 ? '+' : ''}{trend}% จากเดือนที่แล้ว
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Avatar
                    sx={{
                        bgcolor: `${color}.main`,
                        width: 56,
                        height: 56,
                    }}
                >
                    <Icon fontSize="large" />
                </Avatar>
            </Box>
        </CardContent>
    </Card>
);

// Quick Action Button Component
const QuickActionButton = ({ icon: Icon, label, color = 'primary', onClick }) => (
    <Button
        variant="contained"
        color={color}
        size="large"
        startIcon={<Icon />}
        onClick={onClick}
        sx={{
            py: 2,
            px: 3,
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            minWidth: 200,
            '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: 4,
            },
            transition: 'all 0.2s ease-in-out',
        }}
    >
        {label}
    </Button>
);

// Recent Activity Item Component
const ActivityItem = ({ activity }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'error';
            default: return 'primary';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircleIcon fontSize="small" />;
            case 'pending': return <ScheduleIcon fontSize="small" />;
            case 'failed': return <WarningIcon fontSize="small" />;
            default: return <AssignmentIcon fontSize="small" />;
        }
    };

    return (
        <Box display="flex" alignItems="center" py={1.5}>
            <Avatar
                sx={{
                    bgcolor: `${getStatusColor(activity.status)}.main`,
                    width: 40,
                    height: 40,
                    mr: 2,
                }}
            >
                {getStatusIcon(activity.status)}
            </Avatar>
            <Box flex={1}>
                <Typography variant="body2" fontWeight={500}>
                    {activity.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {activity.description}
                </Typography>
            </Box>
            <Box textAlign="right">
                <Chip
                    label={activity.status}
                    color={getStatusColor(activity.status)}
                    size="small"
                    sx={{ mb: 0.5 }}
                />
                <Typography variant="caption" color="text.secondary" display="block">
                    {activity.time}
                </Typography>
            </Box>
        </Box>
    );
};

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`accounting-tabpanel-${index}`}
        aria-labelledby={`accounting-tab-${index}`}
        {...other}
    >
        {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
);

// Main Accounting Dashboard Component
const AccountingDashboard = () => {
    const dispatch = useDispatch();
    const activeStep = useSelector(selectActiveStep);
    const unreadNotifications = useSelector(selectUnreadNotifications);
    const { stats, isLoading, error } = useDashboardData();

    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleStepChange = (step) => {
        dispatch(setActiveStep(step));
    };

    const handleQuickAction = (action) => {
        dispatch(addNotification({
            type: 'info',
            title: 'เริ่มต้นการทำงาน',
            message: `กำลังไปยังหน้า ${action}`,
        }));

        // Route to specific page based on action
        switch (action) {
            case 'pricing':
                handleStepChange('pricing');
                break;
            case 'quotation':
                handleStepChange('quotation');
                break;
            case 'invoice':
                handleStepChange('invoice');
                break;
            case 'receipt':
                handleStepChange('receipt');
                break;
            case 'delivery':
                handleStepChange('delivery');
                break;
            default:
                break;
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress color="primary" />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="error">
                    เกิดข้อผิดพลาดในการโหลดข้อมูล
                </Typography>
            </Box>
        );
    }

    return (
        <ThemeProvider theme={accountingTheme}>
            <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
                {/* Header Section */}
                <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 4 }}>
                    <Container maxWidth="xl">
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography variant="h3" component="h1" gutterBottom>
                                    ระบบบัญชี TNP
                                </Typography>
                                <Typography variant="subtitle1">
                                    จัดการใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ และการจัดส่ง
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={2}>
                                <IconButton
                                    color="inherit"
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                                    }}
                                >
                                    <Badge badgeContent={unreadNotifications.length} color="error">
                                        <NotificationsIcon />
                                    </Badge>
                                </IconButton>
                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                    <DashboardIcon />
                                </Avatar>
                            </Box>
                        </Box>
                    </Container>
                </Box>

                <Container maxWidth="xl" sx={{ py: 4 }}>
                    {/* Navigation Tabs */}
                    <Paper sx={{ mb: 4 }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant="fullWidth"
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab label="Dashboard" icon={<DashboardIcon />} />
                            <Tab label="ภาพรวม" icon={<TrendingUpIcon />} />
                            <Tab label="รายงาน" icon={<AssignmentIcon />} />
                        </Tabs>
                    </Paper>

                    {/* Tab Panel 0: Dashboard */}
                    <TabPanel value={tabValue} index={0}>
                        {/* Stats Cards */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    icon={AssignmentIcon}
                                    title="ใบเสนอราคา"
                                    value={stats.totalQuotations}
                                    subtitle="ทั้งหมดในเดือนนี้"
                                    color="primary"
                                    trend={12}
                                    onClick={() => handleQuickAction('quotation')}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    icon={InvoiceIcon}
                                    title="รออนุมัติ"
                                    value={stats.pendingApprovals}
                                    subtitle="เอกสารที่รออนุมัติ"
                                    color="warning"
                                    onClick={() => handleQuickAction('approval')}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    icon={DeliveryIcon}
                                    title="จัดส่งสำเร็จ"
                                    value={stats.completedDeliveries}
                                    subtitle="การจัดส่งในเดือนนี้"
                                    color="success"
                                    trend={8}
                                    onClick={() => handleQuickAction('delivery')}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    icon={ReceiptIcon}
                                    title="รายได้"
                                    value={stats.monthlyRevenue}
                                    subtitle="บาท (เดือนนี้)"
                                    color="secondary"
                                    trend={15}
                                />
                            </Grid>
                        </Grid>

                        {/* Quick Actions */}
                        <Paper sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h5" gutterBottom color="primary">
                                การทำงานด่วน
                            </Typography>
                            <Divider sx={{ mb: 3 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={2.4}>
                                    <QuickActionButton
                                        icon={AddIcon}
                                        label="นำเข้างาน Pricing"
                                        color="primary"
                                        onClick={() => handleQuickAction('pricing')}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2.4}>
                                    <QuickActionButton
                                        icon={AssignmentIcon}
                                        label="สร้างใบเสนอราคา"
                                        color="secondary"
                                        onClick={() => handleQuickAction('quotation')}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2.4}>
                                    <QuickActionButton
                                        icon={InvoiceIcon}
                                        label="สร้างใบแจ้งหนี้"
                                        color="info"
                                        onClick={() => handleQuickAction('invoice')}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2.4}>
                                    <QuickActionButton
                                        icon={ReceiptIcon}
                                        label="บันทึกการชำระ"
                                        color="success"
                                        onClick={() => handleQuickAction('receipt')}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2.4}>
                                    <QuickActionButton
                                        icon={DeliveryIcon}
                                        label="จัดการจัดส่ง"
                                        color="warning"
                                        onClick={() => handleQuickAction('delivery')}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Recent Activities */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} lg={8}>
                                <Card>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                            <Typography variant="h6" color="primary">
                                                กิจกรรมล่าสุด
                                            </Typography>
                                            <IconButton size="small">
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>
                                        <Divider sx={{ mb: 2 }} />
                                        {stats.recentActivities?.length > 0 ? (
                                            stats.recentActivities.map((activity, index) => (
                                                <div key={index}>
                                                    <ActivityItem activity={activity} />
                                                    {index < stats.recentActivities.length - 1 && <Divider />}
                                                </div>
                                            ))
                                        ) : (
                                            <Box textAlign="center" py={4}>
                                                <Typography variant="body2" color="text.secondary">
                                                    ยังไม่มีกิจกรรมล่าสุด
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'center' }}>
                                        <Button size="small" color="primary">
                                            ดูทั้งหมด
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>

                            <Grid item xs={12} lg={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" color="primary" gutterBottom>
                                            สถิติการใช้งาน
                                        </Typography>
                                        <Divider sx={{ mb: 3 }} />

                                        <Box mb={3}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                ความสำเร็จในการจัดส่ง
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={85}
                                                sx={{ height: 8, borderRadius: 4 }}
                                                color="success"
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                85% สำเร็จ
                                            </Typography>
                                        </Box>

                                        <Box mb={3}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                อนุมัติใบเสนอราคา
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={92}
                                                sx={{ height: 8, borderRadius: 4 }}
                                                color="primary"
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                92% อนุมัติ
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                การชำระเงินตรงเวลา
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={78}
                                                sx={{ height: 8, borderRadius: 4 }}
                                                color="info"
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                78% ตรงเวลา
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab Panel 1: Overview */}
                    <TabPanel value={tabValue} index={1}>
                        <Typography variant="h6" gutterBottom>
                            ภาพรวมของระบบ
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            เนื้อหาภาพรวมจะแสดงที่นี่...
                        </Typography>
                    </TabPanel>

                    {/* Tab Panel 2: Reports */}
                    <TabPanel value={tabValue} index={2}>
                        <Typography variant="h6" gutterBottom>
                            รายงานต่างๆ
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            เนื้อหารายงานจะแสดงที่นี่...
                        </Typography>
                    </TabPanel>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default AccountingDashboard;
