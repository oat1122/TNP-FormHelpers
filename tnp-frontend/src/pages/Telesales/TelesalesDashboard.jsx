import { ErrorOutline } from "@mui/icons-material";
import { Container, Grid, Typography, Button, Alert } from "@mui/material";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  DashboardErrorBoundary,
  SourceDistributionChart,
  EmptyState,
  KpiDetailsDialog,
  RecallDetailsDialog,
} from "./components";
import { useUserAccess, useCsvExport } from "./hooks";
import {
  DashboardHeader,
  PeriodTabs,
  SummaryStatsGrid,
  TopUsersCard,
  PersonalStatsCard,
  RecallStatsCard,
  RecallBySalesTable,
  KpiChartsCard,
  NotebookReportSection,
} from "./sections";
import { useGetKpiDashboardQuery } from "../../features/Customer/customerApi";

/**
 * KPI Dashboard Page
 * Redesigned dashboard with period tabs, source filter, and comprehensive stats
 * Supports admin/manager (team view) and telesales/sales (personal view)
 */
const TelesalesDashboard = () => {
  const navigate = useNavigate();

  // State
  const [periodFilter, setPeriodFilter] = useState(() => {
    const today = dayjs();
    return {
      mode: "month",
      shiftUnit: "month", // Tracks the underlying unit for date shifting
      startDate: today.startOf("month").format("YYYY-MM-DD"),
      endDate: today.endOf("month").format("YYYY-MM-DD"),
    };
  });

  const [sourceFilter, setSourceFilter] = useState("all");
  const [isKpiDialogOpen, setIsKpiDialogOpen] = useState(false);
  const [selectedKpiType, setSelectedKpiType] = useState(null);
  const [selectedTopUser, setSelectedTopUser] = useState(null); // For Top Customer Adders

  // Recall State
  const [isRecallDialogOpen, setIsRecallDialogOpen] = useState(false);
  const [selectedRecallType, setSelectedRecallType] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null); // For drill-down

  // Role-based access control
  const { hasAccess, userName, isTeamView } = useUserAccess();

  // CSV export
  const { handleExportCsv, isExporting } = useCsvExport(
    periodFilter.mode === "custom" ? "custom" : periodFilter.mode,
    sourceFilter
  );

  // API query
  // For standard API structure, we pass period as string if not custom,
  // or pass 'custom' and dates if it is custom or shifted period.
  const apiParams = {
    period: periodFilter.mode,
    source_filter: sourceFilter,
    start_date: periodFilter.startDate,
    end_date: periodFilter.endDate,
  };

  const {
    data: kpiData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetKpiDashboardQuery(apiParams, {
    skip: !hasAccess,
    refetchOnMountOrArgChange: true,
  });

  // Historical Recall: no longer needed — backend routes past periods to snapshots automatically
  const isPastPeriod = dayjs(periodFilter.endDate).isBefore(dayjs().startOf("day"));

  // Role label for display
  const roleLabel = isTeamView ? "ภาพรวมทีม" : "ข้อมูลส่วนตัว";

  // Handlers
  const handleKpiCardClick = (kpiType) => {
    setSelectedKpiType(kpiType);
    setSelectedTopUser(null);
    setIsKpiDialogOpen(true);
  };

  const handleTopUserClick = (user) => {
    setSelectedKpiType("created_by");
    setSelectedTopUser(user);
    setIsKpiDialogOpen(true);
  };

  const handleKpiDialogClose = () => {
    setIsKpiDialogOpen(false);
    setSelectedTopUser(null);
  };

  const handleRecallCardClick = (recallType) => {
    setSelectedRecallType(recallType);
    setSelectedUserId(null); // Whole team/personal based on top-level filter
    setIsRecallDialogOpen(true);
  };

  const handleSalesRowClick = (userId, recallType) => {
    setSelectedRecallType(recallType);
    setSelectedUserId(userId);
    setIsRecallDialogOpen(true);
  };

  const handleRecallDialogClose = () => {
    setIsRecallDialogOpen(false);
    setSelectedUserId(null);
  };

  // Extracted data
  const stats = kpiData?.data;
  const periodLabel = stats?.period?.label || "";
  const summary = stats?.summary || {};
  const bySource = stats?.by_source || [];
  const byBusinessType = stats?.by_business_type || [];
  const byAllocation = stats?.by_allocation || [];
  const byUser = stats?.by_user || [];
  const recallStats = stats?.recall_stats || {};
  const recallByUser = stats?.recall_by_user || [];
  const comparison = stats?.comparison || {};

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
            แดชบอร์ดนี้สำหรับผู้ใช้ที่มีบทบาท Admin, Manager, Sales หรือ Telesales เท่านั้น
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <DashboardErrorBoundary>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <DashboardHeader
          userName={userName}
          roleLabel={roleLabel}
          onExportCsv={handleExportCsv}
          onRefresh={refetch}
          isLoading={isLoading}
          isFetching={isFetching}
          isExporting={isExporting}
        />

        {/* Period Tabs */}
        <PeriodTabs
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          periodLabel={periodLabel}
          comparison={comparison}
        />

        {/* Error State */}
        {isError && (
          <EmptyState
            icon={<ErrorOutline />}
            title="เกิดข้อผิดพลาดในการโหลดข้อมูล"
            description="ระบบไม่สามารถดึงข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"
            actionLabel="ลองอีกครั้ง"
            onAction={refetch}
            severity="error"
          />
        )}

        {/* Dashboard Content */}
        {!isError && (
          <>
            {/* Summary Stats Cards */}
            <SummaryStatsGrid
              summary={summary}
              isLoading={isLoading || isFetching}
              onCardClick={handleKpiCardClick}
            />

            {/* Recall Stats Card */}
            <RecallStatsCard
              stats={recallStats}
              isLoading={isLoading || isFetching}
              onCardClick={handleRecallCardClick}
            />

            {/* Recall By Sales Table (Team View) */}
            {isTeamView && (
              <RecallBySalesTable
                data={recallByUser}
                isLoading={isLoading || isFetching}
                onCellClick={handleSalesRowClick}
              />
            )}

            {/* Charts and Details */}
            <Grid container spacing={3}>
              {/* Modern KPI Charts Card (Tabs + Donut Charts) */}
              <Grid item xs={12} md={12}>
                <KpiChartsCard
                  recallStats={recallStats}
                  bySource={bySource}
                  byBusinessType={byBusinessType}
                  byAllocation={byAllocation}
                  isLoading={isLoading || isFetching}
                />
              </Grid>

              {/* Source Distribution Chart removed as per request */}
              {/* <Grid item xs={12} md={6}>
                <SourceDistributionChart
                  data={bySource}
                  loading={isLoading || isFetching}
                  displayLabel={periodLabel}
                />
              </Grid> */}

              {/* Top Users (Team view only) */}
              {isTeamView && (
                <Grid item xs={12} md={12}>
                  <TopUsersCard
                    byUser={byUser}
                    isLoading={isLoading || isFetching}
                    onUserClick={handleTopUserClick}
                  />
                </Grid>
              )}

              {/* Personal view - show personal stats */}
              {!isTeamView && (
                <Grid item xs={12} md={12}>
                  <PersonalStatsCard summary={summary} comparison={comparison} />
                </Grid>
              )}
            </Grid>

            {/* Notebook Report Section */}
            <NotebookReportSection
              sourceFilter={sourceFilter}
              globalPeriodFilter={periodFilter}
              isTeamView={isTeamView}
            />

            {/* KPI Details Dialog */}
            <KpiDetailsDialog
              open={isKpiDialogOpen}
              onClose={handleKpiDialogClose}
              kpiType={selectedKpiType}
              period={periodFilter.mode}
              startDate={periodFilter.startDate}
              endDate={periodFilter.endDate}
              sourceFilter={sourceFilter}
              userId={
                selectedTopUser
                  ? selectedTopUser.user_id
                  : isTeamView && sourceFilter !== "all"
                    ? undefined
                    : isTeamView
                      ? "all"
                      : undefined
              }
            />

            {/* Recall Details Dialog */}
            <RecallDetailsDialog
              open={isRecallDialogOpen}
              onClose={handleRecallDialogClose}
              recallType={selectedRecallType}
              period={periodFilter.mode}
              startDate={periodFilter.startDate}
              endDate={periodFilter.endDate}
              sourceFilter={sourceFilter}
              userId={
                selectedUserId
                  ? selectedUserId
                  : isTeamView && sourceFilter !== "all"
                    ? undefined
                    : isTeamView
                      ? "all"
                      : undefined
              }
            />
          </>
        )}
      </Container>
    </DashboardErrorBoundary>
  );
};

export default TelesalesDashboard;
