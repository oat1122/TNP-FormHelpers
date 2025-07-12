import React from 'react';
import { Box, Typography, Tooltip, Chip, useMediaQuery, useTheme } from '@mui/material';
import { productionTypeConfig, statusConfig, priorityConfig, CALENDAR_CONFIG } from '../../utils/constants';
import { formatShortDate } from '../../utils/dateFormatters';
import ProductionTypeIcon from '../ProductionTypeIcon';

const TimelineBar = ({ 
  timeline, 
  rowIndex, 
  calendarDays, 
  hoveredTimeline, 
  setHoveredTimeline, 
  onTimelineClick 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const event = timeline.event;
  const typeConfig = productionTypeConfig[event.production_type] || productionTypeConfig.screen;
  const statusInfo = statusConfig[event.status] || statusConfig.pending;
  const priorityInfo = priorityConfig[event.priority] || priorityConfig.normal;
  
  const isHovered = hoveredTimeline?.event?.id === event.id;
  const isUrgent = event.priority === 'urgent';
  
  // Calculate position for 7-column grid layout
  const daysPerWeek = CALENDAR_CONFIG.DAYS_PER_WEEK;
  const totalCalendarDays = calendarDays.length;
  const numberOfWeeks = Math.ceil(totalCalendarDays / daysPerWeek);
  
  // Calculate which week and day within week the event starts
  const startWeek = Math.floor(timeline.startCol / daysPerWeek);
  const startDayInWeek = timeline.startCol % daysPerWeek;
  const endCol = timeline.startCol + timeline.width - 1;
  const endWeek = Math.floor(endCol / daysPerWeek);
  const endDayInWeek = endCol % daysPerWeek;
  
  // Improved positioning constants
  const calendarRowHeight = isMobile ? CALENDAR_CONFIG.MOBILE_CALENDAR_HEIGHT : CALENDAR_CONFIG.DESKTOP_CALENDAR_HEIGHT;
  const baseTimelineOffset = isMobile ? CALENDAR_CONFIG.MOBILE_TIMELINE_OFFSET : CALENDAR_CONFIG.DESKTOP_TIMELINE_OFFSET;
  const timelineRowSpacing = isMobile ? CALENDAR_CONFIG.MOBILE_TIMELINE_SPACING : CALENDAR_CONFIG.DESKTOP_TIMELINE_SPACING;
  
  // For multi-week events, create separate timeline segments
  const segments = [];
  
  if (startWeek === endWeek) {
    // Event is within the same week
    const left = (startDayInWeek / daysPerWeek) * 100;
    const width = ((endDayInWeek - startDayInWeek + 1) / daysPerWeek) * 100;
    const top = startWeek * calendarRowHeight + baseTimelineOffset + rowIndex * timelineRowSpacing;
    
    segments.push({
      left: `${left}%`,
      width: `${Math.max(width, 2)}%`, // Minimum 2% width
      top: `${top}px`,
      segmentIndex: 0,
      isFirstSegment: true,
      isLastSegment: true,
    });
  } else {
    // Event spans multiple weeks
    
    // First week segment
    const firstWeekLeft = (startDayInWeek / daysPerWeek) * 100;
    const firstWeekWidth = ((daysPerWeek - startDayInWeek) / daysPerWeek) * 100;
    const firstWeekTop = startWeek * calendarRowHeight + baseTimelineOffset + rowIndex * timelineRowSpacing;
    
    segments.push({
      left: `${firstWeekLeft}%`,
      width: `${firstWeekWidth}%`,
      top: `${firstWeekTop}px`,
      segmentIndex: 0,
      isFirstSegment: true,
      isLastSegment: false,
    });
    
    // Middle weeks (if any)
    for (let week = startWeek + 1; week < endWeek; week++) {
      const middleWeekTop = week * calendarRowHeight + baseTimelineOffset + rowIndex * timelineRowSpacing;
      segments.push({
        left: '0%',
        width: '100%',
        top: `${middleWeekTop}px`,
        segmentIndex: week - startWeek,
        isFirstSegment: false,
        isLastSegment: false,
      });
    }
    
    // Last week segment
    if (endWeek > startWeek) {
      const lastWeekWidth = ((endDayInWeek + 1) / daysPerWeek) * 100;
      const lastWeekTop = endWeek * calendarRowHeight + baseTimelineOffset + rowIndex * timelineRowSpacing;
      
      segments.push({
        left: '0%',
        width: `${lastWeekWidth}%`,
        top: `${lastWeekTop}px`,
        segmentIndex: endWeek - startWeek,
        isFirstSegment: false,
        isLastSegment: true,
      });
    }
  }
  
  return (
    <>
      {segments.map((segment, index) => (
        <Tooltip
          key={`${timeline.event.id}-segment-${index}`}
          title={
            <Box sx={{ p: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ProductionTypeIcon type={event.production_type} size={20} color="white" />
                <Typography variant="body2" fontWeight="bold" sx={{ ml: 1 }}>
                  {event.customer_name || event.title}
                </Typography>
              </Box>
              <Typography variant="caption" display="block">
                <strong>ประเภท:</strong> {typeConfig.label}
              </Typography>
              <Typography variant="caption" display="block">
                <strong>สถานะ:</strong> {statusInfo.label}
              </Typography>
              <Typography variant="caption" display="block">
                <strong>ระยะเวลา:</strong> {timeline.duration} วัน
              </Typography>
              <Typography variant="caption" display="block">
                <strong>เริ่ม:</strong> {formatShortDate(event.start_date)}
              </Typography>
              {event.expected_completion_date && (
                <Typography variant="caption" display="block">
                  <strong>คาดว่าเสร็จ:</strong> {formatShortDate(event.expected_completion_date)}
                </Typography>
              )}
              {event.due_date && (
                <Typography variant="caption" display="block">
                  <strong>ครบกำหนด:</strong> {formatShortDate(event.due_date)}
                </Typography>
              )}
              <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
                คลิกเพื่อดูรายละเอียด
              </Typography>
            </Box>
          }
          placement="top"
          arrow
          disableInteractive={false}
          sx={{
            '& .MuiTooltip-tooltip': {
              bgcolor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              borderRadius: 2,
              maxWidth: 300,
            },
          }}
        >
          <Box
            onClick={() => onTimelineClick(event)}
            onMouseEnter={() => setHoveredTimeline(timeline)}
            onMouseLeave={() => setHoveredTimeline(null)}
            sx={{
              position: 'absolute',
              left: segment.left,
              width: segment.width,
              height: isMobile ? CALENDAR_CONFIG.MOBILE_TIMELINE_HEIGHT : CALENDAR_CONFIG.DESKTOP_TIMELINE_HEIGHT,
              top: segment.top,
              cursor: 'pointer',
              zIndex: isHovered ? 25 : 15,
              display: 'flex',
              alignItems: 'center',
              px: isMobile ? 0.5 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHovered ? (isMobile ? 'translateY(-1px) scale(1.01)' : 'translateY(-2px) scale(1.02)') : 'none',
              minWidth: isMobile ? '40px' : '60px', // Ensure minimum width for visibility
              maxWidth: '100%', // Prevent overflow
              minHeight: isMobile ? CALENDAR_CONFIG.MOBILE_TIMELINE_HEIGHT : CALENDAR_CONFIG.DESKTOP_TIMELINE_HEIGHT,
              pointerEvents: 'auto',
            }}
          >
            {/* Main Timeline Bar */}
            <Box
              sx={{
                position: 'absolute',
                left: '2px',
                right: '2px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: isMobile ? 16 : 20,
                background: typeConfig.gradient,
                borderRadius: segment.isFirstSegment && segment.isLastSegment 
                  ? (isMobile ? '8px' : '10px')
                  : segment.isFirstSegment 
                    ? (isMobile ? '8px 0 0 8px' : '10px 0 0 10px')
                    : segment.isLastSegment 
                      ? (isMobile ? '0 8px 8px 0' : '0 10px 10px 0')
                      : '0',
                display: 'flex',
                alignItems: 'center',
                px: isMobile ? 0.5 : 1,
                boxShadow: isHovered 
                  ? `0 8px 25px ${typeConfig.color}40` 
                  : `0 3px 12px ${typeConfig.color}30`,
                border: `1px solid ${typeConfig.color}`,
                animation: isUrgent ? 'pulse 2s infinite' : 'none',
                overflow: 'hidden',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.8 },
                },
              }}
            >
              {/* Priority indicator - only on first segment */}
              {(event.priority === 'high' || event.priority === 'urgent') && segment.isFirstSegment && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: -2,
                    top: -2,
                    bottom: -2,
                    width: 4,
                    background: priorityInfo.color,
                    borderRadius: '2px',
                  }}
                />
              )}

              {/* Start indicator - only on first segment */}
              {segment.isFirstSegment && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: isMobile ? 3 : 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: isMobile ? 4 : 5,
                    height: isMobile ? 4 : 5,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    borderRadius: '50%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              )}

              {/* Content - show on all segments but different for each */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  ml: segment.isFirstSegment ? (isMobile ? 1 : 1.5) : (isMobile ? 0.5 : 1),
                  overflow: 'hidden',
                }}
              >
                <ProductionTypeIcon 
                  type={event.production_type} 
                  size={isMobile ? 12 : 14} 
                  color="white" 
                />
                {segment.isFirstSegment && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: isMobile ? '0.55rem' : '0.65rem',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      ml: 0.5,
                      flex: 1,
                      lineHeight: 1.2,
                    }}
                    title={`${event.customer_name || event.title} (${formatShortDate(event.start_date)} - ${formatShortDate(event.expected_completion_date)})`}
                  >
                    {isMobile 
                      ? `${(event.customer_name || event.title).substring(0, 10)}${(event.customer_name || event.title).length > 10 ? '...' : ''}`
                      : `${event.customer_name || event.title}`
                    }
                  </Typography>
                )}
                {!segment.isFirstSegment && !isMobile && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.55rem',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      ml: 0.5,
                      opacity: 0.8,
                    }}
                  >
                    (ต่อ)
                  </Typography>
                )}
              </Box>

              {/* Duration badge - only on last segment and if wide enough */}
              {segment.isLastSegment && timeline.duration > 1 && !isMobile && parseFloat(segment.width) > 15 && (
                <Chip
                  label={timeline.duration > 7 ? `${Math.ceil(timeline.duration / 7)}w` : `${timeline.duration}d`}
                  size="small"
                  sx={{
                    height: 14,
                    fontSize: '0.45rem',
                    bgcolor: 'rgba(255,255,255,0.25)',
                    color: 'white',
                    fontWeight: 'bold',
                    '& .MuiChip-label': { px: 0.3 },
                    ml: 0.5,
                    minWidth: 'auto',
                  }}
                />
              )}
            </Box>
          </Box>
        </Tooltip>
      ))}
    </>
  );
};

export default TimelineBar; 