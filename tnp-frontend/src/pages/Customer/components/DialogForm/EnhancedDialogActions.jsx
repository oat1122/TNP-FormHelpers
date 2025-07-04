import React from "react";
import { DialogActions, Button } from "@mui/material";
import { MdSave, MdCancel } from "react-icons/md";

function EnhancedDialogActions({ onClose, isViewMode, isLoading }) {
  return (
    <DialogActions sx={{ p: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
      {!isViewMode && (
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading}
          startIcon={<MdSave />}
          size="large"
          sx={{
            mr: 1,
            px: 3,
            fontWeight: 600,
            boxShadow: 2,
          }}
        >
          บันทึก
        </Button>
      )}
      <Button
        variant="outlined"
        color="error"
        disabled={isLoading}
        onClick={onClose}
        startIcon={<MdCancel />}
        size="large"
        sx={{
          fontWeight: 600,
          px: 2,
        }}
      >
        ยกเลิก
      </Button>
    </DialogActions>
  );
}

export default EnhancedDialogActions;
