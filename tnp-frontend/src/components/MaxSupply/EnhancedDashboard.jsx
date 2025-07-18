import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Divider,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Fade,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Info,
  Speed,
  Assessment,
} from "@mui/icons-material";
import StatisticsCards from "./StatisticsCards";
import CapacitySummary from "./CapacitySummary";
import WorkCapacityCard from "./WorkCapacityCard";
import useProductionCapacityCalculation from "../../hooks/useProductionCapacityCalculation";

const EnhancedDashboard = ({
  statistics,
  loading,
  allData = [],
  selectedTimePeriod: externalSelectedTimePeriod,
  setSelectedTimePeriod: externalSetSelectedTimePeriod,
}) => {
  // Use the production capacity calculation hook
  const {
    selectedTimePeriod: internalSelectedTimePeriod,
    setSelectedTimePeriod: internalSetSelectedTimePeriod,
    calculationResult,
    getCapacityDisplayLabel,
  } = useProductionCapacityCalculation(allData, externalSelectedTimePeriod);

  // Use external state if provided, otherwise use internal state
  const selectedTimePeriod =
    externalSelectedTimePeriod || internalSelectedTimePeriod;
  const setSelectedTimePeriod =
    externalSetSelectedTimePeriod || internalSetSelectedTimePeriod;

  const workCalc =
    calculationResult?.work_calculations || statistics?.work_calculations;

  // Generate insights based on data
  const generateInsights = () => {
    if (!workCalc) return [];

    const insights = [];
    const utilizations = workCalc.utilization || {};

    // Check for low utilization
    Object.entries(utilizations).forEach(([type, utilization]) => {
      if (utilization < 30 && utilization > 0) {
        insights.push({
          type: "info",
          icon: <TrendingDown />,
          title: `${type.toUpperCase()} ใช้งานต่ำมาก`,
          message: `${type.toUpperCase()} ใช้งานเพียง ${utilization}% ของกำลังผลิต${getCapacityDisplayLabel(
            selectedTimePeriod
          )} แนะนำวางงานเพิ่ม`,
        });
      }
    });

    // Check for high utilization
    Object.entries(utilizations).forEach(([type, utilization]) => {
      if (utilization > 100) {
        insights.push({
          type: "error",
          icon: <Warning />,
          title: `${type.toUpperCase()} เกินกำลังผลิต`,
          message: `${type.toUpperCase()} ใช้ ${utilization}% (เกิน ${
            utilization - 100
          }%) ของกำลังผลิต${getCapacityDisplayLabel(
            selectedTimePeriod
          )} — ต้องปรับแผนการผลิตด่วน!`,
        });
      } else if (utilization >= 95) {
        insights.push({
          type: "warning",
          icon: <Warning />,
          title: `${type.toUpperCase()} ใช้งานสูงมาก`,
          message: `${type.toUpperCase()} ใช้ ${utilization}% ของกำลังผลิต${getCapacityDisplayLabel(
            selectedTimePeriod
          )} — เสี่ยงต่อ Delay`,
        });
      } else if (utilization >= 80) {
        insights.push({
          type: "info",
          icon: <Speed />,
          title: `${type.toUpperCase()} ใช้งานสูง`,
          message: `${type.toUpperCase()} ใช้ ${utilization}% ของกำลังผลิต${getCapacityDisplayLabel(
            selectedTimePeriod
          )} — ควรติดตามอย่างใกล้ชิด`,
        });
      }
    });

    // Check overall production balance
    const totalUtilization =
      Object.values(utilizations).reduce((sum, val) => sum + val, 0) /
      Object.keys(utilizations).length;
    if (totalUtilization < 40) {
      insights.push({
        type: "success",
        icon: <CheckCircle />,
        title: "กำลังผลิตเหลือเฟือ",
        message: `การใช้กำลังผลิตเฉลี่ยเพียง ${Math.round(
          totalUtilization
        )}% สามารถรับงานเพิ่มได้อีกมาก`,
      });
    }

    return insights.slice(0, 3); // Show max 3 insights
  };

  const insights = generateInsights();

  return (
    <Box>
      {/* Main Summary Section */}
      <Fade in={true} timeout={500}>
        <Box sx={{ mb: 4 }}>
          {workCalc ? (
            <CapacitySummary
              workCalc={workCalc}
              timePeriod={selectedTimePeriod}
              periodLabel={getCapacityDisplayLabel(selectedTimePeriod)}
              selectedTimePeriod={selectedTimePeriod}
              setSelectedTimePeriod={setSelectedTimePeriod}
              getCapacityDisplayLabel={getCapacityDisplayLabel}
            />
          ) : (
            <Alert severity="info">
              <AlertTitle>กำลังโหลดข้อมูล</AlertTitle>
              กรุณารอสักครู่ เรากำลังคำนวณข้อมูลกำลังการผลิต...
            </Alert>
          )}
        </Box>
      </Fade>

      {/* Insights Section */}
      {insights.length > 0 && (
        <Fade in={true} timeout={700}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ mb: 2, display: "flex", alignItems: "center" }}
            >
              ข้อมูลเชิงลึก (Insights)
            </Typography>
            <Grid container spacing={2}>
              {insights.map((insight, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Alert
                    severity={insight.type}
                    icon={insight.icon}
                    sx={{
                      height: "100%",
                      "& .MuiAlert-message": {
                        width: "100%",
                      },
                    }}
                  >
                    <AlertTitle sx={{ fontWeight: "bold" }}>
                      {insight.title}
                    </AlertTitle>
                    {insight.message}
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Job Status Section */}
      <Fade in={true} timeout={900}>
        <Box sx={{ mb: 4 }}>
          <StatisticsCards
            statistics={statistics}
            loading={loading}
            allData={allData}
            selectedTimePeriod={selectedTimePeriod}
            setSelectedTimePeriod={setSelectedTimePeriod}
          />
        </Box>
      </Fade>

      <Divider sx={{ my: 3 }} />

      {/* Production Capacity Section */}
      <Fade in={true} timeout={1100}>
        <Box>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ mb: 2, display: "flex", alignItems: "center" }}
          >
            รายละเอียดกำลังการผลิต
          </Typography>
          <WorkCapacityCard
            statistics={statistics}
            allData={allData}
            selectedTimePeriod={selectedTimePeriod}
            setSelectedTimePeriod={setSelectedTimePeriod}
          />
        </Box>
      </Fade>
    </Box>
  );
};

export default EnhancedDashboard;
