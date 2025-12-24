import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";

/**
 * ConflictDialog - Dialog for handling assignment conflicts
 */
const ConflictDialog = ({ open, conflictData, onCancel, onForceAssign, isLoading = false }) => {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth aria-labelledby="conflict-dialog-title">
      <DialogTitle id="conflict-dialog-title">
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">ตรวจพบความขัดแย้ง</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography gutterBottom>ลูกค้าบางรายถูกจัดสรรไปแล้ว:</Typography>
        {conflictData?.conflicts && (
          <List dense>
            {conflictData.conflicts.map((c, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={c.cus_name || `ลูกค้า ID: ${c.cus_id}`}
                  secondary={`เพิ่งถูกจัดสรรให้ ${c.allocated_to || "ผู้ใช้อื่น"} เมื่อสักครู่`}
                />
              </ListItem>
            ))}
          </List>
        )}
        <Typography color="error" mt={2}>
          คุณต้องการยืนยันที่จะเปลี่ยนผู้รับผิดชอบหรือไม่?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} aria-label="ยกเลิก">
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={onForceAssign}
          disabled={isLoading}
          aria-label="ยืนยันการเปลี่ยนผู้รับผิดชอบแบบบังคับ"
        >
          ยืนยัน (Force)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ConflictDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  conflictData: PropTypes.object,
  onCancel: PropTypes.func.isRequired,
  onForceAssign: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default ConflictDialog;
