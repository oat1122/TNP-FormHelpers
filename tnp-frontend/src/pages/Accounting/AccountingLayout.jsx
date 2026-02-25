import {
  Menu as MenuIcon,
  Assignment as AssignmentIcon,
  LocalShipping as DeliveryIcon,
  AccountBalance as InvoiceIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  GetApp as ImportIcon,
} from "@mui/icons-material";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  CssBaseline,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import React, { useState } from "react";
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
    id: "delivery",
    title: "การจัดส่ง",
    icon: DeliveryIcon,
    path: "/accounting/delivery-notes",
  },
];

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
        <Typography variant="h6" component="div" fontWeight={600} sx={{ color: "white" }}>
          ระบบบัญชี TNP
        </Typography>
        <Typography variant="caption" sx={{ color: "white" }}>
          จัดการเอกสารทางการเงิน
        </Typography>
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
                  color: selectedItem === item.id ? "white" : "inherit",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

// Main Layout Component
const AccountingLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const activeStep = useSelector(selectActiveStep);

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
      (item) => location.pathname === item.path || location.pathname.includes(item.id)
    ) ||
    navigationItems.find((item) => item.id === "pricing") ||
    navigationItems[0];

  return (
    <ThemeProvider theme={accountingTheme}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <CssBaseline />

        {/* Sidebar */}
        <Sidebar
          open={mobileOpen}
          onClose={handleDrawerToggle}
          selectedItem={currentItem.id}
          onItemSelect={handleItemSelect}
        />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            minHeight: "calc(100vh - 120px)",
          }}
        >
          <Outlet context={{ onMenuClick: handleDrawerToggle }} />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AccountingLayout;
