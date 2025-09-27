import { Box, Container, Typography } from "@mui/material";
import React from "react";

import ToastTester from "../components/ToastTester";

function TestToast() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ทดสอบระบบแจ้งเตือน React Hot Toast
        </Typography>
        <Typography variant="body1" color="text.secondary">
          หน้านี้ใช้สำหรับทดสอบระบบแจ้งเตือนแบบใหม่ที่ใช้ React Hot Toast ในตำแหน่ง bottom-left
        </Typography>
      </Box>

      <ToastTester />
    </Container>
  );
}

export default TestToast;
