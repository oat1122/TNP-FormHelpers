import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Card,
  CardContent,
  Chip,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const PricingRequestNotesDialog = ({
  open,
  onClose,
  selectedRequest,
  pricingNotes,
  getNoteTypeName,
  getNoteTypeColor,
  formatDateTime
}) => {
  if (!selectedRequest) return null;

  const requestId = selectedRequest.id || selectedRequest.pr_id;
  const notes = pricingNotes[requestId] || [];
  const sortedNotes = [...notes].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            ประวัติ Notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedRequest.product_name || selectedRequest.pr_work_name} 
            ({selectedRequest.pr_no || selectedRequest.id || selectedRequest.pr_id})
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box>
          {sortedNotes.length === 0 ? (
            <Alert severity="info">
              <Typography>ไม่มี notes สำหรับรายการนี้</Typography>
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" gutterBottom>
                จำนวน Notes ทั้งหมด: {sortedNotes.length} รายการ
              </Typography>
              
              {sortedNotes.map((note, index) => (
                <Card 
                  key={note.id} 
                  variant="outlined" 
                  sx={{ 
                    bgcolor: index === 0 ? 'action.hover' : 'background.paper',
                    border: index === 0 ? '2px solid' : '1px solid',
                    borderColor: index === 0 ? 'primary.main' : 'divider'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip 
                          label={getNoteTypeName(note.type)}
                          color={getNoteTypeColor(note.type)}
                          size="small"
                        />
                        {index === 0 && (
                          <Chip 
                            label="ล่าสุด"
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.primary">
                          {formatDateTime(note.created_date)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          โดย: {note.created_by || 'ไม่ระบุ'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body1" sx={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {note.text}
                    </Typography>
                    
                    {note.updated_date && note.updated_date !== note.created_date && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                          แก้ไขล่าสุด: {formatDateTime(note.updated_date)} 
                          {note.updated_by && ` โดย ${note.updated_by}`}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PricingRequestNotesDialog;
