import React from 'react';
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
} from '@mui/material';
import {
  Speed,
} from '@mui/icons-material';

const ProductionTypeCapacityCard = ({ type, workCalc }) => {
  const theme = useTheme();
  
  const currentWorkload = workCalc.current_workload[type.key] || 0;
  const dailyCapacity = workCalc.capacity.daily[type.key] || 0;
  const utilization = workCalc.utilization[type.key] || 0;
  const dailyRemaining = workCalc.remaining_capacity.daily[type.key] || 0;
  const weeklyRemaining = workCalc.remaining_capacity.weekly[type.key] || 0;
  const monthlyRemaining = workCalc.remaining_capacity.monthly[type.key] || 0;

  const formatNumber = (number) => {
    return new Intl.NumberFormat('th-TH').format(number);
  };

  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return theme.palette.error.main;
    if (percentage >= 70) return theme.palette.warning.main;
    if (percentage >= 50) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const getUtilizationLabel = (percentage) => {
    if (percentage >= 90) return 'สูงมาก';
    if (percentage >= 70) return 'สูง';
    if (percentage >= 50) return 'ปานกลาง';
    return 'ต่ำ';
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        bgcolor: type.bgColor,
        borderColor: type.color,
        height: '100%',
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center">
            <Typography variant="h6" sx={{ mr: 1 }}>
              {type.icon}
            </Typography>
            <Typography variant="h6" fontWeight="bold" color={type.color}>
              {type.label}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${utilization}%`}
            sx={{
              bgcolor: getUtilizationColor(utilization),
              color: 'white',
              fontWeight: 'bold',
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
              '& .MuiLinearProgress-bar': {
                bgcolor: getUtilizationColor(utilization),
              },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            การใช้งาน: {getUtilizationLabel(utilization)}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Capacity Information */}
        <Stack spacing={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              <Speed sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              กำลังการผลิต/วัน:
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {formatNumber(dailyCapacity)} งาน
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              คงเหลือ/วัน:
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={type.color}>
              {formatNumber(dailyRemaining)} งาน
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              คงเหลือ/สัปดาห์:
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={type.color}>
              {formatNumber(weeklyRemaining)} งาน
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              คงเหลือ/เดือน:
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={type.color}>
              {formatNumber(monthlyRemaining)} งาน
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ProductionTypeCapacityCard; 