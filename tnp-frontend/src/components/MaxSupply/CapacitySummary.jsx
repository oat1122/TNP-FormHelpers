import React from "react";
import { Box, Typography, Grid, Card, CardContent, Tooltip, Avatar, Chip } from "@mui/material";
import { Assignment, Inventory, Speed, TrendingUp, Info } from "@mui/icons-material";
import TimePeriodSelector from "./TimePeriodSelector";

const CapacitySummary = ({
  workCalc,
  timePeriod = "today",
  periodLabel = "วันนี้",
  selectedTimePeriod,
  setSelectedTimePeriod,
  getCapacityDisplayLabel,
}) => {
  const formatNumber = (number) => {
    return new Intl.NumberFormat("th-TH").format(number);
  };

  const totalJobs = Object.values(workCalc.job_count || {}).reduce((sum, val) => sum + val, 0);
  const totalWorkload = Object.values(workCalc.current_workload).reduce((sum, val) => sum + val, 0);
  const totalCapacity = Object.values(
    workCalc.capacity?.total || workCalc.capacity?.daily || {}
  ).reduce((sum, val) => sum + val, 0);
  const totalDailyCapacity = Object.values(workCalc.capacity?.daily || {}).reduce(
    (sum, val) => sum + val,
    0
  );
  const averageUtilization =
    totalCapacity > 0 ? Math.round((totalWorkload / totalCapacity) * 100) : 0;

  const getUtilizationLevel = (utilization) => {
    if (utilization >= 90) return { label: "สูงมาก", color: "error" };
    if (utilization >= 70) return { label: "สูง", color: "warning" };
    if (utilization >= 50) return { label: "ปานกลาง", color: "info" };
    return { label: "ต่ำ", color: "success" };
  };

  const utilizationLevel = getUtilizationLevel(averageUtilization);

  const summaryData = [
    {
      title: "จำนวนงาน",
      value: totalJobs,
      icon: <Assignment />,
      color: "#1976d2",
      bgColor: "#e3f2fd",
    },
    {
      title: "งานทั้งหมด (ชิ้น)",
      value: totalWorkload,
      icon: <Inventory />,
      color: "#7b1fa2",
      bgColor: "#f3e5f5",
    },
    {
      title: `กำลังผลิต${periodLabel}`,
      value: timePeriod === "today" ? totalDailyCapacity : totalCapacity,
      icon: <Speed />,
      color: "#2e7d32",
      bgColor: "#e8f5e8",
    },
    {
      title: "การใช้งานเฉลี่ย",
      value: `${averageUtilization}%`,
      subtitle: utilizationLevel.label,
      icon: <TrendingUp />,
      color:
        utilizationLevel.color === "error"
          ? "#d32f2f"
          : utilizationLevel.color === "warning"
            ? "#ed6c02"
            : utilizationLevel.color === "info"
              ? "#0288d1"
              : "#2e7d32",
      bgColor:
        utilizationLevel.color === "error"
          ? "#ffebee"
          : utilizationLevel.color === "warning"
            ? "#fff3e0"
            : utilizationLevel.color === "info"
              ? "#e1f5fe"
              : "#e8f5e8",
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mr: 1 }}>
            สรุปงานและกำลังการผลิต
          </Typography>
          <Tooltip title={`แสดงงานที่ "กำลังผลิต" เฉพาะช่วงเวลา: ${periodLabel}`}>
            <Info color="action" sx={{ fontSize: 20 }} />
          </Tooltip>
        </Box>

        {selectedTimePeriod && setSelectedTimePeriod && (
          <Box sx={{ textAlign: "right" }}>
            <TimePeriodSelector
              value={selectedTimePeriod}
              onChange={setSelectedTimePeriod}
              label="เลือกช่วงเวลาการคำนวณ"
              size="small"
            />
          </Box>
        )}
      </Box>

      <Grid container spacing={2}>
        {summaryData.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              elevation={2}
              sx={{
                height: "100%",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: item.bgColor,
                    color: item.color,
                    width: 56,
                    height: 56,
                    margin: "0 auto 16px auto",
                  }}
                >
                  {item.icon}
                </Avatar>

                <Typography variant="h3" fontWeight="bold" color={item.color} sx={{ mb: 1 }}>
                  {typeof item.value === "number" ? formatNumber(item.value) : item.value}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {item.title}
                </Typography>

                {item.subtitle && (
                  <Chip
                    label={item.subtitle}
                    size="small"
                    sx={{
                      bgcolor: item.bgColor,
                      color: item.color,
                      fontWeight: "bold",
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{
          mt: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Info sx={{ fontSize: 16, mr: 0.5 }} />
          แสดงงานที่ "กำลังผลิต" เฉพาะช่วงเวลา: {periodLabel}
        </Typography>
      </Box>
    </Box>
  );
};

export default CapacitySummary;
