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
} from 'date-fns';
import { th } from 'date-fns/locale';

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
    dtf: '#0891b2',
    sublimation: '#16a34a',
  };

  const productionIcons = {
    screen: '📺',
    dtf: '📱',
    sublimation: '⚽',
  };

  // Status colors
  const statusColors = {
    pending: '#d97706',
    in_progress: '#2563eb',
    completed: '#059669',
    cancelled: '#dc2626',
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
      const params = new URLSearchParams({
        view: viewMode,
        date: format(currentDate, 'yyyy-MM-dd'),
        ...filters,
      });

      const response = await fetch(`/api/v1/calendar?${params}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setMaxSupplies(data.data.events || []);
      }
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

  // Event Card Component
  const EventCard = ({ event, compact = false }) => (
    <Card
      sx={{
        mb: compact ? 0.5 : 1,
        p: compact ? 0.5 : 1,
        borderLeft: 4,
        borderLeftColor: productionColors[event.production_type],
        cursor: 'pointer',
        minHeight: compact ? 32 : 'auto',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
      onClick={() => handleEventClick(event)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography 
            variant={compact ? 'caption' : 'subtitle2'} 
            fontWeight="bold"
            noWrap
          >
            {productionIcons[event.production_type]} {event.code}
          </Typography>
          {!compact && (
            <>
              <Typography variant="body2" color="text.secondary" noWrap>
                {event.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                👤 {event.creator}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Chip
            label={event.status}
            size="small"
            sx={{
              bgcolor: statusColors[event.status],
              color: 'white',
              fontSize: '0.6rem',
              height: compact ? 20 : 24,
            }}
          />
        </Box>
      </Box>
    </Card>
  );

  // Month View Component
  const MonthView = () => {
    const range = getCalendarRange();
    const days = eachDayOfInterval(range);
    const weekDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

    return (
      <Paper sx={{ p: 2 }}>
        {/* Week headers */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {weekDays.map((day, index) => (
            <Grid item xs key={index} sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {isMobile ? day.substring(0, 3) : day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar grid */}
        <Grid container spacing={1}>
          {days.map((day, index) => {
            const events = getEventsForDate(day);
            const dayNum = format(day, 'd');
            const isCurrentDay = isToday(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const dayOfWeek = getDay(day);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            return (
              <Grid item xs={12/7} key={index}>
                <Box
                  sx={{
                    minHeight: isMobile ? 100 : 150,
                    border: 1,
                    borderColor: isCurrentDay ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    p: 1,
                    backgroundColor: isCurrentDay 
                      ? 'primary.light' 
                      : isWeekend 
                        ? 'grey.50' 
                        : 'background.default',
                    opacity: isCurrentMonth ? 1 : 0.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={isCurrentDay ? 'bold' : 'normal'}
                    color={isCurrentDay ? 'primary.main' : 'text.primary'}
                    sx={{ mb: 1 }}
                  >
                    {dayNum}
                  </Typography>
                  {events.slice(0, isMobile ? 2 : 4).map((event, idx) => (
                    <EventCard key={idx} event={event} compact={isMobile} />
                  ))}
                  {events.length > (isMobile ? 2 : 4) && (
                    <Typography variant="caption" color="text.secondary">
                      +{events.length - (isMobile ? 2 : 4)} เพิ่มเติม
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
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
                    {format(day, 'EEE', { locale: th })}
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
                        <EventCard key={eventIndex} event={event} compact />
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
          {format(currentDate, 'EEEE, dd MMMM yyyy', { locale: th })}
        </Typography>
        
        <Grid container spacing={2}>
          {timeSlots.map((slot, index) => {
            const slotEvents = events.slice(
              index * Math.ceil(events.length / timeSlots.length),
              (index + 1) * Math.ceil(events.length / timeSlots.length)
            );

            return (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      ⏰ {slot}
                    </Typography>
                    {slotEvents.length > 0 ? (
                      slotEvents.map((event, eventIndex) => (
                        <EventCard key={eventIndex} event={event} />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        ไม่มีงาน
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    );
  };

  // Event Detail Dialog
  const EventDetailDialog = () => (
    <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">รายละเอียดงาน</Typography>
          <IconButton onClick={() => setDetailDialog(false)}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedEvent && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: productionColors[selectedEvent.production_type],
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" color="white">
                  {productionIcons[selectedEvent.production_type]}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {selectedEvent.code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedEvent.title}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label={statusLabels[selectedEvent.status]}
                sx={{
                  bgcolor: statusColors[selectedEvent.status],
                  color: 'white',
                }}
              />
              <Chip
                label={selectedEvent.production_type}
                sx={{
                  bgcolor: productionColors[selectedEvent.production_type],
                  color: 'white',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business fontSize="small" color="action" />
                <Typography variant="body2">
                  ลูกค้า: {selectedEvent.customer_name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person fontSize="small" color="action" />
                <Typography variant="body2">
                  ผู้สร้าง: {selectedEvent.creator}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="body2">
                  วันที่เริ่ม: {format(new Date(selectedEvent.start_date), 'dd/MM/yyyy', { locale: th })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2">
                  วันที่คาดว่าจะเสร็จ: {format(new Date(selectedEvent.expected_completion_date), 'dd/MM/yyyy', { locale: th })}
                </Typography>
              </Box>
            </Box>
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
        return format(currentDate, 'MMMM yyyy', { locale: th });
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'dd MMM', { locale: th })} - ${format(weekEnd, 'dd MMM yyyy', { locale: th })}`;
      case 'day':
        return format(currentDate, 'EEEE, dd MMMM yyyy', { locale: th });
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