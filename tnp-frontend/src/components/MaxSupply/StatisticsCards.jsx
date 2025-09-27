import {
  TrendingUp,
  Assignment,
  Schedule,
  CheckCircle,
  PendingActions,
  PlayArrow,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Avatar,
  Chip,
  LinearProgress,
} from "@mui/material";
import React, { useEffect } from "react";

import TimePeriodSelector from "./TimePeriodSelector";
import useProductionCapacityCalculation from "../../hooks/useProductionCapacityCalculation";
import ProductionTypeIcon from "../../pages/MaxSupply/components/ProductionTypeIcon";

const StatisticsCards = ({
  statistics,
  loading,
  allData = [],
  selectedTimePeriod: externalSelectedTimePeriod,
  setSelectedTimePeriod: externalSetSelectedTimePeriod,
}) => {
  // Use the new production capacity calculation hook
  const {
    selectedTimePeriod: internalSelectedTimePeriod,
    setSelectedTimePeriod: internalSetSelectedTimePeriod,
    calculationResult,
    getCapacityDisplayLabel,
  } = useProductionCapacityCalculation(allData, externalSelectedTimePeriod);

  // Use external state if provided, otherwise use internal state
  const selectedTimePeriod = externalSelectedTimePeriod || internalSelectedTimePeriod;
  const setSelectedTimePeriod = externalSetSelectedTimePeriod || internalSetSelectedTimePeriod;

  // Sync internal state with external state
  useEffect(() => {
    if (externalSelectedTimePeriod && externalSelectedTimePeriod !== internalSelectedTimePeriod) {
      internalSetSelectedTimePeriod(externalSelectedTimePeriod);
    }
  }, [externalSelectedTimePeriod, internalSelectedTimePeriod, internalSetSelectedTimePeriod]);

  // Use calculation result data (for time period specific calculations)
  const workCalc = calculationResult?.work_calculations || statistics?.work_calculations;

  const productionTypeData = [
    {
      key: "screen",
      label: "Screen Printing",
      icon: <ProductionTypeIcon type="screen" size={24} />,
      color: "#1565C0", // น้ำเงิน
      count: workCalc?.job_count?.screen || 0,
      workload: workCalc?.current_workload?.screen || 0,
    },
    {
      key: "dtf",
      label: "DTF",
      icon: <ProductionTypeIcon type="dtf" size={24} />,
      color: "#FF8F00", // เหลือง
      count: workCalc?.job_count?.dtf || 0,
      workload: workCalc?.current_workload?.dtf || 0,
    },
    {
      key: "sublimation",
      label: "Sublimation",
      icon: <ProductionTypeIcon type="sublimation" size={24} />,
      color: "#7B1FA2", // ม่วง
      count: workCalc?.job_count?.sublimation || 0,
      workload: workCalc?.current_workload?.sublimation || 0,
    },
    {
      key: "embroidery",
      label: "Embroidery",
      icon: <ProductionTypeIcon type="embroidery" size={24} />,
      color: "#2E7D32", // เขียว
      count: workCalc?.job_count?.embroidery || 0,
      workload: workCalc?.current_workload?.embroidery || 0,
    },
  ];

  const statusData = [
    {
      key: "total",
      label: "งานทั้งหมด",
      icon: <Assignment />,
      color: "#6B7280",
      count: statistics.total || 0,
    },
    {
      key: "pending",
      label: "รอเริ่มงาน",
      icon: <PendingActions />,
      color: "#F59E0B",
      count: statistics.pending || 0,
    },
    {
      key: "in_progress",
      label: "กำลังผลิต",
      icon: <PlayArrow />,
      color: "#3B82F6",
      count: statistics.in_progress || 0,
    },
    {
      key: "completed",
      label: "เสร็จสิ้น",
      icon: <CheckCircle />,
      color: "#10B981",
      count: statistics.completed || 0,
    },
  ];

  const StatusCard = ({ title, value, icon, color, percentage, total }) => (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={color} sx={{ mb: 1 }}>
              {loading ? "-" : value}
            </Typography>
            {percentage !== undefined && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <Box sx={{ flexGrow: 1, mr: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: `${color}20`,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: color,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight="bold" color={color}>
                  {percentage.toFixed(0)}%
                </Typography>
              </Box>
            )}
            {total && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                จาก {total} งานทั้งหมด
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}20`,
              color: color,
              width: 64,
              height: 64,
              ml: 2,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const ProductionTypeCard = ({
    type,
    count,
    workload,
    total,
    totalWorkload,
    statistics,
    timePeriod = "today",
    periodLabel = "วันนี้",
  }) => {
    // Calculate percentage based on workload (pieces) instead of job count
    const percentage = totalWorkload > 0 ? (workload / totalWorkload) * 100 : 0;

    // Production capacity data
    const dailyCapacity = statistics?.work_calculations?.capacity?.daily?.[type.key] || 0;
    const totalCapacity =
      statistics?.work_calculations?.capacity?.total?.[type.key] || dailyCapacity;
    const utilization = statistics?.work_calculations?.utilization?.[type.key] || 0;
    const periodDays = statistics?.work_calculations?.capacity?.period_days || 1;

    const getUtilizationColor = (percentage) => {
      if (percentage >= 90) return "#EF4444"; // Red
      if (percentage >= 70) return "#F59E0B"; // Orange
      if (percentage >= 50) return "#3B82F6"; // Blue
      return "#10B981"; // Green
    };

    const getUtilizationLabel = (percentage) => {
      if (percentage >= 90) return "สูงมาก";
      if (percentage >= 70) return "สูง";
      if (percentage >= 50) return "ปานกลาง";
      return "ต่ำ";
    };

    return (
      <Card
        sx={{
          height: "100%",
          border: `2px solid ${type.color}20`,
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 4,
            borderColor: `${type.color}40`,
          },
        }}
      >
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: `${type.color}20`,
                color: type.color,
                width: 56,
                height: 56,
                mr: 2,
              }}
            >
              {type.icon}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                {type.label}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography variant="h4" color={type.color} fontWeight="bold">
                  {loading ? "-" : count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  งาน
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {loading ? "-" : workload.toLocaleString()} ชิ้นงาน
              </Typography>
            </Box>
            {!loading && utilization > 0 && (
              <Chip
                size="small"
                label={`${utilization}%`}
                sx={{
                  bgcolor: getUtilizationColor(utilization),
                  color: "white",
                  fontWeight: "bold",
                  minWidth: 50,
                  fontSize: "0.875rem",
                }}
              />
            )}
          </Box>

          {!loading && totalWorkload > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  สัดส่วนของงานทั้งหมด
                </Typography>
                <Typography variant="caption" fontWeight="bold" color={type.color}>
                  {percentage.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: `${type.color}20`,
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: type.color,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          )}

          {/* Production Capacity Info */}
          {!loading && dailyCapacity > 0 && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: "1px solid",
                borderTopColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                🎯 กำลังการผลิต/วัน: <strong>{dailyCapacity.toLocaleString()}</strong> ชิ้น
              </Typography>
              {periodDays > 1 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mb: 0.5 }}
                >
                  📈 กำลังการผลิต{periodLabel}: <strong>{totalCapacity.toLocaleString()}</strong>{" "}
                  ชิ้น
                </Typography>
              )}
              <Typography
                variant="caption"
                color={getUtilizationColor(utilization)}
                display="block"
                fontWeight="bold"
              >
                📊 การใช้งาน{periodLabel}: {getUtilizationLabel(utilization)} ({utilization}%)
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Status Statistics */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ mb: 2, display: "flex", alignItems: "center" }}
        >
          สถานะงานทั้งหมด
        </Typography>
        <Grid container spacing={2}>
          {statusData.map((item) => {
            const percentage = statistics.total > 0 ? (item.count / statistics.total) * 100 : 0;
            return (
              <Grid item xs={12} sm={6} md={3} key={item.key}>
                <StatusCard
                  title={item.label}
                  value={item.count}
                  icon={item.icon}
                  color={item.color}
                  percentage={item.key !== "total" ? percentage : undefined}
                  total={item.key !== "total" ? statistics.total : undefined}
                />
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Production Type Statistics */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ mb: 1, display: "flex", alignItems: "center" }}
        >
          กำลังผลิตแยกตามประเภท ({getCapacityDisplayLabel(selectedTimePeriod)})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          แสดงเฉพาะงานที่มีสถานะ "กำลังดำเนินการ" ในช่วงเวลา
          {getCapacityDisplayLabel(selectedTimePeriod)}
        </Typography>
      </Box>
      <Grid container spacing={3}>
        {productionTypeData.map((type) => {
          // Calculate total job count and total workload from work_calculations
          const totalJobCount = productionTypeData.reduce((sum, item) => sum + item.count, 0);
          const totalWorkload = productionTypeData.reduce((sum, item) => sum + item.workload, 0);

          return (
            <Grid item xs={12} sm={6} md={6} lg={3} key={type.key}>
              <ProductionTypeCard
                type={type}
                count={type.count}
                workload={type.workload}
                total={totalJobCount}
                totalWorkload={totalWorkload}
                statistics={{ work_calculations: workCalc }}
                timePeriod={selectedTimePeriod}
                periodLabel={getCapacityDisplayLabel(selectedTimePeriod)}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Debug Info (Development Only):
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Selected period: {selectedTimePeriod} ({getCapacityDisplayLabel(selectedTimePeriod)}){" "}
            {externalSelectedTimePeriod ? "(External)" : "(Internal)"}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Items in period: {calculationResult?.total_items || 0}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Period days: {calculationResult?.work_calculations?.capacity?.period_days || 1}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Total In-Progress Jobs: {productionTypeData.reduce((sum, item) => sum + item.count, 0)}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Total Workload: {productionTypeData.reduce((sum, item) => sum + item.workload, 0)} ชิ้น
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Work Calculations: {JSON.stringify(workCalc || {}, null, 2)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StatisticsCards;
