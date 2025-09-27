import { Dashboard, CalendarToday, Assignment } from "@mui/icons-material";
import { Box, Tab, Tabs } from "@mui/material";
import React from "react";

const NavigationTabs = ({ currentTab, setCurrentTab }) => {
  const tabs = [
    { label: "Dashboard", icon: <Dashboard /> },
    { label: "Calendar", icon: <CalendarToday /> },
    { label: "Manager", icon: <Assignment /> },
  ];

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
      <Tabs
        value={currentTab}
        onChange={(e, newValue) => setCurrentTab(newValue)}
        sx={{
          "& .MuiTab-root": {
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: 500,
            color: "#666666", // สีเทาสำหรับ tab ที่ไม่ active
            "&.Mui-selected": {
              color: "#B20000", // สีหลักของระบบสำหรับ tab ที่ active
              fontWeight: 600,
            },
            "&:hover": {
              color: "#E36264", // สีรองสำหรับ hover
              backgroundColor: "rgba(178, 0, 0, 0.04)", // พื้นหลังอ่อนๆ เมื่อ hover
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "#B20000", // สีของแถบบอก active tab
            height: 3, // ความหนาของแถบ
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            icon={tab.icon}
            label={tab.label}
            iconPosition="start"
            sx={{
              minHeight: 48,
              "& .MuiSvgIcon-root": {
                fontSize: "1.25rem", // ขนาดไอคอน
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default NavigationTabs;
