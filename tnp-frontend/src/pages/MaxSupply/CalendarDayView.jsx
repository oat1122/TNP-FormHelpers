import React from 'react';
import { Box, Typography, Grid, Paper, Divider, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { getProductionTypeColor, getStatusColor, getStatusLabel, getProductionTypeIcon } from '../../utils/maxSupplyUtils';
import { FaCircle } from 'react-icons/fa';

const CalendarDayView = ({ calendarData, onEventClick, currentDate }) => {
  const theme = useTheme();
  
  if (!calendarData || !calendarData.timeline) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>ไม่มีข้อมูลปฏิทินสำหรับช่วงเวลานี้</Typography>
      </Box>
    );
  }
  
  const dateKey = currentDate.format('YYYY-MM-DD');
  const dayData = calendarData.timeline[dateKey] || { events: [], time_slots: {} };
  const timeSlots = ['09:00-12:00', '13:00-16:00', '17:00-20:00'];
  const isToday = dateKey === dayjs().format('YYYY-MM-DD');
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Day Header */}
      <Box 
        sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: isToday ? theme.palette.primary.light + '20' : 'background.paper',
          borderRadius: 1,
          border: isToday ? `1px solid ${theme.palette.primary.main}` : 'none',
          textAlign: 'center'
        }}
      >
        <Typography variant="h5" fontWeight="bold" color={isToday ? theme.palette.primary.main : 'text.primary'}>
          {currentDate.format('dddd, D MMMM YYYY')}
          {isToday && (
            <Typography 
              component="span" 
              variant="body2" 
              sx={{ 
                ml: 1, 
                p: 0.5, 
                bgcolor: theme.palette.primary.main, 
                color: 'white',
                borderRadius: 1
              }}
            >
              วันนี้
            </Typography>
          )}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          งานทั้งหมด: {dayData.events.length} งาน
        </Typography>
      </Box>
      
      {/* Time Slots */}
      {timeSlots.map((slot, index) => {
        const events = dayData.time_slots[slot] || [];
        
        return (
          <Box key={index} sx={{ mb: 3 }}>
            <Box sx={{ 
              p: 1, 
              bgcolor: theme.palette.grey[100], 
              borderRadius: '4px 4px 0 0',
              borderBottom: `2px solid ${theme.palette.primary.main}`
            }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {slot}
              </Typography>
            </Box>
            
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                minHeight: 150,
                border: `1px solid ${theme.palette.divider}`,
                borderTop: 'none'
              }}
            >
              {events.length > 0 ? (
                <Grid container spacing={2}>
                  {events.map((event, eventIndex) => (
                    <Grid item xs={12} sm={6} md={4} key={eventIndex}>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          bgcolor: getProductionTypeColor(event.production_type, 0.1),
                          borderLeft: `4px solid ${getProductionTypeColor(event.production_type)}`,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: getProductionTypeColor(event.production_type, 0.2),
                            transform: 'translateY(-2px)',
                            transition: 'transform 0.3s ease'
                          }
                        }}
                        onClick={() => onEventClick(event)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getProductionTypeIcon(event.production_type, 18)}
                            <Typography variant="subtitle2" fontWeight="bold">
                              {event.code}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            px: 1, 
                            py: 0.5,
                            bgcolor: getStatusColor(event.status) + '20',
                            borderRadius: 1
                          }}>
                            <FaCircle size={8} color={getStatusColor(event.status)} />
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              {getStatusLabel(event.status)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {event.title}
                        </Typography>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            ลูกค้า: {event.customer_name}
                          </Typography>
                          
                          <Typography variant="caption" color="text.secondary">
                            ผู้สร้าง: {event.creator}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  p: 3
                }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่มีงานในช่วงเวลานี้
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
};

export default CalendarDayView;
