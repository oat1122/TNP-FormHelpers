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
import { format, isWithinInterval, parseISO, addDays, startOfToday } from 'date-fns';

const DeadlineSection = ({ jobs = [], getUpcomingDeadlines, loading, daysAhead = 7, maxItems = 3, onClearAll }) => {
  const today = startOfToday();
  const weekAhead = addDays(today, daysAhead);

  // Primary filtering: use jobs array if provided, otherwise fallback to getUpcomingDeadlines
  const primaryData = jobs.length > 0 ? jobs : (getUpcomingDeadlines ? getUpcomingDeadlines(daysAhead) : []);

  // Filter using expected_completion_date instead of due_date
  const defaultFilter = (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter((job) => {
      // Use expected_completion_date, fallback to due_date
      const targetDate = job.expected_completion_date || job.due_date;
      if (!targetDate) return false;
      try {
        const expectedDate = typeof targetDate === 'string' 
          ? parseISO(targetDate) 
          : new Date(targetDate);
        return isWithinInterval(expectedDate, { start: today, end: weekAhead });
      } catch (error) {
        console.warn('Invalid date format:', targetDate);
        return false;
      }
    });
  };

  const filteredDeadlines = defaultFilter(primaryData);
  
  // Sort by expected_completion_date (earliest first) and priority
  const upcomingDeadlines = filteredDeadlines.sort((a, b) => {
    // First sort by expected_completion_date (with fallback to due_date)
    const dateA = typeof (a.expected_completion_date || a.due_date) === 'string' 
      ? parseISO(a.expected_completion_date || a.due_date) 
      : new Date(a.expected_completion_date || a.due_date);
    const dateB = typeof (b.expected_completion_date || b.due_date) === 'string' 
      ? parseISO(b.expected_completion_date || b.due_date) 
      : new Date(b.expected_completion_date || b.due_date);
    const dateDiff = dateA - dateB;
    
    if (dateDiff !== 0) return dateDiff;
    
    // If dates are equal, sort by priority
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });

  // Debug logging (remove in production)
  console.log('DeadlineSection - Primary data:', primaryData);
  console.log('DeadlineSection - Filtered deadlines:', upcomingDeadlines);
  console.log('DeadlineSection - Today:', today);
  console.log('DeadlineSection - Week ahead:', weekAhead);
  
  return (
    <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Schedule color="primary" />
        Deadline
      </Typography>
      <Button 
        variant="text" 
        size="small" 
        sx={{ color: 'text.secondary', mb: 2 }}
        onClick={onClearAll}
        disabled={!onClearAll || upcomingDeadlines.length === 0}
      >
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
          upcomingDeadlines.slice(0, maxItems).map((item, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon>
                <Circle
                  sx={{
                    fontSize: '0.8rem',
                    color:
                      item.priority === 'urgent'
                        ? 'error.main'
                        : item.priority === 'high'
                        ? 'warning.main'
                        : '#0ea5e9',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={item.title || item.customer_name || 'งานไม่ระบุชื่อ'}
                secondary={
                  (item.expected_completion_date || item.due_date)
                    ? (() => {
                        try {
                          const targetDate = typeof (item.expected_completion_date || item.due_date) === 'string' 
                            ? parseISO(item.expected_completion_date || item.due_date) 
                            : new Date(item.expected_completion_date || item.due_date);
                          return format(targetDate, 'dd/MM/yyyy');
                        } catch (error) {
                          return 'วันที่ไม่ถูกต้อง';
                        }
                      })()
                    : 'ไม่ระบุวันที่คาดว่าเสร็จ'
                }
              />
            </ListItem>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            ไม่มีงานที่คาดว่าจะเสร็จใน {daysAhead} วันข้างหน้า
          </Typography>
        )}
      </List>
    </Paper>
  );
};

export default DeadlineSection; 