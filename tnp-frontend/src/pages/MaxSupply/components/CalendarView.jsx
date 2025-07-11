import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarMonth as CalendarMonthIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  startOfWeek,
  endOfWeek,
  isToday,
  isSameMonth,
  getDay,
} from 'date-fns';
import { th } from 'date-fns/locale';

const CalendarView = ({
  currentDate,
  navigateMonth,
  maxSupplies = [],
  calculateEventTimeline,
  organizeEventsInRows,
  statistics,
  onJobUpdate,
  onJobDelete,
}) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobMenuAnchor, setJobMenuAnchor] = useState(null);
  const [jobMenuData, setJobMenuData] = useState(null);

  // Get calendar days for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Organize events into rows to avoid overlap
  const eventRows = organizeEventsInRows(maxSupplies, calendarDays);

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return maxSupplies.filter(job => {
      const startDate = format(new Date(job.start_date), 'yyyy-MM-dd');
      const endDate = format(new Date(job.expected_completion_date), 'yyyy-MM-dd');
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in_progress':
        return '#ff9800';
      case 'pending':
        return '#2196f3';
      case 'urgent':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'in_progress':
        return <ScheduleIcon fontSize="small" />;
      case 'pending':
        return <CalendarMonthIcon fontSize="small" />;
      case 'urgent':
        return <WarningIcon fontSize="small" />;
      default:
        return <ErrorIcon fontSize="small" />;
    }
  };

  // Handle job menu
  const handleJobMenu = (event, job) => {
    event.stopPropagation();
    setJobMenuAnchor(event.currentTarget);
    setJobMenuData(job);
  };

  const handleJobMenuClose = () => {
    setJobMenuAnchor(null);
    setJobMenuData(null);
  };

  // Handle job actions
  const handleJobView = () => {
    setSelectedJob(jobMenuData);
    handleJobMenuClose();
  };

  const handleJobEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit job:', jobMenuData);
    handleJobMenuClose();
  };

  const handleJobDelete = () => {
    if (window.confirm('คุณต้องการลบงานนี้หรือไม่?')) {
      onJobDelete(jobMenuData.id);
    }
    handleJobMenuClose();
  };

  return (
    <Box>
      {/* Calendar Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="h2">
            {format(currentDate, 'MMMM yyyy', { locale: th })}
          </Typography>
          <Box>
            <IconButton onClick={() => navigateMonth('prev')}>
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={() => navigateMonth('next')}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Calendar Grid */}
      <Paper elevation={2} sx={{ p: 2 }}>
        {/* Day Headers */}
        <Grid container>
          {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map((day) => (
            <Grid key={day} item xs={12/7} sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Days */}
        <Box sx={{ position: 'relative' }}>
          <Grid container sx={{ minHeight: '400px' }}>
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <Grid 
                  key={day.toISOString()} 
                  item 
                  xs={12/7} 
                  sx={{ 
                    border: '1px solid #e0e0e0',
                    minHeight: '80px',
                    position: 'relative',
                    backgroundColor: isTodayDate 
                      ? '#e3f2fd' 
                      : isCurrentMonth 
                        ? '#fff' 
                        : '#fafafa',
                    opacity: isCurrentMonth ? 1 : 0.6,
                  }}
                >
                  <Box sx={{ p: 1 }}>
                    <Typography 
                      variant="body2" 
                      color={isTodayDate ? 'primary.main' : 'text.primary'}
                      fontWeight={isTodayDate ? 'bold' : 'normal'}
                    >
                      {format(day, 'd')}
                    </Typography>
                    
                    {/* Day Events - only show dots for events that start on this day */}
                    {dayEvents.slice(0, 2).map((event, eventIndex) => {
                      const eventStartDate = format(new Date(event.start_date), 'yyyy-MM-dd');
                      const currentDayStr = format(day, 'yyyy-MM-dd');
                      
                      if (eventStartDate === currentDayStr) {
                        return (
                          <Chip
                            key={event.id}
                            label={event.customer_name}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              height: '20px',
                              mb: 0.5,
                              backgroundColor: getStatusColor(event.status),
                              color: 'white',
                              display: 'block',
                              '& .MuiChip-label': {
                                px: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                              },
                            }}
                          />
                        );
                      }
                      return null;
                    })}
                    
                    {dayEvents.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        +{dayEvents.length - 2} เพิ่มเติม
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {/* Timeline Events */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {eventRows.map((row, rowIndex) => (
              <Box
                key={rowIndex}
                sx={{
                  position: 'absolute',
                  top: `${80 + rowIndex * 25}px`,
                  left: 0,
                  width: '100%',
                  height: '20px',
                  zIndex: 1,
                }}
              >
                {row.map((timeline) => (
                  <Box
                    key={timeline.event.id}
                    sx={{
                      position: 'absolute',
                      left: `${(timeline.startCol / 7) * 100}%`,
                      width: `${(timeline.width / 7) * 100}%`,
                      height: '18px',
                      backgroundColor: getStatusColor(timeline.event.status),
                      borderRadius: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                    onClick={(e) => handleJobMenu(e, timeline.event)}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {timeline.event.customer_name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Job Menu */}
      <Menu
        anchorEl={jobMenuAnchor}
        open={Boolean(jobMenuAnchor)}
        onClose={handleJobMenuClose}
      >
        <MenuItem onClick={handleJobView}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>ดูรายละเอียด</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleJobEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>แก้ไข</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleJobDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>ลบ</ListItemText>
        </MenuItem>
      </Menu>

      {/* Job Details Dialog */}
      <Dialog open={Boolean(selectedJob)} onClose={() => setSelectedJob(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {selectedJob && getStatusIcon(selectedJob.status)}
            รายละเอียดงาน
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  ลูกค้า
                </Typography>
                <Typography variant="body1">
                  {selectedJob.customer_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  สถานะ
                </Typography>
                <Chip
                  label={selectedJob.status}
                  size="small"
                  sx={{
                    backgroundColor: getStatusColor(selectedJob.status),
                    color: 'white',
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  วันที่เริ่ม
                </Typography>
                <Typography variant="body1">
                  {format(new Date(selectedJob.start_date), 'dd/MM/yyyy')}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  วันที่คาดว่าจะเสร็จ
                </Typography>
                <Typography variant="body1">
                  {format(new Date(selectedJob.expected_completion_date), 'dd/MM/yyyy')}
                </Typography>
              </Grid>
              {selectedJob.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    หมายเหตุ
                  </Typography>
                  <Typography variant="body1">
                    {selectedJob.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedJob(null)}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarView;
