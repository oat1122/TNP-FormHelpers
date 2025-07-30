import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  Container
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

  // Mock badge counts (จะต้องดึงจาก API จริง)
  const badgeCounts = {
    pending_count: 5,
    overdue_count: 2
  };

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

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          ระบบบัญชี
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ ml: 'auto' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
              onClick={() => handleNavigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                {item.badge && badgeCounts[item.badge] ? (
                  <Badge badgeContent={badgeCounts[item.badge]} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: location.pathname.startsWith(item.path) ? 'bold' : 'normal'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
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
        
        {/* Status tabs for document pages */}
        {isDocumentPage() && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
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
              >
                {getStatusTabs(getDocumentType()).map((tab) => (
                  <Tab 
                    key={tab.value}
                    label={tab.label} 
                    value={tab.value}
                    sx={{ minWidth: 'auto', fontSize: '0.875rem' }}
                  />
                ))}
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

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: isDocumentPage() ? '128px' : '64px', // Account for status tabs
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AccountingLayout; 