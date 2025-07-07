import React, { useState, useCallback, useRef } from "react";
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
  Card,
  CardContent,
  Avatar,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  Fab,
  Stack,
  Divider,
  Skeleton,
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
  MdPhotoCamera,
  MdFolder,
  MdCloudUpload,
  MdPreview,
  MdDragIndicator,
  MdAddAPhoto,
  MdInsertDriveFile,
  MdClose,
  MdFullscreen,
  MdRotateRight,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [previewDialog, setPreviewDialog] = useState({ open: false, file: null });
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // API hooks
  const { data: filesData, isLoading: isLoadingFiles, refetch } = useMaxSupplyFiles(maxSupplyId);
  const uploadFilesMutation = useUploadMaxSupplyFiles();
  const deleteFileMutation = useDeleteMaxSupplyFile();
  const downloadFileMutation = useDownloadMaxSupplyFile();

  const files = filesData?.data || [];
  const isUploading = uploadFilesMutation.isPending;

  // File type helpers
  const getFileIcon = (file) => {
    const iconSize = 24;
    if (file.is_image) return <MdImage size={iconSize} color={theme.palette.primary.main} />;
    if (file.mime_type === 'application/pdf') return <MdPictureAsPdf size={iconSize} color="#f44336" />;
    if (file.mime_type.includes('word')) return <MdDescription size={iconSize} color="#2196f3" />;
    if (file.mime_type.includes('excel')) return <MdFilePresent size={iconSize} color="#4caf50" />;
    return <MdInsertDriveFile size={iconSize} color={theme.palette.text.secondary} />;
  };

  const getFileColor = (file) => {
    if (file.is_image) return 'primary';
    if (file.mime_type === 'application/pdf') return 'error';
    if (file.mime_type.includes('word')) return 'info';
    if (file.mime_type.includes('excel')) return 'success';
    return 'default';
  };

  // Upload handlers
  const handleFilesUpload = useCallback(async (uploadFiles) => {
    if (!maxSupplyId) {
      toast.error("ไม่พบรหัสงานผลิต กรุณาบันทึกงานก่อน");
      return;
    }

    if (uploadFiles.length === 0) return;

    // Validate files
    const validFiles = [];
    const invalidFiles = [];
    
    for (const file of uploadFiles) {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ name: file.name, error: validation.error });
      }
    }

    // Show validation errors
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ name, error }) => {
        toast.error(`${name}: ${error}`);
      });
    }

    if (validFiles.length === 0) return;

    try {
      // Show upload progress
      toast.loading(`กำลังอัปโหลด ${validFiles.length} ไฟล์...`, {
        id: 'upload-progress'
      });

      await uploadFilesMutation.mutateAsync({
        maxSupplyId,
        files: validFiles,
      });
      
      toast.success(`อัปโหลดไฟล์สำเร็จ ${validFiles.length} ไฟล์`, {
        id: 'upload-progress'
      });
      
      // Refetch files
      refetch();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error?.message || "ไม่สามารถอัปโหลดไฟล์ได้", {
        id: 'upload-progress'
      });
    }
  }, [maxSupplyId, uploadFilesMutation, refetch]);

  // Camera capture
  const handleCameraCapture = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Add timestamp to filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newFile = new File([file], `camera-${timestamp}.jpg`, {
        type: file.type,
      });
      handleFilesUpload([newFile]);
    }
    // Reset input
    event.target.value = '';
  }, [handleFilesUpload]);

  // File input
  const handleFileInput = useCallback((event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      handleFilesUpload(selectedFiles);
    }
    // Reset input
    event.target.value = '';
  }, [handleFilesUpload]);

  // Delete file
  const handleFileDelete = useCallback(async (file) => {
    const confirmed = await new Promise((resolve) => {
      const result = window.confirm(`คุณต้องการลบไฟล์ "${file.original_name}" หรือไม่?`);
      resolve(result);
    });

    if (!confirmed) return;

    try {
      await deleteFileMutation.mutateAsync({
        maxSupplyId,
        fileId: file.id,
      });
      toast.success("ลบไฟล์เรียบร้อยแล้ว");
      refetch();
    } catch (error) {
      toast.error(error?.message || "ไม่สามารถลบไฟล์ได้");
    }
  }, [maxSupplyId, deleteFileMutation, refetch]);

  // Download file
  const handleFileDownload = useCallback(async (file) => {
    try {
      toast.loading("กำลังดาวน์โหลด...", { id: 'download' });
      
      const blob = await downloadFileMutation.mutateAsync({
        maxSupplyId,
        fileId: file.id,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("ดาวน์โหลดไฟล์เรียบร้อยแล้ว", { id: 'download' });
    } catch (error) {
      toast.error(error?.message || "ไม่สามารถดาวน์โหลดไฟล์ได้", { id: 'download' });
    }
  }, [maxSupplyId, downloadFileMutation]);

  // Preview file
  const handleFilePreview = useCallback((file) => {
    if (file.is_image) {
      setPreviewDialog({ open: true, file });
    } else {
      handleFileDownload(file);
    }
  }, [handleFileDownload]);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error) => {
          if (error.code === 'file-too-large') {
            toast.error(`${file.name}: ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`${file.name}: ไม่รองรับไฟล์ประเภทนี้`);
          } else {
            toast.error(`${file.name}: ${error.message}`);
          }
        });
      });
    }
    
    if (acceptedFiles.length > 0) {
      handleFilesUpload(acceptedFiles);
    }
  }, [handleFilesUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false),
  });

  const renderFileItem = (file, index) => (
    <Fade in timeout={300 + index * 100} key={file.id}>
      <Card
        variant="outlined"
        sx={{
          mb: 2,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 2,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* File Icon/Thumbnail */}
            <Box
              sx={{
                minWidth: 60,
                height: 60,
                backgroundColor: 'grey.100',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {file.is_image && file.url ? (
                <img
                  src={file.url}
                  alt={file.original_name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <Box sx={{ display: file.is_image && file.url ? 'none' : 'flex' }}>
                {getFileIcon(file)}
              </Box>
            </Box>

            {/* File Info */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
                {file.original_name}
              </Typography>
              
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={file.formatted_size} 
                  size="small" 
                  variant="outlined" 
                />
                <Chip 
                  label={file.file_type} 
                  size="small" 
                  color={getFileColor(file)}
                />
                {file.uploaded_at && (
                  <Chip 
                    label={new Date(file.uploaded_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })} 
                    size="small" 
                    variant="outlined" 
                  />
                )}
              </Stack>
            </Box>

            {/* Actions */}
            <Stack direction="row" spacing={1}>
              {file.is_image && (
                <Tooltip title="ดูตัวอย่าง">
                  <IconButton
                    onClick={() => handleFilePreview(file)}
                    size="small"
                    color="primary"
                    sx={{ 
                      backgroundColor: 'primary.light',
                      '&:hover': { backgroundColor: 'primary.main', color: 'white' }
                    }}
                  >
                    <MdPreview />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="ดาวน์โหลด">
                <IconButton
                  onClick={() => handleFileDownload(file)}
                  size="small"
                  color="info"
                  disabled={downloadFileMutation.isPending}
                  sx={{ 
                    backgroundColor: 'info.light',
                    '&:hover': { backgroundColor: 'info.main', color: 'white' }
                  }}
                >
                  <MdDownload />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="ลบไฟล์">
                <IconButton
                  onClick={() => handleFileDelete(file)}
                  size="small"
                  color="error"
                  disabled={deleteFileMutation.isPending}
                  sx={{ 
                    backgroundColor: 'error.light',
                    '&:hover': { backgroundColor: 'error.main', color: 'white' }
                  }}
                >
                  <MdDelete />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  return (
    <Box>
      {/* Upload Area */}
      <Card
        sx={{
          mb: 3,
          border: `2px dashed ${
            dragActive || isDragActive ? theme.palette.primary.main : theme.palette.divider
          }`,
          backgroundColor: dragActive || isDragActive 
            ? `${theme.palette.primary.main}10` 
            : 'transparent',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: `${theme.palette.primary.main}05`,
          },
        }}
      >
        <Box {...getRootProps()}>
          <input {...getInputProps()} />
          <CardContent sx={{ textAlign: 'center', py: { xs: 3, md: 4 } }}>
            <Zoom in timeout={300}>
              <Avatar
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  mx: 'auto',
                  mb: 2,
                  backgroundColor: dragActive || isDragActive 
                    ? theme.palette.primary.main 
                    : theme.palette.primary.light,
                  transition: 'all 0.3s ease',
                }}
              >
                <MdCloudUpload size={isMobile ? 30 : 40} />
              </Avatar>
            </Zoom>
            
            <Typography variant={isMobile ? "h6" : "h5"} gutterBottom sx={{ fontWeight: 'bold' }}>
              {isDragActive ? "วางไฟล์ที่นี่..." : "ลากและวางไฟล์ หรือคลิกเพื่อเลือก"}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 2 }}>
              รองรับไฟล์: รูปภาพ (JPG, PNG, GIF), PDF, Word, Excel
              <br />
              ขนาดไฟล์สูงสุด 10MB ต่อไฟล์
            </Typography>

            {/* Quick Action Buttons */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
              sx={{ mt: 2 }}
            >
              <Button
                variant="contained"
                startIcon={<MdFolder />}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                size={isMobile ? "medium" : "large"}
                sx={{ 
                  borderRadius: 3,
                  px: 3,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 16px rgba(33, 150, 243, 0.3)',
                }}
              >
                เลือกไฟล์
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<MdAddAPhoto />}
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                size={isMobile ? "medium" : "large"}
                sx={{ 
                  borderRadius: 3,
                  px: 3,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: 'primary.light',
                  }
                }}
              >
                ถ่ายรูป
              </Button>
            </Stack>
          </CardContent>
        </Box>
      </Card>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        style={{ display: 'none' }}
      />

      {/* Upload Progress */}
      {isUploading && (
        <Fade in>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MdUpload />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    กำลังอัปโหลดไฟล์...
                  </Typography>
                  <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <MdFilePresent size={24} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                ไฟล์ที่แนบ
              </Typography>
              <Chip 
                label={`${files.length} ไฟล์`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
            
            <Box>
              {files.map(renderFileItem)}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoadingFiles && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Skeleton variant="rectangular" width={60} height={60} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {files.length === 0 && !isLoadingFiles && !isUploading && (
        <Fade in>
          <Alert 
            severity="info" 
            variant="outlined"
            sx={{ 
              textAlign: 'center',
              borderRadius: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography variant="body2">
              ยังไม่มีไฟล์แนับ ลากและวางไฟล์หรือคลิกปุ่มด้านบนเพื่อเริ่มต้น
            </Typography>
          </Alert>
        </Fade>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, file: null })}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MdImage />
              <Typography variant="h6" noWrap>
                {previewDialog.file?.original_name}
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setPreviewDialog({ open: false, file: null })}
              size="small"
            >
              <MdClose />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {previewDialog.file?.url && (
            <Box sx={{ 
              width: '100%', 
              height: isMobile ? 'auto' : '70vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'grey.100'
            }}>
              <img
                src={previewDialog.file.url}
                alt={previewDialog.file.original_name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setPreviewDialog({ open: false, file: null })}
            color="inherit"
          >
            ปิด
          </Button>
          <Button
            variant="contained"
            startIcon={<MdDownload />}
            onClick={() => {
              handleFileDownload(previewDialog.file);
              setPreviewDialog({ open: false, file: null });
            }}
            sx={{ borderRadius: 2 }}
          >
            ดาวน์โหลด
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Camera Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)',
            boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
          }}
          onClick={() => cameraInputRef.current?.click()}
        >
          <MdCameraAlt />
        </Fab>
      )}
    </Box>
  );
};

export default FileUpload;