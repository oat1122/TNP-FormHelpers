import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { BsX } from 'react-icons/bs';
import { useSelector, useDispatch } from 'react-redux';
import { selectPreviewAttachment, setPreviewAttachment } from '../feedbackSlice';

const AttachmentPreview = () => {
  const dispatch = useDispatch();
  const previewAttachment = useSelector(selectPreviewAttachment);

  const handleClose = () => {
    dispatch(setPreviewAttachment(null));
  };

  if (!previewAttachment) {
    return null;
  }

  const isImage = previewAttachment.type.startsWith('image/');
  const isPdf = previewAttachment.type === 'application/pdf';

  return (
    <Dialog
      open={!!previewAttachment}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{previewAttachment.name}</Typography>
          <IconButton onClick={handleClose} size="large">
            <BsX />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {isImage && (
          <Box display="flex" justifyContent="center">
            <img
              src={URL.createObjectURL(previewAttachment)}
              alt={previewAttachment.name}
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
          </Box>
        )}
        
        {isPdf && (
          <Box sx={{ height: '70vh', width: '100%' }}>
            <iframe
              src={URL.createObjectURL(previewAttachment)}
              title={previewAttachment.name}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          </Box>
        )}
        
        {!isImage && !isPdf && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>
              Preview not available for this file type. Please download the file to view it.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentPreview;
