import React from 'react';
import { Box, Typography, Divider, Grid, Paper, useTheme } from '@mui/material';
import { getProductionTypeColor, getProductionTypeIcon } from '../../utils/maxSupplyUtils';

/**
 * Component to display statistics summary in the calendar page
 */
const StatisticsSummary = ({ statistics }) => {
  const theme = useTheme();
  
  if (!statistics) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          ไม่มีข้อมูลสถิติ
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          สรุปงานทั้งหมด
        </Typography>
        
        <Box sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 1, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            {statistics.total_jobs || 0}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            งาน
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        ตามประเภทการผลิต
      </Typography>
      
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1, 
              textAlign: 'center', 
              bgcolor: getProductionTypeColor('screen', 0.1)
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              {getProductionTypeIcon('screen', 20)}
            </Box>
            <Typography variant="h6" fontWeight="bold" color={getProductionTypeColor('screen')}>
              {statistics.by_type?.screen || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              สกรีน
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1, 
              textAlign: 'center', 
              bgcolor: getProductionTypeColor('dtf', 0.1)
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              {getProductionTypeIcon('dtf', 20)}
            </Box>
            <Typography variant="h6" fontWeight="bold" color={getProductionTypeColor('dtf')}>
              {statistics.by_type?.dtf || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              DTF
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1, 
              textAlign: 'center', 
              bgcolor: getProductionTypeColor('sublimation', 0.1)
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              {getProductionTypeIcon('sublimation', 20)}
            </Box>
            <Typography variant="h6" fontWeight="bold" color={getProductionTypeColor('sublimation')}>
              {statistics.by_type?.sublimation || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ซับลิเมชั่น
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        ตามสถานะ
      </Typography>
      
      <Box>
        {/* Pending */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                bgcolor: '#d97706', 
                borderRadius: '50%' 
              }} 
            />
            <Typography variant="body2">รอเริ่ม</Typography>
          </Box>
          <Typography variant="body2" fontWeight="bold">
            {statistics.by_status?.pending || 0}
          </Typography>
        </Box>
        
        {/* In Progress */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                bgcolor: '#2563eb', 
                borderRadius: '50%' 
              }} 
            />
            <Typography variant="body2">กำลังผลิต</Typography>
          </Box>
          <Typography variant="body2" fontWeight="bold">
            {statistics.by_status?.in_progress || 0}
          </Typography>
        </Box>
        
        {/* Completed */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                bgcolor: '#059669', 
                borderRadius: '50%' 
              }} 
            />
            <Typography variant="body2">เสร็จสิ้น</Typography>
          </Box>
          <Typography variant="body2" fontWeight="bold">
            {statistics.by_status?.completed || 0}
          </Typography>
        </Box>
        
        {/* Cancelled */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                bgcolor: '#dc2626', 
                borderRadius: '50%' 
              }} 
            />
            <Typography variant="body2">ยกเลิก</Typography>
          </Box>
          <Typography variant="body2" fontWeight="bold">
            {statistics.by_status?.cancelled || 0}
          </Typography>
        </Box>
      </Box>
      
      {statistics.weekly_trends && (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            แนวโน้มรายสัปดาห์
          </Typography>
          
          <Box sx={{ height: 150 }}>
            {/* Chart would go here - a simple implementation could be done with inline SVG */}
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              แผนภูมิแนวโน้มรายสัปดาห์
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default StatisticsSummary;
