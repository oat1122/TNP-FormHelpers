import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { CalendarToday as CalendarTodayIcon } from "@mui/icons-material";

// Utils
import { datadisplayColors, formatThaiDate } from "../../../utils/customerCardUtils";

/**
 * CustomerCardFooter - ส่วนท้ายของ Customer Card
 * แสดงวันที่สร้างลูกค้า
 * @param {string|Object} createdDate - วันที่สร้าง
 */
const CustomerCardFooter = ({ createdDate }) => {
  const theme = useTheme();

  if (!createdDate) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        mt: 1.5,
        pt: 1,
        borderTop: `1px solid ${datadisplayColors.primaryDivider}`,
      }}
    >
      <CalendarTodayIcon
        fontSize="small"
        sx={{ color: datadisplayColors.primary, fontSize: "0.9rem" }}
      />
      <Typography
        variant="caption"
        sx={{
          color: theme.palette.text.disabled,
          fontSize: "0.7rem",
        }}
      >
        สร้างเมื่อ: {formatThaiDate(createdDate)}
      </Typography>
    </Box>
  );
};

export default CustomerCardFooter;
