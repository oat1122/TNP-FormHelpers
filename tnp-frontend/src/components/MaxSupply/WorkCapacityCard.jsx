import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
  Chip,
  Divider,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Factory,
  TrendingUp,
  Speed,
  Assessment,
} from '@mui/icons-material';

const WorkCapacityCard = ({ statistics }) => {
  const theme = useTheme();
  
  const workCalc = statistics?.work_calculations;
  
  if (!workCalc) {
    return null;
  }

  const productionTypes = [
    { 
      key: 'dtf', 
      label: 'DTF', 
      icon: '📱', 
      color: theme.palette.info.main,
      bgColor: theme.palette.info.light + '20',
    },
    { 
      key: 'screen', 
      label: 'Screen', 
      icon: '📺', 
      color: theme.palette.primary.main,
      bgColor: theme.palette.primary.light + '20',
    },
    { 
      key: 'sublimation', 
      label: 'Sublimation', 
      icon: '⚽', 
      color: theme.palette.success.main,
      bgColor: theme.palette.success.light + '20',
    },
    { 
      key: 'embroidery', 
      label: 'Embroidery', 
      icon: '🧵', 
      color: theme.palette.warning.main,
      bgColor: theme.palette.warning.light + '20',
    },
  ];

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
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Factory sx={{ color: theme.palette.primary.main, mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            กำลังการผลิตและการใช้งาน
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {productionTypes.map((type) => {
            const currentWorkload = workCalc.current_workload[type.key] || 0;
            const dailyCapacity = workCalc.capacity.daily[type.key] || 0;
            const weeklyCapacity = workCalc.capacity.weekly[type.key] || 0;
            const monthlyCapacity = workCalc.capacity.monthly[type.key] || 0;
            const utilization = workCalc.utilization[type.key] || 0;
            const dailyRemaining = workCalc.remaining_capacity.daily[type.key] || 0;
            const weeklyRemaining = workCalc.remaining_capacity.weekly[type.key] || 0;
            const monthlyRemaining = workCalc.remaining_capacity.monthly[type.key] || 0;

            return (
              <Grid item xs={12} md={6} key={type.key}>
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
              </Grid>
            );
          })}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Debug Information (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Debug Info (Development Only):
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Raw work_calculations data: {JSON.stringify(workCalc, null, 2)}
            </Typography>
          </Box>
        )}

        {/* Summary */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            <Assessment sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
            สรุปภาพรวม
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatNumber(
                    Object.values(workCalc.job_count || {}).reduce((sum, val) => sum + val, 0)
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  จำนวนงาน
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight="bold" color="secondary">
                  {formatNumber(
                    Object.values(workCalc.current_workload).reduce((sum, val) => sum + val, 0)
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  งานทั้งหมด (ชิ้น)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {formatNumber(
                    Object.values(workCalc.capacity.daily).reduce((sum, val) => sum + val, 0)
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  กำลังการผลิต/วัน
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight="bold" color="info.main">
                  {Math.round(
                    (Object.values(workCalc.current_workload).reduce((sum, val) => sum + val, 0) /
                     Object.values(workCalc.capacity.daily).reduce((sum, val) => sum + val, 0)) * 100
                  )}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  การใช้งานเฉลี่ย
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WorkCapacityCard;