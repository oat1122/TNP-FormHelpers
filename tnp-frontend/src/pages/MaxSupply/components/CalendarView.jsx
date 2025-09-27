import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CalendarMonth as CalendarIcon,
  TipsAndUpdates as TipsIcon,
} from "@mui/icons-material";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import React, { useState, useEffect } from "react";

// Import extracted components
import { ProductionTypeLegend, DayEventsDialog, JobDetailsDialog, CalendarGrid } from "./Calendar";

// Import hooks and utilities
import { useCalendarEvents } from "../hooks";
import { productionTypeConfig, formatShortDate } from "../utils";

const EnhancedCalendarView = ({
  currentDate = new Date(),
  navigateMonth = () => {},
  maxSupplies = [],
  statistics = {},
  onJobUpdate = () => {},
  onJobDelete = () => {},
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Job menu state
  const [jobMenuAnchor, setJobMenuAnchor] = useState(null);
  const [jobMenuData, setJobMenuData] = useState(null);
  const [viewMode, setViewMode] = useState("month"); // 'month' or 'week'

  // Use calendar events hook
  const {
    filter,
    setFilter,
    selectedJob,
    selectedDate,
    dayEventsDialogOpen,
    hoveredTimeline,
    setHoveredTimeline,
    calendarDays,
    filteredEvents,
    eventRows,
    overflowTimelines,
    totalTimelines,
    handleDayClick,
    handleDayEventsDialogClose,
    handleTimelineClick,
    handleJobSelect,
    handleJobClose,
    getEventsByDate,
  } = useCalendarEvents(currentDate, maxSupplies);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            navigateMonth?.("prev");
            break;
          case "ArrowRight":
            e.preventDefault();
            navigateMonth?.("next");
            break;
          case "Home":
            e.preventDefault();
            navigateMonth?.("today");
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigateMonth]);

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
    handleJobSelect(jobMenuData);
    handleJobMenuClose();
  };

  const handleJobEdit = () => {
    console.log("Edit job:", jobMenuData);
    onJobUpdate?.();
    handleJobMenuClose();
  };

  const handleJobDelete = () => {
    if (window.confirm("คุณต้องการลบงานนี้หรือไม่?")) {
      onJobDelete(jobMenuData.id);
    }
    handleJobMenuClose();
  };

  // Go to today
  const handleGoToToday = () => {
    navigateMonth?.("today");
  };

  return (
    <Box>
      {/* Enhanced Calendar Header */}
      <Paper
        elevation={2}
        sx={{
          p: isMobile ? 2 : 3,
          mb: 2,
          background: "linear-gradient(135deg, #B20000 0%, #900F0F 100%)", // ใช้สีหลักของระบบ
          color: "white",
          borderRadius: 2,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexDirection={isMobile ? "column" : "row"}
          gap={isMobile ? 2 : 0}
        >
          <Box sx={{ textAlign: isMobile ? "center" : "left" }}>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              fontWeight="bold"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                justifyContent: isMobile ? "center" : "flex-start",
              }}
            >
              <CalendarIcon sx={{ fontSize: "inherit" }} />
              {format(currentDate, "MMMM yyyy", { locale: th })}
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.9, mt: 0.5, fontSize: isMobile ? "0.8rem" : "0.875rem" }}
            >
              แผนผังการผลิต • งานทั้งหมด {maxSupplies.length} รายการ
              {filteredEvents.length !== maxSupplies.length &&
                ` (แสดง ${filteredEvents.length} งาน)`}
            </Typography>
            {!isMobile && (
              <Typography
                variant="caption"
                sx={{ opacity: 0.7, mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <TipsIcon sx={{ fontSize: "14px" }} />
                ใช้ Ctrl+← → เพื่อเปลี่ยนเดือน, Ctrl+Home เพื่อไปวันนี้
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            {!isMobile && (
              <Box
                sx={{ display: "flex", bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1, p: 0.5 }}
              >
                <Button
                  size="small"
                  variant={viewMode === "month" ? "contained" : "text"}
                  onClick={() => setViewMode("month")}
                  sx={{
                    color: "white",
                    bgcolor: viewMode === "month" ? "rgba(255,255,255,0.2)" : "transparent",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  เดือน
                </Button>
                <Button
                  size="small"
                  variant={viewMode === "week" ? "contained" : "text"}
                  onClick={() => setViewMode("week")}
                  sx={{
                    color: "white",
                    bgcolor: viewMode === "week" ? "rgba(255,255,255,0.2)" : "transparent",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  สัปดาห์
                </Button>
              </Box>
            )}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <IconButton onClick={() => navigateMonth("prev")} sx={{ color: "white" }}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton onClick={handleGoToToday} sx={{ color: "white" }}>
                <TodayIcon />
              </IconButton>
              <IconButton onClick={() => navigateMonth("next")} sx={{ color: "white" }}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Production Type Legend */}
      <ProductionTypeLegend
        maxSupplies={maxSupplies}
        filteredEvents={filteredEvents}
        filter={filter}
        setFilter={setFilter}
      />

      {/* Calendar Grid */}
      <CalendarGrid
        calendarDays={calendarDays}
        currentDate={currentDate}
        eventRows={eventRows}
        overflowTimelines={overflowTimelines}
        totalTimelines={totalTimelines}
        filteredEvents={filteredEvents}
        loading={loading}
        hoveredTimeline={hoveredTimeline}
        setHoveredTimeline={setHoveredTimeline}
        onDayClick={handleDayClick}
        onTimelineClick={handleTimelineClick}
      />

      {/* Job Details Dialog */}
      <JobDetailsDialog
        open={Boolean(selectedJob)}
        onClose={handleJobClose}
        selectedJob={selectedJob}
        onJobEdit={onJobUpdate}
        onJobDelete={onJobDelete}
      />

      {/* Day Events Dialog */}
      <DayEventsDialog
        open={dayEventsDialogOpen}
        onClose={handleDayEventsDialogClose}
        selectedDate={selectedDate}
        dayEvents={selectedDate ? getEventsByDate(selectedDate) : []}
        onEventClick={handleJobSelect}
      />

      {/* Context Menu */}
      <Menu
        anchorEl={jobMenuAnchor}
        open={Boolean(jobMenuAnchor)}
        onClose={handleJobMenuClose}
        PaperProps={{ sx: { minWidth: 200 } }}
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
        <MenuItem onClick={handleJobDelete} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>ลบ</ListItemText>
        </MenuItem>
      </Menu>

      {/* Enhanced Tooltip for hovered timeline */}
      {hoveredTimeline && !isMobile && (
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "rgba(0,0,0,0.8)",
            color: "white",
            p: 2,
            borderRadius: 2,
            boxShadow: 3,
            zIndex: 1000,
            maxWidth: 300,
            pointerEvents: "none",
          }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            {productionTypeConfig[hoveredTimeline.event.production_type]?.icon}{" "}
            {hoveredTimeline.event.title}
          </Typography>
          <Typography variant="caption" display="block">
            👤 {hoveredTimeline.event.customer_name}
          </Typography>
          <Typography variant="caption" display="block">
            📅 {formatShortDate(hoveredTimeline.event.start_date)} -{" "}
            {formatShortDate(hoveredTimeline.event.expected_completion_date)}
          </Typography>
          <Typography variant="caption" display="block">
            📦 {hoveredTimeline.event.total_quantity || 0} ตัว • {hoveredTimeline.duration} วัน
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EnhancedCalendarView;
