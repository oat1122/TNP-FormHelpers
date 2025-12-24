import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Grid, Typography, Button, Alert } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";

// Components
import { DashboardErrorBoundary, SourceDistributionChart, EmptyState } from "./components";

// Sections
import {
  DashboardHeader,
  PeriodTabs,
  SummaryStatsGrid,
  TopUsersCard,
  PersonalStatsCard,
} from "./sections";

// Hooks
import { useUserAccess, useCsvExport } from "./hooks";

// API
import { useGetKpiDashboardQuery } from "../../features/Customer/customerApi";

/**
 * KPI Dashboard Page
 * Redesigned dashboard with period tabs, source filter, and comprehensive stats
 * Supports admin/manager (team view) and telesales/sales (personal view)
 */
const TelesalesDashboard = () => {
  const navigate = useNavigate();

  // State
  const [period, setPeriod] = useState("month");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Role-based access control
  const { hasAccess, userName, isTeamView } = useUserAccess();

  // CSV export
  const { handleExportCsv, isExporting } = useCsvExport(period, sourceFilter);

  // API query
  const {
    data: kpiData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetKpiDashboardQuery(
    {
      period,
      source_filter: sourceFilter,
    },
    {
      skip: !hasAccess,
      refetchOnMountOrArgChange: true,
    }
  );

  // Role label for display
  const roleLabel = isTeamView ? "ภาพรวมทีม" : "ข้อมูลส่วนตัว";

  // Extracted data
  const stats = kpiData?.data;
  const periodLabel = stats?.period?.label || "";
  const summary = stats?.summary || {};
  const bySource = stats?.by_source || [];
  const byUser = stats?.by_user || [];
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
          period={period}
          onPeriodChange={setPeriod}
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
            <SummaryStatsGrid summary={summary} isLoading={isLoading || isFetching} />

            {/* Charts and Details */}
            <Grid container spacing={3}>
              {/* Source Distribution Chart */}
              <Grid item xs={12} md={6}>
                <SourceDistributionChart
                  data={bySource}
                  loading={isLoading || isFetching}
                  displayLabel={periodLabel}
                />
              </Grid>

              {/* Top Users (Team view only) */}
              {isTeamView && (
                <Grid item xs={12} md={6}>
                  <TopUsersCard byUser={byUser} isLoading={isLoading || isFetching} />
                </Grid>
              )}

              {/* Personal view - show personal stats */}
              {!isTeamView && (
                <Grid item xs={12} md={6}>
                  <PersonalStatsCard summary={summary} comparison={comparison} />
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Container>
    </DashboardErrorBoundary>
  );
};

export default TelesalesDashboard;
