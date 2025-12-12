import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import { MdSwapHoriz, MdPerson, MdComment } from "react-icons/md";

import { useTransferToOnlineMutation } from "../../../../features/Customer/customerTransferApi";
import {
  CUSTOMER_CHANNEL,
  getChannelLabelTh,
  getChannelColor,
} from "../../constants/customerChannel";

/**
 * TransferToOnlineDialog
 *
 * Dialog สำหรับ Head of Offline (Sales) โอนลูกค้าจาก Sales ไป Online
 * Design: สี Blue/Info theme
 */
const TransferToOnlineDialog = ({ open, onClose, customer, onlineUsers = [], onSuccess }) => {
  // Form state
  const [selectedOnlineId, setSelectedOnlineId] = useState("");
  const [remark, setRemark] = useState("");

  // RTK Query mutation
  const [transferToOnline, { isLoading, error }] = useTransferToOnlineMutation();

  // Reset form when dialog closes
  const handleClose = useCallback(() => {
    setSelectedOnlineId("");
    setRemark("");
    onClose();
  }, [onClose]);

  // Handle transfer
  const handleTransfer = async () => {
    if (!customer?.cus_id) return;

    try {
      const result = await transferToOnline({
        customerId: customer.cus_id,
        newManageBy: selectedOnlineId || undefined,
        remark: remark || undefined,
      }).unwrap();

      // Success callback
      if (onSuccess) {
        onSuccess(result);
      }

      handleClose();
    } catch (err) {
      console.error("Transfer to Online failed:", err);
    }
  };

  // Customer info display
  const customerName = customer?.cus_name || customer?.cus_company || "ไม่ระบุชื่อ";
  const currentChannel = customer?.cus_channel || CUSTOMER_CHANNEL.SALES;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "info.light",
          color: "info.contrastText",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <MdSwapHoriz size={24} />
        <Typography variant="h6" component="span">
          โอนลูกค้าไปทีม Online
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error?.data?.message || "เกิดข้อผิดพลาดในการโอนลูกค้า"}
          </Alert>
        )}

        {/* Customer Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            ข้อมูลลูกค้า
          </Typography>
          <Typography variant="h6" gutterBottom>
            {customerName}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              ช่องทางปัจจุบัน:
            </Typography>
            <Chip
              label={getChannelLabelTh(currentChannel)}
              color={getChannelColor(currentChannel)}
              size="small"
            />
            <Typography variant="body2" sx={{ mx: 1 }}>
              →
            </Typography>
            <Chip
              label={getChannelLabelTh(CUSTOMER_CHANNEL.ONLINE)}
              color={getChannelColor(CUSTOMER_CHANNEL.ONLINE)}
              size="small"
            />
          </Box>
        </Box>

        {/* Online User Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="online-select-label">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <MdPerson />
              เลือกผู้ดูแลทีม Online (ไม่บังคับ)
            </Box>
          </InputLabel>
          <Select
            labelId="online-select-label"
            value={selectedOnlineId}
            onChange={(e) => setSelectedOnlineId(e.target.value)}
            label="เลือกผู้ดูแลทีม Online (ไม่บังคับ)"
          >
            <MenuItem value="">
              <em>ไม่ระบุ (เข้า Pool)</em>
            </MenuItem>
            {onlineUsers.map((user) => (
              <MenuItem key={user.user_id} value={user.user_id}>
                {user.user_firstname} {user.user_lastname} ({user.username})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Remark */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <MdComment />
              หมายเหตุ (ไม่บังคับ)
            </Box>
          }
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="เช่น ลูกค้าต้องการติดต่อผ่าน LINE..."
          inputProps={{ maxLength: 500 }}
          helperText={`${remark.length}/500`}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          color="info"
          onClick={handleTransfer}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <MdSwapHoriz />}
        >
          {isLoading ? "กำลังโอน..." : "ยืนยันการโอน"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

TransferToOnlineDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customer: PropTypes.shape({
    cus_id: PropTypes.string,
    cus_name: PropTypes.string,
    cus_company: PropTypes.string,
    cus_channel: PropTypes.number,
  }),
  onlineUsers: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.number,
      username: PropTypes.string,
      user_firstname: PropTypes.string,
      user_lastname: PropTypes.string,
    })
  ),
  onSuccess: PropTypes.func,
};

export default TransferToOnlineDialog;
