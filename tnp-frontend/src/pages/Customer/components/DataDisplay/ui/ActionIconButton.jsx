import React from "react";
import { IconButton, useTheme } from "@mui/material";

// Utils
import { datadisplayColors } from "../../../utils/customerCardUtils";

/**
 * ActionIconButton - Styled IconButton สำหรับ View/Edit/Call actions
 * @param {ReactNode} icon - Icon component
 * @param {Function} onClick - Click handler
 * @param {string} hoverColor - สีเมื่อ hover (default: primary)
 * @param {string} title - Tooltip title
 * @param {string} size - ขนาด (small/medium)
 */
const ActionIconButton = ({
  icon,
  onClick,
  hoverColor = datadisplayColors.primary,
  title,
  size = "small",
  sx = {},
}) => {
  const theme = useTheme();

  const handleClick = (e) => {
    try {
      if (typeof onClick === "function") {
        onClick(e);
      }
    } catch (error) {
      console.error("Error in ActionIconButton onClick:", error);
    }
  };

  return (
    <IconButton
      size={size}
      onClick={handleClick}
      title={title}
      sx={{
        bgcolor: theme.palette.action.hover,
        "&:hover": {
          bgcolor: hoverColor,
          color: "white",
        },
        ...sx,
      }}
    >
      {icon}
    </IconButton>
  );
};

export default ActionIconButton;
