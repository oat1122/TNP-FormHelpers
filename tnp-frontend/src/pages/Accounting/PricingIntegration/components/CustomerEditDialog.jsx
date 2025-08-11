import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CustomerEditCard from './CustomerEditCard';

const CustomerEditDialog = ({ open, onClose, customer, onUpdated }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        แก้ไขข้อมูลลูกค้า
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <CustomerEditCard
          customer={customer}
          onUpdate={(c) => onUpdated?.(c)}
          onCancel={onClose}
          startInEdit
        />
      </DialogContent>
    </Dialog>
  );
};

export default CustomerEditDialog;
