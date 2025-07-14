import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import { 
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format, isToday, isSameMonth, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { DAY_NAMES, DAY_NAMES_SHORT, productionTypeConfig, priorityConfig } from '../../utils/constants';
import { getEventsForDate } from '../../utils/calendarUtils';
import TimelineBar from './TimelineBar';
import ProductionTypeIcon from '../ProductionTypeIcon';

const CalendarGrid = ({ 
  calendarDays, 
  currentDate, 
  eventRows, 
  overflowTimelines, 
  totalTimelines,
  filteredEvents,
  loading,
  hoveredTimeline,
  setHoveredTimeline,
  onDayClick,
  onTimelineClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State สำหรับ dynamic window height
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setWindowHeight(window.innerHeight);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // คำนวณจำนวนแถวของปฏิทิน - บังคับใช้ 6 แถวเสมอ
  const numRows = 6;
  // ใช้ responsive cellHeight และส่ง numeric value ให้ TimelineBar
  const cellHeight = isMobile ? `${Math.floor(windowHeight / 5.5)}px` : '200px';
  const numericCellHeight = isMobile ? Math.floor(windowHeight / 5.5) : 200;

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Day Headers */}
      <Box sx={{ 
        display: { xs: 'flex', md: 'grid' },
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        justifyContent: 'space-between',
        gridTemplateColumns: { md: 'repeat(7, 1fr)' },
        bgcolor: 'grey.100',
        borderBottom: 2,
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {DAY_NAMES.map((day, index) => (
          <Box 
            key={day} 
            sx={{ 
              p: { xs: 1, md: 2 }, 
              textAlign: 'center', 
              borderRight: { md: 1 }, 
              borderColor: 'divider',
              flex: { xs: '1 1 14.28%', md: 'none' }, // ให้แต่ละช่องกว้างเท่ากันบนมือถือ
              minWidth: { xs: '14.28%', md: 'auto' }, // 100% / 7 = 14.28%
            }}
          >
            <Typography 
              variant="subtitle2" 
              fontWeight="bold" 
              color="primary"
              sx={{ fontSize: { xs: '0.65rem', md: '0.875rem' } }}
            >
              {isMobile ? DAY_NAMES_SHORT[index] : day}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar Days with Enhanced Timeline */}
      <Box sx={{ 
        position: 'relative', 
        height: `calc(${numRows} * ${cellHeight})`, // คำนวณความสูงตามจำนวนแถวจริง
        minHeight: isMobile ? `${Math.floor(windowHeight / 1.8)}px` : '600px', // ความสูงขั้นต่ำแบบ responsive
        bgcolor: 'grey.50' 
      }}>
        {/* Days Grid */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `repeat(${numRows}, ${cellHeight})`, // ปรับจำนวนแถวตามจำนวนที่คำนวณได้
          position: 'relative', 
          zIndex: 1 
        }}>
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDate(day, filteredEvents);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <Box 
                key={day.toISOString()} 
                onClick={() => onDayClick(day)}
                sx={{ 
                  border: 1,
                  borderColor: 'divider',
                  height: cellHeight, // ใช้ความสูงที่คำนวณแล้ว
                  position: 'relative',
                  backgroundColor: isTodayDate 
                    ? '#e8f0fe' 
                    : isCurrentMonth 
                      ? '#fff' 
                      : '#f9fafb',
                  opacity: isCurrentMonth ? 1 : 0.7,
                  transition: 'all 0.2s ease',
                  cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                  overflow: 'hidden', // 💥 ป้องกันล้น
                  '&:hover': {
                    backgroundColor: isTodayDate ? '#e8f0fe' : '#f0f9ff',
                    transform: dayEvents.length > 0 ? 'scale(1.02)' : 'none',
                  }
                }}
              >
                <Box sx={{ p: isMobile ? 0.5 : 1 }}>
                  <Typography 
                    variant="body2" 
                    fontWeight={isTodayDate ? 'bold' : 'normal'}
                    sx={{
                      color: isTodayDate ? '#1a73e8' : isCurrentMonth ? 'text.primary' : 'text.secondary',
                      fontSize: isTodayDate ? (isMobile ? '0.875rem' : '1rem') : (isMobile ? '0.75rem' : '0.875rem'),
                      width: isMobile ? 20 : 24,
                      height: isMobile ? 20 : 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: isTodayDate ? '#1a73e8' : 'transparent',
                      color: isTodayDate ? 'white' : 'inherit',
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  
                  {/* Enhanced Event dots for jobs starting on this day */}
                  <Box sx={{ mt: 0.25, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                    {dayEvents.slice(0, 2).map((event) => {
                      const eventStartDate = format(parseISO(event.start_date), 'yyyy-MM-dd');
                      const currentDayStr = format(day, 'yyyy-MM-dd');
                      const typeConfig = productionTypeConfig[event.production_type] || productionTypeConfig.screen;
                      const priorityInfo = priorityConfig[event.priority] || priorityConfig.normal;
                      
                      // Only show dots for jobs that start on this specific day
                      if (eventStartDate === currentDayStr) {
                        return (
                          <Box
                            key={event.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: isMobile ? 16 : 20,
                              height: isMobile ? 16 : 20,
                              borderRadius: '50%',
                              backgroundColor: typeConfig.color,
                              boxShadow: `0 1px 3px ${typeConfig.color}40`,
                              opacity: 0.9,
                              border: event.priority === 'urgent' || event.priority === 'high' ? `2px solid ${priorityInfo.color}` : 'none',
                              animation: event.priority === 'urgent' ? 'pulse 1.5s infinite' : 'none',
                              '@keyframes pulse': {
                                '0%, 100%': { opacity: 0.9 },
                                '50%': { opacity: 1 },
                              },
                            }}
                          >
                            <ProductionTypeIcon 
                              type={event.production_type} 
                              size={isMobile ? 10 : 12} 
                              color="white" 
                            />
                          </Box>
                        );
                      }
                      return null;
                    })}
                    
                    {/* Enhanced overflow indicator */}
                    {(() => {
                      const startingJobsCount = dayEvents.filter(event => 
                        format(parseISO(event.start_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                      ).length;
                      const totalJobsCount = dayEvents.length;
                      
                      if (startingJobsCount > 2) {
                        return (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: isMobile ? '0.4rem' : '0.5rem', 
                              opacity: 0.8,
                              color: 'primary.main',
                              fontWeight: 'bold',
                              backgroundColor: 'rgba(26, 115, 232, 0.1)',
                              borderRadius: '4px',
                              px: 0.5,
                              py: 0.25,
                            }}
                          >
                            +{startingJobsCount - 2}
                          </Typography>
                        );
                      }
                      
                      if (totalJobsCount > startingJobsCount && startingJobsCount <= 2) {
                        return (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: isMobile ? '0.4rem' : '0.5rem', 
                              opacity: 0.6,
                              color: 'text.secondary',
                              fontWeight: 'bold',
                            }}
                          >
                            •{totalJobsCount}
                          </Typography>
                        );
                      }
                      
                      return null;
                    })()}
                  </Box>
                  
                  {/* Per-cell Timeline Overflow Indicator */}
                  {(() => {
                    const dayEventsTimelines = eventRows.reduce((acc, row, rowIndex) => {
                      const dayTimelines = row.filter(timeline => {
                        const timelineStartDate = format(parseISO(timeline.event.start_date), 'yyyy-MM-dd');
                        const dayString = format(day, 'yyyy-MM-dd');
                        return timelineStartDate === dayString;
                      });
                      return acc.concat(dayTimelines);
                    }, []);
                    
                    const visibleTimelineCount = Math.min(dayEventsTimelines.length, 5);
                    const hiddenTimelineCount = dayEventsTimelines.length - visibleTimelineCount;
                    
                    if (hiddenTimelineCount > 0) {
                      return (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 6,
                            right: 6,
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            fontSize: '0.65rem',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            zIndex: 20,
                            pointerEvents: 'auto',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            onDayClick(day);
                          }}
                        >
                          +{hiddenTimelineCount} งานเพิ่มเติม
                        </Box>
                      );
                    }
                    
                    return null;
                  })()}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Enhanced Timeline Events Overlay */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            overflow: 'hidden', // 💥 ป้องกันล้น
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {loading ? (
            <Box sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              p: 3,
              bgcolor: 'rgba(255,255,255,0.9)',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}>
                <RefreshIcon sx={{ color: 'white' }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                กำลังโหลดข้อมูล...
              </Typography>
            </Box>
          ) : eventRows.length === 0 && filteredEvents.length === 0 ? (
            <Box sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              p: 3,
              bgcolor: 'rgba(255,255,255,0.9)',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', // ปรับเป็นสีโทนแดงอ่อน
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CalendarIcon sx={{ fontSize: '2rem', color: '#B20000' }} />
              </Box>
              <Typography variant="h6" color="text.secondary" textAlign="center">
                ไม่มีงานในเดือนนี้
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                ยังไม่มีงานที่กำหนดไว้สำหรับ {format(currentDate, 'MMMM yyyy', { locale: th })}
              </Typography>
            </Box>
          ) : eventRows.length === 0 && filteredEvents.length > 0 ? (
            <Box sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              p: 3,
              bgcolor: 'rgba(255,255,255,0.9)',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <SearchIcon sx={{ fontSize: '2rem', color: '#f59e0b' }} />
              </Box>
              <Typography variant="h6" color="text.secondary" textAlign="center">
                ไม่มีงานที่ตรงกับตัวกรอง
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                ลองเปลี่ยนตัวกรองหรือดูเดือนอื่น
              </Typography>
            </Box>
          ) : (
            <>
              {/* Timeline Bars - แสดงเฉพาะ 5 แถวแรก */}
              {eventRows.slice(0, 5).map((row, rowIndex) => (
                <Box key={rowIndex}>
                  {row.map((timeline) => (
                    <Box key={timeline.event.id} sx={{ pointerEvents: 'auto' }}>
                      <TimelineBar 
                        timeline={timeline} 
                        rowIndex={rowIndex} 
                        calendarDays={calendarDays}
                        hoveredTimeline={hoveredTimeline}
                        setHoveredTimeline={setHoveredTimeline}
                        onTimelineClick={onTimelineClick}
                        cellHeight={numericCellHeight}
                      />
                    </Box>
                  ))}
                </Box>
              ))}
              
              {/* Overflow Indicator - รวมทั้งแถวที่เกิน และงานใน overflow */}
              {(eventRows.length > 5 || overflowTimelines.length > 0) && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    cursor: 'pointer',
                    zIndex: 20,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                      transform: 'scale(1.05)',
                    },
                  }}
                  onClick={() => {
                    // Show overflow events in a dialog or expand view
                    console.log('Overflow events:', overflowTimelines);
                    console.log('Hidden rows:', eventRows.slice(5));
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    +{(eventRows.length > 5 ? eventRows.slice(5).flat().length : 0) + overflowTimelines.length} งานเพิ่มเติม
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    คลิกเพื่อดูทั้งหมด
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default CalendarGrid; 