import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  LocalShipping as DeliveryIcon,
  AccountBalance as InvoiceIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
  GetApp as ImportIcon,
} from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import { useSelector, useDispatch } from "react-redux";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import accountingTheme from "./theme/accountingTheme";
import {
  selectActiveStep,
  selectUnreadNotifications,
  setActiveStep,
} from "../../features/Accounting/accountingSlice";

const drawerWidth = 280;

// Navigation items
const navigationItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: DashboardIcon,
    path: "/accounting",
  },
  {
    id: "pricing",
    title: "นำเข้างาน Pricing",
    icon: ImportIcon,
    path: "/accounting/pricing-integration",
  },
  {
    id: "quotation",
    title: "ใบเสนอราคา",
    icon: AssignmentIcon,
    path: "/accounting/quotations",
  },
  {
    id: "invoice",
    title: "ใบแจ้งหนี้",
    icon: InvoiceIcon,
    path: "/accounting/invoices",
  },
  {
    id: "receipt",
    title: "ใบเสร็จรับเงิน",
    icon: ReceiptIcon,
    path: "/accounting/receipts",
  },
  {
    id: "delivery",
    title: "การจัดส่ง",
    icon: DeliveryIcon,
    path: "/accounting/delivery-notes",
  },
];

// Get breadcrumb items based on current path
const getBreadcrumbs = (pathname) => {
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs = [{ title: "หน้าหลัก", path: "/" }];

  if (paths.includes("accounting")) {
    breadcrumbs.push({ title: "ระบบบัญชี", path: "/accounting" });

    const currentItem = navigationItems.find(
      (item) => item.path === pathname || pathname.includes(item.id)
    );

    if (currentItem && currentItem.id !== "dashboard") {
      breadcrumbs.push({ title: currentItem.title, path: currentItem.path });
    }
  }

  return breadcrumbs;
};

// Sidebar Component
const Sidebar = ({ open, onClose, selectedItem, onItemSelect }) => {
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    onItemSelect(item.id);
    navigate(item.path);
    onClose();
  };

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          borderRight: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <Box sx={{ p: 3, bgcolor: "primary.main", color: "white" }}>
        <Typography variant="h6" component="div" fontWeight={600}>
          ระบบบัญชี TNP
        </Typography>
        <Typography variant="caption">จัดการเอกสารทางการเงิน</Typography>
      </Box>

      <List sx={{ p: 2 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={selectedItem === item.id}
              onClick={() => handleItemClick(item)}
              sx={{
                borderRadius: 2,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListItemIcon>
                <item.icon />
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  fontWeight: selectedItem === item.id ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

// Header Component
const Header = ({ onMenuClick, unreadCount }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          ระบบบัญชี TNP
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton color="inherit" onClick={handleNotificationClick}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton color="inherit" onClick={handleProfileMenuOpen}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "secondary.main",
                fontSize: "0.875rem",
              }}
            >
              T
            </Avatar>
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 200 },
          }}
        >
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            ตั้งค่า
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            ออกจากระบบ
          </MenuItem>
        </Menu>

        {/* Notification Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: { width: 320, maxHeight: 400 },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              การแจ้งเตือน
            </Typography>
            {unreadCount === 0 ? (
              <Typography variant="body2" color="text.secondary">
                ไม่มีการแจ้งเตือนใหม่
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                มีการแจ้งเตือน {unreadCount} รายการ
              </Typography>
            )}
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

// Breadcrumb Component
const BreadcrumbNavigation = ({ breadcrumbs }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{ py: 2, px: 3, bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
    >
      <Breadcrumbs separator={<ChevronRightIcon fontSize="small" />} aria-label="breadcrumb">
        {breadcrumbs.map((item, index) =>
          index === breadcrumbs.length - 1 ? (
            <Typography key={item.path} color="primary" fontWeight={500}>
              {item.title}
            </Typography>
          ) : (
            <Link
              key={item.path}
              underline="hover"
              color="inherit"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
              sx={{ cursor: "pointer" }}
            >
              {item.title}
            </Link>
          )
        )}
      </Breadcrumbs>
    </Box>
  );
};

// Main Layout Component
const AccountingLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const activeStep = useSelector(selectActiveStep);
  const unreadNotifications = useSelector(selectUnreadNotifications);

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleItemSelect = (itemId) => {
    dispatch(setActiveStep(itemId));
  };

  // Get current navigation item based on path
  const currentItem =
    navigationItems.find(
      (item) =>
        location.pathname === item.path ||
        (item.path !== "/accounting" && location.pathname.includes(item.id))
    ) || navigationItems[0];

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <ThemeProvider theme={accountingTheme}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <CssBaseline />

        {/* Header */}
        <Header onMenuClick={handleDrawerToggle} unreadCount={unreadNotifications.length} />

        {/* Sidebar */}
        <Sidebar
          open={mobileOpen}
          onClose={handleDrawerToggle}
          selectedItem={currentItem.id}
          onItemSelect={handleItemSelect}
        />

        {/* Breadcrumb */}
        <BreadcrumbNavigation breadcrumbs={breadcrumbs} />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            minHeight: "calc(100vh - 120px)",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AccountingLayout;
