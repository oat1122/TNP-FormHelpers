import React from 'react';
import { Box, Typography, Grid, Paper, Divider, useTheme, useMediaQuery } from '@mui/material';
import dayjs from 'dayjs';
import { getProductionTypeColor, getStatusColor, getStatusLabel, getProductionTypeIcon } from '../../utils/maxSupplyUtils';
import { FaCircle } from 'react-icons/fa';

const CalendarWeekView = ({ calendarData, onEventClick, currentDate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!calendarData || !calendarData.timeline) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>ไม่มีข้อมูลปฏิทินสำหรับช่วงเวลานี้</Typography>
      </Box>
    );
  }
  
  // Process data for week view
  const startDate = currentDate.startOf('week');
  const weekDays = [];
  const timeSlots = ['09:00-12:00', '13:00-16:00', '17:00-20:00'];
  
  // Generate weekday headers
  for (let i = 0; i < 7; i++) {
    const date = startDate.add(i, 'day');
    const dateKey = date.format('YYYY-MM-DD');
    const isToday = date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
    
    weekDays.push({
      date: dateKey,
      dayName: date.format('ddd'),
      dayNumber: date.format('D'),
      isToday,
      events: calendarData.timeline[dateKey] ? calendarData.timeline[dateKey].events : [],
      timeSlots: calendarData.timeline[dateKey] ? calendarData.timeline[dateKey].time_slots : {}
    });
  }
  
  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      {/* Week Header */}
      <Grid container sx={{ mb: 1 }} wrap={isMobile ? "nowrap" : "wrap"}>
        <Grid item xs={2} sx={{ p: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'text.secondary' }}>
            เวลา
          </Typography>
        </Grid>
        
        {weekDays.map((day, index) => (
          <Grid item xs={isMobile ? 3 : true} key={index} sx={{ 
            minWidth: isMobile ? 100 : 120, 
            p: 1,
            bgcolor: day.isToday ? theme.palette.primary.light + '20' : 'transparent',
            border: day.isToday ? `1px solid ${theme.palette.primary.main}` : 'none',
            borderRadius: 1
          }}>
            <Typography 
              variant="subtitle2" 
              align="center" 
              fontWeight={day.isToday ? "bold" : "normal"}
            >
              {day.dayName}
            </Typography>
            <Typography 
              variant="h6" 
              align="center" 
              fontWeight="bold" 
              color={day.isToday ? theme.palette.primary.main : 'text.primary'}
            >
              {day.dayNumber}
            </Typography>
          </Grid>
        ))}
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Time Slots */}
      {timeSlots.map((slot, slotIndex) => (
        <Box key={slotIndex} sx={{ mb: 2 }}>
          <Grid container wrap={isMobile ? "nowrap" : "wrap"}>
            <Grid item xs={2} sx={{ p: 1 }}>
              <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.secondary' }}>
                {slot}
              </Typography>
            </Grid>
            
            {weekDays.map((day, dayIndex) => {
              const events = day.timeSlots && day.timeSlots[slot] ? day.timeSlots[slot] : [];
              
              return (
                <Grid item xs={isMobile ? 3 : true} key={dayIndex} sx={{ 
                  minWidth: isMobile ? 100 : 120,
                  height: isMobile ? 120 : 150,
                  p: 1,
                  borderRight: '1px dashed #e0e0e0'
                }}>
                  <Paper 
                    elevation={0} 
                    sx={{
                      height: '100%',
                      p: 1,
                      bgcolor: 'background.default',
                      overflow: 'auto'
                    }}
                  >
                    {events.length > 0 ? (
                      events.map((event, eventIndex) => (
                        <Box 
                          key={eventIndex}
                          sx={{
                            mb: 1,
                            p: 1,
                            borderRadius: 1,
                            bgcolor: getProductionTypeColor(event.production_type, 0.2),
                            borderLeft: `3px solid ${getProductionTypeColor(event.production_type)}`,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: getProductionTypeColor(event.production_type, 0.3)
                            }
                          }}
                          onClick={() => onEventClick(event)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getProductionTypeIcon(event.production_type)}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {event.code}
                            </Typography>
                          </Box>
                          
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {event.title}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FaCircle size={8} color={getStatusColor(event.status)} />
                            <Typography variant="caption">
                              {getStatusLabel(event.status)}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        opacity: 0.3
                      }}>
                        <Typography variant="caption" align="center">
                          ไม่มีงาน
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
          
          {slotIndex < timeSlots.length - 1 && (
            <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CalendarWeekView;
