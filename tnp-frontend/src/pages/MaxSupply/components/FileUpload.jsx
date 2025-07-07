import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Tooltip,
} from "@mui/material";
import toast from 'react-hot-toast';

// Icons
import { 
  MdUpload, 
  MdDelete, 
  MdDownload, 
  MdImage,
  MdDescription,
  MdPictureAsPdf,
  MdFilePresent,
  MdCameraAlt,
} from "react-icons/md";

// API and State
import {
  useMaxSupplyFiles,
  useUploadMaxSupplyFiles,
  useDeleteMaxSupplyFile,
  useDownloadMaxSupplyFile,
} from "../../../features/MaxSupply/maxSupplyApi";
import { 
  validateFile, 
  formatFileSize 
} from "../../../features/MaxSupply/maxSupplyUtils";

const FileUpload = ({ maxSupplyId }) => {
  const [previewDialog, setPreviewDialog] = useState({ open: false, file: null });

  // API hooks
  const { data: filesData, refetch } = useMaxSupplyFiles(maxSupplyId);
  const uploadFilesMutation = useUploadMaxSupplyFiles();
  const deleteFileMutation = useDeleteMaxSupplyFile();
  const downloadFileMutation = useDownloadMaxSupplyFile();

  const isUploading = uploadFilesMutation.isPending;
  const files = filesData?.data || [];

  // File upload handler
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!maxSupplyId) {
      toast.error("กรุณาบันทึกข้อมูลก่อนแนบไฟล์");
      return;
    }

    // Validate files
    const validFiles = [];
    const errors = [];

    acceptedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      toast.error(`ไฟล์ไม่ถูกต้อง: ${errors.join(', ')}`);
      if (validFiles.length === 0) return;
    }

    try {
      // Upload files
      await uploadFilesMutation.mutateAsync({ maxSupplyId, files: validFiles });
      
      toast.success(`อัปโหลดไฟล์ ${validFiles.length} ไฟล์เรียบร้อยแล้ว`);
      refetch();
    } catch (error) {
      toast.error(error?.message || "ไม่สามารถอัปโหลดไฟล์ได้");
    }
  }, [maxSupplyId, uploadFilesMutation, refetch]);

  // File delete handler
  const handleDeleteFile = async (fileId, fileName) => {
    if (!confirm(`คุณต้องการลบไฟล์ "${fileName}" หรือไม่?`)) return;

    try {
      await deleteFileMutation.mutateAsync({ maxSupplyId, fileId });
      toast.success("ลบไฟล์เรียบร้อยแล้ว");
      refetch();
    } catch (error) {
      toast.error(error?.message || "ไม่สามารถลบไฟล์ได้");
    }
  };

  // File download handler
  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const response = await downloadFileMutation.mutateAsync({ maxSupplyId, fileId });
      
      // Create download link
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.message || "ไม่สามารถดาวน์โหลดไฟล์ได้");
    }
  };

  // Preview handler
  const handlePreview = (file) => {
    if (file.mime_type.startsWith('image/')) {
      setPreviewDialog({ open: true, file });
    } else {
      handleDownloadFile(file.id, file.original_name);
    }
  };

  // Camera capture (for mobile)
  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      onDrop(files);
    };
    input.click();
  };

  // Get file icon
  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <MdImage />;
    if (mimeType === 'application/pdf') return <MdPictureAsPdf />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <MdDescription />;
    return <MdFilePresent />;
  };

  // Get file type color
  const getFileTypeColor = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'info';
    if (mimeType === 'application/pdf') return 'error';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'primary';
    return 'default';
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: isUploading || !maxSupplyId,
  });

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: maxSupplyId ? 'pointer' : 'not-allowed',
          opacity: maxSupplyId ? 1 : 0.5,
          textAlign: 'center',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: maxSupplyId ? 'primary.main' : 'grey.300',
            backgroundColor: maxSupplyId ? 'action.hover' : 'background.paper',
          },
        }}
      >
        <input {...getInputProps()} />
        <MdUpload size={48} style={{ color: '#666', marginBottom: 16 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'วางไฟล์ที่นี่' : 'ลากไฟล์มาวางหรือคลิกเพื่อเลือกไฟล์'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          รองรับ: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX (ขนาดไม่เกิน 10MB)
        </Typography>
        
        {/* Mobile Camera Button */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<MdCameraAlt />}
            onClick={handleCameraCapture}
            disabled={!maxSupplyId || isUploading}
            sx={{ mr: 1 }}
          >
            ถ่ายรูป
          </Button>
        </Box>
      </Paper>

      {/* Upload Progress */}
      {isUploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            กำลังอัปโหลดไฟล์...
          </Typography>
        </Box>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            ไฟล์ที่แนบ ({files.length} ไฟล์)
          </Typography>
          <List>
            {files.map((file) => (
              <ListItem key={file.id} divider>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  {getFileIcon(file.mime_type)}
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                        onClick={() => handlePreview(file)}
                      >
                        {file.original_name}
                      </Typography>
                      <Chip
                        label={file.file_type}
                        size="small"
                        color={getFileTypeColor(file.mime_type)}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="caption">{formatFileSize(file.file_size)}</Typography>
                      {file.description && (
                        <Typography variant="caption" color="text.secondary">
                          {file.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="ดาวน์โหลด">
                    <IconButton
                      size="small"
                      onClick={() => handleDownloadFile(file.id, file.original_name)}
                    >
                      <MdDownload />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ลบ">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteFile(file.id, file.original_name)}
                    >
                      <MdDelete />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, file: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ตัวอย่างไฟล์: {previewDialog.file?.original_name}
        </DialogTitle>
        <DialogContent>
          {previewDialog.file && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={previewDialog.file.url}
                alt={previewDialog.file.original_name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, file: null })}>
            ปิด
          </Button>
          {previewDialog.file && (
            <Button
              onClick={() => handleDownloadFile(previewDialog.file.id, previewDialog.file.original_name)}
            >
              ดาวน์โหลด
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Help Text */}
      {!maxSupplyId && (
        <Alert severity="info" sx={{ mt: 2 }}>
          กรุณาบันทึกข้อมูลก่อนเพื่อสามารถแนบไฟล์ได้
        </Alert>
      )}
    </Box>
  );
}

export default FileUpload;
