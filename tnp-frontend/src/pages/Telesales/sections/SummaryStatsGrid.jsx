import React from "react";
import { Grid } from "@mui/material";
import { People as PeopleIcon, Schedule as ScheduleIcon, TrendingUp } from "@mui/icons-material";
import StatCard from "../components/StatCard";

/**
 * Summary Stats Grid component
 * Displays 3 stat cards: total customers, in pool, allocated
 *
 * @param {Object} props
 * @param {Object} props.summary - Summary data { total_customers, in_pool, allocated }
 * @param {boolean} props.isLoading - Loading state
 */
const SummaryStatsGrid = ({ summary, isLoading }) => {
  return (
    <Grid container spacing={3} mb={3}>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          icon={<PeopleIcon />}
          label="ลูกค้าใหม่ทั้งหมด"
          value={summary?.total_customers || 0}
          color="#1976d2"
          loading={isLoading}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          icon={<ScheduleIcon />}
          label="รอจัดสรร (Pool)"
          value={summary?.in_pool || 0}
          color="#ed6c02"
          loading={isLoading}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          icon={<TrendingUp />}
          label="จัดสรรแล้ว"
          value={summary?.allocated || 0}
          color="#2e7d32"
          loading={isLoading}
        />
      </Grid>
    </Grid>
  );
};

export default SummaryStatsGrid;
