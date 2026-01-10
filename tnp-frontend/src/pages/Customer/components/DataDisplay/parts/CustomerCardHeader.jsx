import React from "react";
import { Box, Typography, Stack, useTheme } from "@mui/material";
import { Visibility as VisibilityIcon, Edit as EditIcon } from "@mui/icons-material";

// UI Atoms
import { CustomerAvatar, ActionIconButton } from "../ui";

// Utils
import { datadisplayColors, safeExtractValue } from "../../../utils/customerCardUtils";

/**
 * CustomerCardHeader - ส่วนหัวของ Customer Card
 * รวม Avatar, Name, Customer No, Action Buttons
 * @param {Object} customer - Customer data object
 * @param {Function} onView - Handler สำหรับดูข้อมูล
 * @param {Function} onEdit - Handler สำหรับแก้ไข
 */
const CustomerCardHeader = ({ customer, onView, onEdit }) => {
  const theme = useTheme();

  const cusName = safeExtractValue(customer.cus_name, ["name", "user_name"], "ไม่ระบุชื่อ");
  const cusNo = safeExtractValue(customer.cus_no, ["code", "number"], "N/A");

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        mb: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CustomerAvatar name={customer.cus_name} size={40} />
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: "1rem",
              lineHeight: 1.2,
              color: datadisplayColors.primary,
            }}
          >
            {cusName}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.75rem",
            }}
          >
            รหัส: {cusNo}
          </Typography>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={0.5}>
        <ActionIconButton
          icon={<VisibilityIcon fontSize="small" />}
          onClick={() => onView?.(customer.cus_id)}
          hoverColor={datadisplayColors.primary}
          title="ดูรายละเอียด"
        />
        <ActionIconButton
          icon={<EditIcon fontSize="small" />}
          onClick={() => onEdit?.(customer.cus_id)}
          hoverColor={datadisplayColors.secondary}
          title="แก้ไข"
        />
      </Stack>
    </Box>
  );
};

export default CustomerCardHeader;
