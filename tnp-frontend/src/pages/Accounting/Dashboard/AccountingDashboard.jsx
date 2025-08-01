import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  useTheme,
  useMediaQuery,
  Divider,
  LinearProgress,
  Tooltip,
  Fade,
  Grow
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Receipt as QuotationIcon,
  Assignment as InvoiceIcon,
  Description as ReceiptIcon,
  LocalShipping as DeliveryIcon,
  People as CustomersIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  ArrowUpward,
  ArrowDownward,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  AccountBalance as MoneyIcon,
  AccessTime as ClockIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { dashboardService } from '../../../features/Accounting';
import DocumentStatusBadge from '../components/DocumentStatusBadge';

// Enhanced mock data with FlowAccount-inspired structure
const mockDashboardData = {
  summary: {
    // Quick stats
    pendingApprovals: 15,
    overdueInvoices: 3,
    totalRevenue: 2450000,
    monthlyGrowth: 12.5,
    newCustomers: 8,
    
    // Document counts
    quotations: { total: 45, draft: 12, pending: 8, approved: 15, rejected: 3, completed: 7 },
    invoices: { total: 32, sent: 18, paid: 12, overdue: 3, partial: 2 },
    receipts: { total: 28, received: 28 },
    deliveryNotes: { total: 25, preparing: 5, ready: 8, shipped: 7, delivered: 5 }
  },
  
  // Enhanced revenue chart with more data points
  revenueChart: [
    { month: 'ส.ค.', revenue: 165000, quotations: 10, invoices: 8, growth: -5.2 },
    { month: 'ก.ย.', revenue: 185000, quotations: 12, invoices: 10, growth: 12.1 },
    { month: 'ต.ค.', revenue: 220000, quotations: 15, invoices: 13, growth: 18.9 },
    { month: 'พ.ย.', revenue: 195000, quotations: 11, invoices: 9, growth: -11.4 },
    { month: 'ธ.ค.', revenue: 280000, quotations: 18, invoices: 16, growth: 43.6 },
    { month: 'ม.ค.', revenue: 315000, quotations: 22, invoices: 19, growth: 12.5 }
  ],
  
  // Status distribution for pie chart
  statusDistribution: [
    { name: 'อนุมัติแล้ว', value: 45, color: '#4caf50' },
    { name: 'รอตรวจ', value: 15, color: '#ff9800' },
    { name: 'ร่าง', value: 12, color: '#2196f3' },
    { name: 'เสร็จสิ้น', value: 28, color: '#00bcd4' },
    { name: 'ปฏิเสธ', value: 3, color: '#f44336' }
  ],
  
  // Recent activities timeline
  recentActivities: [
    {
      id: 1,
      type: 'quotation',
      action: 'created',
      title: 'สร้างใบเสนอราคา QT202501-0045',
      customer: 'บริษัท ABC จำกัด',
      amount: 125000,
      timestamp: '10:30',
      status: 'draft',
      user: 'คุณสมชาย'
    },
    {
      id: 2,
      type: 'invoice',
      action: 'approved',
      title: 'อนุมัติใบแจ้งหนี้ INV202501-0123',
      customer: 'ร้าน XYZ',
      amount: 89500,
      timestamp: '09:15',
      status: 'approved',
      user: 'คุณสมใจ'
    },
    {
      id: 3,
      type: 'receipt',
      action: 'sent',
      title: 'ส่งใบกำกับภาษี RCPT202501-0089',
      customer: 'บริษัท DEF จำกัด',
      amount: 67800,
      timestamp: '08:45',
      status: 'sent',
      user: 'คุณสมศักดิ์'
    },
    {
      id: 4,
      type: 'quotation',
      action: 'converted',
      title: 'แปลงใบเสนอราคา QT202501-0044 เป็นใบแจ้งหนี้',
      customer: 'บริษัท GHI จำกัด',
      amount: 156000,
      timestamp: '08:20',
      status: 'converted',
      user: 'ระบบอัตโนมัติ'
    },
    {
      id: 5,
      type: 'invoice',
      action: 'paid',
      title: 'รับชำระใบแจ้งหนี้ INV202501-0120',
      customer: 'ร้าน JKL',
      amount: 45000,
      timestamp: '07:55',
      status: 'paid',
      user: 'คุณสมหญิง'
    }
  ],
  
  // Top customers
  topCustomers: [
    { name: 'บริษัท ABC จำกัด', amount: 450000, orders: 12, growth: 15.2 },
    { name: 'ร้าน XYZ', amount: 380000, orders: 8, growth: -5.1 },
    { name: 'บริษัท DEF จำกัด', amount: 320000, orders: 15, growth: 28.5 },
    { name: 'บริษัท GHI จำกัด', amount: 280000, orders: 6, growth: 8.7 },
    { name: 'ร้าน JKL', amount: 195000, orders: 9, growth: -12.3 }
  ]
};

// Enhanced summary card with FlowAccount-inspired design
const SummaryCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary', 
  trend = null, 
  onClick = null,
  loading = false,
  gradient = false 
}) => {
  const theme = useTheme();
  
  return (
    <Grow in timeout={500}>
      <Card 
        sx={{ 
          height: '100%', 
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
          ...(gradient && {
            background: `linear-gradient(135deg, ${theme.palette[color]?.main}15 0%, ${theme.palette[color]?.light}25 100%)`,
          }),
          '&:hover': {
            ...(onClick && {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
            })
          },
          transition: 'all 0.3s ease-in-out'
        }}
        onClick={onClick}
        elevation={2}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
            <Avatar 
              sx={{ 
                bgcolor: `${color}.main`, 
                color: 'white',
                width: 48,
                height: 48,
                boxShadow: theme.shadows[4]
              }}
            >
              {icon}
            </Avatar>
            {trend !== null && (
              <Chip
                label={`${trend > 0 ? '+' : ''}${trend}%`}
                color={trend > 0 ? 'success' : 'error'}
                size="small"
                icon={trend > 0 ? <ArrowUpward /> : <ArrowDownward />}
                sx={{
                  fontWeight: 'bold',
                  '& .MuiChip-icon': {
                    fontSize: '0.875rem'
                  }
                }}
              />
            )}
          </Box>
          
          <Box sx={{ mb: 1 }}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography 
                variant="h3" 
                component="div" 
                fontWeight="bold"
                color={`${color}.main`}
                sx={{ fontFamily: 'KanitSemiBold' }}
              >
                {typeof value === 'number' ? value.toLocaleString() : value}
              </Typography>
            )}
          </Box>
          
          <Typography 
            variant="h6" 
            color="text.primary" 
            gutterBottom
            sx={{ fontFamily: 'Kanit', fontWeight: 500 }}
          >
            {title}
          </Typography>
          
          {subtitle && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontFamily: 'Kanit' }}
            >
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grow>
  );
};

// Enhanced chart wrapper with actions
const ChartCard = ({ title, children, action = null, loading = false }) => (
  <Fade in timeout={600}>
    <Card sx={{ height: '100%' }} elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ fontFamily: 'KanitSemiBold', fontWeight: 'bold' }}
          >
            {title}
          </Typography>
          {action}
        </Box>
        <Box sx={{ height: 300, width: '100%', position: 'relative' }}>
          {loading && (
            <Box 
              sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {children}
        </Box>
      </CardContent>
    </Card>
  </Fade>
);

// Activity item component
const ActivityItem = ({ activity, onClick }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'quotation': return <QuotationIcon />;
      case 'invoice': return <InvoiceIcon />;
      case 'receipt': return <ReceiptIcon />;
      case 'delivery': return <DeliveryIcon />;
      default: return <TimelineIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'quotation': return 'secondary';
      case 'invoice': return 'warning';
      case 'receipt': return 'success';
      case 'delivery': return 'info';
      default: return 'primary';
    }
  };

  return (
    <ListItem 
      sx={{ 
        borderRadius: 2, 
        mb: 1,
        '&:hover': { 
          bgcolor: 'action.hover',
          cursor: 'pointer'
        }
      }}
      onClick={() => onClick?.(activity)}
    >
      <ListItemIcon>
        <Avatar 
          sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: `${getActivityColor(activity.type)}.light`,
            color: `${getActivityColor(activity.type)}.main`
          }}
        >
          {getActivityIcon(activity.type)}
        </Avatar>
      </ListItemIcon>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: 'Kanit', fontWeight: 500 }}>
              {activity.title}
            </Typography>
            <DocumentStatusBadge status={activity.status} size="small" />
          </Box>
        }
        secondary={
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Kanit' }}>
              {activity.customer} • ฿{activity.amount.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Kanit' }}>
              {activity.timestamp} โดย {activity.user}
            </Typography>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <IconButton size="small">
          <ViewIcon fontSize="small" />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

const AccountingDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState(mockDashboardData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('6months');

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      setTimeout(() => {
        setDashboardData(mockDashboardData);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleActivityClick = (activity) => {
    // Navigate to the appropriate document page
    const paths = {
      quotation: '/accounting/quotations',
      invoice: '/accounting/invoices',
      receipt: '/accounting/receipts',
      delivery: '/accounting/delivery-notes'
    };
    navigate(paths[activity.type] || '/accounting');
  };

  if (loading && !dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Enhanced Header with Quick Actions */}
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', md: 'center' }}
        mb={4}
        gap={2}
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ fontFamily: 'KanitSemiBold', fontWeight: 'bold', mb: 1 }}
          >
            Dashboard ระบบบัญชี
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Kanit' }}>
            ภาพรวมธุรกิจและการเงินแบบเรียลไทม์
          </Typography>
        </Box>
        
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ fontFamily: 'Kanit' }}>ช่วงเวลา</InputLabel>
            <Select
              value={timeRange}
              label="ช่วงเวลา"
              onChange={handleTimeRangeChange}
              sx={{ fontFamily: 'Kanit' }}
            >
              <MenuItem value="1month" sx={{ fontFamily: 'Kanit' }}>1 เดือน</MenuItem>
              <MenuItem value="3months" sx={{ fontFamily: 'Kanit' }}>3 เดือน</MenuItem>
              <MenuItem value="6months" sx={{ fontFamily: 'Kanit' }}>6 เดือน</MenuItem>
              <MenuItem value="1year" sx={{ fontFamily: 'Kanit' }}>1 ปี</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="รีเฟรชข้อมูล">
            <IconButton 
              onClick={handleRefresh} 
              color="primary"
              disabled={loading}
              sx={{
                '&:hover': {
                  transform: 'rotate(180deg)',
                  transition: 'transform 0.3s ease-in-out'
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/accounting/quotations/new')}
            sx={{ minWidth: 140 }}
          >
            สร้างใบเสนอราคา
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, fontFamily: 'Kanit' }}>
          {error}
        </Alert>
      )}

      {/* Enhanced Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="รอดำเนินการ"
            value={dashboardData.summary.pendingApprovals}
            subtitle="รายการรอตรวจสอบ"
            icon={<ClockIcon />}
            color="warning"
            trend={null}
            onClick={() => navigate('/accounting/quotations?status=pending_review')}
            gradient
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="รอเก็บเงิน"
            value={`฿${(dashboardData.summary.totalRevenue * 0.3 / 1000).toFixed(0)}K`}
            subtitle={`เกินกำหนด ${dashboardData.summary.overdueInvoices} ใบ`}
            icon={<MoneyIcon />}
            color="error"
            trend={-5.2}
            onClick={() => navigate('/accounting/invoices?status=overdue')}
            gradient
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="ยอดขายเดือนนี้"
            value={`฿${(dashboardData.summary.totalRevenue / 1000000).toFixed(1)}M`}
            subtitle={`+${dashboardData.summary.monthlyGrowth}% จากเดือนที่แล้ว`}
            icon={<TrendingUpIcon />}
            color="success"
            trend={dashboardData.summary.monthlyGrowth}
            onClick={() => navigate('/accounting/reports')}
            gradient
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="ลูกค้าใหม่"
            value={dashboardData.summary.newCustomers}
            subtitle="รายใหม่เดือนนี้"
            icon={<CustomersIcon />}
            color="info"
            trend={15.3}
            onClick={() => navigate('/accounting/customers')}
            gradient
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Enhanced Charts Section */}
      <Grid container spacing={3} mb={4}>
        {/* Revenue Trend Chart */}
        <Grid item xs={12} lg={8}>
          <ChartCard 
            title="ยอดขายรายเดือน" 
            loading={loading}
            action={
              <Chip 
                label={`เติบโต ${dashboardData.summary.monthlyGrowth}%`}
                color={dashboardData.summary.monthlyGrowth > 0 ? 'success' : 'error'}
                size="small"
                icon={dashboardData.summary.monthlyGrowth > 0 ? <ArrowUpward /> : <ArrowDownward />}
              />
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.revenueChart}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="month" 
                  stroke={theme.palette.text.secondary}
                  style={{ fontFamily: 'Kanit' }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  style={{ fontFamily: 'Kanit' }}
                />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontFamily: 'Kanit'
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `฿${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'ยอดขาย' : 'ใบเสนอราคา'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={theme.palette.primary.main}
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                  dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: theme.palette.primary.main, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} lg={4}>
          <ChartCard title="สถานะเอกสาร" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    fontFamily: 'Kanit'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Fade in timeout={800}>
            <Card elevation={2}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography 
                    variant="h6" 
                    sx={{ fontFamily: 'KanitSemiBold', fontWeight: 'bold' }}
                  >
                    📋 กิจกรรมล่าสุด
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/accounting/reports')}
                    sx={{ fontFamily: 'Kanit' }}
                  >
                    ดูทั้งหมด
                  </Button>
                </Box>
                
                <List sx={{ py: 0 }}>
                  {dashboardData.recentActivities.slice(0, 5).map((activity, index) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      onClick={handleActivityClick}
                    />
                  ))}
                </List>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
        
        {/* Quick Stats */}
        <Grid item xs={12} lg={4}>
          <Fade in timeout={1000}>
            <Card elevation={2}>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  sx={{ fontFamily: 'KanitSemiBold', fontWeight: 'bold', mb: 3 }}
                >
                  📈 สรุปสถิติ
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" sx={{ fontFamily: 'Kanit' }}>
                      ใบเสนอราคาที่อนุมัติ
                    </Typography>
                    <Typography variant="h6" color="success.main" sx={{ fontFamily: 'KanitSemiBold' }}>
                      {dashboardData.summary.quotations.approved}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(dashboardData.summary.quotations.approved / dashboardData.summary.quotations.total) * 100}
                    color="success"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" sx={{ fontFamily: 'Kanit' }}>
                      ใบแจ้งหนี้ที่ชำระแล้ว
                    </Typography>
                    <Typography variant="h6" color="primary.main" sx={{ fontFamily: 'KanitSemiBold' }}>
                      {dashboardData.summary.invoices.paid}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(dashboardData.summary.invoices.paid / dashboardData.summary.invoices.total) * 100}
                    color="primary"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
                
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" sx={{ fontFamily: 'Kanit' }}>
                      ใบส่งของที่ส่งมอบแล้ว
                    </Typography>
                    <Typography variant="h6" color="info.main" sx={{ fontFamily: 'KanitSemiBold' }}>
                      {dashboardData.summary.deliveryNotes.delivered}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(dashboardData.summary.deliveryNotes.delivered / dashboardData.summary.deliveryNotes.total) * 100}
                    color="info"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AccountingDashboard; 