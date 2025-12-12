import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import { MdClose, MdHistory, MdSwapHoriz } from "react-icons/md";
import moment from "moment";
import "moment/locale/th";

import { useGetTransferHistoryQuery } from "../../../../features/Customer/customerTransferApi";
import { getChannelLabelTh, getChannelColor } from "../../constants/customerChannel";

// Set Thai locale for moment
moment.locale("th");

/**
 * TransferHistoryDialog
 *
 * Dialog แสดงประวัติการโอนย้ายลูกค้า
 * แสดงเป็น Timeline พร้อมรายละเอียด
 */
const TransferHistoryDialog = ({ open, onClose, customerId, customerName }) => {
  // Fetch transfer history
  const { data, isLoading, error } = useGetTransferHistoryQuery(customerId, {
    skip: !open || !customerId,
  });

  const historyData = data?.data || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "grey.100",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MdHistory size={24} />
          <Typography variant="h6">ประวัติการโอนย้าย</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <MdClose />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Customer Name */}
        {customerName && (
          <Box sx={{ mb: 2, textAlign: "center" }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {customerName}
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error?.data?.message || "ไม่สามารถดึงประวัติได้"}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && historyData.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <MdSwapHoriz size={48} style={{ opacity: 0.3 }} />
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              ยังไม่มีประวัติการโอนย้าย
            </Typography>
          </Box>
        )}

        {/* Timeline */}
        {!isLoading && historyData.length > 0 && (
          <Timeline position="right" sx={{ p: 0 }}>
            {historyData.map((item, index) => (
              <TimelineItem key={item.id}>
                <TimelineOppositeContent sx={{ flex: 0.3, py: 1.5 }} color="text.secondary">
                  <Typography variant="caption" display="block">
                    {moment(item.created_at).format("D MMM YY")}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {moment(item.created_at).format("HH:mm น.")}
                  </Typography>
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot color={getChannelColor(item.new_channel)} variant="outlined">
                    <MdSwapHoriz size={16} />
                  </TimelineDot>
                  {index < historyData.length - 1 && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent sx={{ py: 1.5 }}>
                  {/* Channel Change */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                    <Chip
                      label={
                        item.previous_channel_label || getChannelLabelTh(item.previous_channel)
                      }
                      size="small"
                      color={getChannelColor(item.previous_channel)}
                      variant="outlined"
                    />
                    <Typography variant="body2" sx={{ mx: 0.5 }}>
                      →
                    </Typography>
                    <Chip
                      label={item.new_channel_label || getChannelLabelTh(item.new_channel)}
                      size="small"
                      color={getChannelColor(item.new_channel)}
                    />
                  </Box>

                  {/* Action By */}
                  <Typography variant="caption" color="text.secondary" display="block">
                    โดย:{" "}
                    {item.action_by
                      ? `${item.action_by.user_firstname || ""} ${item.action_by.user_lastname || ""}`.trim() ||
                        item.action_by.username
                      : "ไม่ทราบ"}
                  </Typography>

                  {/* Remark */}
                  {item.remark && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1,
                        bgcolor: "grey.50",
                        borderRadius: 1,
                        borderLeft: "3px solid",
                        borderColor: "grey.300",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        "{item.remark}"
                      </Typography>
                    </Box>
                  )}
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </DialogContent>
    </Dialog>
  );
};

TransferHistoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customerId: PropTypes.string,
  customerName: PropTypes.string,
};

export default TransferHistoryDialog;
