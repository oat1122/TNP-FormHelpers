import React, { useState, useEffect } from 'react';
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
  InputLabel
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { dashboardService } from '../../../features/Accounting';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Mock data - จะต้องเปลี่ยนเป็นข้อมูลจริงจาก API
const mockDashboardData = {
  summary: {
    totalQuotations: 45,
    totalInvoices: 32,
    totalReceipts: 28,
    totalDeliveryNotes: 25,
    pendingApprovals: 8,
    overdueInvoices: 3,
    totalRevenue: 2450000,
    monthlyGrowth: 12.5
  },
  revenueChart: [
    { month: 'ม.ค.', revenue: 185000, quotations: 12 },
    { month: 'ก.พ.', revenue: 220000, quotations: 15 },
    { month: 'มี.ค.', revenue: 195000, quotations: 11 },
    { month: 'เม.ย.', revenue: 280000, quotations: 18 },
    { month: 'พ.ค.', revenue: 315000, quotations: 22 },
    { month: 'มิ.ย.', revenue: 290000, quotations: 19 }
  ],
  statusDistribution: [
    { name: 'อนุมัติแล้ว', value: 45, color: '#00C49F' },
    { name: 'รอตรวจ', value: 12, color: '#FFBB28' },
    { name: 'ปฏิเสธ', value: 3, color: '#FF8042' },
    { name: 'เสร็จสิ้น', value: 28, color: '#0088FE' }
  ]
};

// Summary card component
const SummaryCard = ({ title, value, subtitle, icon, color = 'primary', trend = null }) => (
  <Card sx={{ height: '100%', position: 'relative' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>
          {icon}
        </Avatar>
        {trend && (
          <Chip
            label={`${trend > 0 ? '+' : ''}${trend}%`}
            color={trend > 0 ? 'success' : 'error'}
            size="small"
            icon={<TrendingUpIcon />}
          />
        )}
      </Box>
      <Typography variant="h4" component="div" gutterBottom fontWeight="bold">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// Chart wrapper component
const ChartCard = ({ title, children, action = null }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ height: 300, width: '100%' }}>
        {children}
      </Box>
    </CardContent>
  </Card>
);

const AccountingDashboard = () => {
  const [dashboardData, setDashboardData] = useState(mockDashboardData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [anchorEl, setAnchorEl] = useState(null);

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // const response = await dashboardService.getDashboardSummary({ time_range: timeRange });
      // setDashboardData(response.data);
      
      // For now, use mock data
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard ระบบบัญชี
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>ช่วงเวลา</InputLabel>
            <Select
              value={timeRange}
              label="ช่วงเวลา"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="1month">1 เดือน</MenuItem>
              <MenuItem value="3months">3 เดือน</MenuItem>
              <MenuItem value="6months">6 เดือน</MenuItem>
              <MenuItem value="1year">1 ปี</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="ใบเสนอราคา"
            value={dashboardData.summary.totalQuotations}
            subtitle="ทั้งหมดในเดือนนี้"
            icon={<QuotationIcon />}
            color="primary"
            trend={8.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="ใบแจ้งหนี้"
            value={dashboardData.summary.totalInvoices}
            subtitle={`เกินกำหนด ${dashboardData.summary.overdueInvoices} ใบ`}
            icon={<InvoiceIcon />}
            color="warning"
            trend={-2.1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="รอการอนุมัติ"
            value={dashboardData.summary.pendingApprovals}
            subtitle="เอกสารรอดำเนินการ"
            icon={<WarningIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="ยอดขายรวม"
            value={`฿${(dashboardData.summary.totalRevenue / 1000000).toFixed(1)}M`}
            subtitle="ในเดือนนี้"
            icon={<TrendingUpIcon />}
            color="success"
            trend={dashboardData.summary.monthlyGrowth}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={4}>
        {/* Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <ChartCard title="ยอดขายรายเดือน">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `฿${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'ยอดขาย' : 'ใบเสนอราคา'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} lg={4}>
          <ChartCard title="สถานะเอกสาร">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Quick Actions or Recent Activities can go here */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                การดำเนินการล่าสุด
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ฟีเจอร์นี้จะแสดงกิจกรรมล่าสุดของระบบ เช่น เอกสารที่สร้างใหม่ การอนุมัติ การปฏิเสธ ฯลฯ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AccountingDashboard; 