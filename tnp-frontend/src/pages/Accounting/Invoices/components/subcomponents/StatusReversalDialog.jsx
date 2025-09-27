import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  Select,
  InputLabel,
  MenuItem,
  TextField,
  Typography,
  Box,
  Alert,
  Fade,
  Chip,
} from "@mui/material";
import { ErrorOutline as ErrorIcon, InfoOutlined as InfoIcon } from "@mui/icons-material";

/**
 * Enhanced Status Reversal Dialog Component
 * Provides a user-friendly interface for selecting reasons when reverting invoice status
 */
const StatusReversalDialog = ({
  open,
  onClose,
  onSubmit,
  pendingRevertSide,
  isLoading = false,
}) => {
  // Local state for form data
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  // Predefined reasons with categorization
  const predefinedReasons = [
    "ข้อมูลลูกค้าไม่ถูกต้อง",
    "ราคาผิดพลาด",
    "รายการสินค้าไม่ถูกต้อง",
    "เงื่อนไขการชำระเงินต้องแก้ไข",
    "เอกสารแนบไม่ครบถ้วน",
    "ลูกค้าขอแก้ไขข้อมูล",
    "พบข้อผิดพลาดในการคำนวณ",
    "ต้องอัพเดทข้อมูลจาก Quotation",
    "อื่นๆ (โปรดระบุ)",
  ];

  // Computed values
  const isOther = selectedReason === "อื่นๆ (โปรดระบุ)";
  const finalReason = isOther ? customReason : selectedReason;
  const isSubmitDisabled = !finalReason.trim() || isLoading;

  /**
   * Handles form submission
   */
  const handleSubmit = () => {
    if (finalReason.trim()) {
      onSubmit(finalReason.trim());
      resetForm();
    }
  };

  /**
   * Handles dialog close with form reset
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * Resets form to initial state
   */
  const resetForm = () => {
    setSelectedReason("");
    setCustomReason("");
  };

  /**
   * Gets the side display text with proper formatting
   */
  const getSideDisplayText = () => {
    if (!pendingRevertSide) return "";
    return pendingRevertSide === "before" ? "มัดจำก่อน" : "มัดจำหลัง";
  };

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 24,
        sx: {
          borderRadius: 2,
          "--Paper-shadow":
            "0px 11px 15px -7px rgba(244, 67, 54, 0.2), 0px 24px 38px 3px rgba(244, 67, 54, 0.14), 0px 9px 46px 8px rgba(244, 67, 54, 0.12)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <ErrorIcon color="warning" />
          <Typography variant="h6" component="span">
            เลือกเหตุผลสำหรับการย้อนสถานะ
          </Typography>
        </Box>

        {pendingRevertSide && (
          <Chip
            icon={<InfoIcon />}
            label={`ฝั่ง${getSideDisplayText()} กลับเป็น draft`}
            size="small"
            color="warning"
            variant="outlined"
            sx={{ mt: 1 }}
          />
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Information Alert */}
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 1 }}>
            การย้อนสถานะจะทำให้ใบแจ้งหนี้กลับไปเป็น draft และสามารถแก้ไขได้อีกครั้ง
          </Alert>

          {/* Reason Selection */}
          <FormControl fullWidth>
            <InputLabel>เลือกเหตุผล</InputLabel>
            <Select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              label="เลือกเหตุผล"
              disabled={isLoading}
            >
              {predefinedReasons.map((reason) => (
                <MenuItem key={reason} value={reason}>
                  <Typography variant="body2">{reason}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Custom Reason Input */}
          <Fade in={isOther}>
            <Box>
              {isOther && (
                <TextField
                  autoFocus
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={5}
                  label="กรุณาระบุเหตุผล"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="โปรดระบุเหตุผลอื่นๆ ที่ต้องการย้อนสถานะ..."
                  disabled={isLoading}
                  helperText={`${customReason.length}/500 ตัวอักษร`}
                  inputProps={{ maxLength: 500 }}
                />
              )}
            </Box>
          </Fade>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button onClick={handleClose} color="secondary" disabled={isLoading} size="large">
          ยกเลิก
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          disabled={isSubmitDisabled}
          size="large"
          sx={{
            minWidth: 120,
            fontWeight: 600,
            "&:disabled": {
              bgcolor: "grey.300",
              color: "grey.500",
            },
          }}
        >
          {isLoading ? "กำลังดำเนินการ..." : "ย้อนสถานะ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusReversalDialog;
