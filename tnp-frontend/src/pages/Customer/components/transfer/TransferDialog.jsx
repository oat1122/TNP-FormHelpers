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

import {
  CUSTOMER_CHANNEL,
  getChannelLabelTh,
  getChannelColor,
} from "../../constants/customerChannel";

/**
 * TransferDialog - Generic dialog for customer transfers
 *
 * Consolidates TransferToSalesDialog and TransferToOnlineDialog
 * into a single reusable component with configurable target channel.
 *
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {function} props.onClose - Close handler
 * @param {Object} props.customer - Customer data
 * @param {Array} props.usersList - List of users to select as new manager
 * @param {function} props.onSuccess - Success callback
 * @param {number} props.targetChannel - CUSTOMER_CHANNEL.SALES or CUSTOMER_CHANNEL.ONLINE
 * @param {function} props.transferMutation - RTK Query mutation hook result [mutate, { isLoading, error }]
 */
const TransferDialog = ({
  open,
  onClose,
  customer,
  usersList = [],
  onSuccess,
  targetChannel,
  transferMutation,
}) => {
  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [remark, setRemark] = useState("");

  // Destructure mutation
  const [transfer, { isLoading, error }] = transferMutation;

  // Determine styling and labels based on target channel
  const isToSales = targetChannel === CUSTOMER_CHANNEL.SALES;
  const themeColor = isToSales ? "warning" : "info";
  const titleText = isToSales ? "โอนลูกค้าไปทีม Sales" : "โอนลูกค้าไปทีม Online";
  const userSelectLabel = isToSales
    ? "เลือก Sales ที่จะดูแล (ไม่บังคับ)"
    : "เลือกผู้ดูแลทีม Online (ไม่บังคับ)";
  const placeholderText = isToSales
    ? "เช่น ลูกค้าต้องการพบหน้าร้าน..."
    : "เช่น ลูกค้าต้องการติดต่อผ่าน LINE...";

  // Reset form when dialog closes
  const handleClose = useCallback(() => {
    setSelectedUserId("");
    setRemark("");
    onClose();
  }, [onClose]);

  // Handle transfer
  const handleTransfer = async () => {
    if (!customer?.cus_id) return;

    try {
      const result = await transfer({
        customerId: customer.cus_id,
        newManageBy: selectedUserId || undefined,
        remark: remark || undefined,
      }).unwrap();

      // Success callback
      if (onSuccess) {
        onSuccess(result);
      }

      handleClose();
    } catch (err) {
      console.error(`Transfer to ${isToSales ? "Sales" : "Online"} failed:`, err);
    }
  };

  // Customer info display
  const customerName = customer?.cus_name || customer?.cus_company || "ไม่ระบุชื่อ";
  const currentChannel =
    customer?.cus_channel || (isToSales ? CUSTOMER_CHANNEL.ONLINE : CUSTOMER_CHANNEL.SALES);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: `${themeColor}.light`,
          color: `${themeColor}.contrastText`,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <MdSwapHoriz size={24} />
        <Typography variant="h6" component="span">
          {titleText}
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
              label={getChannelLabelTh(targetChannel)}
              color={getChannelColor(targetChannel)}
              size="small"
            />
          </Box>
        </Box>

        {/* User Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="user-select-label">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <MdPerson />
              {userSelectLabel}
            </Box>
          </InputLabel>
          <Select
            labelId="user-select-label"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            label={userSelectLabel}
          >
            <MenuItem value="">
              <em>ไม่ระบุ (เข้า Pool)</em>
            </MenuItem>
            {usersList.map((user) => (
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
          placeholder={placeholderText}
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
          color={themeColor}
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

TransferDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customer: PropTypes.shape({
    cus_id: PropTypes.string,
    cus_name: PropTypes.string,
    cus_company: PropTypes.string,
    cus_channel: PropTypes.number,
  }),
  usersList: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.number,
      username: PropTypes.string,
      user_firstname: PropTypes.string,
      user_lastname: PropTypes.string,
    })
  ),
  onSuccess: PropTypes.func,
  targetChannel: PropTypes.number.isRequired,
  transferMutation: PropTypes.array.isRequired,
};

export default TransferDialog;
