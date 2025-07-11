import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  LinearProgress,
  Alert,
} from '@mui/material';
import { 
  maxSupplyApi, 
  calendarApi 
} from '../../services/maxSupplyApi';
import toast from 'react-hot-toast';
import { useMaxSupplyData } from '../../hooks/useMaxSupplyData';
import { useFallbackData } from '../../hooks/useFallbackData';
import { StatisticsCards, WorkCapacityCard, KanbanBoard } from '../../components/MaxSupply';
import {
  NavigationTabs,
  CalendarView,
  DeadlineSection,
  JobStatusSection,
  TestButtons,
} from './components';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  startOfWeek,
  endOfWeek,
  } from 'date-fns';

const MaxSupplyHome = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); 
  const [currentTab, setCurrentTab] = useState(0); // 0=Dashboard, 1=Calendar, 2=Manager (default to Dashboard for better UX)
  
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

  // Handler for status change
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      if (isBackendUnavailable) {
        toast.error('ไม่สามารถเปลี่ยนสถานะได้ในโหมดสาธิต');
        return;
      }

      await maxSupplyApi.updateStatus(jobId, newStatus);
      toast.success('เปลี่ยนสถานะงานสำเร็จ');
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะงาน');
    }
  };

  // Handler for job deletion
  const handleDeleteJob = async (jobId) => {
    try {
      if (isBackendUnavailable) {
        toast.error('ไม่สามารถลบงานได้ในโหมดสาธิต');
        return;
      }

      await maxSupplyApi.delete(jobId);
      toast.success('ลบงานสำเร็จ');
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('เกิดข้อผิดพลาดในการลบงาน');
    }
  };

  // Navigate months
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  // Refetch data when filters change (but not too frequently)
  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [currentDate, viewMode]); // Remove refetch from dependencies

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
      <NavigationTabs 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

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
            <CalendarView 
              currentDate={currentDate}
              navigateMonth={navigateMonth}
              maxSupplies={maxSupplies}
              calculateEventTimeline={calculateEventTimeline}
              organizeEventsInRows={organizeEventsInRows}
            />
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={3}>
            <DeadlineSection 
              getUpcomingDeadlines={getUpcomingDeadlines}
              loading={loading}
            />
            <JobStatusSection 
              statistics={statistics}
              loading={loading}
            />
          </Grid>
        </Grid>
      )}

      {/* Other tab content placeholders */}
      {currentTab === 0 && (
        <Box>
          <TestButtons statistics={statistics} />
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
        <KanbanBoard 
          maxSupplies={maxSupplies}
          onStatusChange={handleStatusChange}
          onDeleteJob={handleDeleteJob}
          loading={loading}
        />
      )}
    </Container>
  );
};

export default MaxSupplyHome;