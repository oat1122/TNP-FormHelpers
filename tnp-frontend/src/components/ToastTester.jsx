import React from "react";
import { Button, Box, Typography, Stack } from "@mui/material";
import {
  open_dialog_error,
  open_dialog_ok_timer,
  open_dialog_warning,
  open_dialog_loading,
  dismiss_loading_toast,
} from "../utils/dialog_swal2/alart_one_line";

/**
 * A component for testing the new React Hot Toast notifications
 */
function ToastTester() {
  const handleTestSuccess = () => {
    open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ");
  };

  const handleTestError = () => {
    open_dialog_error("เกิดข้อผิดพลาด", "ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้");
  };

  const handleTestWarning = () => {
    open_dialog_warning("คำเตือน", "คุณกำลังจะลบข้อมูลสำคัญ");
  };

  const handleTestLoading = () => {
    open_dialog_loading();

    // Dismiss loading toast after 3 seconds
    setTimeout(() => {
      dismiss_loading_toast();
      open_dialog_ok_timer("การประมวลผลเสร็จสิ้น");
    }, 3000);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        ทดสอบระบบแจ้งเตือน React Hot Toast
      </Typography>

      <Stack spacing={2} direction="column">
        <Button variant="contained" color="success" onClick={handleTestSuccess}>
          ทดสอบแจ้งเตือนสำเร็จ
        </Button>

        <Button variant="contained" color="error" onClick={handleTestError}>
          ทดสอบแจ้งเตือนข้อผิดพลาด
        </Button>

        <Button variant="contained" color="warning" onClick={handleTestWarning}>
          ทดสอบแจ้งเตือนคำเตือน
        </Button>

        <Button variant="contained" color="info" onClick={handleTestLoading}>
          ทดสอบแจ้งเตือนกำลังโหลด
        </Button>
      </Stack>
    </Box>
  );
}

export default ToastTester;
