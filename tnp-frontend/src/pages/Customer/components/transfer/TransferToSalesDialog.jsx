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

import { useTransferToSalesMutation } from "../../../../features/Customer/customerTransferApi";
import {
  CUSTOMER_CHANNEL,
  getChannelLabel,
  getChannelLabelTh,
  getChannelColor,
} from "../../constants/customerChannel";

/**
 * TransferToSalesDialog
 *
 * Dialog สำหรับ Head of Online โอนลูกค้าจาก Online ไป Sales
 * Design: สี Orange/Warning theme
 */
const TransferToSalesDialog = ({ open, onClose, customer, salesUsers = [], onSuccess }) => {
  // Form state
  const [selectedSalesId, setSelectedSalesId] = useState("");
  const [remark, setRemark] = useState("");

  // RTK Query mutation
  const [transferToSales, { isLoading, error }] = useTransferToSalesMutation();

  // Reset form when dialog closes
  const handleClose = useCallback(() => {
    setSelectedSalesId("");
    setRemark("");
    onClose();
  }, [onClose]);

  // Handle transfer
  const handleTransfer = async () => {
    if (!customer?.cus_id) return;

    try {
      const result = await transferToSales({
        customerId: customer.cus_id,
        newManageBy: selectedSalesId || undefined,
        remark: remark || undefined,
      }).unwrap();

      // Success callback
      if (onSuccess) {
        onSuccess(result);
      }

      handleClose();
    } catch (err) {
      console.error("Transfer to Sales failed:", err);
    }
  };

  // Customer info display
  const customerName = customer?.cus_name || customer?.cus_company || "ไม่ระบุชื่อ";
  const currentChannel = customer?.cus_channel || CUSTOMER_CHANNEL.ONLINE;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "warning.light",
          color: "warning.contrastText",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <MdSwapHoriz size={24} />
        <Typography variant="h6" component="span">
          โอนลูกค้าไปทีม Sales
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
              label={getChannelLabelTh(CUSTOMER_CHANNEL.SALES)}
              color={getChannelColor(CUSTOMER_CHANNEL.SALES)}
              size="small"
            />
          </Box>
        </Box>

        {/* Sales Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="sales-select-label">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <MdPerson />
              เลือก Sales ที่จะดูแล (ไม่บังคับ)
            </Box>
          </InputLabel>
          <Select
            labelId="sales-select-label"
            value={selectedSalesId}
            onChange={(e) => setSelectedSalesId(e.target.value)}
            label="เลือก Sales ที่จะดูแล (ไม่บังคับ)"
          >
            <MenuItem value="">
              <em>ไม่ระบุ (เข้า Pool)</em>
            </MenuItem>
            {salesUsers.map((user) => (
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
          placeholder="เช่น ลูกค้าต้องการพบหน้าร้าน..."
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
          color="warning"
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

TransferToSalesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customer: PropTypes.shape({
    cus_id: PropTypes.string,
    cus_name: PropTypes.string,
    cus_company: PropTypes.string,
    cus_channel: PropTypes.number,
  }),
  salesUsers: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.number,
      username: PropTypes.string,
      user_firstname: PropTypes.string,
      user_lastname: PropTypes.string,
    })
  ),
  onSuccess: PropTypes.func,
};

export default TransferToSalesDialog;
