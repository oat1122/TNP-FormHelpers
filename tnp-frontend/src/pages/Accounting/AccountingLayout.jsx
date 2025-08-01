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
  Alert,
  Avatar,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  Fab,
  Slide,
  useScrollTrigger
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as QuotationIcon,
  Assignment as InvoiceIcon,
  Description as ReceiptIcon,
  LocalShipping as DeliveryIcon,
  People as CustomersIcon,
  Inventory2 as ProductsIcon,
  Analytics as AnalyticsIcon,
  ChevronLeft as ChevronLeftIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Add as AddIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';

const drawerWidth = 280;

// Enhanced navigation structure with FlowAccount-inspired design
const navigationItems = [
  {
    title: 'Dashboard',
    path: '/accounting',
    icon: <DashboardIcon />,
    badge: null,
    color: 'primary'
  },
  {
    section: 'เอกสาร',
    items: [
      {
        title: 'ใบเสนอราคา',
        path: '/accounting/quotations',
        icon: <QuotationIcon />,
        badge: 'pending_count',
        color: 'secondary',
        quickAction: '/accounting/quotations/new'
      },
      {
        title: 'ใบแจ้งหนี้',
        path: '/accounting/invoices', 
        icon: <InvoiceIcon />,
        badge: 'overdue_count',
        color: 'warning',
        quickAction: '/accounting/invoices/new'
      },
      {
        title: 'ใบเสร็จ/ใบกำกับภาษี',
        path: '/accounting/receipts',
        icon: <ReceiptIcon />,
        badge: null,
        color: 'success',
        quickAction: '/accounting/receipts/new'
      },
      {
        title: 'ใบส่งของ',
        path: '/accounting/delivery-notes',
        icon: <DeliveryIcon />,
        badge: null,
        color: 'info',
        quickAction: '/accounting/delivery-notes/new'
      }
    ]
  },
  {
    section: 'ข้อมูลหลัก',
    items: [
      {
        title: 'ลูกค้า',
        path: '/accounting/customers',
        icon: <CustomersIcon />,
        badge: 'new_customers',
        color: 'primary'
      },
      {
        title: 'สินค้า/บริการ',
        path: '/accounting/products',
        icon: <ProductsIcon />,
        badge: null,
        color: 'secondary'
      }
    ]
  },
  {
    section: 'รายงาน',
    items: [
      {
        title: 'รายงานการเงิน',
        path: '/accounting/reports',
        icon: <AnalyticsIcon />,
        badge: null,
        color: 'info'
      }
    ]
  }
];

// Breadcrumb navigation helper
const getBreadcrumbs = (pathname) => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'หน้าหลัก', path: '/', icon: <HomeIcon fontSize="small" /> }
  ];

  if (paths.includes('accounting')) {
    breadcrumbs.push({ label: 'ระบบบัญชี', path: '/accounting' });
    
    if (paths.includes('quotations')) {
      breadcrumbs.push({ label: 'ใบเสนอราคา', path: '/accounting/quotations' });
      if (paths.includes('new')) {
        breadcrumbs.push({ label: 'สร้างใหม่', path: null });
      } else if (paths.length > 3) {
        breadcrumbs.push({ label: 'รายละเอียด', path: null });
      }
    } else if (paths.includes('invoices')) {
      breadcrumbs.push({ label: 'ใบแจ้งหนี้', path: '/accounting/invoices' });
    } else if (paths.includes('receipts')) {
      breadcrumbs.push({ label: 'ใบเสร็จ/ใบกำกับภาษี', path: '/accounting/receipts' });
    } else if (paths.includes('delivery-notes')) {
      breadcrumbs.push({ label: 'ใบส่งของ', path: '/accounting/delivery-notes' });
    } else if (paths.includes('customers')) {
      breadcrumbs.push({ label: 'ลูกค้า', path: '/accounting/customers' });
      if (paths.includes('new') || paths.includes('create')) {
        breadcrumbs.push({ label: 'เพิ่มลูกค้าใหม่', path: null });
      } else if (paths.length > 3 && !paths.includes('edit')) {
        breadcrumbs.push({ label: 'รายละเอียดลูกค้า', path: null });
      } else if (paths.includes('edit')) {
        breadcrumbs.push({ label: 'แก้ไขข้อมูล', path: null });
      }
    } else if (paths.includes('products')) {
      breadcrumbs.push({ label: 'สินค้า/บริการ', path: '/accounting/products' });
    } else if (paths.includes('reports')) {
      breadcrumbs.push({ label: 'รายงาน', path: '/accounting/reports' });
    }
  }

  return breadcrumbs;
};

// Scroll to top component
function ScrollTop(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Slide appear={false} direction="up" in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1200 }}
      >
        {children}
      </Box>
    </Slide>
  );
}

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
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // State for managing badge counts and loading state
  const [badgeCounts, setBadgeCounts] = useState({
    pending_count: 3,
    overdue_count: 1,
    new_customers: 2
  });
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
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

  // Enhanced drawer with FlowAccount-inspired design
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar sx={{ px: 3, py: 2 }}>
        <Avatar 
          sx={{ 
            bgcolor: 'secondary.main', 
            mr: 2, 
            width: 32, 
            height: 32 
          }}
        >
          T
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'secondary.main', 
              fontWeight: 'bold',
              fontFamily: 'KanitSemiBold',
              fontSize: '1.1rem'
            }}
          >
            TNP Account
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontFamily: 'Kanit' }}
          >
            ระบบบัญชี
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      
      <Divider />

      {/* Error Alert */}
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert 
            severity="warning" 
            size="small"
            sx={{ borderRadius: 2 }}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {navigationItems.map((item, index) => {
          if (item.section) {
            // Section header with items
            return (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography 
                  variant="overline" 
                  sx={{ 
                    px: 2, 
                    py: 1, 
                    display: 'block',
                    fontWeight: 'bold',
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    fontFamily: 'Kanit'
                  }}
                >
                  📋 {item.section}
                </Typography>
                <List sx={{ py: 0 }}>
                  {item.items.map((subItem) => {
                    const isSelected = location.pathname === subItem.path || 
                                    location.pathname.startsWith(subItem.path + '/');
                    const badgeCount = subItem.badge ? badgeCounts[subItem.badge] : 0;
                    
                    return (
                      <ListItem key={subItem.path} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          selected={isSelected}
                          onClick={() => handleNavigate(subItem.path)}
                          sx={{
                            borderRadius: 2,
                            mx: 1,
                            '&.Mui-selected': {
                              bgcolor: `${subItem.color}.light`,
                              color: 'white',
                              '&:hover': {
                                bgcolor: `${subItem.color}.main`,
                              },
                              '& .MuiListItemIcon-root': {
                                color: 'inherit'
                              }
                            },
                            '&:hover': {
                              bgcolor: `${subItem.color}.light`,
                              color: 'white',
                              '& .MuiListItemIcon-root': {
                                color: 'inherit'
                              }
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {badgeCount > 0 ? (
                              <Badge 
                                badgeContent={badgeCount} 
                                color="error"
                                sx={{
                                  '& .MuiBadge-badge': {
                                    fontSize: '0.65rem',
                                    height: '16px',
                                    minWidth: '16px'
                                  }
                                }}
                              >
                                {subItem.icon}
                              </Badge>
                            ) : (
                              subItem.icon
                            )}
                          </ListItemIcon>
                          <ListItemText 
                            primary={subItem.title}
                            primaryTypographyProps={{
                              fontSize: '0.875rem',
                              fontWeight: isSelected ? 600 : 400,
                              fontFamily: 'Kanit'
                            }}
                            sx={{ my: 0 }}
                          />
                          {badgeCount > 0 && (
                            <Chip 
                              label={badgeCount} 
                              size="small" 
                              sx={{ 
                                height: 20, 
                                minWidth: 20,
                                bgcolor: 'warning.main',
                                color: 'white',
                                fontSize: '0.7rem',
                                '& .MuiChip-label': { px: 0.5 }
                              }} 
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            );
          } else {
            // Single item (Dashboard)
            const isSelected = location.pathname === item.path;
            
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': {
                      bgcolor: `${item.color}.light`,
                      color: 'white',
                      '&:hover': {
                        bgcolor: `${item.color}.main`,
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'inherit'
                      }
                    },
                    '&:hover': {
                      bgcolor: `${item.color}.light`,
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'inherit'
                      }
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 400,
                      fontFamily: 'Kanit'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          }
        })}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <ListItemButton
          sx={{
            borderRadius: 2,
            '&:hover': {
              bgcolor: 'grey.100'
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
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Enhanced AppBar with breadcrumbs */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <div id="back-to-top-anchor" />
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Breadcrumbs */}
          <Box sx={{ flexGrow: 1 }}>
            <Breadcrumbs 
              separator={<NavigateNextIcon fontSize="small" color="action" />}
              sx={{ mb: 0.5 }}
            >
              {getBreadcrumbs(location.pathname).map((breadcrumb, index) => {
                const isLast = index === getBreadcrumbs(location.pathname).length - 1;
                
                return isLast || !breadcrumb.path ? (
                  <Typography 
                    key={index}
                    color="text.primary" 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      fontFamily: 'Kanit',
                      fontWeight: 500
                    }}
                  >
                    {breadcrumb.icon && <Box sx={{ mr: 0.5 }}>{breadcrumb.icon}</Box>}
                    {breadcrumb.label}
                  </Typography>
                ) : (
                  <Link
                    key={index}
                    underline="hover"
                    color="text.secondary"
                    href={breadcrumb.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(breadcrumb.path);
                    }}
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      fontFamily: 'Kanit',
                      cursor: 'pointer'
                    }}
                  >
                    {breadcrumb.icon && <Box sx={{ mr: 0.5 }}>{breadcrumb.icon}</Box>}
                    {breadcrumb.label}
                  </Link>
                );
              })}
            </Breadcrumbs>
            
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: 'KanitSemiBold',
                fontWeight: 'bold',
                color: 'text.primary'
              }}
            >
              {(() => {
                const currentNav = navigationItems.find(item => {
                  if (item.section) {
                    return item.items.some(subItem => 
                      location.pathname === subItem.path || 
                      location.pathname.startsWith(subItem.path + '/')
                    );
                  }
                  return location.pathname === item.path;
                });
                
                if (currentNav?.section) {
                  const subItem = currentNav.items.find(subItem => 
                    location.pathname === subItem.path || 
                    location.pathname.startsWith(subItem.path + '/')
                  );
                  return subItem?.title || 'ระบบบัญชี';
                }
                
                return currentNav?.title || 'ระบบบัญชี';
              })()}
            </Typography>
          </Box>

          {/* Header Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="การแจ้งเตือน">
              <IconButton color="inherit">
                <Badge badgeContent={badgeCounts.pending_count + badgeCounts.overdue_count} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="บัญชีผู้ใช้">
              <IconButton 
                color="inherit"
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  <AccountCircleIcon />
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
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
          mt: isDocumentPage() ? '144px' : '80px', // Account for status tabs and larger header
          minHeight: 'calc(100vh - 80px)',
          backgroundColor: 'background.default'
        }}
      >
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        PaperProps={{
          sx: { 
            minWidth: 200,
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight="bold">
            ผู้ใช้งาน
          </Typography>
          <Typography variant="body2" color="text.secondary">
            admin@tnp.com
          </Typography>
        </Box>
        <MenuItem onClick={() => setUserMenuAnchor(null)}>
          <AccountCircleIcon sx={{ mr: 2 }} />
          โปรไฟล์
        </MenuItem>
        <MenuItem onClick={() => setUserMenuAnchor(null)}>
          <SettingsIcon sx={{ mr: 2 }} />
          ตั้งค่า
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            setUserMenuAnchor(null);
            // Handle logout
          }}
          sx={{ color: 'error.main' }}
        >
          <Typography color="error">ออกจากระบบ</Typography>
        </MenuItem>
      </Menu>

      {/* Scroll to top */}
      <ScrollTop>
        <Fab 
          color="secondary" 
          size="small" 
          aria-label="scroll back to top"
          sx={{
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s ease-in-out'
            }
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </Box>
  );
};

export default AccountingLayout; 