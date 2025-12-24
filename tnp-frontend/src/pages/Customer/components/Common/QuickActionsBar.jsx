import { Box, Button, Chip, Stack, Tooltip, useTheme, useMediaQuery } from "@mui/material";
import React from "react";
import { MdContentCopy, MdAutoAwesome } from "react-icons/md";
import { useSelector } from "react-redux";

// สี theme ของบริษัท
const PRIMARY_RED = "#9e0000";

/**
 * QuickActionsBar - Quick action buttons for form
 * Provides shortcuts like copying from last customer
 */
const QuickActionsBar = ({ onCopyLastCustomer, mode = "create", disabled = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Get last customer from itemList
  const itemList = useSelector((state) => state.customer.itemList);
  const hasLastCustomer = itemList && itemList.length > 0;

  // Don't show in view mode
  if (mode === "view") {
    return null;
  }

  // Handle copy last customer
  const handleCopyLast = () => {
    if (!hasLastCustomer || !onCopyLastCustomer) return;

    // Get the most recent customer (last in the list)
    const lastCustomer = itemList[itemList.length - 1];

    // Extract useful info to copy (not all fields, just common ones)
    const copyData = {
      cus_bt_id: lastCustomer.cus_bt_id,
      cus_channel: lastCustomer.cus_channel,
      cus_province_text: lastCustomer.cus_province_text,
      cus_district_text: lastCustomer.cus_district_text,
      cus_subdistrict_text: lastCustomer.cus_subdistrict_text,
      cus_zip_code: lastCustomer.cus_zip_code,
    };

    onCopyLastCustomer(copyData);
  };

  // Mobile: Compact chips
  if (isMobile) {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 1,
          p: 1.5,
          bgcolor: "#fafafa",
          borderBottom: "1px solid #e0e0e0",
          overflowX: "auto",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Chip
          icon={<MdAutoAwesome size={16} />}
          label="Quick Actions"
          size="small"
          sx={{
            fontFamily: "Kanit",
            fontSize: "0.75rem",
            bgcolor: `${PRIMARY_RED}10`,
            color: PRIMARY_RED,
            fontWeight: 600,
            "& .MuiChip-icon": {
              color: PRIMARY_RED,
            },
          }}
        />

        {hasLastCustomer && (
          <Tooltip title="คัดลอกข้อมูลจากลูกค้าล่าสุด (ประเภทธุรกิจ, ที่อยู่)" arrow>
            <Chip
              icon={<MdContentCopy size={14} />}
              label="ใช้ข้อมูลล่าสุด"
              size="small"
              onClick={handleCopyLast}
              disabled={disabled}
              variant="outlined"
              sx={{
                fontFamily: "Kanit",
                fontSize: "0.75rem",
                borderColor: PRIMARY_RED,
                color: PRIMARY_RED,
                "&:hover": {
                  bgcolor: `${PRIMARY_RED}10`,
                },
                "& .MuiChip-icon": {
                  color: PRIMARY_RED,
                },
              }}
            />
          </Tooltip>
        )}
      </Box>
    );
  }

  // Desktop: Button row
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        py: 1.5,
        bgcolor: "#fafafa",
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          icon={<MdAutoAwesome size={16} />}
          label="Quick Actions"
          size="small"
          sx={{
            fontFamily: "Kanit",
            fontSize: "0.8rem",
            bgcolor: `${PRIMARY_RED}10`,
            color: PRIMARY_RED,
            fontWeight: 600,
            "& .MuiChip-icon": {
              color: PRIMARY_RED,
            },
          }}
        />
      </Stack>

      <Stack direction="row" spacing={1}>
        {hasLastCustomer && (
          <Tooltip title="คัดลอกประเภทธุรกิจและที่อยู่จากลูกค้าที่เพิ่มล่าสุด" arrow>
            <Button
              variant="outlined"
              size="small"
              startIcon={<MdContentCopy size={16} />}
              onClick={handleCopyLast}
              disabled={disabled}
              sx={{
                fontFamily: "Kanit",
                fontSize: "0.85rem",
                textTransform: "none",
                borderColor: PRIMARY_RED,
                color: PRIMARY_RED,
                "&:hover": {
                  borderColor: PRIMARY_RED,
                  bgcolor: `${PRIMARY_RED}08`,
                },
              }}
            >
              ใช้ข้อมูลล่าสุด
            </Button>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};

export default QuickActionsBar;
