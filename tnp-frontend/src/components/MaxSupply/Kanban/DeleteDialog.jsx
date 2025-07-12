import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

const DeleteDialog = ({ 
  open, 
  onClose, 
  job, 
  onConfirm 
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        ยืนยันการลบงาน
      </DialogTitle>
      <DialogContent>
        <Typography>
          คุณแน่ใจหรือไม่ที่จะลบงาน "{job?.title}" ของลูกค้า "{job?.customer_name}"?
        </Typography>
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          ยกเลิก
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          ลบงาน
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog; 