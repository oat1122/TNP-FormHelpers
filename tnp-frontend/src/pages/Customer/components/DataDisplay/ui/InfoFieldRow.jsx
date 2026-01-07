import React from "react";
import { Box, Typography, useTheme } from "@mui/material";

// Utils
import { datadisplayColors } from "../../../utils/customerCardUtils";

/**
 * InfoFieldRow - Pattern ซ้ำๆ ของ Icon + Typography สำหรับแสดงข้อมูล
 * @param {ReactNode} icon - Icon component
 * @param {string} text - ข้อความที่แสดง
 * @param {string} iconColor - สี icon (default: primary)
 * @param {boolean} alignTop - จัดตำแหน่ง icon ด้านบน (สำหรับ multiline text)
 * @param {Object} sx - Additional styles
 */
const InfoFieldRow = ({
  icon,
  text,
  iconColor = datadisplayColors.icon.primary,
  alignTop = false,
  sx = {},
}) => {
  const theme = useTheme();

  if (!text) return null;

  const IconComponent = icon;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: alignTop ? "flex-start" : "center",
        gap: 1,
        ...sx,
      }}
    >
      {IconComponent && (
        <Box
          component="span"
          sx={{
            color: iconColor,
            minWidth: 20,
            display: "flex",
            alignItems: "center",
            mt: alignTop ? 0.1 : 0,
          }}
        >
          {React.isValidElement(IconComponent) ? (
            React.cloneElement(IconComponent, { fontSize: "small" })
          ) : (
            <IconComponent fontSize="small" />
          )}
        </Box>
      )}
      <Typography
        variant="body2"
        sx={{
          fontSize: "0.8rem",
          color: theme.palette.text.primary,
          lineHeight: alignTop ? 1.3 : "inherit",
        }}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default InfoFieldRow;
