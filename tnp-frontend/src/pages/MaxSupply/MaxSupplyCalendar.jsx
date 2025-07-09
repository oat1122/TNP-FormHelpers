import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Tabs, 
  Tab, 
  Chip, 
  IconButton,
  CircularProgress,
  ButtonGroup,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useMaxSupply } from '../../context/MaxSupplyContext';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { FaCalendarAlt, FaList, FaClock } from 'react-icons/fa';
import { IoChevronBackOutline, IoChevronForwardOutline, IoTodayOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

// Custom components
import CalendarMonthView from './CalendarMonthView';
import CalendarWeekView from './CalendarWeekView';
import CalendarDayView from './CalendarDayView';
import StatisticsSummary from './StatisticsSummary';
import MaxSupplyQuickView from './MaxSupplyQuickView';

const MaxSupplyCalendar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const { 
    calendarData, 
    statistics, 
    fetchCalendarData, 
    fetchWeekCalendarData, 
    fetchStatistics,
    isLoading, 
    error 
  } = useMaxSupply();
  
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedMaxSupply, setSelectedMaxSupply] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  
  // Initial data fetch
  useEffect(() => {
    const loadCalendarData = async () => {
      if (viewMode === 'month') {
        await fetchCalendarData(currentDate.year(), currentDate.month() + 1);
      } else if (viewMode === 'week') {
        await fetchWeekCalendarData(currentDate.format('YYYY-MM-DD'));
      } else {
        // day view - handled by the same endpoint as week for simplicity
        await fetchWeekCalendarData(currentDate.format('YYYY-MM-DD'));
      }
      
      await fetchStatistics();
    };
    
    loadCalendarData();
  }, [viewMode, currentDate]);
  
  // Handle date navigation
  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(currentDate.subtract(1, 'month'));
    } else if (viewMode === 'week') {
      setCurrentDate(currentDate.subtract(1, 'week'));
    } else {
      setCurrentDate(currentDate.subtract(1, 'day'));
    }
  };
  
  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(currentDate.add(1, 'month'));
    } else if (viewMode === 'week') {
      setCurrentDate(currentDate.add(1, 'week'));
    } else {
      setCurrentDate(currentDate.add(1, 'day'));
    }
  };
  
  const handleToday = () => {
    setCurrentDate(dayjs());
  };
  
  // Handle calendar event click
  const handleEventClick = (maxSupply) => {
    setSelectedMaxSupply(maxSupply);
    setQuickViewOpen(true);
  };
  
  const handleQuickViewClose = () => {
    setQuickViewOpen(false);
  };
  
  const handleCreateNew = () => {
    navigate('/max-supply/create');
  };
  
  const handleViewList = () => {
    navigate('/max-supply/list');
  };
  
  // Generate title based on view mode
  const getCalendarTitle = () => {
    if (viewMode === 'month') {
      return currentDate.locale('th').format('MMMM YYYY');
    } else if (viewMode === 'week') {
      const weekStart = currentDate.startOf('week').format('D MMM');
      const weekEnd = currentDate.endOf('week').format('D MMM YYYY');
      return `${weekStart} - ${weekEnd}`;
    } else {
      return currentDate.locale('th').format('D MMMM YYYY');
    }
  };
  
  // Calendar view renderer based on mode
  const renderCalendarView = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => viewMode === 'month' ? 
              fetchCalendarData(currentDate.year(), currentDate.month() + 1) : 
              fetchWeekCalendarData(currentDate.format('YYYY-MM-DD'))}
          >
            ลองอีกครั้ง
          </Button>
        </Box>
      );
    }
    
    if (!calendarData) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">ไม่พบข้อมูลปฏิทิน</Typography>
        </Box>
      );
    }
    
    switch(viewMode) {
      case 'month':
        return (
          <CalendarMonthView 
            calendarData={calendarData} 
            onEventClick={handleEventClick} 
            currentDate={currentDate}
          />
        );
      case 'week':
        return (
          <CalendarWeekView 
            calendarData={calendarData} 
            onEventClick={handleEventClick} 
            currentDate={currentDate}
          />
        );
      case 'day':
        return (
          <CalendarDayView 
            calendarData={calendarData} 
            onEventClick={handleEventClick} 
            currentDate={currentDate}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center">
                    <FaCalendarAlt size={24} color={theme.palette.primary.main} />
                    <Typography variant={isMobile ? "h6" : "h5"} sx={{ ml: 1 }}>
                      กำหนดการผลิต: {getCalendarTitle()}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center" gap={1}>
                    <ButtonGroup variant="outlined" size={isMobile ? "small" : "medium"}>
                      <IconButton onClick={handlePrevious}>
                        <IoChevronBackOutline />
                      </IconButton>
                      <Button onClick={handleToday} startIcon={<IoTodayOutline />}>
                        {isMobile ? 'วันนี้' : 'ไปที่วันนี้'}
                      </Button>
                      <IconButton onClick={handleNext}>
                        <IoChevronForwardOutline />
                      </IconButton>
                    </ButtonGroup>
                    
                    <Tabs 
                      value={viewMode} 
                      onChange={(_, newValue) => setViewMode(newValue)}
                      aria-label="calendar view modes"
                      sx={{ ml: { xs: 0, md: 2 } }}
                    >
                      <Tab 
                        label={isMobile ? "M" : "เดือน"} 
                        value="month" 
                        sx={{ minWidth: isMobile ? 40 : 80 }} 
                      />
                      <Tab 
                        label={isMobile ? "W" : "สัปดาห์"} 
                        value="week" 
                        sx={{ minWidth: isMobile ? 40 : 80 }} 
                      />
                      <Tab 
                        label={isMobile ? "D" : "วัน"} 
                        value="day" 
                        sx={{ minWidth: isMobile ? 40 : 80 }} 
                      />
                    </Tabs>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <Card sx={{ height: '100%', minHeight: '70vh' }}>
            <CardContent>
              {renderCalendarView()}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', mb: 2 }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  สถิติการผลิต
                </Typography>
                {statistics && <StatisticsSummary statistics={statistics} />}
              </Box>
            </CardContent>
          </Card>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              size="large"
              onClick={handleCreateNew}
              startIcon={<FaClock />}
            >
              สร้างงานผลิตใหม่
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth
              onClick={handleViewList}
              startIcon={<FaList />}
            >
              รายการงานทั้งหมด
            </Button>
          </Box>
        </Grid>
      </Grid>
      
      {/* Quick View Modal */}
      {selectedMaxSupply && (
        <MaxSupplyQuickView 
          open={quickViewOpen} 
          onClose={handleQuickViewClose}
          maxSupply={selectedMaxSupply}
        />
      )}
    </Box>
  );
};

export default MaxSupplyCalendar;
