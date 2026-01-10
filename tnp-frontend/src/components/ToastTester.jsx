import { Button, Box, Typography, Stack, Divider } from "@mui/material";
import React from "react";

import {
  showSuccess,
  showError,
  showLoading,
  showNotificationToast,
  dismissToast,
} from "../utils/toast";

/**
 * A component for testing the Custom Toast Notification System
 * - NotificationToast: Real-time notifications with icons
 * - StatusToast: Success, Error, Loading variants
 */
function ToastTester() {
  // ===== Status Toasts =====
  const handleTestSuccess = () => {
    showSuccess("บันทึกข้อมูลสำเร็จ");
  };

  const handleTestError = () => {
    showError("เกิดข้อผิดพลาด: ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้");
  };

  const handleTestLoading = () => {
    const loadingId = showLoading("กำลังดำเนินการ...");

    // Dismiss loading toast after 3 seconds and show success
    setTimeout(() => {
      dismissToast(loadingId);
      showSuccess("การประมวลผลเสร็จสิ้น");
    }, 3000);
  };

  // ===== Notification Toasts =====
  const handleTestNotification = () => {
    showNotificationToast({
      title: "ลูกค้าใหม่",
      message: "คุณได้รับมอบหมายลูกค้าใหม่: สมชาย ใจดี",
      icon: "user-plus",
    });
  };

  const handleTestNotificationAlert = () => {
    showNotificationToast({
      title: "แจ้งเตือนระบบ",
      message: "มีการอัปเดตข้อมูลลูกค้าในระบบ กรุณาตรวจสอบ",
      icon: "alert",
    });
  };

  const handleTestNotificationMessage = () => {
    showNotificationToast({
      title: "ข้อความใหม่",
      message: "คุณได้รับข้อความจากทีมงาน: ประชุมเวลา 14:00 น.",
      icon: "message",
    });
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        ทดสอบระบบ Custom Toast Notification
      </Typography>

      {/* Status Toasts Section */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: "primary.main" }}>
        Status Toast (สถานะทั่วไป)
      </Typography>
      <Stack spacing={2} direction="column" sx={{ mb: 3 }}>
        <Button variant="contained" color="success" onClick={handleTestSuccess}>
          ✓ ทดสอบ Success Toast
        </Button>

        <Button variant="contained" color="error" onClick={handleTestError}>
          ✕ ทดสอบ Error Toast
        </Button>

        <Button variant="contained" color="info" onClick={handleTestLoading}>
          ⟳ ทดสอบ Loading Toast (3 วินาที)
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }} />

      {/* Notification Toasts Section */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: "secondary.main" }}>
        Notification Toast (Real-time)
      </Typography>
      <Stack spacing={2} direction="column">
        <Button variant="outlined" color="secondary" onClick={handleTestNotification}>
          👤 ทดสอบ Notification - ลูกค้าใหม่
        </Button>

        <Button variant="outlined" color="warning" onClick={handleTestNotificationAlert}>
          ⚠ ทดสอบ Notification - แจ้งเตือน
        </Button>

        <Button variant="outlined" color="primary" onClick={handleTestNotificationMessage}>
          💬 ทดสอบ Notification - ข้อความ
        </Button>
      </Stack>
    </Box>
  );
}

export default ToastTester;
