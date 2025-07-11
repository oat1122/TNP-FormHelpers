import React from 'react';
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
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  Schedule,
  CheckCircle,
  PendingActions,
  PlayArrow,
} from '@mui/icons-material';

const StatisticsCards = ({ statistics, loading }) => {
  const productionTypeData = [
    {
      key: 'screen',
      label: 'Screen Printing',
      icon: '📺',
      color: '#8B5CF6',
      count: statistics.by_production_type?.screen || 0,
    },
    {
      key: 'dtf',
      label: 'DTF',
      icon: '📱',
      color: '#06B6D4',
      count: statistics.by_production_type?.dtf || 0,
    },
    {
      key: 'sublimation',
      label: 'Sublimation',
      icon: '⚽',
      color: '#10B981',
      count: statistics.by_production_type?.sublimation || 0,
    },
    {
      key: 'embroidery',
      label: 'Embroidery',
      icon: '🧵',
      color: '#F59E0B',
      count: statistics.by_production_type?.embroidery || 0,
    },
  ];

  const statusData = [
    {
      key: 'total',
      label: 'Total Jobs',
      icon: <Assignment />,
      color: '#6B7280',
      count: statistics.total || 0,
    },
    {
      key: 'pending',
      label: 'Pending',
      icon: <PendingActions />,
      color: '#F59E0B',
      count: statistics.pending || 0,
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      icon: <PlayArrow />,
      color: '#3B82F6',
      count: statistics.in_progress || 0,
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: <CheckCircle />,
      color: '#10B981',
      count: statistics.completed || 0,
    },
  ];

  const StatCard = ({ title, value, icon, color, percentage }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {loading ? '-' : value}
            </Typography>
            {percentage !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    width: 60,
                    height: 4,
                    borderRadius: 2,
                    mr: 1,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: color,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {percentage.toFixed(0)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}20`,
              color: color,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const ProductionTypeCard = ({ type, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h3" sx={{ mr: 1 }}>
              {type.icon}
            </Typography>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {type.label}
              </Typography>
              <Typography variant="h5" color={type.color} fontWeight="bold">
                {loading ? '-' : count}
              </Typography>
            </Box>
          </Box>
          
          {!loading && total > 0 && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: `${type.color}20`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: type.color,
                    borderRadius: 3,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {percentage.toFixed(1)}% ของงานทั้งหมด
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
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Job Overview
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {statusData.map((item) => {
          const percentage = statistics.total > 0 ? (item.count / statistics.total) * 100 : 0;
          return (
            <Grid item xs={12} sm={6} md={3} key={item.key}>
              <StatCard
                title={item.label}
                value={item.count}
                icon={item.icon}
                color={item.color}
                percentage={item.key !== 'total' ? percentage : undefined}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Production Type Statistics */}
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Production Types
      </Typography>
      <Grid container spacing={2}>
        {productionTypeData.map((type) => (
          <Grid item xs={12} sm={6} md={3} key={type.key}>
            <ProductionTypeCard
              type={type}
              count={type.count}
              total={statistics.total}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StatisticsCards; 