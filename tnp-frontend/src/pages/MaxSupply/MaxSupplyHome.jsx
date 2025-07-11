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
  Avatar,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  LinearProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import { 
  maxSupplyApi, 
  calendarApi 
} from '../../services/maxSupplyApi';
import { useMaxSupplyData } from '../../hooks/useMaxSupplyData';
import { useFallbackData } from '../../hooks/useFallbackData';
import { StatisticsCards, WorkCapacityCard } from '../../components/MaxSupply';
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  Add,
  GridView,
  ViewWeek,
  ViewDay,
  CheckCircle,
  Schedule,
  Person,
  Assignment,
  Circle,
  AccessTime,
  TrendingUp,
  Today,
  Dashboard,
  Message,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths, 
  getDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { th } from 'date-fns/locale';

const MaxSupplyHome = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); 
  const [currentTab, setCurrentTab] = useState(1); // 0=Dashboard, 1=Calendar, 2=Messages
  
  // Use custom hook for data management
  const { 
    data: realMaxSupplies, 
    loading, 
    error, 
    statistics: realStatistics, 
    refetch, 
    getEventsForDate: getRealEventsForDate,
    getUpcomingDeadlines: getRealUpcomingDeadlines 
  } = useMaxSupplyData({
    view: viewMode,
    date: currentDate,
  });

  // Fallback data when backend is not available
  const {
    data: fallbackMaxSupplies,
    statistics: fallbackStatistics,
    getEventsForDate: getFallbackEventsForDate,
    getUpcomingDeadlines: getFallbackUpcomingDeadlines,
  } = useFallbackData();

  // Fallback mode when backend is unavailable
  const isBackendUnavailable = error && (
    error.includes('Cannot connect to server') || 
    error.includes('Network Error') ||
    error.includes('timeout')
  );

  // Use fallback data when backend is unavailable
  const maxSupplies = isBackendUnavailable ? fallbackMaxSupplies : realMaxSupplies;
  const statistics = isBackendUnavailable ? fallbackStatistics : realStatistics;
  const getEventsForDate = isBackendUnavailable ? getFallbackEventsForDate : getRealEventsForDate;
  const getUpcomingDeadlines = isBackendUnavailable ? getFallbackUpcomingDeadlines : getRealUpcomingDeadlines;

  // Production type colors and labels
  const productionTypes = {
    screen: { color: '#8B5CF6', emoji: '📺', label: 'Screen Printing' },
    dtf: { color: '#06B6D4', emoji: '📱', label: 'DTF' },
    sublimation: { color: '#10B981', emoji: '⚽', label: 'Sublimation' },
    embroidery: { color: '#F59E0B', emoji: '🧵', label: 'Embroidery' },
  };



  // Tab labels
  const tabs = [
    { label: 'Dashboard', icon: <Dashboard /> },
    { label: 'Calendar', icon: <CalendarToday /> },
    { label: 'Messages', icon: <Message /> },
  ];

  // Generate calendar days including previous/next month days for full calendar grid
  const generateCalendarDays = (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
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

  // Refetch data when filters change (but not too frequently)
  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [currentDate, viewMode]); // Remove refetch from dependencies

  // Welcome Section Component
  // Navigation Tabs Component
  const NavigationTabs = () => (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={currentTab} 
        onChange={(e, newValue) => setCurrentTab(newValue)}
        sx={{
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
          }
        }}
      >
        {tabs.map((tab, index) => (
          <Tab 
            key={index}
            icon={tab.icon} 
            label={tab.label} 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        ))}
      </Tabs>
    </Box>
  );

  // Event Card Component
  const EventCard = ({ event }) => {
    const prodType = productionTypes[event.production_type] || productionTypes.screen;
    
    return (
      <Box
        sx={{
          bgcolor: prodType.color,
          color: 'white',
          p: 0.5,
          borderRadius: 1,
          mb: 0.5,
          fontSize: '0.75rem',
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.8,
          },
        }}
        onClick={() => navigate(`/max-supply/edit/${event.id}`)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Circle sx={{ fontSize: '0.5rem' }} />
          <Typography variant="caption" noWrap sx={{ flex: 1 }}>
            {event.title || 'งานไม่ระบุชื่อ'}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Calendar Component
  const CalendarView = () => {
    const days = generateCalendarDays(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekDaysThai = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    return (
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        {/* Calendar Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Calendar
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<GridView />}
              onClick={() => setViewMode('month')}
              sx={{ 
                bgcolor: viewMode === 'month' ? 'primary.main' : 'transparent',
                color: viewMode === 'month' ? 'white' : 'inherit'
              }}
            >
              Month
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ViewWeek />}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ViewDay />}
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => navigate('/max-supply/create')}
              sx={{ bgcolor: '#FB923C', '&:hover': { bgcolor: '#F97316' } }}
            >
              Create a job
            </Button>
          </Box>
        </Box>

        {/* Calendar Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigateMonth('prev')} size="small">
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
              {format(currentDate, 'MMMM yyyy', { locale: th })}
            </Typography>
            <IconButton onClick={() => navigateMonth('next')} size="small">
              <ChevronRight />
            </IconButton>
          </Box>
                     <Box sx={{ display: 'flex', gap: 1 }}>
             <Button variant="outlined" size="small" onClick={goToToday}>
               Today
             </Button>
             <Button 
               variant="outlined" 
               size="small" 
               onClick={refetch}
               disabled={loading}
             >
               <Refresh />
             </Button>
           </Box>
        </Box>

        {/* Calendar Grid */}
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          {/* Week headers */}
          <Grid container sx={{ bgcolor: 'grey.50' }}>
            {weekDaysThai.map((day, index) => (
              <Grid item xs key={index} sx={{ p: 1, textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>
                <Typography variant="body2" fontWeight="bold">
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Calendar days */}
          <Grid container>
            {days.map((day, index) => {
              const events = getEventsForDate(day);
              const dayNum = format(day, 'd');
              const isCurrentDay = isToday(day);
              const isCurrentMonth = isSameDay(startOfMonth(day), startOfMonth(currentDate)) ||
                                   (day >= startOfMonth(currentDate) && day <= endOfMonth(currentDate));

              return (
                <Grid 
                  item 
                  xs 
                  key={index} 
                  sx={{ 
                    minHeight: 120,
                    border: 1,
                    borderColor: 'divider',
                    p: 1,
                    bgcolor: isCurrentDay ? '#FEF3C7' : (isCurrentMonth ? 'white' : 'grey.50'),
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={isCurrentDay ? 'bold' : 'normal'}
                    color={!isCurrentMonth ? 'text.disabled' : (isCurrentDay ? 'primary.main' : 'text.primary')}
                    sx={{ mb: 1 }}
                  >
                    {dayNum}
                  </Typography>
                  {events.slice(0, 3).map((event, idx) => (
                    <EventCard key={idx} event={event} />
                  ))}
                  {events.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{events.length - 3} more
                    </Typography>
                  )}
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Paper>
    );
  };

  // Sidebar Components
  const DeadlineSection = () => {
    const upcomingDeadlines = getUpcomingDeadlines(7);
    
    return (
      <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule color="primary" />
          Deadline
        </Typography>
        <Button variant="text" size="small" sx={{ color: 'text.secondary', mb: 2 }}>
          Clear all
        </Button>
        
        <List dense>
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon>
                  <Skeleton variant="circular" width={12} height={12} />
                </ListItemIcon>
                <ListItemText
                  primary={<Skeleton variant="text" width="80%" />}
                  secondary={<Skeleton variant="text" width="60%" />}
                />
              </ListItem>
            ))
          ) : upcomingDeadlines.length > 0 ? (
            upcomingDeadlines.slice(0, 3).map((item, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon>
                  <Circle sx={{ fontSize: '0.8rem', color: productionTypes[item.production_type]?.color }} />
                </ListItemIcon>
                <ListItemText
                  primary={item.title || 'งานไม่ระบุชื่อ'}
                  secondary={item.due_date ? format(new Date(item.due_date), 'dd/MM/yyyy') : 'ไม่ระบุ'}
                />
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              ไม่มีงานที่ใกล้ครบกำหนดใน 7 วันข้างหน้า
            </Typography>
          )}
        </List>
      </Paper>
    );
  };

  const JobStatusSection = () => {
    // Map statistics to display data
    const statusData = [
      { 
        key: 'pending', 
        label: 'Available', 
        color: '#F59E0B', 
        count: statistics.pending || 0 
      },
      { 
        key: 'in_progress', 
        label: 'Booked', 
        color: '#3B82F6', 
        count: statistics.in_progress || 0 
      },
      { 
        key: 'completed', 
        label: 'In progress', 
        color: '#10B981', 
        count: statistics.completed || 0 
      },
    ];

    return (
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Job statuses
        </Typography>
        <Button variant="text" size="small" sx={{ color: 'text.secondary', mb: 2 }}>
          Clear all
        </Button>
        
        <List dense>
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <ListItem key={index} sx={{ px: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <Skeleton variant="circular" width={12} height={12} />
                  <Skeleton variant="text" width="60%" />
                </Box>
                <Skeleton variant="text" width="20%" />
              </ListItem>
            ))
          ) : (
            statusData.map((status) => (
              <ListItem key={status.key} sx={{ px: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <Circle sx={{ fontSize: '0.8rem', color: status.color }} />
                  <Typography variant="body2">{status.label}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  ({status.count})
                </Typography>
              </ListItem>
            ))
          )}
        </List>
      </Paper>
    );
  };

  // Add test button for verification (only in development)
  const TestCalculationButton = () => {
    const handleTestCalculation = () => {
      // Simple inline test calculation
      const testData = {
        screen: { total_work: 60 },
        dtf: { total_work: 120 }
      };
      
      const screenUtilization = Math.round((testData.screen.total_work / 3000) * 100);
      const dtfUtilization = Math.round((testData.dtf.total_work / 2500) * 100);
      const screenRemaining = 3000 - testData.screen.total_work;
      const dtfRemaining = 2500 - testData.dtf.total_work;
      
      console.log('=== Inline Test Calculation Results ===');
      console.log('Screen - Current Workload:', testData.screen.total_work);
      console.log('Screen - Utilization:', screenUtilization + '%');
      console.log('Screen - Remaining Daily:', screenRemaining);
      console.log('DTF - Current Workload:', testData.dtf.total_work);
      console.log('DTF - Utilization:', dtfUtilization + '%');
      console.log('DTF - Remaining Daily:', dtfRemaining);
      console.log('===============================');
      
      // Also check the current statistics state
      console.log('Current statistics from hook:', statistics);
      
      // Show results in an alert for easy viewing
      alert(`Calculation Test Results:
      
Screen Printing:
- Current Workload: ${testData.screen.total_work} งาน
- Utilization: ${screenUtilization}%
- Remaining Daily: ${screenRemaining} งาน

DTF:
- Current Workload: ${testData.dtf.total_work} งาน
- Utilization: ${dtfUtilization}%
- Remaining Daily: ${dtfRemaining} งาน

Current Hook Statistics:
- Screen Workload: ${statistics?.work_calculations?.current_workload?.screen || 0}
- DTF Workload: ${statistics?.work_calculations?.current_workload?.dtf || 0}
- Screen Utilization: ${statistics?.work_calculations?.utilization?.screen || 0}%
- DTF Utilization: ${statistics?.work_calculations?.utilization?.dtf || 0}%`);
    };

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return (
      <Button 
        variant="outlined" 
        color="secondary" 
        onClick={handleTestCalculation}
        size="small"
        sx={{ mb: 2 }}
      >
        Test Calculation Logic
      </Button>
    );
  };

  // Add a button to test with sample work_calculations data
  const TestWithSampleDataButton = () => {
    const handleTestWithSampleData = () => {
      // Create sample data and force recalculation
      const sampleData = [
        {
          id: 'manual-test-1',
          title: 'Manual Test Job 1',
          status: 'in_progress',
          production_type: 'screen',
          work_calculations: {
            "screen": {
              "points": 1,
              "total_quantity": 60,
              "total_work": 60,
              "description": "Screen Printing 1 จุด เสื้อทั้งหมด 60 ตัว (1×60=60) งาน Screen Printing มีงาน 60"
            }
          }
        },
        {
          id: 'manual-test-2',
          title: 'Manual Test Job 2',
          status: 'in_progress',
          production_type: 'dtf',
          work_calculations: {
            "dtf": {
              "points": 2,
              "total_quantity": 60,
              "total_work": 120,
              "description": "DTF (Direct Film Transfer) 2 จุด เสื้อทั้งหมด 60 ตัว (2×60=120) งาน DTF มีงาน 120"
            }
          }
        }
      ];

      console.log('Manually setting sample data:', sampleData);
      
      // This would simulate receiving data with work_calculations
      // In practice, this should come from the API
      alert('Sample data with work_calculations set in console. Check the logs and refresh the page to see if the API includes this data.');
    };

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return (
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleTestWithSampleData}
        size="small"
        sx={{ mb: 2, ml: 1 }}
      >
        Force Sample Data
      </Button>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading calendar data...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Navigation Tabs */}
      <NavigationTabs />

      {/* Error Alert or Demo Mode Alert */}
      {error && isBackendUnavailable && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              size="small" 
              onClick={refetch} 
              disabled={loading}
              sx={{ color: 'inherit' }}
            >
              {loading ? 'กำลังลอง...' : 'เชื่อมต่อ Backend'}
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>🚧 โหมดสาธิต (Demo Mode)</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            ไม่สามารถเชื่อมต่อกับ Backend ได้ แต่คุณยังสามารถดู UI และ Layout ได้ปกติ
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontSize: '0.875rem' }}>
            💡 <strong>วิธีแก้ไข:</strong> เปิด Laravel server ที่ <code>localhost:8000</code> แล้วคลิก "เชื่อมต่อ Backend"
          </Typography>
        </Alert>
      )}

      {error && !isBackendUnavailable && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              size="small" 
              onClick={refetch} 
              disabled={loading}
              sx={{ color: 'inherit' }}
            >
              {loading ? 'กำลังลอง...' : 'ลองใหม่'}
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>เกิดข้อผิดพลาด:</strong> {error}
          </Typography>
        </Alert>
      )}

      {/* Main Content */}
      {currentTab === 1 && (
        <Grid container spacing={3}>
          {/* Calendar */}
          <Grid item xs={12} lg={9}>
            <CalendarView />
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={3}>
            <DeadlineSection />
            <JobStatusSection />
          </Grid>
        </Grid>
      )}

      {/* Other tab content placeholders */}
      {currentTab === 0 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <TestCalculationButton />
            <TestWithSampleDataButton />
          </Box>
          <StatisticsCards 
            statistics={statistics} 
            loading={loading} 
          />
          <Box sx={{ mt: 3 }}>
            <WorkCapacityCard statistics={statistics} />
          </Box>
        </Box>
      )}

      {currentTab === 2 && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Message sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h5" color="text.secondary">
            Messages
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Messages feature coming soon
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default MaxSupplyHome;