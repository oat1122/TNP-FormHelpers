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
  Divider,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { calendarApi } from '../../services/maxSupplyApi';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaPlus,
  FaChartBar,
  FaFileAlt,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarCheck,
  FaTh,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getWeek, startOfWeek, endOfWeek } from 'date-fns';
// Import locale without direct reference to specific structure
// This works with both date-fns v2.x and v4.x
import * as dateFnsLocales from 'date-fns/locale';

const MaxSupplyHome = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [maxSupplies, setMaxSupplies] = useState([]);
  const [statistics, setStatistics] = useState({
    screen: 0,
    dtf: 0,
    sublimation: 0,
    weeklyStats: [],
  });
  const [loading, setLoading] = useState(true);

  // Production type colors
  const productionColors = {
    screen: '#7c3aed',
    dtf: '#0891b2',
    sublimation: '#16a34a',
  };

  // Production type icons
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

  // Generate calendar days
  const generateCalendarDays = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  // Get events for specific date
  const getEventsForDate = (date) => {
    return maxSupplies.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.expected_completion_date);
      return date >= eventStart && date <= eventEnd;
    });
  };

  // Navigate months
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
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
      
      // Only include essential parameters
      const params = {
        view: viewMode,
        date: format(currentDate, 'yyyy-MM-dd')
      };
      
      console.log('MaxSupplyHome: Calling calendar API with params:', params);
      
      // Use the calendarApi service instead of direct fetch
      const data = await calendarApi.getCalendarData(params);
      console.log('MaxSupplyHome: Calendar API response:', data);
      
      if (data.status === 'success') {
        setMaxSupplies(data.data.events || []);
        setStatistics(data.data.statistics || {});
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      // Show error message to user
      alert(`Failed to load calendar data: ${error.message}. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewMode]);

  // Event Card Component
  const EventCard = ({ event }) => (
    <Card
      sx={{
        mb: 1,
        p: 1,
        borderLeft: 4,
        borderLeftColor: productionColors[event.production_type],
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
      onClick={() => navigate(`/max-supply/${event.id}`)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            {productionIcons[event.production_type]} {event.code}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {event.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            👤 {event.creator}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Chip
            label={event.status}
            size="small"
            sx={{
              bgcolor: statusColors[event.status],
              color: 'white',
              fontSize: '0.7rem',
            }}
          />
          <Typography variant="caption" display="block" color="text.secondary">
            ⏰ {format(new Date(event.start_date), 'd-M')}
          </Typography>
        </Box>
      </Box>
    </Card>
  );

  // Calendar Month View
  const CalendarMonthView = () => {
    const days = generateCalendarDays(currentDate);
    const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    return (
      <Paper sx={{ p: 2 }}>
        {/* Week headers */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {weekDays.map((day, index) => (
            <Grid item xs key={index} sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {day}
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

            return (
              <Grid item xs={12/7} key={index}>
                <Box
                  sx={{
                    minHeight: isMobile ? 80 : 120,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1,
                    backgroundColor: isCurrentDay ? 'primary.light' : 'background.default',
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={isCurrentDay ? 'bold' : 'normal'}
                    color={isCurrentDay ? 'primary.main' : 'text.primary'}
                  >
                    {dayNum}
                  </Typography>
                  {events.slice(0, isMobile ? 1 : 3).map((event, idx) => (
                    <EventCard key={idx} event={event} />
                  ))}
                  {events.length > (isMobile ? 1 : 3) && (
                    <Typography variant="caption" color="text.secondary">
                      +{events.length - (isMobile ? 1 : 3)} เพิ่มเติม
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

  // Statistics Panel
  const StatisticsPanel = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        สถิติรายเดือน
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {statistics.screen || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📺 Screen
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {statistics.dtf || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📱 DTF
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {statistics.sublimation || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ⚽ Sublimation
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  // Quick Actions
  const QuickActions = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        การดำเนินการด่วน
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<FaPlus />}
            onClick={() => navigate('/max-supply/create')}
          >
            สร้างงานใหม่
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<FaFileAlt />}
            onClick={() => navigate('/worksheets')}
          >
            ดู Worksheet
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<FaChartBar />}
            onClick={() => navigate('/reports')}
          >
            รายงาน
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          กำหนดการผลิต
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FaCalendarDay />}
            onClick={goToToday}
            size="small"
          >
            วันนี้
          </Button>
          <Button
            variant={viewMode === 'month' ? 'contained' : 'outlined'}
            startIcon={<FaTh />}
            onClick={() => changeViewMode('month')}
            size="small"
          >
            เดือน
          </Button>
          <Button
            variant={viewMode === 'week' ? 'contained' : 'outlined'}
            startIcon={<FaCalendarWeek />}
            onClick={() => changeViewMode('week')}
            size="small"
          >
            สัปดาห์
          </Button>
          <Button
            variant={viewMode === 'day' ? 'contained' : 'outlined'}
            startIcon={<FaCalendarCheck />}
            onClick={() => changeViewMode('day')}
            size="small"
          >
            วัน
          </Button>
        </Box>
      </Box>

      {/* Calendar Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
        <IconButton onClick={() => navigateMonth('prev')}>
                      <FaChevronLeft />
        </IconButton>
        <Typography variant="h5" sx={{ mx: 3 }}>
          {format(currentDate, 'MMMM yyyy', { locale: dateFnsLocales.th })}
        </Typography>
        <IconButton onClick={() => navigateMonth('next')}>
                      <FaChevronRight />
        </IconButton>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <CalendarMonthView />
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <StatisticsPanel />
            <QuickActions />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MaxSupplyHome;