import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid2 as Grid,
  Tooltip,
  Badge,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";

// Icons
import { 
  MdToday, 
  MdChevronLeft, 
  MdChevronRight,
  MdFilterList,
  MdRefresh,
  MdAdd,
  MdEvent,
  MdSearch,
} from "react-icons/md";
import { BsCalendar, BsCalendar2Week, BsCalendar3 } from "react-icons/bs";

// API and State
import { useMaxSupplyCalendar } from "../../features/MaxSupply/maxSupplyApi";
import { useMaxSupplyStore } from "../../features/MaxSupply/maxSupplySlice";
import { 
  transformToCalendarEvents,
  getStatusConfig,
  getPriorityConfig,
  formatDate,
} from "../../features/MaxSupply/maxSupplyUtils";

// Components
import TitleBar from "../../components/TitleBar";

// Utils
import { open_dialog_error } from "../../utils/import_lib";

// Moment localizer for React Big Calendar
const localizer = momentLocalizer(moment);

// Custom styles for calendar
const calendarStyle = {
  height: 600,
  fontFamily: 'inherit',
};

// Custom event component
function CustomEvent({ event }) {
  const statusConfig = getStatusConfig(event.resource.status);
  const priorityConfig = getPriorityConfig(event.resource.priority);

  return (
    <Box
      sx={{
        p: 0.5,
        borderRadius: 1,
        backgroundColor: statusConfig.bgColor,
        color: statusConfig.textColor,
        border: `2px solid ${priorityConfig.bgColor}`,
        fontSize: '0.75rem',
        fontWeight: 'bold',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Typography variant="caption" noWrap sx={{ fontWeight: 'bold' }}>
        {event.resource.production_code}
      </Typography>
      <Typography variant="caption" noWrap>
        {event.resource.customer_name}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
        <Chip
          label={statusConfig.icon}
          size="small"
          sx={{ fontSize: '0.6rem', height: 16, minWidth: 16 }}
        />
        <Chip
          label={priorityConfig.icon}
          size="small"
          sx={{ fontSize: '0.6rem', height: 16, minWidth: 16 }}
        />
      </Box>
    </Box>
  );
}

// Custom toolbar
function CustomToolbar({ date, view, onNavigate, onView, label }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      {/* Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={() => onNavigate('PREV')} size="small">
          <MdChevronLeft />
        </IconButton>
        <Button
          variant="outlined"
          onClick={() => onNavigate('TODAY')}
          startIcon={<MdToday />}
          size="small"
        >
          วันนี้
        </Button>
        <IconButton onClick={() => onNavigate('NEXT')} size="small">
          <MdChevronRight />
        </IconButton>
      </Box>

      {/* Title */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        {label}
      </Typography>

      {/* View Selector */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant={view === 'month' ? 'contained' : 'outlined'}
          onClick={() => onView('month')}
          startIcon={<BsCalendar3 />}
          size="small"
          color="error"
        >
          {!isMobile && 'เดือน'}
        </Button>
        <Button
          variant={view === 'week' ? 'contained' : 'outlined'}
          onClick={() => onView('week')}
          startIcon={<BsCalendar2Week />}
          size="small"
          color="error"
        >
          {!isMobile && 'สัปดาห์'}
        </Button>
        <Button
          variant={view === 'day' ? 'contained' : 'outlined'}
          onClick={() => onView('day')}
          startIcon={<BsCalendar />}
          size="small"
          color="error"
        >
          {!isMobile && 'วัน'}
        </Button>
      </Box>
    </Box>
  );
}

function MaxSupplyCalendar() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  // Zustand store
  const {
    calendarEvents,
    filters,
    statusList,
    priorityList,
    setCalendarEvents,
    updateFilter,
  } = useMaxSupplyStore();

  // API query
  const calendarFilters = {
    start: moment(currentDate).startOf(currentView).format('YYYY-MM-DD'),
    end: moment(currentDate).endOf(currentView).format('YYYY-MM-DD'),
    status: filters.status !== 'all' ? filters.status : undefined,
    search: filters.search,
  };
  
  const { data, error, isLoading, refetch } = useMaxSupplyCalendar(calendarFilters);

  // Handle API response
  useEffect(() => {
    if (data?.success) {
      const events = transformToCalendarEvents(data.data);
      setCalendarEvents(events);
    } else if (error) {
      console.error("Calendar API Error:", error);
    }
  }, [data, error, setCalendarEvents]);

  // Event handlers
  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }) => {
    // Navigate to create form with pre-filled dates
    const searchParams = new URLSearchParams({
      start_date: moment(start).format('YYYY-MM-DD'),
      end_date: moment(end).format('YYYY-MM-DD'),
    });
    navigate(`/max-supply/create?${searchParams.toString()}`);
  }, [navigate]);

  const handleNavigate = useCallback((newDate) => {
    setCurrentDate(newDate);
  }, []);

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
  }, []);

  const handleEditEvent = () => {
    if (selectedEvent) {
      navigate(`/max-supply/edit/${selectedEvent.resource.id}`);
    }
    setEventDialogOpen(false);
  };

  const handleViewEvent = () => {
    if (selectedEvent) {
      navigate(`/max-supply/view/${selectedEvent.resource.id}`);
    }
    setEventDialogOpen(false);
  };

  // Event style getter
  const eventStyleGetter = useCallback((event) => {
    const statusConfig = getStatusConfig(event.resource.status);
    const priorityConfig = getPriorityConfig(event.resource.priority);

    return {
      style: {
        backgroundColor: statusConfig.bgColor,
        borderColor: priorityConfig.bgColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        color: statusConfig.textColor,
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
      }
    };
  }, []);

  // Filtered events based on current filters
  const filteredEvents = useMemo(() => {
    let filtered = [...calendarEvents];

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(event => event.resource.status === filters.status);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.resource.production_code.toLowerCase().includes(searchTerm) ||
        event.resource.customer_name.toLowerCase().includes(searchTerm) ||
        event.resource.product_name.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [calendarEvents, filters]);

  // Statistics
  const stats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const statusCounts = filteredEvents.reduce((acc, event) => {
      const status = event.resource.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return { totalEvents, statusCounts };
  }, [filteredEvents]);

  return (
    <Box>
      <TitleBar title="ปฏิทินงานผลิต Max Supply" />
      
      <Box sx={{ p: 3 }}>
        {/* Header Actions */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => navigate('/max-supply/create')}
                  startIcon={<MdAdd />}
                >
                  เพิ่มงานใหม่
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => setFilterDialogOpen(true)}
                  startIcon={<MdFilterList />}
                >
                  ตัวกรอง
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => refetch()}
                  startIcon={<MdRefresh />}
                >
                  รีเฟรช
                </Button>
              </Box>
            </Grid>

            <Grid xs={12} md={6}>
              {/* Statistics */}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Chip
                  label={`ทั้งหมด ${stats.totalEvents}`}
                  color="default"
                  variant="outlined"
                />
                {statusList.map(status => (
                  <Chip
                    key={status.value}
                    label={`${status.label} ${stats.statusCounts[status.value] || 0}`}
                    color={status.color}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Calendar */}
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              style={calendarStyle}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              popup
              onNavigate={handleNavigate}
              onView={handleViewChange}
              view={currentView}
              date={currentDate}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar,
                event: CustomEvent,
              }}
              messages={{
                next: "ถัดไป",
                previous: "ก่อนหน้า",
                today: "วันนี้",
                month: "เดือน",
                week: "สัปดาห์",
                day: "วัน",
                agenda: "ตารางงาน",
                date: "วันที่",
                time: "เวลา",
                event: "งาน",
                noEventsInRange: "ไม่มีงานในช่วงวันที่นี้",
                showMore: total => `+${total} เพิ่มเติม`,
              }}
              formats={{
                monthHeaderFormat: 'MMMM YYYY',
                dayHeaderFormat: 'dddd DD/MM/YYYY',
                dayRangeHeaderFormat: ({ start, end }) => 
                  `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM/YYYY')}`,
              }}
            />
          </CardContent>
        </Card>

        {/* Event Detail Dialog */}
        <Dialog
          open={eventDialogOpen}
          onClose={() => setEventDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedEvent && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MdEvent />
                  <Typography variant="h6">
                    {selectedEvent.resource.production_code}
                  </Typography>
                  <Chip
                    label={getStatusConfig(selectedEvent.resource.status).label}
                    color={getStatusConfig(selectedEvent.resource.status).color}
                    size="small"
                  />
                  <Chip
                    label={getPriorityConfig(selectedEvent.resource.priority).label}
                    color={getPriorityConfig(selectedEvent.resource.priority).color}
                    size="small"
                  />
                </Box>
              </DialogTitle>
              
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ลูกค้า
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedEvent.resource.customer_name}
                    </Typography>
                  </Grid>

                  <Grid xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      สินค้า
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedEvent.resource.product_name}
                    </Typography>
                  </Grid>

                  <Grid xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      จำนวน
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedEvent.resource.quantity?.toLocaleString()} ชิ้น
                    </Typography>
                  </Grid>

                  <Grid xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      จุดพิมพ์
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedEvent.resource.print_points?.toFixed(2)} จุด
                    </Typography>
                  </Grid>

                  <Grid xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      วันที่เริ่มต้น
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formatDate(selectedEvent.resource.start_date)}
                    </Typography>
                  </Grid>

                  <Grid xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      วันที่สิ้นสุด
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formatDate(selectedEvent.resource.end_date)}
                    </Typography>
                  </Grid>

                  {selectedEvent.resource.notes && (
                    <Grid xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        หมายเหตุ
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent.resource.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              
              <DialogActions>
                <Button onClick={() => setEventDialogOpen(false)}>
                  ปิด
                </Button>
                <Button onClick={handleViewEvent} variant="outlined">
                  ดูรายละเอียด
                </Button>
                <Button onClick={handleEditEvent} variant="contained" color="error">
                  แก้ไข
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Filter Dialog */}
        <Dialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MdFilterList />
              ตัวกรองข้อมูล
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid xs={12}>
                <TextField
                  label="ค้นหา"
                  placeholder="รหัสการผลิต, ลูกค้า, สินค้า..."
                  fullWidth
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  InputProps={{
                    startAdornment: <MdSearch style={{ marginRight: 8 }} />,
                  }}
                />
              </Grid>

              <Grid xs={12}>
                <FormControl fullWidth>
                  <InputLabel>สถานะ</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    label="สถานะ"
                  >
                    <MenuItem value="all">ทั้งหมด</MenuItem>
                    {statusList.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        <Chip
                          label={status.label}
                          size="small"
                          color={status.color}
                          sx={{ mr: 1 }}
                        />
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button 
              onClick={() => {
                updateFilter('search', '');
                updateFilter('status', 'all');
              }}
            >
              ล้างตัวกรอง
            </Button>
            <Button 
              onClick={() => setFilterDialogOpen(false)}
              variant="contained"
              color="error"
            >
              ปิด
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default MaxSupplyCalendar;
