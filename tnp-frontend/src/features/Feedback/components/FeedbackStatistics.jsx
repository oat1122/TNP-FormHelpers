import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import {
  BsPieChart,
  BsBarChart,
  BsCheckCircle,
  BsXCircle,
  BsLightbulb,
  BsBug,
  BsArrowUp
} from 'react-icons/bs';
import { useGetFeedbackStatisticsQuery } from '../feedbackApi';
import EncouragingMessage from './EncouragingMessage';

const FeedbackStatistics = () => {
  const { data: stats, isLoading } = useGetFeedbackStatisticsQuery();

  const renderStatCard = (title, value, icon, color) => {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 3
          }
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            mb: 2,
            bgcolor: `${color}20`, // 20% opacity
            color: color,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'medium' }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Paper>
    );
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'medium', color: 'primary.main' }}>
          Feedback Statistics
        </Typography>
        
        <EncouragingMessage />
        
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>Loading statistics...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              {renderStatCard(
                'Total Feedback Reports',
                stats?.total || 0,
                <BsPieChart size={24} />,
                '#2196f3' // Blue
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              {renderStatCard(
                'Resolved Reports',
                stats?.resolved || 0,
                <BsCheckCircle size={24} />,
                '#4caf50' // Green
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              {renderStatCard(
                'Pending Reports',
                stats?.pending || 0,
                <BsXCircle size={24} />,
                '#ff9800' // Orange
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              {renderStatCard(
                'Bug Reports',
                stats?.categories?.bug || 0,
                <BsBug size={24} />,
                '#f44336' // Red
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              {renderStatCard(
                'Feature Requests',
                stats?.categories?.feature || 0,
                <BsLightbulb size={24} />,
                '#4caf50' // Green
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              {renderStatCard(
                'High Priority',
                stats?.priorities?.high || 0,
                <BsArrowUp size={24} />,
                '#f44336' // Red
              )}
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackStatistics;
