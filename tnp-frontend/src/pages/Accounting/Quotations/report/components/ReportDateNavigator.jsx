import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DateRangeIcon from "@mui/icons-material/DateRange";
import EventIcon from "@mui/icons-material/Event";
import EventNoteIcon from "@mui/icons-material/EventNote";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import TodayIcon from "@mui/icons-material/Today";
import { Box, Button, IconButton, Menu, Tab, Tabs, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";

const TAB_OPTIONS = [
  { value: "today", label: "วันนี้", icon: <TodayIcon fontSize="small" /> },
  { value: "week", label: "สัปดาห์นี้", icon: <DateRangeIcon fontSize="small" /> },
  { value: "month", label: "เดือนนี้", icon: <EventIcon fontSize="small" /> },
  { value: "quarter", label: "ไตรมาสนี้", icon: <EventNoteIcon fontSize="small" /> },
  { value: "year", label: "ปีนี้", icon: <CalendarTodayIcon fontSize="small" /> },
];

const ReportDateNavigator = ({ dateFilter }) => {
  const {
    dateFilterTab,
    displayLabel,
    handleDateTabChange,
    handlePrevPeriod,
    handleNextPeriod,
    customPicker,
  } = dateFilter;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
      }}
    >
      <Tabs
        value={dateFilterTab !== "custom" ? dateFilterTab : false}
        onChange={handleDateTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: "40px", "& .MuiTab-root": { minHeight: "40px", py: 0 } }}
      >
        {TAB_OPTIONS.map((opt) => (
          <Tab
            key={opt.value}
            icon={opt.icon}
            iconPosition="start"
            label={opt.label}
            value={opt.value}
          />
        ))}
      </Tabs>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "background.paper",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            px: 1,
            height: "40px",
          }}
        >
          <IconButton size="small" onClick={handlePrevPeriod}>
            <KeyboardArrowLeftIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: 100, textAlign: "center", fontWeight: 500 }}>
            {displayLabel}
          </Typography>
          <IconButton size="small" onClick={handleNextPeriod}>
            <KeyboardArrowRightIcon fontSize="small" />
          </IconButton>
        </Box>

        <Button
          variant={dateFilterTab === "custom" ? "contained" : "outlined"}
          startIcon={<DateRangeIcon />}
          onClick={customPicker.open}
          sx={{ height: "40px" }}
        >
          ระบุวันที่
        </Button>

        <Menu
          anchorEl={customPicker.anchorEl}
          open={Boolean(customPicker.anchorEl)}
          onClose={customPicker.close}
          PaperProps={{ sx: { p: 2, borderRadius: 2, mt: 1 } }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold" }}>
            กำหนดช่วงเวลา
          </Typography>
          <Box display="flex" gap={2} mb={2}>
            <DatePicker
              label="วันที่เริ่มต้น"
              value={customPicker.tempStart}
              onChange={(value) => customPicker.setTempStart(value)}
              slotProps={{ textField: { size: "small" } }}
            />
            <DatePicker
              label="วันที่สิ้นสุด"
              value={customPicker.tempEnd}
              minDate={customPicker.tempStart}
              onChange={(value) => customPicker.setTempEnd(value)}
              slotProps={{ textField: { size: "small" } }}
            />
          </Box>
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button onClick={customPicker.close} size="small">
              ยกเลิก
            </Button>
            <Button onClick={customPicker.apply} variant="contained" size="small">
              นำไปใช้
            </Button>
          </Box>
        </Menu>
      </Box>
    </Box>
  );
};

export default ReportDateNavigator;
