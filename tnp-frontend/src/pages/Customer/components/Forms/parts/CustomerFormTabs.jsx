import { Box, Tabs, Tab, Chip, useTheme, useMediaQuery, Badge } from "@mui/material";
import React from "react";
import { MdAssignment, MdLocationOn, MdCheck, MdWarning } from "react-icons/md";

// Theme constants
import { FORM_THEME } from "../ui/FormFields";
const PRIMARY_RED = FORM_THEME.PRIMARY_RED;
const SECONDARY_RED = FORM_THEME.SECONDARY_RED;

/**
 * CustomerFormTabs - Tab header component for customer form
 * แสดง 2 tabs: ข้อมูลหลัก และ ที่อยู่ & เพิ่มเติม
 */
const CustomerFormTabs = ({
  activeTab = 0,
  onTabChange,
  essentialComplete = false,
  essentialHasError = false,
  additionalComplete = false,
  additionalHasError = false,
  mode = "create",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleTabChange = (event, newValue) => {
    if (onTabChange) {
      onTabChange(newValue);
    }
  };

  // Tab icon with status badge
  const TabIcon = ({ icon: Icon, isComplete, hasError }) => {
    if (hasError) {
      return (
        <Badge
          badgeContent={<MdWarning size={10} />}
          color="error"
          sx={{
            "& .MuiBadge-badge": {
              backgroundColor: "#f44336",
              minWidth: 16,
              height: 16,
              padding: "2px",
            },
          }}
        >
          <Icon size={isMobile ? 18 : 20} />
        </Badge>
      );
    }
    if (isComplete) {
      return (
        <Badge
          badgeContent={<MdCheck size={10} />}
          color="success"
          sx={{
            "& .MuiBadge-badge": {
              backgroundColor: "#4caf50",
              minWidth: 16,
              height: 16,
              padding: "2px",
            },
          }}
        >
          <Icon size={isMobile ? 18 : 20} />
        </Badge>
      );
    }
    return <Icon size={isMobile ? 18 : 20} />;
  };

  // Mobile: Chip-style tabs
  if (isMobile) {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 1,
          p: 1.5,
          bgcolor: "#fafafa",
          borderBottom: "1px solid #e0e0e0",
          overflowX: "auto",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Chip
          icon={
            <TabIcon
              icon={MdAssignment}
              isComplete={essentialComplete}
              hasError={essentialHasError}
            />
          }
          label="ข้อมูลหลัก"
          onClick={() => onTabChange && onTabChange(0)}
          variant={activeTab === 0 ? "filled" : "outlined"}
          sx={{
            fontFamily: "Kanit",
            fontSize: "0.85rem",
            fontWeight: activeTab === 0 ? 600 : 400,
            bgcolor: activeTab === 0 ? PRIMARY_RED : "transparent",
            color: activeTab === 0 ? "white" : PRIMARY_RED,
            borderColor: PRIMARY_RED,
            "& .MuiChip-icon": {
              color: activeTab === 0 ? "white" : PRIMARY_RED,
            },
            "&:hover": {
              bgcolor: activeTab === 0 ? SECONDARY_RED : `${PRIMARY_RED}10`,
            },
          }}
        />
        <Chip
          icon={
            <TabIcon
              icon={MdLocationOn}
              isComplete={additionalComplete}
              hasError={additionalHasError}
            />
          }
          label="ที่อยู่ & เพิ่มเติม"
          onClick={() => onTabChange && onTabChange(1)}
          variant={activeTab === 1 ? "filled" : "outlined"}
          sx={{
            fontFamily: "Kanit",
            fontSize: "0.85rem",
            fontWeight: activeTab === 1 ? 600 : 400,
            bgcolor: activeTab === 1 ? PRIMARY_RED : "transparent",
            color: activeTab === 1 ? "white" : PRIMARY_RED,
            borderColor: PRIMARY_RED,
            "& .MuiChip-icon": {
              color: activeTab === 1 ? "white" : PRIMARY_RED,
            },
            "&:hover": {
              bgcolor: activeTab === 1 ? SECONDARY_RED : `${PRIMARY_RED}10`,
            },
          }}
        />
      </Box>
    );
  }

  // Desktop: Standard tabs
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#fafafa" }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="customer form tabs"
        centered
        sx={{
          "& .MuiTab-root": {
            fontFamily: "Kanit",
            fontSize: "0.95rem",
            fontWeight: 500,
            textTransform: "none",
            minHeight: 56,
            color: "#666",
            "&.Mui-selected": {
              color: PRIMARY_RED,
              fontWeight: 600,
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: PRIMARY_RED,
            height: 3,
          },
        }}
      >
        <Tab
          icon={
            <TabIcon
              icon={MdAssignment}
              isComplete={essentialComplete}
              hasError={essentialHasError}
            />
          }
          iconPosition="start"
          label="ข้อมูลหลัก"
          id="customer-tab-0"
          aria-controls="customer-tabpanel-0"
        />
        <Tab
          icon={
            <TabIcon
              icon={MdLocationOn}
              isComplete={additionalComplete}
              hasError={additionalHasError}
            />
          }
          iconPosition="start"
          label="ที่อยู่ & ข้อมูลเพิ่มเติม"
          id="customer-tab-1"
          aria-controls="customer-tabpanel-1"
        />
      </Tabs>
    </Box>
  );
};

export default CustomerFormTabs;
