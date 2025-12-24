import React from "react";
import { Avatar } from "@mui/material";

// Utils
import { getInitials, datadisplayColors } from "../../../utils/customerCardUtils";

/**
 * CustomerAvatar - Avatar component สำหรับแสดง initials ลูกค้า
 * @param {string|Object} name - ชื่อลูกค้า
 * @param {number} size - ขนาด Avatar (default: 40)
 * @param {string} bgColor - สีพื้นหลัง (default: primary)
 */
const CustomerAvatar = ({ name, size = 40, bgColor = datadisplayColors.avatar.background }) => {
  return (
    <Avatar
      sx={{
        bgcolor: bgColor,
        width: size,
        height: size,
        fontSize: size * 0.225 + "rem",
        color: datadisplayColors.avatar.text,
        fontWeight: 500,
      }}
    >
      {getInitials(name)}
    </Avatar>
  );
};

export default CustomerAvatar;
