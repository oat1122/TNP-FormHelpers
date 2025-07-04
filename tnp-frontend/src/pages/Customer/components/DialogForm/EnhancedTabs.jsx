import React from "react";
import { Box, Tabs, Tab } from "@mui/material";
import {
  MdPerson,
  MdPhone,
  MdLocationOn,
  MdNotes,
  MdCheckCircle,
  MdError,
  MdInfo,
} from "react-icons/md";

function EnhancedTabs({ value, onChange, tabStatus }) {
  function a11yProps(index) {
    return {
      id: `customer-tab-${index}`,
      "aria-controls": `customer-tabpanel-${index}`,
    };
  }

  return (
    <Box
      sx={{
        mb: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        variant="fullWidth"
        aria-label="customer info tabs"
        sx={{
          bgcolor: "#fafafa",
          "& .MuiTabs-flexContainer": {
            borderRadius: 1,
            overflow: "hidden",
          },
          "& .MuiTab-root": {
            minHeight: "74px",
            fontSize: "0.95rem",
            fontWeight: 500,
            transition: "all 0.2s",
            py: 1,
            textTransform: "none",
            "&:hover": {
              bgcolor: "rgba(0,0,0,0.03)",
            },
          },
          "& .Mui-selected": {
            bgcolor: "primary.lighter",
            color: "primary.main",
            fontWeight: 600,
          },
        }}
      >
        <Tab
          icon={<MdPerson style={{ fontSize: "1.5rem" }} />}
          iconPosition="top"
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              ข้อมูลพื้นฐาน
              {tabStatus.basicInfo === "complete" && (
                <MdCheckCircle style={{ color: "green", fontSize: "1rem" }} />
              )}
              {tabStatus.basicInfo === "incomplete" && (
                <MdError style={{ color: "red", fontSize: "1rem" }} />
              )}
            </Box>
          }
          {...a11yProps(0)}
        />
        <Tab
          icon={<MdPhone style={{ fontSize: "1.5rem" }} />}
          iconPosition="top"
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              ข้อมูลติดต่อ
              {tabStatus.contactInfo === "complete" && (
                <MdCheckCircle style={{ color: "green", fontSize: "1rem" }} />
              )}
              {tabStatus.contactInfo === "incomplete" && (
                <MdError style={{ color: "red", fontSize: "1rem" }} />
              )}
            </Box>
          }
          {...a11yProps(1)}
        />
        <Tab
          icon={<MdLocationOn style={{ fontSize: "1.5rem" }} />}
          iconPosition="top"
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              ที่อยู่
              {tabStatus.address === "complete" && (
                <MdCheckCircle style={{ color: "green", fontSize: "1rem" }} />
              )}
              {tabStatus.address === "incomplete" && (
                <MdError style={{ color: "red", fontSize: "1rem" }} />
              )}
              {tabStatus.address === "optional" && (
                <MdInfo style={{ color: "#0288d1", fontSize: "1rem" }} />
              )}
            </Box>
          }
          {...a11yProps(2)}
        />
        <Tab
          icon={<MdNotes style={{ fontSize: "1.5rem" }} />}
          iconPosition="top"
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              บันทึกเพิ่มเติม
              {tabStatus.notes === "optional" && (
                <MdInfo style={{ color: "#0288d1", fontSize: "1rem" }} />
              )}
            </Box>
          }
          {...a11yProps(3)}
        />
      </Tabs>
    </Box>
  );
}

export default EnhancedTabs;
