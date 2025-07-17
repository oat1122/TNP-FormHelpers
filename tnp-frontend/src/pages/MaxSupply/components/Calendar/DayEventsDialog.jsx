import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  Avatar, 
  Chip, 
  Grid, 
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Close as CloseIcon, Event as EventIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { productionTypeConfig, statusConfig, priorityConfig, PRIORITY_ORDER } from '../../utils/constants';
import { formatDate } from '../../utils/dateFormatters';

const DayEventsDialog = ({ 
  open, 
  onClose, 
  selectedDate, 
  dayEvents, 
  onEventClick 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  if (!selectedDate) return null;
  
  const sortedEvents = dayEvents.sort((a, b) => {
    const priorityA = PRIORITY_ORDER[a.priority] || 3;
    const priorityB = PRIORITY_ORDER[b.priority] || 3;
    return priorityA - priorityB;
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          background: 'linear-gradient(135deg, #B20000 0%, #900F0F 100%)', // ใช้สีหลักของระบบ
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <EventIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "white" }}>
              งานวันที่ {format(selectedDate, 'dd MMMM yyyy', { locale: th })}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, color: "white" }}>
              รวม {dayEvents.length} งาน
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
          {sortedEvents.map((event, index) => {
            const typeConfig = productionTypeConfig[event.production_type] || productionTypeConfig.screen;
            const statusInfo = statusConfig[event.status] || statusConfig.pending;
            const priorityInfo = priorityConfig[event.priority] || priorityConfig.normal;
            
            return (
              <Box
                key={event.id}
                onClick={() => {
                  onClose();
                  onEventClick(event);
                }}
                sx={{
                  p: 3,
                  borderBottom: index < sortedEvents.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: 'grey.50',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: typeConfig.color,
                      width: 48,
                      height: 48,
                      fontSize: '1.5rem',
                    }}
                  >
                    {typeConfig.icon}
                  </Avatar>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {event.title || event.customer_name || 'งานไม่ระบุชื่อ'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip
                        label={priorityInfo.label}
                        size="small"
                        sx={{
                          bgcolor: `${priorityInfo.color}20`,
                          color: priorityInfo.color,
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        label={statusInfo.label}
                        size="small"
                        sx={{
                          bgcolor: statusInfo.bgColor,
                          color: statusInfo.color,
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        label={typeConfig.label}
                        size="small"
                        sx={{
                          bgcolor: typeConfig.bgColor,
                          color: typeConfig.color,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>ลูกค้า:</strong> {event.customer_name || 'ไม่ระบุ'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>จำนวน:</strong> {event.total_quantity || 0} ตัว
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>เริ่ม:</strong> {formatDate(event.start_date)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>คาดว่าเสร็จ:</strong> {formatDate(event.expected_completion_date)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined">
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DayEventsDialog; 