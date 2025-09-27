import { Delete as DeleteIcon, Warning as WarningIcon } from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";
import React from "react";

const DeleteConfirmDialog = ({ open, onClose, onConfirm, itemToDelete }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningIcon color="error" />
        ยืนยันการลบ
      </DialogTitle>
      <DialogContent>
        <Typography>
          คุณต้องการลบงาน <strong>{itemToDelete?.code}</strong> หรือไม่?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          การกระทำนี้ไม่สามารถย้อนกลับได้
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          ยกเลิก
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" startIcon={<DeleteIcon />}>
          ลบ
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
