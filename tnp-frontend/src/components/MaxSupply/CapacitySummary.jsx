import React from 'react';
import {
  Box,
  Typography,
  Grid,
} from '@mui/material';
import {
  Assessment,
} from '@mui/icons-material';

const CapacitySummary = ({ workCalc, timePeriod = 'today', periodLabel = 'วันนี้' }) => {
  const formatNumber = (number) => {
    return new Intl.NumberFormat('th-TH').format(number);
  };

  const totalJobs = Object.values(workCalc.job_count || {}).reduce((sum, val) => sum + val, 0);
  const totalWorkload = Object.values(workCalc.current_workload).reduce((sum, val) => sum + val, 0);
  const totalCapacity = Object.values(workCalc.capacity?.total || workCalc.capacity?.daily || {}).reduce((sum, val) => sum + val, 0);
  const totalDailyCapacity = Object.values(workCalc.capacity?.daily || {}).reduce((sum, val) => sum + val, 0);
  const averageUtilization = totalCapacity > 0 ? Math.round((totalWorkload / totalCapacity) * 100) : 0;

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        <Assessment sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
        สรุปภาพรวม
      </Typography>
      <Grid container spacing={1}>
        <Grid item xs={3}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold" color="primary">
              {formatNumber(totalJobs)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              จำนวนงาน
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold" color="secondary">
              {formatNumber(totalWorkload)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              งานทั้งหมด (ชิ้น)
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {formatNumber(totalCapacity)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              กำลังการผลิต{periodLabel}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold" color="info.main">
              {averageUtilization}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              การใช้งานเฉลี่ย
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CapacitySummary; 