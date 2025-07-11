import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Tooltip,
  Badge,
  Stack,
  Divider,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add,
  Search,
  FilterList,
  ViewModule,
  ViewWeek,
  ViewDay,
  Close,
  CalendarToday,
  AccessTime,
  Person,
  Business,
  Info,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays,
  startOfDay,
  endOfDay,
  getDay,
  differenceInDays,
  isAfter,
  isBefore,
  isEqual,
} from 'date-fns';
// Import locale without direct reference to specific structure
// This works with both date-fns v2.x and v4.x
import * as dateFnsLocales from 'date-fns/locale';

const MaxSupplyCalendar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [maxSupplies, setMaxSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    production_type: 'all',
  });

  // Production type colors and icons
  const productionColors = {
    screen: '#7c3aed',
    dtf: '#0ea5e9',
    sublimation: '#16a34a',
    embroidery: '#dc2626',
  };

  const productionIcons = {
    screen: '📺',
    dtf: '📱',
    sublimation: '⚽',
    embroidery: '🧵',
  };

  // Status colors
  const statusColors = {
    pending: '#f59e0b',
    in_progress: '#3b82f6',
    completed: '#10b981',
    cancelled: '#ef4444',
  };

  const statusLabels = {
    pending: '🟡 รอเริ่ม',
    in_progress: '🔵 กำลังผลิต',
    completed: '🟢 เสร็จสิ้น',
    cancelled: '🔴 ยกเลิก',
  };

  // Get calendar range based on view mode
  const getCalendarRange = () => {
    switch (viewMode) {
      case 'month':
        return {
          start: startOfWeek(startOfMonth(currentDate)),
          end: endOfWeek(endOfMonth(currentDate)),
        };
      case 'week':
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
        };
      case 'day':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
        };
      default:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
    }
  };

  // Calculate event timeline position and width
  const calculateEventTimeline = (event, calendarDays) => {
    const eventStart = new Date(event.start_date);
    const eventEnd = new Date(event.expected_completion_date);
    
    // Find start and end positions in calendar
    const startIndex = calendarDays.findIndex(day => 
      format(day, 'yyyy-MM-dd') === format(eventStart, 'yyyy-MM-dd')
    );
    const endIndex = calendarDays.findIndex(day => 
      format(day, 'yyyy-MM-dd') === format(eventEnd, 'yyyy-MM-dd')
    );

    // If event is not in current view, don't show
    if (startIndex === -1 && endIndex === -1) return null;

    // Calculate position and width
    const actualStart = Math.max(0, startIndex);
    const actualEnd = Math.min(calendarDays.length - 1, endIndex >= 0 ? endIndex : startIndex);
    const width = actualEnd - actualStart + 1;

    return {
      startCol: actualStart,
      width,
      event,
    };
  };

  // Organize events into rows to avoid overlap
  const organizeEventsInRows = (events, calendarDays) => {
    const timelines = events
      .map(event => calculateEventTimeline(event, calendarDays))
      .filter(Boolean);

    const rows = [];
    
    timelines.forEach(timeline => {
      let placed = false;
      
      // Try to place in existing rows
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const hasOverlap = row.some(existingTimeline => {
          const existingEnd = existingTimeline.startCol + existingTimeline.width - 1;
          const currentEnd = timeline.startCol + timeline.width - 1;
          
          return !(existingEnd < timeline.startCol || currentEnd < existingTimeline.startCol);
        });
        
        if (!hasOverlap) {
          row.push(timeline);
          placed = true;
          break;
        }
      }
      
      // If no suitable row found, create new row
      if (!placed) {
        rows.push([timeline]);
      }
    });

    return rows;
  };

  // Get events for specific date
  const getEventsForDate = (date) => {
    return maxSupplies.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.expected_completion_date);
      return date >= eventStart && date <= eventEnd;
    });
  };

  // Navigate time periods
  const navigateTime = (direction) => {
    if (direction === 'prev') {
      switch (viewMode) {
        case 'month':
          setCurrentDate(subMonths(currentDate, 1));
          break;
        case 'week':
          setCurrentDate(subWeeks(currentDate, 1));
          break;
        case 'day':
          setCurrentDate(subDays(currentDate, 1));
          break;
      }
    } else {
      switch (viewMode) {
        case 'month':
          setCurrentDate(addMonths(currentDate, 1));
          break;
        case 'week':
          setCurrentDate(addWeeks(currentDate, 1));
          break;
        case 'day':
          setCurrentDate(addDays(currentDate, 1));
          break;
      }
    }
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Change view mode
  const changeViewMode = (mode) => {
    setViewMode(mode);
  };

  // Load calendar data
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockEvents = [
        {
          id: 1,
          title: 'เสื้อโปโล ABC Company',
          customer_name: 'ABC Company',
          production_type: 'screen',
          start_date: '2025-01-15',
          expected_completion_date: '2025-01-18',
          status: 'in_progress',
          total_quantity: 500,
          priority: 'high',
        },
        {
          id: 2,
          title: 'เสื้อยืด XYZ Corp',
          customer_name: 'XYZ Corp',
          production_type: 'dtf',
          start_date: '2025-01-16',
          expected_completion_date: '2025-01-22',
          status: 'pending',
          total_quantity: 300,
          priority: 'normal',
        },
        {
          id: 3,
          title: 'เสื้อฮูดี้ DEF Ltd',
          customer_name: 'DEF Ltd',
          production_type: 'sublimation',
          start_date: '2025-01-20',
          expected_completion_date: '2025-01-25',
          status: 'pending',
          total_quantity: 150,
          priority: 'low',
        },
        {
          id: 4,
          title: 'เสื้อโปโล GHI Inc',
          customer_name: 'GHI Inc',
          production_type: 'embroidery',
          start_date: '2025-01-17',
          expected_completion_date: '2025-01-20',
          status: 'completed',
          total_quantity: 200,
          priority: 'urgent',
        },
      ];
      
      setMaxSupplies(mockEvents);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setDetailDialog(true);
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewMode, filters]);

  // Timeline Bar Component
  const EventTimelineBar = ({ timeline, rowIndex }) => {
    const event = timeline.event;
    const bgColor = productionColors[event.production_type];
    const duration = differenceInDays(new Date(event.expected_completion_date), new Date(event.start_date)) + 1;
    
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {event.title}
            </Typography>
            <Typography variant="caption" display="block">
              {event.customer_name}
            </Typography>
            <Typography variant="caption" display="block">
              {format(new Date(event.start_date), 'dd/MM/yyyy')} - {format(new Date(event.expected_completion_date), 'dd/MM/yyyy')}
            </Typography>
            <Typography variant="caption" display="block">
              จำนวน: {event.total_quantity} ตัว | {duration} วัน
            </Typography>
          </Box>
        }
        placement="top"
        arrow
      >
        <Box
          onClick={() => handleEventClick(event)}
          sx={{
            position: 'absolute',
            left: `${(timeline.startCol / 7) * 100}%`,
            width: `${(timeline.width / 7) * 100}%`,
            height: 24,
            top: rowIndex * 28,
            backgroundColor: bgColor,
            borderRadius: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            px: 1,
            zIndex: 10,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[4],
              zIndex: 20,
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.75rem',
            }}
          >
            {productionIcons[event.production_type]} {event.title}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  // Month View Component with Timeline
  const MonthView = () => {
    const range = getCalendarRange();
    const days = eachDayOfInterval(range);
    const weekDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const eventRows = organizeEventsInRows(maxSupplies, days);

    return (
      <Paper sx={{ p: 2 }}>
        {/* Week headers */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {weekDays.map((day, index) => (
            <Grid item xs key={index} sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                {isMobile ? day.substring(0, 3) : day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar grid with timeline overlay */}
        <Box sx={{ position: 'relative' }}>
          {/* Calendar grid */}
          <Grid container spacing={1}>
            {days.map((day, index) => {
              const dayNum = format(day, 'd');
              const isCurrentDay = isToday(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const dayOfWeek = getDay(day);
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const eventsCount = getEventsForDate(day).length;

              return (
                <Grid item xs={12/7} key={index}>
                  <Box
                    sx={{
                      minHeight: Math.max(120, eventRows.length * 28 + 60),
                      border: 1,
                      borderColor: isCurrentDay ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      backgroundColor: isCurrentDay 
                        ? 'primary.50' 
                        : isWeekend 
                          ? 'grey.50' 
                          : 'background.default',
                      opacity: isCurrentMonth ? 1 : 0.6,
                      position: 'relative',
                      p: 1,
                    }}
                  >
                    {/* Date number */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={isCurrentDay ? 'bold' : 'normal'}
                        color={isCurrentDay ? 'primary.main' : 'text.primary'}
                        sx={{
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          backgroundColor: isCurrentDay ? 'primary.main' : 'transparent',
                          color: isCurrentDay ? 'white' : 'inherit',
                        }}
                      >
                        {dayNum}
                      </Typography>
                      {eventsCount > 0 && (
                        <Badge
                          badgeContent={eventsCount}
                          color="primary"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.7rem',
                              minWidth: 16,
                              height: 16,
                            },
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {/* Timeline overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {eventRows.map((row, rowIndex) =>
              row.map((timeline, timelineIndex) => (
                <Box
                  key={`${rowIndex}-${timelineIndex}`}
                  sx={{
                    position: 'absolute',
                    left: `${(timeline.startCol / 7) * 100}%`,
                    width: `${(timeline.width / 7) * 100}%`,
                    top: 40 + rowIndex * 28,
                    height: 24,
                    pointerEvents: 'auto',
                  }}
                >
                  <EventTimelineBar timeline={timeline} rowIndex={rowIndex} />
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            ประเภทงานผลิต
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {Object.entries(productionColors).map(([type, color]) => (
              <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: color,
                    borderRadius: 1,
                  }}
                />
                <Typography variant="caption">
                  {productionIcons[type]} {type.toUpperCase()}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Paper>
    );
  };

  // Week View Component
  const WeekView = () => {
    const range = getCalendarRange();
    const days = eachDayOfInterval(range);
    const timeSlots = ['09:00-12:00', '13:00-16:00', '17:00-20:00'];

    return (
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={1}>
          {/* Time column */}
          <Grid item xs={2} md={1}>
            <Box sx={{ height: 60 }}></Box>
            {timeSlots.map((slot, index) => (
              <Box
                key={index}
                sx={{
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {slot}
                </Typography>
              </Box>
            ))}
          </Grid>

          {/* Day columns */}
          {days.map((day, dayIndex) => {
            const events = getEventsForDate(day);
            const isCurrentDay = isToday(day);

            return (
              <Grid item xs={10/7} md={11/7} key={dayIndex}>
                {/* Day header */}
                <Box
                  sx={{
                    height: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isCurrentDay ? 'primary.light' : 'grey.50',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {format(day, 'EEE', { locale: dateFnsLocales.th })}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={isCurrentDay ? 'bold' : 'normal'}
                    color={isCurrentDay ? 'primary.main' : 'text.primary'}
                  >
                    {format(day, 'd')}
                  </Typography>
                </Box>

                {/* Time slots */}
                {timeSlots.map((slot, slotIndex) => {
                  const slotEvents = events.slice(
                    slotIndex * Math.ceil(events.length / 3),
                    (slotIndex + 1) * Math.ceil(events.length / 3)
                  );

                  return (
                    <Box
                      key={slotIndex}
                      sx={{
                        height: 100,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                        mb: 1,
                        overflow: 'hidden',
                      }}
                    >
                      {slotEvents.map((event, eventIndex) => (
                        <Box
                          key={eventIndex}
                          onClick={() => handleEventClick(event)}
                          sx={{
                            backgroundColor: productionColors[event.production_type],
                            color: 'white',
                            borderRadius: 1,
                            p: 0.5,
                            mb: 0.5,
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8,
                            },
                          }}
                        >
                          <Typography variant="caption" fontWeight="bold">
                            {productionIcons[event.production_type]} {event.title}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  );
                })}
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    );
  };

  // Day View Component
  const DayView = () => {
    const events = getEventsForDate(currentDate);
    const timeSlots = [
      '09:00-10:00', '10:00-11:00', '11:00-12:00',
      '13:00-14:00', '14:00-15:00', '15:00-16:00',
      '17:00-18:00', '18:00-19:00', '19:00-20:00',
    ];

    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {format(currentDate, 'EEEE, dd MMMM yyyy', { locale: dateFnsLocales.th })}
        </Typography>
        
        {events.length > 0 ? (
          <Grid container spacing={2}>
            {events.map((event, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card
                  sx={{
                    borderLeft: 4,
                    borderLeftColor: productionColors[event.production_type],
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => handleEventClick(event)}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {productionIcons[event.production_type]} {event.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {event.customer_name}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" />
                        <Typography variant="body2">
                          {format(new Date(event.start_date), 'dd/MM/yyyy')} - {format(new Date(event.expected_completion_date), 'dd/MM/yyyy')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business fontSize="small" />
                        <Typography variant="body2">
                          จำนวน: {event.total_quantity} ตัว
                        </Typography>
                      </Box>
                      <Chip
                        label={statusLabels[event.status]}
                        size="small"
                        sx={{
                          backgroundColor: statusColors[event.status],
                          color: 'white',
                          alignSelf: 'flex-start',
                        }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              ไม่มีงานในวันนี้
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  // Event Detail Dialog
  const EventDetailDialog = () => (
    <Dialog
      open={detailDialog}
      onClose={() => setDetailDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">รายละเอียดงาน</Typography>
          <IconButton onClick={() => setDetailDialog(false)}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedEvent && (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  {selectedEvent.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedEvent.customer_name}
                </Typography>
                <Chip
                  label={statusLabels[selectedEvent.status]}
                  size="small"
                  sx={{
                    backgroundColor: statusColors[selectedEvent.status],
                    color: 'white',
                    mb: 2,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  ประเภทงาน: {productionIcons[selectedEvent.production_type]} {selectedEvent.production_type}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  จำนวน: {selectedEvent.total_quantity} ตัว
                </Typography>
                <Typography variant="body2" gutterBottom>
                  วันที่เริ่ม: {format(new Date(selectedEvent.start_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}
                </Typography>
                <Typography variant="body2">
                  วันที่คาดว่าจะเสร็จ: {format(new Date(selectedEvent.expected_completion_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailDialog(false)}>ปิด</Button>
        <Button
          variant="contained"
          onClick={() => {
            setDetailDialog(false);
            navigate(`/max-supply/${selectedEvent.id}`);
          }}
        >
          ดูรายละเอียด
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render current view
  const renderView = () => {
    switch (viewMode) {
      case 'month':
        return <MonthView />;
      case 'week':
        return <WeekView />;
      case 'day':
        return <DayView />;
      default:
        return <MonthView />;
    }
  };

  // Get current period label
  const getCurrentPeriodLabel = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: dateFnsLocales.th });
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'dd MMM', { locale: dateFnsLocales.th })} - ${format(weekEnd, 'dd MMM yyyy', { locale: dateFnsLocales.th })}`;
      case 'day':
        return format(currentDate, 'EEEE, dd MMMM yyyy', { locale: dateFnsLocales.th });
      default:
        return '';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          ปฏิทินงานผลิต
        </Typography>
        
        {/* View Mode Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Today />}
            onClick={goToToday}
            size="small"
          >
            วันนี้
          </Button>
          <Button
            variant={viewMode === 'month' ? 'contained' : 'outlined'}
            startIcon={<ViewModule />}
            onClick={() => changeViewMode('month')}
            size="small"
          >
            เดือน
          </Button>
          <Button
            variant={viewMode === 'week' ? 'contained' : 'outlined'}
            startIcon={<ViewWeek />}
            onClick={() => changeViewMode('week')}
            size="small"
          >
            สัปดาห์
          </Button>
          <Button
            variant={viewMode === 'day' ? 'contained' : 'outlined'}
            startIcon={<ViewDay />}
            onClick={() => changeViewMode('day')}
            size="small"
          >
            วัน
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="ค้นหางาน..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>สถานะ</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="สถานะ"
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  <MenuItem value="pending">รอเริ่ม</MenuItem>
                  <MenuItem value="in_progress">กำลังผลิต</MenuItem>
                  <MenuItem value="completed">เสร็จสิ้น</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>ประเภท</InputLabel>
                <Select
                  value={filters.production_type}
                  onChange={(e) => handleFilterChange('production_type', e.target.value)}
                  label="ประเภท"
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  <MenuItem value="screen">📺 Screen</MenuItem>
                  <MenuItem value="dtf">📱 DTF</MenuItem>
                  <MenuItem value="sublimation">⚽ Sublimation</MenuItem>
                  <MenuItem value="embroidery">🧵 Embroidery</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {maxSupplies.length} งาน
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Calendar Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
        <IconButton onClick={() => navigateTime('prev')}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h5" sx={{ mx: 3, textAlign: 'center', minWidth: 200 }}>
          {getCurrentPeriodLabel()}
        </Typography>
        <IconButton onClick={() => navigateTime('next')}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Calendar View */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>กำลังโหลด...</Typography>
        </Box>
      ) : (
        renderView()
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate('/max-supply/create')}
      >
        <Add />
      </Fab>

      {/* Event Detail Dialog */}
      <EventDetailDialog />
    </Container>
  );
};

export default MaxSupplyCalendar; 