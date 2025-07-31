import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { dashboardService } from '../../features/Accounting';
import {
  Box,
  Drawer,
  AppBar,
  CssBaseline,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Chip,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Container,
  Tooltip,
  Skeleton,
  Alert
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as QuotationIcon,
  Assignment as InvoiceIcon,
  Description as ReceiptIcon,
  LocalShipping as DeliveryIcon,
  People as CustomersIcon,
  Inventory as ProductsIcon,
  Analytics as AnalyticsIcon,
  ChevronLeft as ChevronLeftIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const drawerWidth = 280;

// Navigation items based on doce.md requirements
const navigationItems = [
  {
    title: 'Dashboard',
    path: '/accounting',
    icon: <DashboardIcon />,
    badge: null
  },
  {
    title: 'ใบเสนอราคา',
    path: '/accounting/quotations',
    icon: <QuotationIcon />,
    badge: 'pending_count'
  },
  {
    title: 'ใบแจ้งหนี้',
    path: '/accounting/invoices', 
    icon: <InvoiceIcon />,
    badge: 'overdue_count'
  },
  {
    title: 'ใบเสร็จ/ใบกำกับภาษี',
    path: '/accounting/receipts',
    icon: <ReceiptIcon />,
    badge: null
  },
  {
    title: 'ใบส่งของ',
    path: '/accounting/delivery-notes',
    icon: <DeliveryIcon />,
    badge: null
  },
  {
    title: 'ลูกค้า',
    path: '/accounting/customers',
    icon: <CustomersIcon />,
    badge: null
  },
  {
    title: 'สินค้า',
    path: '/accounting/products',
    icon: <ProductsIcon />,
    badge: null
  },
  {
    title: 'รายงาน',
    path: '/accounting/reports',
    icon: <AnalyticsIcon />,
    badge: null
  }
];

// Status filter tabs for document pages
const getStatusTabs = (documentType) => {
  const commonTabs = [
    { label: 'ทั้งหมด', value: 'all' },
    { label: 'รอตรวจ', value: 'pending_review' },
    { label: 'อนุมัติแล้ว', value: 'approved' },
    { label: 'ปฏิเสธ', value: 'rejected' },
    { label: 'เสร็จสิ้น', value: 'completed' }
  ];
  
  if (documentType === 'invoice') {
    return [
      ...commonTabs,
      { label: 'เกินกำหนด', value: 'overdue' }
    ];
  }
  
  return commonTabs;
};

const AccountingLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // State for managing badge counts and loading state
  const [badgeCounts, setBadgeCounts] = useState({
    pending_count: 0,
    overdue_count: 0
  });
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [error, setError] = useState(null);

  // Fetch badge counts from API
  const fetchBadgeCounts = useCallback(async () => {
    try {
      setIsLoadingCounts(true);
      setError(null);
      
      // Use real API endpoints from dashboardService
      const [pendingData, overdueData] = await Promise.all([
        dashboardService.getPendingApprovals().catch(() => ({ data: { count: 0 } })),
        dashboardService.getOverdueSummary().catch(() => ({ data: { count: 0 } }))
      ]);
      
      setBadgeCounts({
        pending_count: pendingData.data?.count || 0,
        overdue_count: overdueData.data?.count || 0
      });
    } catch (err) {
      console.error('Error fetching badge counts:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
      // Fallback to mock data in case of error
      setBadgeCounts({
        pending_count: 3,
        overdue_count: 1
      });
    } finally {
      setIsLoadingCounts(false);
    }
  }, []);

  // Load badge counts on component mount
  useEffect(() => {
    fetchBadgeCounts();
    
    // Set up polling for real-time updates (every 5 minutes)
    const interval = setInterval(fetchBadgeCounts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchBadgeCounts]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const isDocumentPage = () => {
    const documentPages = ['/accounting/quotations', '/accounting/invoices', '/accounting/receipts', '/accounting/delivery-notes'];
    return documentPages.some(page => location.pathname.startsWith(page));
  };

  const getDocumentType = () => {
    if (location.pathname.startsWith('/accounting/quotations')) return 'quotation';
    if (location.pathname.startsWith('/accounting/invoices')) return 'invoice';
    if (location.pathname.startsWith('/accounting/receipts')) return 'receipt';
    if (location.pathname.startsWith('/accounting/delivery-notes')) return 'delivery-note';
    return null;
  };

  // Enhanced drawer component with loading states and tooltips
  const drawer = (
    <div>
      <Toolbar>
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ 
            color: 'error.main', 
            fontWeight: 'bold',
            fontFamily: 'KanitSemiBold'
          }}
        >
          ระบบบัญชี
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ ml: 'auto' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert 
            severity="warning" 
            size="small"
            action={
              <IconButton 
                size="small" 
                onClick={fetchBadgeCounts}
                disabled={isLoadingCounts}
              >
                <NotificationsIcon fontSize="small" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        </Box>
      )}
      
      <List>
        {navigationItems.map((item) => {
          const isSelected = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const badgeCount = item.badge ? badgeCounts[item.badge] : 0;
          
          return (
            <ListItem key={item.path} disablePadding>
              <Tooltip title={item.title} placement="right" arrow>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'error.light',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'error.main',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'error.light',
                      color: 'white',
                    },
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.badge && badgeCount > 0 ? (
                      isLoadingCounts ? (
                        <Skeleton variant="circular" width={24} height={24} />
                      ) : (
                        <Badge 
                          badgeContent={badgeCount} 
                          color="warning"
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: '#ff9800',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }
                          }}
                        >
                          {item.icon}
                        </Badge>
                      )
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontFamily: 'Kanit'
                    }}
                  />
                  {isLoadingCounts && item.badge && (
                    <Skeleton variant="rectangular" width={20} height={12} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Additional Actions */}
      <List>
        <ListItem disablePadding>
          <Tooltip title="ตั้งค่า" placement="right" arrow>
            <ListItemButton
              sx={{
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: 'grey.100'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="ตั้งค่า"
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontFamily: 'Kanit'
                }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => location.pathname.startsWith(item.path))?.title || 'ระบบบัญชี'}
          </Typography>

          {/* User info or actions can go here */}
        </Toolbar>
        
        {/* Enhanced Status tabs for document pages */}
        {isDocumentPage() && (
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            bgcolor: 'background.paper',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Container maxWidth="xl">
              <Tabs
                value={new URLSearchParams(location.search).get('status') || 'all'}
                onChange={(event, newValue) => {
                  const url = new URL(window.location);
                  if (newValue === 'all') {
                    url.searchParams.delete('status');
                  } else {
                    url.searchParams.set('status', newValue);
                  }
                  navigate(url.pathname + url.search);
                }}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    minWidth: 'auto',
                    fontSize: '0.875rem',
                    fontFamily: 'Kanit',
                    textTransform: 'none',
                    '&.Mui-selected': {
                      color: 'error.main',
                      fontWeight: 'bold'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'error.main',
                    height: 3
                  }
                }}
              >
                {getStatusTabs(getDocumentType()).map((tab) => {
                  // Add badge for specific status tabs
                  const tabBadge = tab.value === 'pending_review' ? badgeCounts.pending_count :
                                   tab.value === 'overdue' ? badgeCounts.overdue_count : 0;
                  
                  return (
                    <Tab 
                      key={tab.value}
                      label={
                        tabBadge > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {tab.label}
                            <Chip 
                              label={tabBadge} 
                              size="small" 
                              color="error" 
                              sx={{ 
                                height: 16, 
                                minWidth: 16,
                                '& .MuiChip-label': {
                                  fontSize: '0.7rem',
                                  px: 0.5
                                }
                              }} 
                            />
                          </Box>
                        ) : tab.label
                      }
                      value={tab.value}
                    />
                  );
                })}
              </Tabs>
            </Container>
          </Box>
        )}
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Enhanced Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: isDocumentPage() ? '128px' : '64px', // Account for status tabs
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'grey.50'
        }}
      >
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Breadcrumb or page context can be added here */}
          <Box sx={{ 
            mb: 2,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: 'KanitSemiBold',
                color: 'text.primary',
                mb: 1
              }}
            >
              {navigationItems.find(item => location.pathname.startsWith(item.path))?.title || 'ระบบบัญชี'}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontFamily: 'Kanit' }}
            >
              จัดการข้อมูลด้านบัญชีและการเงิน
            </Typography>
          </Box>
          
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AccountingLayout; 