import { Box, Container, Typography, Grid, Button, LinearProgress, Alert } from "@mui/material";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { NavigationTabs, DeadlineSection, JobStatusSection } from "./components";
import EnhancedCalendarView from "./components/CalendarView";
import {
  StatisticsCards,
  WorkCapacityCard,
  KanbanBoard,
  EnhancedDashboard,
} from "../../components/MaxSupply";
import { useMaxSupplyData } from "../../hooks/useMaxSupplyData";
import { useFallbackData } from "./hooks/useFallbackData";
import { maxSupplyApi, calendarApi } from "../../services/maxSupplyApi";

const MaxSupplyHome = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [currentTab, setCurrentTab] = useState(0); // 0=Dashboard, 1=Calendar, 2=Manager (default to Dashboard for better UX)
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("today"); // Shared time period state

  // Use custom hook for data management
  const {
    data: realMaxSupplies,
    loading,
    error,
    statistics: realStatistics,
    refetch,
    getEventsForDate: getRealEventsForDate,
    getUpcomingDeadlines: getRealUpcomingDeadlines,
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
  const isBackendUnavailable =
    error &&
    (error.includes("Cannot connect to server") ||
      error.includes("Network Error") ||
      error.includes("timeout"));

  // Use fallback data only when backend is unavailable
  const maxSupplies = isBackendUnavailable ? fallbackMaxSupplies : realMaxSupplies;
  const statistics = isBackendUnavailable ? fallbackStatistics : realStatistics;
  const getEventsForDate = isBackendUnavailable ? getFallbackEventsForDate : getRealEventsForDate;
  const getUpcomingDeadlines = isBackendUnavailable
    ? getFallbackUpcomingDeadlines
    : getRealUpcomingDeadlines;

  // Handler for status change
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      if (isBackendUnavailable) {
        toast.error("ไม่สามารถเปลี่ยนสถานะได้ในโหมดสาธิต");
        return;
      }

      await maxSupplyApi.updateStatus(jobId, newStatus);
      toast.success("เปลี่ยนสถานะงานสำเร็จ");
      refetch(); // Refresh data
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะงาน");
    }
  };

  // Handler for job deletion
  const handleDeleteJob = async (jobId) => {
    try {
      if (isBackendUnavailable) {
        toast.error("ไม่สามารถลบงานได้ในโหมดสาธิต");
        return;
      }

      await maxSupplyApi.delete(jobId);
      toast.success("ลบงานสำเร็จ");
      refetch(); // Refresh data
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("เกิดข้อผิดพลาดในการลบงาน");
    }
  };

  // Navigate months
  const navigateMonth = (direction) => {
    if (direction === "prev") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (direction === "next") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (direction === "today") {
      setCurrentDate(new Date());
    }
  };

  // Refetch data when filters change (but not too frequently)
  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [currentDate, viewMode]); // Remove refetch from dependencies

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
      <NavigationTabs currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Error Alert or Demo Mode Alert */}
      {error && isBackendUnavailable && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={refetch} disabled={loading} sx={{ color: "inherit" }}>
              {loading ? "กำลังลอง..." : "เชื่อมต่อ Backend"}
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>🚧 โหมดสาธิต (Demo Mode)</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            ไม่สามารถเชื่อมต่อกับ Backend ได้ แต่คุณยังสามารถดู UI และ Layout ได้ปกติ
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontSize: "0.875rem" }}>
            💡 <strong>วิธีแก้ไข:</strong> เปิด Laravel server ที่ <code>localhost:8000</code>{" "}
            แล้วคลิก "เชื่อมต่อ Backend"
          </Typography>
        </Alert>
      )}

      {error && !isBackendUnavailable && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={refetch} disabled={loading} sx={{ color: "inherit" }}>
              {loading ? "กำลังลอง..." : "ลองใหม่"}
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
            <EnhancedCalendarView
              currentDate={currentDate}
              navigateMonth={navigateMonth}
              maxSupplies={maxSupplies}
              statistics={statistics}
              onJobUpdate={refetch}
              onJobDelete={handleDeleteJob}
              loading={loading}
            />
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={3}>
            <DeadlineSection
              jobs={maxSupplies}
              getUpcomingDeadlines={getUpcomingDeadlines}
              loading={loading}
            />
            <JobStatusSection statistics={statistics} loading={loading} />
          </Grid>
        </Grid>
      )}

      {/* Other tab content placeholders */}
      {currentTab === 0 && (
        <Box>
          <EnhancedDashboard
            statistics={statistics}
            loading={loading}
            allData={maxSupplies}
            selectedTimePeriod={selectedTimePeriod}
            setSelectedTimePeriod={setSelectedTimePeriod}
          />
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
