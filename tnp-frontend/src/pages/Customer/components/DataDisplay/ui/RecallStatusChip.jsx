import React from "react";
import { Box, Typography } from "@mui/material";
import { CalendarToday as CalendarTodayIcon } from "@mui/icons-material";

// Utils
import { datadisplayColors } from "../../../utils/customerCardUtils";

/**
 * RecallStatusChip - แสดงสถานะการนัดโทร
 * @param {string} recallDate - วันที่นัด
 * @param {Object} status - { color, text, statusKey } จาก getRecallStatus
 */
const RecallStatusChip = ({ recallDate, status }) => {
  if (!recallDate || !status) return null;

  const statusStyle =
    datadisplayColors.status[status.statusKey] || datadisplayColors.status.default;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        ml: "auto",
        bgcolor: statusStyle.background,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        border: `1px solid ${statusStyle.border}`,
      }}
    >
      <CalendarTodayIcon
        fontSize="small"
        sx={{
          fontSize: "0.75rem",
          color: statusStyle.color,
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontSize: "0.7rem",
          fontWeight: 500,
          color: statusStyle.color,
        }}
      >
        {status.text}
      </Typography>
    </Box>
  );
};

export default RecallStatusChip;
