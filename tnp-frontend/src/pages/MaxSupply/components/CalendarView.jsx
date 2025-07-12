import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Badge,
  useTheme,
  Alert,
  Fade,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarMonth as CalendarMonthIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  startOfWeek,
  endOfWeek,
  isToday,
  isSameMonth,
  differenceInDays,
  parseISO,
  isValid,
} from 'date-fns';
import { th } from 'date-fns/locale';

const EnhancedCalendarView = ({
  currentDate = new Date(),
  navigateMonth = () => {},
  maxSupplies = [],
  statistics = {},
  onJobUpdate = () => {},
  onJobDelete = () => {},
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobMenuAnchor, setJobMenuAnchor] = useState(null);
  const [jobMenuData, setJobMenuData] = useState(null);
  const [hoveredTimeline, setHoveredTimeline] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [filter, setFilter] = useState({ type: 'all', status: 'all' });

  // Production Type Configuration - Enhanced with gradients and better colors
  const productionTypeConfig = {
    screen: { 
      color: '#1a73e8', 
      bgColor: '#e8f0fe',
      icon: '📺', 
      label: 'Screen Printing',
      gradient: 'linear-gradient(135deg, #1a73e8, #1557b0)',
      lightColor: '#e8f0fe',
    },
    dtf: { 
      color: '#f9ab00', 
      bgColor: '#fef7e0',
      icon: '📱', 
      label: 'DTF',
      gradient: 'linear-gradient(135deg, #f9ab00, #e37400)',
      lightColor: '#fef7e0',
    },
    sublimation: { 
      color: '#9334e6', 
      bgColor: '#f3e8ff',
      icon: '⚽', 
      label: 'Sublimation',
      gradient: 'linear-gradient(135deg, #9334e6, #7c2d99)',
      lightColor: '#f3e8ff',
    },
    embroidery: { 
      color: '#137333', 
      bgColor: '#e6f4ea',
      icon: '🧵', 
      label: 'Embroidery',
      gradient: 'linear-gradient(135deg, #137333, #0f5132)',
      lightColor: '#e6f4ea',
    },
  };

  const statusConfig = {
    pending: { color: '#f9ab00', label: 'รอดำเนินการ', bgColor: '#fef7e0' },
    in_progress: { color: '#1a73e8', label: 'กำลังดำเนินการ', bgColor: '#e8f0fe' },
    completed: { color: '#137333', label: 'เสร็จสิ้น', bgColor: '#e6f4ea' },
    cancelled: { color: '#d93025', label: 'ยกเลิก', bgColor: '#fce8e6' },
  };

  const priorityConfig = {
    low: { color: '#5f6368', label: 'ต่ำ' },
    normal: { color: '#1a73e8', label: 'ปกติ' },
    high: { color: '#f9ab00', label: 'สูง' },
    urgent: { color: '#d93025', label: 'เร่งด่วน' },
  };

  // Get calendar days for the current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Calculate event timeline position and width for multi-day spanning
  const calculateEventTimeline = (event, calendarDays) => {
    console.log('=== TIMELINE CALCULATION START ===');
    console.log('Event data:', {
      id: event.id,
      title: event.title,
      customer_name: event.customer_name,
      start_date: event.start_date,
      expected_completion_date: event.expected_completion_date,
      due_date: event.due_date,
      production_type: event.production_type,
      status: event.status
    });
    
    if (!event.start_date) {
      console.log('No start_date, returning null');
      return null;
    }
    
    try {
      const eventStart = typeof event.start_date === 'string' ? parseISO(event.start_date) : event.start_date;
      
      // Use expected_completion_date, fallback to due_date if not available
      const endDateStr = event.expected_completion_date || event.due_date;
      if (!endDateStr) {
        console.log('No end date found, returning null');
        return null;
      }
      
      const eventEnd = typeof endDateStr === 'string' ? parseISO(endDateStr) : endDateStr;
      
      if (!isValid(eventStart) || !isValid(eventEnd)) {
        console.log('Invalid dates, returning null');
        return null;
      }
      
      // Convert to date strings for comparison
      const eventStartStr = format(eventStart, 'yyyy-MM-dd');
      const eventEndStr = format(eventEnd, 'yyyy-MM-dd');
      
      console.log('Parsed dates:', {
        eventStart: eventStartStr,
        eventEnd: eventEndStr,
        eventStartObj: eventStart,
        eventEndObj: eventEnd
      });
      
      // Find start and end positions in calendar
      const startIndex = calendarDays.findIndex(day => 
        format(day, 'yyyy-MM-dd') === eventStartStr
      );
      const endIndex = calendarDays.findIndex(day => 
        format(day, 'yyyy-MM-dd') === eventEndStr
      );

      // Calendar range for debugging
      const calendarStart = calendarDays[0];
      const calendarEnd = calendarDays[calendarDays.length - 1];
      
      // Enhanced debug logging
      console.log('=== CALCULATING TIMELINE ===');
      console.log('Event:', event.id, event.title || event.customer_name);
      console.log('Event dates:', eventStartStr, 'to', eventEndStr);
      console.log('Calendar range:', format(calendarStart, 'yyyy-MM-dd'), 'to', format(calendarEnd, 'yyyy-MM-dd'));
      console.log('Start index:', startIndex, 'End index:', endIndex);
      
      // Handle events that span beyond the current calendar view
      let actualStart, actualEnd;
      
      // Check if event has any intersection with current calendar view
      const eventIntersectsCalendar = (eventStart <= calendarEnd && eventEnd >= calendarStart);
      console.log('Event intersects calendar:', eventIntersectsCalendar);
      
      if (!eventIntersectsCalendar) {
        // Event is completely outside current calendar view
        console.log('Event completely outside calendar view');
        return null;
      }
      
      if (startIndex === -1 && endIndex === -1) {
        // Event spans across the entire calendar view
        if (eventStart <= calendarStart && eventEnd >= calendarEnd) {
          actualStart = 0;
          actualEnd = calendarDays.length - 1;
          console.log('Event spans entire calendar view');
        } else {
          console.log('Event outside calendar view (case 2)');
          return null;
        }
      } else if (startIndex === -1) {
        // Event starts before calendar view but ends within
        actualStart = 0;
        actualEnd = endIndex;
        console.log('Event starts before calendar, ends within');
      } else if (endIndex === -1) {
        // Event starts within calendar view but ends after
        actualStart = startIndex;
        actualEnd = calendarDays.length - 1;
        console.log('Event starts within calendar, ends after', { startIndex, actualStart, actualEnd });
      } else {
        // Event is completely within calendar view
        actualStart = startIndex;
        actualEnd = endIndex;
        console.log('Event completely within calendar view', { startIndex, endIndex, actualStart, actualEnd });
      }
      
      const width = actualStart <= actualEnd ? actualEnd - actualStart + 1 : 0;
      if (width <= 0) {
        console.log('Invalid width:', width);
        return null;
      }
      
      const duration = differenceInDays(eventEnd, eventStart) + 1;
      
      console.log('Final result:', {
        actualStart,
        actualEnd,
        width,
        duration,
        leftPercent: (actualStart / calendarDays.length) * 100,
        widthPercent: (width / calendarDays.length) * 100,
        totalCalendarDays: calendarDays.length,
        startIndex,
        endIndex
      });
      console.log('=== END TIMELINE CALCULATION ===');

      return {
        startCol: actualStart,
        width,
        event,
        duration,
        startIndex,
        endIndex,
        actualStart,
        actualEnd,
        eventStart,
        eventEnd,
        eventStartStr,
        eventEndStr,
      };
    } catch (error) {
      console.error('Error calculating timeline for event:', event.id, error);
      return null;
    }
  };

  // Organize events into rows to avoid overlap
  const organizeEventsInRows = (events, calendarDays) => {
    const timelines = events
      .map(event => calculateEventTimeline(event, calendarDays))
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by start date, then by duration (longer first)
        if (a.startCol !== b.startCol) return a.startCol - b.startCol;
        return b.width - a.width;
      });
    
    console.log('=== ORGANIZING TIMELINE ROWS ===');
    console.log('Total timelines to organize:', timelines.length);
    
    const rows = [];
    
    timelines.forEach((timeline, index) => {
      const currentStart = timeline.startCol;
      const currentEnd = timeline.startCol + timeline.width - 1;
      
      console.log(`\nProcessing timeline ${index + 1}:`, {
        eventId: timeline.event.id,
        title: timeline.event.title || timeline.event.customer_name,
        startCol: currentStart,
        endCol: currentEnd,
        width: timeline.width,
        range: `${currentStart}-${currentEnd}`
      });
      
      let placed = false;
      
      // Try to place in existing rows
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        
        // Check for overlap with any timeline in this row
        const hasOverlap = row.some(existingTimeline => {
          const existingStart = existingTimeline.startCol;
          const existingEnd = existingTimeline.startCol + existingTimeline.width - 1;
          
          // Two timelines overlap if one starts before the other ends
          const overlaps = !(existingEnd < currentStart || currentEnd < existingStart);
          
          if (overlaps) {
            console.log(`  Overlap detected with existing timeline in row ${rowIndex}:`, {
              existingId: existingTimeline.event.id,
              existingRange: `${existingStart}-${existingEnd}`,
              currentRange: `${currentStart}-${currentEnd}`,
              overlapCondition: `!(${existingEnd} < ${currentStart} || ${currentEnd} < ${existingStart}) = ${overlaps}`
            });
          }
          
          return overlaps;
        });
        
        if (!hasOverlap) {
          row.push(timeline);
          placed = true;
          console.log(`  ✓ Placed in existing row ${rowIndex} (no overlap)`);
          break;
        } else {
          console.log(`  ✗ Cannot place in row ${rowIndex} (overlap detected)`);
        }
      }
      
      // If no suitable row found, create new row
      if (!placed) {
        rows.push([timeline]);
        console.log(`  ✓ Created new row ${rows.length - 1}`);
      }
    });
    
    // Final debug output
    console.log('\n=== FINAL ROW ORGANIZATION ===');
    rows.forEach((row, rowIndex) => {
      console.log(`Row ${rowIndex} (${row.length} timelines):`);
      row.forEach((timeline, timelineIndex) => {
        console.log(`  ${timelineIndex + 1}. ${timeline.event.title || timeline.event.customer_name} (${timeline.startCol}-${timeline.startCol + timeline.width - 1})`);
      });
    });
    console.log('=== END ROW ORGANIZATION ===\n');

    return rows;
  };

  // Filter events based on current filter
  const filteredEvents = useMemo(() => {
    return maxSupplies.filter(job => {
      const typeMatch = filter.type === 'all' || job.production_type === filter.type;
      const statusMatch = filter.status === 'all' || job.status === filter.status;
      return typeMatch && statusMatch;
    });
  }, [maxSupplies, filter]);

  const eventRows = useMemo(() => {
    const rows = organizeEventsInRows(filteredEvents, calendarDays);
    return rows;
  }, [filteredEvents, calendarDays]);

  // Get events for a specific date (for dots display)
  const getEventsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredEvents.filter(job => {
      if (!job.start_date) return false;
      
      // Use expected_completion_date, fallback to due_date if not available
      const endDateStr = job.expected_completion_date || job.due_date;
      if (!endDateStr) return false;
      
      try {
        const startDate = format(parseISO(job.start_date), 'yyyy-MM-dd');
        const endDate = format(parseISO(endDateStr), 'yyyy-MM-dd');
        return dateStr >= startDate && dateStr <= endDate;
      } catch {
        return false;
      }
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            navigateMonth?.('prev');
            break;
          case 'ArrowRight':
            e.preventDefault();
            navigateMonth?.('next');
            break;
          case 'Home':
            e.preventDefault();
            navigateMonth?.('today');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateMonth]);

  // Handle timeline click
  const handleTimelineClick = (job) => {
    setSelectedJob(job);
  };

  // Handle job menu
  const handleJobMenu = (event, job) => {
    event.stopPropagation();
    setJobMenuAnchor(event.currentTarget);
    setJobMenuData(job);
  };

  const handleJobMenuClose = () => {
    setJobMenuAnchor(null);
    setJobMenuData(null);
  };

  // Handle job actions
  const handleJobView = () => {
    setSelectedJob(jobMenuData);
    handleJobMenuClose();
  };

  const handleJobEdit = () => {
    console.log('Edit job:', jobMenuData);
    onJobUpdate?.();
    handleJobMenuClose();
  };

  const handleJobDelete = () => {
    if (window.confirm('คุณต้องการลบงานนี้หรือไม่?')) {
      onJobDelete(jobMenuData.id);
    }
    handleJobMenuClose();
  };

  // Go to today
  const handleGoToToday = () => {
    navigateMonth?.('today');
  };

  // Format date helpers
  const formatDate = (dateStr) => {
    try {
      const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
      return format(date, 'dd MMM yyyy', { locale: th });
    } catch {
      return 'ไม่ระบุ';
    }
  };

  const formatShortDate = (dateStr) => {
    try {
      const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
      return format(date, 'dd/MM', { locale: th });
    } catch {
      return '--';
    }
  };

  // Timeline Bar Component
  const TimelineBar = ({ timeline, rowIndex, calendarDays }) => {
    const event = timeline.event;
    const typeConfig = productionTypeConfig[event.production_type] || productionTypeConfig.screen;
    const statusInfo = statusConfig[event.status] || statusConfig.pending;
    const priorityInfo = priorityConfig[event.priority] || priorityConfig.normal;
    
    const isHovered = hoveredTimeline?.event?.id === event.id;
    const isUrgent = event.priority === 'urgent';
    
    // Calculate position for 7-column grid layout
    const daysPerWeek = 7;
    const totalCalendarDays = calendarDays.length;
    const numberOfWeeks = Math.ceil(totalCalendarDays / daysPerWeek);
    
    // Calculate which week and day within week the event starts
    const startWeek = Math.floor(timeline.startCol / daysPerWeek);
    const startDayInWeek = timeline.startCol % daysPerWeek;
    const endCol = timeline.startCol + timeline.width - 1;
    const endWeek = Math.floor(endCol / daysPerWeek);
    const endDayInWeek = endCol % daysPerWeek;
    
    // Improved positioning constants
    const calendarRowHeight = isMobile ? 80 : 120; // Match height from calendar days
    const baseTimelineOffset = isMobile ? 45 : 60; // Reduced from 55/85 to 45/60
    const timelineRowSpacing = isMobile ? 20 : 22; // Reduced from 26/30 to 20/22
    
    // Debug position calculation
    console.log('TimelineBar position calculation:', {
      eventId: event.id,
      eventTitle: event.title || event.customer_name,
      startCol: timeline.startCol,
      width: timeline.width,
      rowIndex,
      startWeek,
      startDayInWeek,
      endWeek,
      endDayInWeek,
      positioning: {
        calendarRowHeight,
        baseTimelineOffset,
        timelineRowSpacing,
        calculatedTop: startWeek * calendarRowHeight + baseTimelineOffset + rowIndex * timelineRowSpacing
      }
    });
    
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
      
      console.log('Single week segment:', {
        left: `${left}%`,
        width: `${Math.max(width, 2)}%`,
        top: `${top}px`,
        calculation: `week(${startWeek}) × ${calendarRowHeight} + ${baseTimelineOffset} + row(${rowIndex}) × ${timelineRowSpacing} = ${top}px`
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
      
      console.log('Multi-week segments:', {
        totalSegments: segments.length,
        firstSegment: segments[0],
        lastSegment: segments[segments.length - 1],
        positioning: {
          baseTimelineOffset,
          timelineRowSpacing,
          rowIndex
        }
      });
    }
    
    return (
      <>
        {segments.map((segment, index) => (
          <Tooltip
            key={`${timeline.event.id}-segment-${index}`}
            title={
              <Box sx={{ p: 1 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  {typeConfig.icon} {event.customer_name || event.title}
                </Typography>
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
              onClick={() => handleTimelineClick(event)}
              onMouseEnter={() => setHoveredTimeline(timeline)}
              onMouseLeave={() => setHoveredTimeline(null)}
              sx={{
                position: 'absolute',
                left: segment.left,
                width: segment.width,
                height: isMobile ? 18 : 22,
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
                minHeight: isMobile ? 18 : 22,
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
                    ml: segment.isFirstSegment ? (isMobile ? 1 : 1.5) : (isMobile ? 0.5 : 1),
                    flex: 1,
                    lineHeight: 1.2,
                  }}
                  title={`${typeConfig.icon} ${event.customer_name || event.title} (${formatShortDate(event.start_date)} - ${formatShortDate(event.expected_completion_date)})`}
                >
                  {segment.isFirstSegment ? (
                    isMobile 
                      ? `${typeConfig.icon} ${(event.customer_name || event.title).substring(0, 10)}${(event.customer_name || event.title).length > 10 ? '...' : ''}`
                      : `${typeConfig.icon} ${event.customer_name || event.title}`
                  ) : (
                    // Continuation segments show abbreviated name or just icon
                    isMobile ? typeConfig.icon : `${typeConfig.icon} (ต่อ)`
                  )}
                </Typography>

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

  // Production Type Legend with Filter
  const ProductionTypeLegend = () => {
    const typeCounts = useMemo(() => {
      const counts = { screen: 0, dtf: 0, sublimation: 0, embroidery: 0 };
      maxSupplies.forEach(job => {
        if (counts.hasOwnProperty(job.production_type)) {
          counts[job.production_type]++;
        }
      });
      return counts;
    }, [maxSupplies]);

    return (
      <Paper elevation={1} sx={{ p: 2, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            ประเภทงานผลิต • รวม {filteredEvents.length} จาก {maxSupplies.length} งาน
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant={filter.type === 'all' && filter.status === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilter({ type: 'all', status: 'all' })}
              sx={{ fontSize: '0.75rem', height: 28 }}
            >
              ทั้งหมด
            </Button>
            <Button
              size="small"
              variant={filter.status === 'in_progress' ? 'contained' : 'outlined'}
              onClick={() => setFilter({ ...filter, status: filter.status === 'in_progress' ? 'all' : 'in_progress' })}
              sx={{ fontSize: '0.75rem', height: 28, bgcolor: filter.status === 'in_progress' ? '#1a73e8' : 'transparent' }}
            >
              กำลังดำเนินการ
            </Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(productionTypeConfig).map(([key, config]) => {
            const count = typeCounts[key] || 0;
            const isSelected = filter.type === key;
            return (
              <Chip
                key={key}
                clickable
                onClick={() => setFilter({ ...filter, type: isSelected ? 'all' : key })}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: '16px' }}>{config.icon}</span>
                    <span>{config.label}</span>
                    <Badge
                      badgeContent={count}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          bgcolor: 'rgba(255,255,255,0.9)',
                          color: config.color,
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          minWidth: 18,
                          height: 18,
                        }
                      }}
                    />
                  </Box>
                }
                sx={{
                  background: isSelected ? config.gradient : `${config.color}20`,
                  color: isSelected ? 'white' : config.color,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  height: 36,
                  border: `1px solid ${config.color}`,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${config.color}40`,
                    background: config.gradient,
                    color: 'white',
                  },
                  transition: 'all 0.2s ease',
                }}
              />
            );
          })}
        </Box>
      </Paper>
    );
  };

  // Enhanced Job Details Dialog
  const JobDetailsDialog = () => {
    if (!selectedJob) return null;

    const typeConfig = productionTypeConfig[selectedJob.production_type] || productionTypeConfig.screen;
    const statusInfo = statusConfig[selectedJob.status] || statusConfig.pending;
    const priorityInfo = priorityConfig[selectedJob.priority] || priorityConfig.normal;
    const endDateForDuration = selectedJob.expected_completion_date || selectedJob.due_date;
    const duration = selectedJob.start_date && endDateForDuration 
      ? differenceInDays(parseISO(endDateForDuration), parseISO(selectedJob.start_date)) + 1
      : 0;

    return (
      <Dialog
        open={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            boxShadow: isMobile ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
          }
        }}
      >
        {/* Header with accent color */}
        <Box sx={{ 
          background: typeConfig.gradient,
          color: 'white',
          position: 'relative',
        }}>
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white',
              pb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  width: 56,
                  height: 56,
                }}
              >
                <Typography variant="h5">{typeConfig.icon}</Typography>
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {selectedJob.title || 'งานไม่ระบุชื่อ'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {typeConfig.label}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setSelectedJob(null)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {/* Status and Priority Badges */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Chip
              label={statusInfo.label}
              sx={{
                bgcolor: statusInfo.bgColor,
                color: statusInfo.color,
                fontWeight: 600,
              }}
            />
            <Chip
              label={`ความสำคัญ: ${priorityInfo.label}`}
              sx={{
                bgcolor: `${priorityInfo.color}20`,
                color: priorityInfo.color,
                fontWeight: 600,
              }}
            />
          </Box>

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="primary" />
                  ข้อมูลพื้นฐาน
                </Typography>
                <Box sx={{ space: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">ลูกค้า:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedJob.customer_name || 'ไม่ระบุ'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">จำนวน:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedJob.total_quantity || 0} ตัว
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">ประเภทเสื้อ:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedJob.shirt_type || 'ไม่ระบุ'}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Timeline Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventIcon color="primary" />
                  ระยะเวลา
                </Typography>
                <Box sx={{ space: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">วันที่เริ่ม:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(selectedJob.start_date)}
                    </Typography>
                  </Box>
                  {selectedJob.expected_completion_date && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">วันที่คาดว่าเสร็จ:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(selectedJob.expected_completion_date)}
                      </Typography>
                    </Box>
                  )}
                  {selectedJob.due_date && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">วันครบกำหนด:</Typography>
                      <Typography variant="body2" fontWeight="medium" color={new Date(selectedJob.due_date) < new Date() ? 'error.main' : 'text.primary'}>
                        {formatDate(selectedJob.due_date)}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">ระยะเวลา:</Typography>
                    <Typography variant="body2" fontWeight="medium" color={typeConfig.color}>
                      {duration > 7 ? `${Math.ceil(duration / 7)} สัปดาห์ (${duration} วัน)` : `${duration} วัน`}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2, p: 2, bgcolor: typeConfig.lightColor, borderRadius: 1, border: `1px solid ${typeConfig.color}30` }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      การแสดงผลบนปฏิทิน
                    </Typography>
                    <Typography variant="body2" sx={{ color: typeConfig.color, fontWeight: 'bold' }}>
                      {typeConfig.icon} Timeline bar ข้ามจาก {formatShortDate(selectedJob.start_date)} ถึง {formatShortDate(selectedJob.expected_completion_date || selectedJob.due_date)}
                    </Typography>
                    {selectedJob.due_date && selectedJob.expected_completion_date && selectedJob.due_date !== selectedJob.expected_completion_date && (
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        ⚠️ วันครบกำหนด: {formatShortDate(selectedJob.due_date)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Work Calculations */}
            {selectedJob.work_calculations && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkIcon color="primary" />
                  รายละเอียดการผลิต
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(selectedJob.work_calculations).map(([type, data]) => {
                    const typeConf = productionTypeConfig[type] || productionTypeConfig.screen;
                    return (
                      <Grid item xs={12} md={6} key={type}>
                        <Card variant="outlined" sx={{ p: 2, bgcolor: typeConf.bgColor, borderColor: typeConf.color }}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: typeConf.color }}>
                            {typeConf.icon} {typeConf.label}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">จุดพิมพ์</Typography>
                              <Typography variant="h6" fontWeight="bold">{data.points || 0}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">จำนวน</Typography>
                              <Typography variant="h6" fontWeight="bold">{data.total_quantity || 0}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">รวมงาน</Typography>
                              <Typography variant="h6" fontWeight="bold" color={typeConf.color}>{data.total_work || 0}</Typography>
                            </Grid>
                          </Grid>
                          {data.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                              {data.description}
                            </Typography>
                          )}
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            )}

            {/* Notes */}
            {(selectedJob.notes || selectedJob.special_instructions) && (
              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>📝 หมายเหตุ</Typography>
                {selectedJob.notes && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>หมายเหตุทั่วไป:</strong> {selectedJob.notes}
                    </Typography>
                  </Alert>
                )}
                {selectedJob.special_instructions && (
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>คำแนะนำพิเศษ:</strong> {selectedJob.special_instructions}
                    </Typography>
                  </Alert>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button
            onClick={handleJobEdit}
            variant="contained"
            startIcon={<EditIcon />}
            sx={{
              background: typeConfig.gradient,
              '&:hover': { opacity: 0.9 },
            }}
          >
            แก้ไข
          </Button>
          <Button
            onClick={() => {
              if (window.confirm(`คุณต้องการลบงาน "${selectedJob.title}" หรือไม่?`)) {
                onJobDelete(selectedJob.id);
                setSelectedJob(null);
              }
            }}
            variant="outlined"
            startIcon={<DeleteIcon />}
            color="error"
          >
            ลบ
          </Button>
          <Button onClick={() => setSelectedJob(null)} variant="outlined">
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Auto-debug when data changes
  useEffect(() => {
    console.log('=== CALENDAR DEBUG ===');
    console.log('Current date:', format(currentDate, 'yyyy-MM-dd'));
    console.log('Calendar range:', format(calendarDays[0], 'yyyy-MM-dd'), 'to', format(calendarDays[calendarDays.length - 1], 'yyyy-MM-dd'));
    console.log('Total events:', maxSupplies.length);
    console.log('Filtered events:', filteredEvents.length);
    console.log('Event rows:', eventRows.length);
    
    if (maxSupplies.length > 0) {
      console.log('All maxSupplies events:');
      maxSupplies.forEach((event, index) => {
        const endDateStr = event.expected_completion_date || event.due_date;
        console.log(`Event ${index + 1}:`, {
          id: event.id,
          title: event.title || event.customer_name,
          start_date: event.start_date,
          expected_completion_date: event.expected_completion_date,
          due_date: event.due_date,
          using_end_date: endDateStr,
          production_type: event.production_type,
          status: event.status
        });
      });
    }
    
    if (filteredEvents.length > 0) {
      console.log('Filtered events:');
      filteredEvents.forEach((event, index) => {
        const endDateStr = event.expected_completion_date || event.due_date;
        console.log(`Filtered Event ${index + 1}:`, {
          id: event.id,
          title: event.title || event.customer_name,
          start_date: event.start_date,
          expected_completion_date: event.expected_completion_date,
          due_date: event.due_date,
          using_end_date: endDateStr,
          production_type: event.production_type,
          status: event.status
        });
      });
    }
    
    if (eventRows.length > 0) {
      console.log('=== TIMELINE ROW SUMMARY ===');
      eventRows.forEach((row, rowIndex) => {
        console.log(`Row ${rowIndex} (${row.length} timelines):`);
        row.forEach((timeline, timelineIndex) => {
          const event = timeline.event;
          const startWeek = Math.floor(timeline.startCol / 7);
          const startDayInWeek = timeline.startCol % 7;
          const calendarRowHeight = isMobile ? 80 : 120;
          const baseTimelineOffset = isMobile ? 45 : 60;
          const timelineRowSpacing = isMobile ? 20 : 22;
          const expectedTop = startWeek * calendarRowHeight + baseTimelineOffset + rowIndex * timelineRowSpacing;
          
          console.log(`  ${timelineIndex + 1}. ${event.title || event.customer_name}:`, {
            eventId: timeline.event.id,
            startCol: timeline.startCol,
            width: timeline.width,
            duration: timeline.duration,
            range: `${timeline.startCol}-${timeline.startCol + timeline.width - 1}`,
            positioning: {
              startWeek,
              startDayInWeek,
              rowIndex,
              expectedTop: `${expectedTop}px`,
              leftPercent: `${((timeline.startCol % 7) / 7) * 100}%`,
              widthPercent: `${(timeline.width / calendarDays.length) * 100}%`
            }
          });
        });
      });
      console.log('=== END TIMELINE ROW SUMMARY ===');
    }
    
    console.log('=== END CALENDAR DEBUG ===');
  }, [filteredEvents, eventRows, currentDate, calendarDays, maxSupplies, isMobile]);

  return (
    <Box>
      {/* Quick Stats Bar */}
      <Paper elevation={1} sx={{ 
        p: isMobile ? 1.5 : 2, 
        mb: 2, 
        bgcolor: 'grey.50', 
        borderLeft: '4px solid #667eea',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 2 : 3,
        flexWrap: 'wrap',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: '#1a73e8' 
          }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
            กำลังดำเนินการ:
          </Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            {filteredEvents.filter(e => e.status === 'in_progress').length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: '#f9ab00' 
          }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
            รอดำเนินการ:
          </Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            {filteredEvents.filter(e => e.status === 'pending').length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: '#137333' 
          }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
            เสร็จสิ้น:
          </Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            {filteredEvents.filter(e => e.status === 'completed').length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: '#d93025' 
          }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
            เร่งด่วน:
          </Typography>
          <Typography variant="body2" fontWeight="bold" color="error" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            {filteredEvents.filter(e => e.priority === 'urgent').length}
          </Typography>
        </Box>
      </Paper>

      {/* Enhanced Calendar Header */}
      <Paper elevation={2} sx={{ 
        p: isMobile ? 2 : 3, 
        mb: 2, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        borderRadius: 2,
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 2 : 0}>
          <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
              {format(currentDate, 'MMMM yyyy', { locale: th })}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              📅 แผนผังการผลิต • งานทั้งหมด {maxSupplies.length} รายการ
              {filteredEvents.length !== maxSupplies.length && ` (แสดง ${filteredEvents.length} งาน)`}
            </Typography>
            {!isMobile && (
              <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                💡 ใช้ Ctrl+← → เพื่อเปลี่ยนเดือน, Ctrl+Home เพื่อไปวันนี้
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
            {!isMobile && (
              <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, p: 0.5 }}>
                <Button
                  size="small"
                  variant={viewMode === 'month' ? 'contained' : 'text'}
                  onClick={() => setViewMode('month')}
                  sx={{ 
                    color: 'white',
                    bgcolor: viewMode === 'month' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  เดือน
                </Button>
                <Button
                  size="small"
                  variant={viewMode === 'week' ? 'contained' : 'text'}
                  onClick={() => setViewMode('week')}
                  sx={{ 
                    color: 'white',
                    bgcolor: viewMode === 'week' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  สัปดาห์
                </Button>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton onClick={() => navigateMonth('prev')} sx={{ color: 'white' }}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton onClick={handleGoToToday} sx={{ color: 'white' }}>
                <TodayIcon />
              </IconButton>
              <IconButton onClick={() => navigateMonth('next')} sx={{ color: 'white' }}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Production Type Legend */}
      <ProductionTypeLegend />

      {/* Enhanced Calendar Grid */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Day Headers */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          bgcolor: 'grey.100',
          borderBottom: 2,
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((day) => (
            <Box key={day} sx={{ p: 2, textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary">
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Days with Enhanced Timeline */}
        <Box sx={{ position: 'relative', height: isMobile ? '400px' : '600px', bgcolor: 'grey.50' }}>
          {/* Days Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', position: 'relative', zIndex: 1 }}>
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <Box 
                  key={day.toISOString()} 
                  sx={{ 
                    border: 1,
                    borderColor: 'divider',
                    height: isMobile ? '80px' : '120px', // Fixed height instead of minHeight
                    position: 'relative',
                    backgroundColor: isTodayDate 
                      ? '#e8f0fe' 
                      : isCurrentMonth 
                        ? '#fff' 
                        : '#f9fafb',
                    opacity: isCurrentMonth ? 1 : 0.7,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isTodayDate ? '#e8f0fe' : '#f0f9ff',
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
                    
                    {/* Event dots for jobs starting on this day - only show starting dots, timeline will handle the spanning */}
                    <Box sx={{ mt: 0.25, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                      {dayEvents.slice(0, isMobile ? 1 : 2).map((event) => {
                        const eventStartDate = format(parseISO(event.start_date), 'yyyy-MM-dd');
                        const currentDayStr = format(day, 'yyyy-MM-dd');
                        const typeConfig = productionTypeConfig[event.production_type] || productionTypeConfig.screen;
                        
                        // Only show dots for jobs that start on this specific day
                        if (eventStartDate === currentDayStr) {
                          return (
                            <Box
                              key={event.id}
                              sx={{
                                width: isMobile ? 3 : 4,
                                height: isMobile ? 3 : 4,
                                borderRadius: '50%',
                                backgroundColor: typeConfig.color,
                                boxShadow: `0 1px 2px ${typeConfig.color}40`,
                                opacity: 0.6,
                              }}
                            />
                          );
                        }
                        return null;
                      })}
                      
                      {dayEvents.filter(event => format(parseISO(event.start_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length > (isMobile ? 1 : 2) && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.4rem' : '0.5rem', opacity: 0.6 }}>
                          +{dayEvents.filter(event => format(parseISO(event.start_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length - (isMobile ? 1 : 2)}
                        </Typography>
                      )}
                    </Box>
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
                  background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                }}>
                  📅
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
                  fontSize: '2rem',
                }}>
                  🔍
                </Box>
                <Typography variant="h6" color="text.secondary" textAlign="center">
                  ไม่มีงานที่ตรงกับตัวกรอง
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  ลองเปลี่ยนตัวกรองหรือดูเดือนอื่น
                </Typography>
              </Box>
            ) : (
              eventRows.map((row, rowIndex) => (
                <Box key={rowIndex}>
                  {row.map((timeline) => (
                    <Box key={timeline.event.id} sx={{ pointerEvents: 'auto' }}>
                      <TimelineBar 
                        timeline={timeline} 
                        rowIndex={rowIndex} 
                        calendarDays={calendarDays}
                      />
                    </Box>
                  ))}
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Paper>

      {/* Enhanced Job Details Dialog */}
      <JobDetailsDialog />

      {/* Context Menu */}
      <Menu
        anchorEl={jobMenuAnchor}
        open={Boolean(jobMenuAnchor)}
        onClose={handleJobMenuClose}
        PaperProps={{ sx: { minWidth: 200 } }}
      >
        <MenuItem onClick={handleJobView}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>ดูรายละเอียด</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleJobEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>แก้ไข</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleJobDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>ลบ</ListItemText>
        </MenuItem>
      </Menu>

      {/* Enhanced Tooltip for hovered timeline */}
      {hoveredTimeline && !isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(0,0,0,0.8)',
            color: 'white',
            p: 2,
            borderRadius: 2,
            boxShadow: 3,
            zIndex: 1000,
            maxWidth: 300,
            pointerEvents: 'none',
          }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            {productionTypeConfig[hoveredTimeline.event.production_type]?.icon} {hoveredTimeline.event.title}
          </Typography>
          <Typography variant="caption" display="block">
            👤 {hoveredTimeline.event.customer_name}
          </Typography>
          <Typography variant="caption" display="block">
            📅 {formatShortDate(hoveredTimeline.event.start_date)} - {formatShortDate(hoveredTimeline.event.expected_completion_date)}
          </Typography>
          <Typography variant="caption" display="block">
            📦 {hoveredTimeline.event.total_quantity || 0} ตัว • {hoveredTimeline.duration} วัน
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EnhancedCalendarView;

