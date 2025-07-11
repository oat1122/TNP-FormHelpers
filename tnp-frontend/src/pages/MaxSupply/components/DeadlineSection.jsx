import React from 'react';
import { 
  Paper, 
  Typography, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Skeleton 
} from '@mui/material';
import { Schedule, Circle } from '@mui/icons-material';
import { format } from 'date-fns';

const DeadlineSection = ({ getUpcomingDeadlines, loading }) => {
  const upcomingDeadlines = getUpcomingDeadlines(7);
  
  return (
    <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Schedule color="primary" />
        Deadline
      </Typography>
      <Button variant="text" size="small" sx={{ color: 'text.secondary', mb: 2 }}>
        Clear all
      </Button>
      
      <List dense>
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon>
                <Skeleton variant="circular" width={12} height={12} />
              </ListItemIcon>
              <ListItemText
                primary={<Skeleton variant="text" width="80%" />}
                secondary={<Skeleton variant="text" width="60%" />}
              />
            </ListItem>
          ))
        ) : upcomingDeadlines.length > 0 ? (
          upcomingDeadlines.slice(0, 3).map((item, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon>
                <Circle sx={{ fontSize: '0.8rem', color: '#0ea5e9' }} />
              </ListItemIcon>
              <ListItemText
                primary={item.title || 'งานไม่ระบุชื่อ'}
                secondary={item.due_date ? format(new Date(item.due_date), 'dd/MM/yyyy') : 'ไม่ระบุ'}
              />
            </ListItem>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            ไม่มีงานที่ใกล้ครบกำหนดใน 7 วันข้างหน้า
          </Typography>
        )}
      </List>
    </Paper>
  );
};

export default DeadlineSection; 