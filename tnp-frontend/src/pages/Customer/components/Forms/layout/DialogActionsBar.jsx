/**
 * DialogActionsBar.jsx - Reusable dialog action buttons
 *
 * Used in:
 * - DialogForm (Customer form dialog)
 * - TelesalesQuickCreateForm
 *
 * Features:
 * - Cancel/Close button
 * - Save button (create/edit mode)
 * - Transfer buttons (view mode, optional)
 * - Responsive layout
 *
 * @module Forms/layout/DialogActionsBar
 */
import React from "react";
import { DialogActions, Button, Box, Tooltip } from "@mui/material";
import { MdSave, MdCancel, MdAdd, MdSwapHoriz, MdHistory } from "react-icons/md";
import { FORM_THEME } from "../ui/FormFields";

/**
 * DialogActionsBar - Consistent action buttons for form dialogs
 *
 * @param {string} mode - "create" | "edit" | "view"
 * @param {function} onClose - Cancel/Close button handler
 * @param {function} onSave - Save button handler (optional, uses form submit if not provided)
 * @param {boolean} saveLoading - Loading state for save button
 * @param {boolean} saveDisabled - Disable save button (e.g., duplicate phone)
 * @param {string} saveLabel - Custom save button label
 * @param {boolean} showSaveAndNew - Show "Save & Add New" button instead of "Save"
 * @param {function} onSaveAndNew - Handler for "Save & Add New" button
 * @param {object} transferConfig - Transfer button configuration (view mode only)
 * @param {boolean} transferConfig.show - Show transfer buttons
 * @param {string} transferConfig.direction - "to_sales" | "to_online"
 * @param {function} transferConfig.onTransfer - Transfer button handler
 * @param {function} transferConfig.onHistory - History button handler
 */
export const DialogActionsBar = ({
  mode = "create",
  onClose,
  onSave,
  saveLoading = false,
  saveDisabled = false,
  saveLabel,
  showSaveAndNew = false,
  onSaveAndNew,
  transferConfig,
}) => {
  const isViewMode = mode === "view";
  const isDisabled = saveLoading || saveDisabled;

  // Default save label based on state
  const getSaveLabel = () => {
    if (saveLabel) return saveLabel;
    if (saveLoading) return "กำลังบันทึก...";
    if (saveDisabled) return "เบอร์ซ้ำ";
    if (showSaveAndNew) return "บันทึก & เพิ่มใหม่";
    return "บันทึก";
  };

  return (
    <DialogActions
      sx={{
        borderTop: "1px solid #e0e0e0",
        backgroundColor: "#fff",
        p: { xs: 1.5, sm: 2 },
        justifyContent: "space-between",
        flexDirection: { xs: "column-reverse", sm: "row" },
        gap: { xs: 1, sm: 1 },
      }}
    >
      {/* Cancel/Close Button */}
      <Button
        variant="outlined"
        color="error"
        disabled={saveLoading}
        onClick={onClose}
        startIcon={<MdCancel />}
        sx={{
          minWidth: { xs: "100%", sm: "120px" },
          fontFamily: "Kanit",
        }}
      >
        {isViewMode ? "ปิด" : "ยกเลิก"}
      </Button>

      {/* Transfer Buttons - View mode only */}
      {isViewMode && transferConfig?.show && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* History button - Admin only */}
          {transferConfig.isAdmin && transferConfig.onHistory && (
            <Tooltip title="ดูประวัติการโอน">
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<MdHistory />}
                onClick={transferConfig.onHistory}
                sx={{ fontFamily: "Kanit" }}
              >
                ประวัติโอน
              </Button>
            </Tooltip>
          )}

          {/* Admin: Show BOTH transfer buttons */}
          {transferConfig.isAdmin &&
          transferConfig.onTransferToSales &&
          transferConfig.onTransferToOnline ? (
            <>
              <Button
                variant="contained"
                color="warning"
                startIcon={<MdSwapHoriz />}
                onClick={transferConfig.onTransferToSales}
                sx={{ fontFamily: "Kanit" }}
              >
                โอนไป Sales
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<MdSwapHoriz />}
                onClick={transferConfig.onTransferToOnline}
                sx={{ fontFamily: "Kanit" }}
              >
                โอนไป Online
              </Button>
            </>
          ) : (
            /* Non-Admin: Show single transfer button based on direction */
            transferConfig.onTransfer && (
              <Button
                variant="contained"
                color={transferConfig.direction === "to_sales" ? "warning" : "info"}
                startIcon={<MdSwapHoriz />}
                onClick={transferConfig.onTransfer}
                sx={{ fontFamily: "Kanit" }}
              >
                {transferConfig.direction === "to_sales" ? "โอนไป Sales" : "โอนไป Online"}
              </Button>
            )
          )}
        </Box>
      )}

      {/* Save Button - Create/Edit mode */}
      {!isViewMode && (
        <Button
          variant="contained"
          type={onSave ? "button" : "submit"}
          onClick={onSave}
          disabled={isDisabled}
          startIcon={<MdSave />}
          endIcon={showSaveAndNew ? <MdAdd /> : null}
          sx={{
            backgroundColor: saveDisabled ? "#888" : FORM_THEME.PRIMARY_RED,
            "&:hover": { backgroundColor: saveDisabled ? "#888" : FORM_THEME.SECONDARY_RED },
            minWidth: { xs: "100%", sm: showSaveAndNew ? "180px" : "140px" },
            fontFamily: "Kanit",
            fontWeight: 600,
          }}
        >
          {getSaveLabel()}
        </Button>
      )}
    </DialogActions>
  );
};

export default DialogActionsBar;
