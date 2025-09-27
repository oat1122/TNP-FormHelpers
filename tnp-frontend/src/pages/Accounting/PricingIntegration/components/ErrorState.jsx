import { Refresh as RefreshIcon } from "@mui/icons-material";
import { Box, Typography, Button, Alert, Paper } from "@mui/material";
import React from "react";

const ErrorState = ({ error, onRetry }) => {
  return (
    <Paper sx={{ p: 6, textAlign: "center" }}>
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          เกิดข้อผิดพลาดในการดึงข้อมูล
        </Typography>
        <Typography variant="body2">
          {error?.data?.message || error?.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้"}
        </Typography>
        {process.env.NODE_ENV === "development" && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
            <Typography variant="caption" component="pre">
              {JSON.stringify(error, null, 2)}
            </Typography>
          </Box>
        )}
      </Alert>
      <Button variant="contained" startIcon={<RefreshIcon />} onClick={onRetry} color="error">
        ลองใหม่อีกครั้ง
      </Button>
    </Paper>
  );
};

export default ErrorState;
