import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button,
  Typography
} from '@mui/material';
import { FaExclamationTriangle } from 'react-icons/fa';

/**
 * Confirmation dialog component for operations that need user confirmation
 */
const ConfirmDialog = ({
  open,
  title,
  content,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  onConfirm,
  onCancel,
  confirmColor = 'primary',
  severity = 'warning',
  maxWidth = 'xs'
}) => {
  // Icons based on severity
  const getIcon = () => {
    switch (severity) {
      case 'warning':
      case 'error':
        return <FaExclamationTriangle size={24} color={severity === 'error' ? '#d32f2f' : '#f59e0b'} />;
      default:
        return null;
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth={maxWidth}
      fullWidth
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getIcon()}
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
