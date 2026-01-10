/**
 * DialogHeader.jsx - Reusable dialog header with mode-based styling
 *
 * Used in:
 * - DialogForm (Customer form dialog)
 * - TelesalesQuickCreateForm
 *
 * Features:
 * - Mode-based title (create/edit/view)
 * - Mode-based background color
 * - Consistent styling with Kanit font
 *
 * @module Forms/layout/DialogHeader
 */
import React from "react";
import { DialogTitle, IconButton } from "@mui/material";
import { MdClose } from "react-icons/md";
import { FORM_THEME } from "../ui/FormFields";

/**
 * Get title based on mode
 */
const getTitleByMode = (mode, customTitle) => {
  if (customTitle) return customTitle;

  switch (mode) {
    case "create":
      return "เพิ่มลูกค้าใหม่";
    case "edit":
      return "แก้ไขข้อมูลลูกค้า";
    case "view":
      return "ดูข้อมูลลูกค้า";
    default:
      return "ข้อมูลลูกค้า";
  }
};

/**
 * Get background color based on mode
 */
const getBackgroundColor = (mode) => {
  switch (mode) {
    case "view":
      return "#616161"; // Grey for view mode
    case "edit":
      return "#f57c00"; // Orange for edit mode
    case "create":
    default:
      return FORM_THEME.PRIMARY_RED; // Red for create mode
  }
};

/**
 * DialogHeader - Consistent header for form dialogs
 *
 * @param {string} mode - "create" | "edit" | "view"
 * @param {string} title - Custom title (overrides mode-based title)
 * @param {function} onClose - Close button handler
 * @param {boolean} useModeBgColor - Use mode-based background color (default: false uses PRIMARY_RED)
 */
export const DialogHeader = ({ mode = "create", title, onClose, useModeBgColor = false }) => {
  const displayTitle = getTitleByMode(mode, title);
  const bgColor = useModeBgColor ? getBackgroundColor(mode) : FORM_THEME.PRIMARY_RED;

  return (
    <DialogTitle
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: bgColor,
        color: "white",
        py: { xs: 1, sm: 2 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <span
        style={{
          fontFamily: "Kanit",
          fontWeight: 600,
          fontSize: "1.1rem",
          color: "white",
        }}
      >
        {displayTitle}
      </span>
      <IconButton
        onClick={onClose}
        sx={{
          color: "white",
          p: { xs: 1, sm: 1.5 },
        }}
        aria-label="ปิด"
      >
        <MdClose size={20} />
      </IconButton>
    </DialogTitle>
  );
};

export default DialogHeader;
