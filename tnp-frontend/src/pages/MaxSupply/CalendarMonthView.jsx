import React from 'react';
import { Box, Typography, Grid, Paper, useTheme, useMediaQuery } from '@mui/material';
import dayjs from 'dayjs';
import { getProductionTypeColor, getStatusColor, getStatusLabel } from '../../utils/maxSupplyUtils';
import { FaCircle } from 'react-icons/fa';

const CalendarMonthView = ({ calendarData, onEventClick, currentDate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!calendarData || !calendarData.calendar || !calendarData.calendar.grid) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>ไม่มีข้อมูลปฏิทินสำหรับช่วงเวลานี้</Typography>
      </Box>
    );
  }
  
  const { grid } = calendarData.calendar;
  const today = dayjs().format('YYYY-MM-DD');
  
  // Generate weekday headers
  const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  
  // Get the first day of the month and the last day of the month
  const firstDay = currentDate.startOf('month').day(); // 0 is Sunday, 1 is Monday, etc.
  const daysInMonth = currentDate.daysInMonth();
  
  // Create calendar days array
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push({ day: null, events: [], isEmpty: true });
  }
  
  // Add actual days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = currentDate.date(day).format('YYYY-MM-DD');
    const dayEvents = grid[day] ? grid[day].events : [];
    const isToday = dateKey === today;
    const isWeekend = [0, 6].includes(currentDate.date(day).day()); // 0 is Sunday, 6 is Saturday
    
    calendarDays.push({
      day,
      date: dateKey,
      events: dayEvents,
      isToday,
      isWeekend
    });
  }
  
  // Group calendar days into weeks
  const calendarWeeks = [];
  let week = [];
  
  calendarDays.forEach((day, index) => {
    week.push(day);
    
    if ((index + 1) % 7 === 0 || index === calendarDays.length - 1) {
      // If the week isn't full, add empty cells
      while (week.length < 7) {
        week.push({ day: null, events: [], isEmpty: true });
      }
      
      calendarWeeks.push([...week]);
      week = [];
    }
  });
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Calendar Header */}
      <Grid container sx={{ mb: 1, textAlign: 'center' }}>
        {weekDays.map((day, index) => (
          <Grid item xs={12/7} key={index}>
            <Typography 
              variant="subtitle1" 
              fontWeight="bold"
              color={[0, 6].includes(index) ? 'text.secondary' : 'text.primary'}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>
      
      {/* Calendar Grid */}
      {calendarWeeks.map((week, weekIndex) => (
        <Grid container key={weekIndex} sx={{ mb: 1 }}>
          {week.map((day, dayIndex) => (
            <Grid item xs={12/7} key={dayIndex}>
              <Paper 
                elevation={day.isToday ? 3 : 0} 
                sx={{
                  height: isMobile ? 120 : 150,
                  p: 1,
                  overflow: 'auto',
                  bgcolor: day.isEmpty 
                    ? '#f5f5f5' 
                    : day.isToday
                      ? theme.palette.primary.light + '20'
                      : day.isWeekend
                        ? '#f9f9f9'
                        : 'white',
                  border: day.isToday ? `1px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                  '&:hover': {
                    bgcolor: day.isEmpty ? '#f5f5f5' : '#f0f7ff'
                  }
                }}
              >
                {!day.isEmpty && (
                  <>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: day.isToday ? 'bold' : 'normal',
                        color: day.isWeekend ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {day.day}
                    </Typography>
                    
                    {day.events && day.events.map((event, eventIndex) => (
                      <Box 
                        key={eventIndex}
                        sx={{
                          mt: 0.5,
                          p: 0.5,
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
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {event.code}: {event.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FaCircle size={8} color={getStatusColor(event.status)} />
                          <Typography variant="caption">
                            {getStatusLabel(event.status)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      ))}
    </Box>
  );
};

export default CalendarMonthView;
