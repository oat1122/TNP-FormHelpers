import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import {
  MdPerson,
  MdPhone,
  MdLocationOn,
  MdNotes,
  MdCheckCircle,
  MdError,
  MdInfo,
} from "react-icons/md";

function EnhancedTabPanel({ value, index, title, status, icon, children }) {
  // Map icon component based on the icon name passed as prop
  const getIcon = () => {
    switch (icon) {
      case "person":
        return <MdPerson style={{ fontSize: "22px", color: "#1976d2", marginRight: "12px" }} />;
      case "phone":
        return <MdPhone style={{ fontSize: "22px", color: "#1976d2", marginRight: "12px" }} />;
      case "location":
        return <MdLocationOn style={{ fontSize: "22px", color: "#1976d2", marginRight: "12px" }} />;
      case "notes":
        return <MdNotes style={{ fontSize: "22px", color: "#1976d2", marginRight: "12px" }} />;
      default:
        return null;
    }
  };

  // Get status icon based on the status
  const getStatusIcon = () => {
    switch (status) {
      case "complete":
        return <MdCheckCircle style={{ color: "green", fontSize: "1rem", marginLeft: "8px" }} />;
      case "incomplete":
        return <MdError style={{ color: "red", fontSize: "1rem", marginLeft: "8px" }} />;
      case "optional":
        return <MdInfo style={{ color: "#0288d1", fontSize: "1rem", marginLeft: "8px" }} />;
      default:
        return null;
    }
  };

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ py: 3, px: 1 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              bgcolor: "#fafafa", 
              border: "1px solid", 
              borderColor: "divider", 
              borderRadius: 2, 
              mb: 2 
            }}
          >
            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              mb: 3, 
              pb: 1.5, 
              borderBottom: "1px solid", 
              borderColor: "divider" 
            }}>
              {getIcon()}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {title}
                {getStatusIcon()}
              </Typography>
            </Box>
            {children}
          </Paper>
        </Box>
      )}
    </div>
  );
}

export default EnhancedTabPanel;
