import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
  Chip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  TrendingUp,
  DateRange,
  CalendarMonth,
  PersonOff,
  FilterAltOff,
  ErrorOutline,
} from "@mui/icons-material";

// Components
import DashboardErrorBoundary from "./components/DashboardErrorBoundary";
import StatCard from "./components/StatCard";
import DateRangeSelector from "./components/DateRangeSelector";
import SourceDistributionChart from "./components/SourceDistributionChart";
import RecentAllocationsTable from "./components/RecentAllocationsTable";
import EmptyState from "./components/EmptyState";

// Hooks
import { useDateRangePersistence } from "./hooks/useDateRangePersistence";
import { useTelesalesDashboardPolling } from "./hooks/useTelesalesDashboardPolling";

// API
import { useGetTelesalesStatsQuery } from "../../features/Customer/customerApi";

/**
 * Telesales Dashboard Page
 * Multi-role dashboard with date filtering, auto-refresh polling, and comprehensive stats
 * Supports admin/manager (team view) and telesales (personal view)
 */
const TelesalesDashboard = () => {
  const navigate = useNavigate();

  // Role-based access control
  const { hasAccess, userRole, userName } = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("userData") || "{}");
      const allowedRoles = ["admin", "manager", "telesale"];

      return {
        hasAccess: allowedRoles.includes(user?.role),
        userRole: user?.role,
        userName: user?.username,
      };
    } catch {
      return {
        hasAccess: false,
        userRole: null,
        userName: null,
      };
    }
  }, []);

  // Date range management
  const { dateRange, startDate, endDate, isValid, displayLabel, setPreset, setCustomRange, reset } =
    useDateRangePersistence();

  // API query
  const {
    data: statsData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetTelesalesStatsQuery(
    {
      start_date: startDate?.format("YYYY-MM-DD"),
      end_date: endDate?.format("YYYY-MM-DD"),
    },
    {
      skip: !isValid || !startDate || !endDate || !hasAccess,
      pollingInterval: 0, // Manual polling via hook
    }
  );

  // Polling with visibility detection
  const polling = useTelesalesDashboardPolling({
    enabled: hasAccess && isValid,
    intervalMs: 60000, // 60 seconds
    onRefresh: refetch,
  });

  // Role label for display
  const roleLabel = useMemo(() => {
    if (userRole === "admin" || userRole === "manager") {
      return "ภาพรวมทีม";
    }
    return "ข้อมูลส่วนตัว";
  }, [userRole]);

  // Check authorization
  if (!hasAccess) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => navigate("/")}>
              กลับหน้าหลัก
            </Button>
          }
        >
          <Typography variant="body1" fontWeight={600}>
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </Typography>
          <Typography variant="body2">
            แดชบอร์ดนี้สำหรับผู้ใช้ที่มีบทบาท Admin, Manager หรือ Telesales เท่านั้น
          </Typography>
        </Alert>
      </Container>
    );
  }

  // Determine empty state type
  const showNoDataEmpty =
    !isLoading &&
    !isError &&
    statsData?.data?.total_pool === 0 &&
    statsData?.data?.total_allocated_today === 0 &&
    dateRange.mode === "preset";

  const showNoResultsEmpty =
    !isLoading &&
    !isError &&
    dateRange.mode === "custom" &&
    statsData?.data?.total_allocated_today === 0;

  const showErrorEmpty = isError;

  return (
    <DashboardErrorBoundary>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              แดชบอร์ด Telesales
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip size="small" label={roleLabel} color="primary" variant="outlined" />
              {userName && (
                <Typography variant="caption" color="text.secondary" ml={1}>
                  {userName}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Date Range Selector */}
        <DateRangeSelector
          dateRange={dateRange}
          setPreset={setPreset}
          setCustomRange={setCustomRange}
          startDate={startDate}
          endDate={endDate}
          isValid={isValid}
          displayLabel={displayLabel}
          roleLabel={roleLabel}
        />

        {/* Polling Status */}
        <Paper elevation={1} sx={{ p: 1.5, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <ScheduleIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                อัปเดตล่าสุด: {polling.lastUpdated}
              </Typography>
              {polling.isPaused && (
                <Chip label="หยุดชั่วคราว" size="small" color="warning" variant="outlined" />
              )}
            </Box>

            <Tooltip title="รีเฟรชข้อมูลทันที" arrow>
              <IconButton size="small" onClick={polling.forceRefresh} disabled={isFetching}>
                {isFetching ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Empty States */}
        {showNoDataEmpty && (
          <EmptyState
            icon={<PersonOff />}
            title="ยังไม่มีลูกค้าในระบบ"
            description="เริ่มต้นสร้างลูกค้ารายแรกเพื่อดูสถิติและติดตามผลงานที่นี่"
            actionLabel="สร้างลูกค้าใหม่"
            onAction={() => navigate("/customer")}
            severity="info"
          />
        )}

        {showNoResultsEmpty && (
          <EmptyState
            icon={<FilterAltOff />}
            title="ไม่พบข้อมูลในช่วงเวลาที่เลือก"
            description="ลองเปลี่ยนช่วงเวลาหรือรีเซ็ตเป็นค่าเริ่มต้น (เดือนนี้)"
            actionLabel="รีเซ็ตตัวกรอง"
            onAction={reset}
            severity="warning"
          />
        )}

        {showErrorEmpty && (
          <EmptyState
            icon={<ErrorOutline />}
            title="เกิดข้อผิดพลาดในการโหลดข้อมูล"
            description="ระบบไม่สามารถดึงข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ"
            actionLabel="ลองอีกครั้ง"
            onAction={refetch}
            severity="error"
          />
        )}

        {/* Dashboard Content */}
        {!showNoDataEmpty && !showNoResultsEmpty && !showErrorEmpty && (
          <>
            {/* Stats Cards */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12}>
                <Typography variant="h6" mb={2}>
                  สถิติลูกค้า
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<PeopleIcon />}
                  label="ลูกค้า Pool"
                  value={statsData?.data?.total_pool || 0}
                  color="#1976d2"
                  loading={isLoading || isFetching}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<TrendingUp />}
                  label="จัดสรรวันนี้"
                  value={statsData?.data?.total_allocated_today || 0}
                  color="#2e7d32"
                  loading={isLoading || isFetching}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<DateRange />}
                  label="จัดสรรสัปดาห์นี้"
                  value={statsData?.data?.total_allocated_week || 0}
                  color="#ed6c02"
                  loading={isLoading || isFetching}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  icon={<CalendarMonth />}
                  label="จัดสรรเดือนนี้"
                  value={statsData?.data?.total_allocated_month || 0}
                  color="#B20000"
                  loading={isLoading || isFetching}
                />
              </Grid>
            </Grid>

            {/* Charts and Tables */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SourceDistributionChart
                  data={statsData?.data?.by_source}
                  loading={isLoading || isFetching}
                  displayLabel={displayLabel}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <RecentAllocationsTable
                  data={statsData?.data?.recent_allocations}
                  loading={isLoading || isFetching}
                />
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </DashboardErrorBoundary>
  );
};

export default TelesalesDashboard;
