import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import {
  Box,
  TextField,
  MenuItem,
  IconButton,
  InputAdornment,
  Collapse,
  Chip,
  Tooltip,
  Stack,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { th } from "date-fns/locale";
import { useState } from "react";

/**
 * Compact, single-strip advanced filter bar.
 *
 * The search box and action buttons are always visible in a slim toolbar.
 * Status selects and date pickers are revealed in a collapsible "extra" row
 * that the user toggles via a filter icon.  Active filters show as count badge.
 */
const AdvancedFilter = ({
  filters,
  handlers,
  statusOptions = [],
  statusBeforeOptions = [],
  statusAfterOptions = [],
  showAllStatusOption = true,
}) => {
  const showStatusBefore = statusBeforeOptions.length > 0;
  const showStatusAfter = statusAfterOptions.length > 0;

  const [open, setOpen] = useState(false);

  // Count how many filters are actively set (for badge)
  const activeCount = [
    filters.status !== "all" && statusOptions.length > 0,
    filters.statusBefore !== "all" && showStatusBefore,
    filters.statusAfter !== "all" && showStatusAfter,
    filters.dateRange[0] != null,
    filters.dateRange[1] != null,
  ].filter(Boolean).length;

  const handleClear = () => {
    handlers.resetFilters();
    setOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
      <Box
        sx={{
          mb: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        {/* ─── Main bar ─── */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 1 }}>
          {/* Search */}
          <TextField
            size="small"
            variant="outlined"
            placeholder="ค้นหา..."
            value={filters.searchQuery}
            onChange={handlers.handleSearchChange}
            sx={{
              flex: 1,
              maxWidth: 360,
              "& .MuiOutlinedInput-root": { height: 36, fontSize: "0.85rem" },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "action.active" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Active filter chips (quick glance when collapsed) */}
          {!open && activeCount > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ overflow: "hidden", flexShrink: 1 }}>
              {filters.status !== "all" && statusOptions.length > 0 && (
                <Chip
                  size="small"
                  label={
                    statusOptions.find((o) => o.value === filters.status)?.label || filters.status
                  }
                  onDelete={() => handlers.handleStatusChange({ target: { value: "all" } })}
                  sx={{ height: 24, fontSize: "0.72rem" }}
                />
              )}
              {filters.statusBefore !== "all" && showStatusBefore && (
                <Chip
                  size="small"
                  label={`ก่อน: ${statusBeforeOptions.find((o) => o.value === filters.statusBefore)?.label || filters.statusBefore}`}
                  onDelete={() => handlers.handleStatusBeforeChange({ target: { value: "all" } })}
                  sx={{ height: 24, fontSize: "0.72rem" }}
                />
              )}
              {filters.statusAfter !== "all" && showStatusAfter && (
                <Chip
                  size="small"
                  label={`หลัง: ${statusAfterOptions.find((o) => o.value === filters.statusAfter)?.label || filters.statusAfter}`}
                  onDelete={() => handlers.handleStatusAfterChange({ target: { value: "all" } })}
                  sx={{ height: 24, fontSize: "0.72rem" }}
                />
              )}
              {(filters.dateRange[0] || filters.dateRange[1]) && (
                <Chip
                  size="small"
                  icon={<CalendarIcon sx={{ fontSize: 14 }} />}
                  label="วันที่"
                  onDelete={() => handlers.handleDateRangeChange([null, null])}
                  sx={{ height: 24, fontSize: "0.72rem" }}
                />
              )}
            </Stack>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Action buttons */}
          {activeCount > 0 && (
            <Tooltip title="ล้างตัวกรอง">
              <IconButton
                size="small"
                onClick={handleClear}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: "action.hover",
                  "&:hover": { bgcolor: "error.light", color: "#fff" },
                }}
              >
                <ClearIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={open ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}>
            <IconButton
              size="small"
              onClick={() => setOpen((v) => !v)}
              sx={{
                bgcolor: open ? "primary.main" : "action.hover",
                color: open ? "#fff" : "text.secondary",
                borderRadius: 1.5,
                width: 36,
                height: 36,
                "&:hover": { bgcolor: open ? "primary.dark" : "action.selected" },
                position: "relative",
              }}
            >
              <FilterListIcon sx={{ fontSize: 18 }} />
              {activeCount > 0 && !open && (
                <Box
                  sx={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    bgcolor: "error.main",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 16,
                    height: 16,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {activeCount}
                </Box>
              )}
            </IconButton>
          </Tooltip>
        </Stack>

        {/* ─── Collapsible extra filters ─── */}
        <Collapse in={open}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{
              px: 1.5,
              pb: 1.5,
              pt: 0.5,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            {/* Status Before */}
            {showStatusBefore && (
              <TextField
                select
                size="small"
                label="สถานะ (ก่อนมัดจำ)"
                value={filters.statusBefore}
                onChange={handlers.handleStatusBeforeChange}
                sx={{
                  minWidth: 160,
                  "& .MuiOutlinedInput-root": { height: 36, fontSize: "0.83rem" },
                }}
              >
                <MenuItem value="all">
                  <em>ทั้งหมด</em>
                </MenuItem>
                {statusBeforeOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Status After */}
            {showStatusAfter && (
              <TextField
                select
                size="small"
                label="สถานะ (หลังมัดจำ)"
                value={filters.statusAfter}
                onChange={handlers.handleStatusAfterChange}
                sx={{
                  minWidth: 160,
                  "& .MuiOutlinedInput-root": { height: 36, fontSize: "0.83rem" },
                }}
              >
                <MenuItem value="all">
                  <em>ทั้งหมด</em>
                </MenuItem>
                {statusAfterOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Main Status */}
            {statusOptions.length > 0 && (
              <TextField
                select
                size="small"
                label="สถานะ"
                value={filters.status}
                onChange={handlers.handleStatusChange}
                sx={{
                  minWidth: 140,
                  "& .MuiOutlinedInput-root": { height: 36, fontSize: "0.83rem" },
                }}
              >
                {showAllStatusOption && (
                  <MenuItem value="all">
                    <em>ทุกสถานะ</em>
                  </MenuItem>
                )}
                {statusOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Date range */}
            <DatePicker
              label="ตั้งแต่"
              value={filters.dateRange[0]}
              onChange={(v) => handlers.handleDateRangeChange([v, filters.dateRange[1]])}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    width: 150,
                    "& .MuiOutlinedInput-root": { height: 36, fontSize: "0.83rem" },
                  },
                },
              }}
            />
            <Box sx={{ color: "text.disabled", fontSize: "0.8rem", userSelect: "none" }}>—</Box>
            <DatePicker
              label="ถึง"
              value={filters.dateRange[1]}
              onChange={(v) => handlers.handleDateRangeChange([filters.dateRange[0], v])}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    width: 150,
                    "& .MuiOutlinedInput-root": { height: 36, fontSize: "0.83rem" },
                  },
                },
              }}
            />
          </Stack>
        </Collapse>
      </Box>
    </LocalizationProvider>
  );
};

export default AdvancedFilter;
