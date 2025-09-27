import { Speed } from "@mui/icons-material";
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Divider,
  Stack,
  Box,
  useTheme,
  Avatar,
} from "@mui/material";
import React from "react";

import ProductionTypeIcon from "../../pages/MaxSupply/components/ProductionTypeIcon";

const ProductionTypeCapacityCard = ({
  type,
  workCalc,
  timePeriod = "today",
  periodLabel = "วันนี้",
}) => {
  const theme = useTheme();

  const currentWorkload = workCalc.current_workload[type.key] || 0;
  const totalCapacity = workCalc.capacity?.total?.[type.key] || 0;
  const dailyCapacity = workCalc.capacity?.daily?.[type.key] || 0;
  const utilization = workCalc.utilization[type.key] || 0;
  const remainingCapacity = workCalc.remaining_capacity[type.key] || 0;
  const jobCount = workCalc.job_count?.[type.key] || 0;
  const periodDays = workCalc.capacity?.period_days || 1;

  const formatNumber = (number) => {
    return new Intl.NumberFormat("th-TH").format(number);
  };

  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return theme.palette.error.main;
    if (percentage >= 70) return theme.palette.warning.main;
    if (percentage >= 50) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const getUtilizationLabel = (percentage) => {
    if (percentage >= 90) return "สูงมาก";
    if (percentage >= 70) return "สูง";
    if (percentage >= 50) return "ปานกลาง";
    return "ต่ำ";
  };

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: type.bgColor,
        borderColor: type.color,
        height: "100%",
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{
                bgcolor: `${type.color}20`,
                color: type.color,
                width: 40,
                height: 40,
                mr: 1,
              }}
            >
              <ProductionTypeIcon type={type.key} size={20} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold" color={type.color}>
              {type.label}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={
              utilization > 100 ? `${utilization}% (เกิน ${utilization - 100}%)` : `${utilization}%`
            }
            sx={{
              bgcolor: getUtilizationColor(utilization),
              color: "white",
              fontWeight: "bold",
              fontSize: utilization > 100 ? "0.7rem" : "0.75rem",
              height: utilization > 100 ? "auto" : 24,
              "& .MuiChip-label": {
                px: utilization > 100 ? 1 : 1.5,
                py: utilization > 100 ? 0.5 : 0.5,
                whiteSpace: "nowrap",
              },
            }}
          />
        </Box>

        {/* Current Workload */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            จำนวนงาน: {formatNumber(workCalc.job_count?.[type.key] || 0)} งาน
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            งานปัจจุบัน: {formatNumber(currentWorkload)} ชิ้น
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(utilization, 100)}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: theme.palette.grey[200],
              "& .MuiLinearProgress-bar": {
                bgcolor: getUtilizationColor(utilization),
              },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            การใช้งาน: {getUtilizationLabel(utilization)}
            {utilization > 100 && (
              <span style={{ color: theme.palette.error.main, fontWeight: "bold" }}>
                {" "}
                (เกินกำลังผลิต {utilization - 100}%)
              </span>
            )}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Capacity Information */}
        <Stack spacing={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              <Speed sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
              กำลังการผลิต/วัน:
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {formatNumber(dailyCapacity)} ชิ้น
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              กำลังการผลิต{periodLabel}:
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={type.color}>
              {formatNumber(totalCapacity)} ชิ้น
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              คงเหลือ{periodLabel}:
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              color={remainingCapacity < 0 ? theme.palette.error.main : type.color}
            >
              {remainingCapacity < 0
                ? `เกิน ${formatNumber(Math.abs(remainingCapacity))} ชิ้น`
                : `${formatNumber(remainingCapacity)} ชิ้น`}
            </Typography>
          </Box>

          {periodDays > 1 && (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                จำนวนวันในช่วง:
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="text.secondary">
                {periodDays} วัน
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ProductionTypeCapacityCard;
