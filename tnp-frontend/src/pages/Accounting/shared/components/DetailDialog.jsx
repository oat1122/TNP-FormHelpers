import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { tokens } from '../../PricingIntegration/components/quotation/styles/quotationTheme';

/**
 * DetailDialog (Shared Base Component)
 * Base dialog structure for quotation/invoice/receipt details
 */
const DetailDialog = ({
  open,
  onClose,
  title,
  isLoading = false,
  error = null,
  children,
  actions,
  maxWidth = "lg",
  fullWidth = true,
  ...props
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={maxWidth} 
      fullWidth={fullWidth}
      {...props}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2, bgcolor: tokens.bg }}>
        {isLoading ? (
          <Box display="flex" alignItems="center" gap={1} p={2}>
            <CircularProgress size={22} />
            <Typography variant="body2">กำลังโหลดรายละเอียด…</Typography>
          </Box>
        ) : error ? (
          <Box p={2}>
            <Typography color="error">
              ไม่สามารถโหลดข้อมูลได้: {typeof error === 'string' ? error : error?.message || 'เกิดข้อผิดพลาด'}
            </Typography>
          </Box>
        ) : (
          children
        )}
      </DialogContent>
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DetailDialog;
