import { Assignment as AssignmentIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { Typography, Button, Paper } from "@mui/material";
import React from "react";

const EmptyState = ({ onRefresh }) => {
  return (
    <Paper sx={{ p: 6, textAlign: "center" }}>
      <AssignmentIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        ไม่พบข้อมูล Pricing Request
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        ยังไม่มี Pricing Request ที่เสร็จสมบูรณ์แล้ว หรือลองปรับเปลี่ยนเงื่อนไขการค้นหา
      </Typography>
      <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onRefresh}>
        รีเฟรชข้อมูล
      </Button>
    </Paper>
  );
};

export default EmptyState;
