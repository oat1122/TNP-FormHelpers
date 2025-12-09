import React from "react";
import { Card, CardHeader, CardContent, Skeleton, CircularProgress } from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { getSourceDisplayName, getSourceColor } from "../../../features/Customer/customerUtils";
import EmptyState from "./EmptyState";
import { BarChart as BarChartIcon } from "@mui/icons-material";

/**
 * Source Distribution Chart component using Recharts
 * Displays customer count by source (sales/telesales/online/office)
 *
 * @param {Object} props
 * @param {Array} props.data Array of {source, count} objects
 * @param {boolean} props.loading Loading state
 * @param {string} props.displayLabel Current date range label
 */
const SourceDistributionChart = ({ data, loading, displayLabel }) => {
  // Transform data for chart
  const chartData = (data || []).map((item) => ({
    name: getSourceDisplayName(item.source),
    count: item.count,
    fill: getSourceColor(item.source),
  }));

  const isEmpty = !loading && chartData.length === 0;

  return (
    <Card elevation={2}>
      <CardHeader
        title="การกระจายตัวของลูกค้าตามแหล่งที่มา"
        subheader={displayLabel ? `ช่วง: ${displayLabel}` : "ภาพรวมทั้งหมด"}
        action={loading && <CircularProgress size={20} />}
      />
      <CardContent>
        {loading ? (
          // Loading skeleton
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        ) : isEmpty ? (
          // Empty state
          <EmptyState
            icon={<BarChartIcon />}
            title="ไม่มีข้อมูล"
            description="ยังไม่มีข้อมูลลูกค้าในช่วงเวลาที่เลือก"
            severity="info"
          />
        ) : (
          // Chart
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e0e0e0",
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SourceDistributionChart;
