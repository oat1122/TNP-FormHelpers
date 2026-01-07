import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import { MdSwapHoriz, MdComment, MdInfo } from "react-icons/md";

import {
  CUSTOMER_CHANNEL,
  getChannelLabelTh,
  getChannelColor,
} from "../../constants/customerChannel";

/**
 * TransferDialog - Dialog for customer transfers (always to pool)
 *
 * Cross-team transfers always go to the target team's pool.
 * No user selection - the target team's HEAD will assign later.
 *
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {function} props.onClose - Close handler
 * @param {Object} props.customer - Customer data
 * @param {function} props.onSuccess - Success callback
 * @param {number} props.targetChannel - CUSTOMER_CHANNEL.SALES or CUSTOMER_CHANNEL.ONLINE
 * @param {function} props.transferMutation - RTK Query mutation hook result [mutate, { isLoading, error }]
 */
const TransferDialog = ({
  open,
  onClose,
  customer,
  onSuccess,
  targetChannel,
  transferMutation,
}) => {
  // Form state - only remark now (no user selection)
  const [remark, setRemark] = useState("");

  // Destructure mutation
  const [transfer, { isLoading, error }] = transferMutation;

  // Determine styling and labels based on target channel
  const isToSales = targetChannel === CUSTOMER_CHANNEL.SALES;
  const themeColor = isToSales ? "warning" : "info";
  const titleText = isToSales ? "โอนลูกค้าไปทีม Sales" : "โอนลูกค้าไปทีม Online";
  const placeholderText = isToSales
    ? "เช่น ลูกค้าต้องการพบหน้าร้าน..."
    : "เช่น ลูกค้าต้องการติดต่อผ่าน LINE...";

  // Reset form when dialog closes
  const handleClose = useCallback(() => {
    setRemark("");
    onClose();
  }, [onClose]);

  // Handle transfer - always to pool (no user selection)
  const handleTransfer = async () => {
    if (!customer?.cus_id) return;

    try {
      const result = await transfer({
        customerId: customer.cus_id,
        // No newManageBy - always goes to pool
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

        {/* Pool Info Alert - Replaces user selector */}
        <Alert severity="info" icon={<MdInfo size={20} />} sx={{ mb: 3, alignItems: "center" }}>
          <Typography variant="body2">
            ลูกค้าจะถูกส่งเข้า <strong>Pool ของทีม {getChannelLabelTh(targetChannel)}</strong>
            <br />
            <Typography variant="caption" color="text.secondary">
              หัวหน้าทีมปลายทางจะเป็นผู้มอบหมายผู้ดูแลต่อไป
            </Typography>
          </Typography>
        </Alert>

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
  onSuccess: PropTypes.func,
  targetChannel: PropTypes.number.isRequired,
  transferMutation: PropTypes.array.isRequired,
};

export default TransferDialog;
