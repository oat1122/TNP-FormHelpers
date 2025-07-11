import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { Add, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isToday, 
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { th } from 'date-fns/locale';
import TimelineBar from './TimelineBar';

const CalendarView = ({ 
  currentDate, 
  navigateMonth, 
  maxSupplies, 
  calculateEventTimeline,
  organizeEventsInRows 
}) => {
  const navigate = useNavigate();
  
  // Generate calendar days including previous/next month days for full calendar grid
  const generateCalendarDays = (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const days = generateCalendarDays(currentDate);
  const weekDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const allEvents = maxSupplies || [];
  const eventRows = organizeEventsInRows(allEvents, days);

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        bgcolor: '#f9fafb', 
        p: 2,
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigateMonth('prev')}
            size="small"
            sx={{ color: '#6b7280' }}
          >
            <ChevronLeft />
          </IconButton>
          
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', minWidth: 150 }}>
            {format(currentDate, 'MMMM yyyy', { locale: th })}
          </Typography>
          
          <IconButton
            onClick={() => navigateMonth('next')}
            size="small"
            sx={{ color: '#6b7280' }}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/max-supply/create')}
          sx={{
            bgcolor: '#0ea5e9',
            '&:hover': { bgcolor: '#0284c7' },
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          }}
          size="small"
        >
          สร้างงาน
        </Button>
      </Box>

      {/* Calendar Grid */}
      <Box sx={{ position: 'relative' }}>
        {/* Week Headers */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            bgcolor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          {weekDays.map((day, index) => (
            <Box
              key={index}
              sx={{
                py: 1.5,
                px: 1,
                textAlign: 'center',
                borderRight: index < 6 ? '1px solid #e5e7eb' : 'none',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#6b7280',
                  fontSize: '0.875rem',
                }}
              >
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Days */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            position: 'relative',
            minHeight: Math.max(350, eventRows.length * 25 + 120),
          }}
        >
          {days.map((day, index) => {
            const dayNum = format(day, 'd');
            const isCurrentDay = isToday(day);
            const isCurrentMonth = day >= startOfMonth(currentDate) && day <= endOfMonth(currentDate);
            const isWeekend = index % 7 === 0 || index % 7 === 6;

            return (
              <Box
                key={index}
                sx={{
                  minHeight: 80,
                  p: 1,
                  borderRight: index % 7 < 6 ? '1px solid #e5e7eb' : 'none',
                  borderBottom: '1px solid #e5e7eb',
                  bgcolor: isCurrentDay
                    ? '#eff6ff'
                    : isWeekend
                    ? '#fafafa'
                    : '#ffffff',
                  opacity: isCurrentMonth ? 1 : 0.5,
                  position: 'relative',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isCurrentDay ? 600 : 400,
                    color: isCurrentDay 
                      ? '#2563eb' 
                      : isCurrentMonth 
                        ? '#374151' 
                        : '#9ca3af',
                    fontSize: '0.875rem',
                  }}
                >
                  {dayNum}
                </Typography>
              </Box>
            );
          })}

          {/* Timeline Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            {eventRows.map((row, rowIndex) =>
              row.map((timeline, timelineIndex) => (
                <Box
                  key={`${rowIndex}-${timelineIndex}`}
                  sx={{
                    pointerEvents: 'auto',
                  }}
                >
                  <TimelineBar timeline={timeline} rowIndex={rowIndex} />
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CalendarView; 