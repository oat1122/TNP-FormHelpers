import {
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import {
  MdExpandLess,
  MdExpandMore,
  MdOutlineFilterAlt,
  MdOutlineSearch,
  MdOutlineTableRows,
  MdOutlineViewAgenda,
  MdRestartAlt,
} from "react-icons/md";

import PeriodTabs from "../../Telesales/sections/PeriodTabs";
import {
  NOTEBOOK_ACTION_OPTIONS,
  NOTEBOOK_ENTRY_TYPE_OPTIONS,
  NOTEBOOK_STATUS_OPTIONS,
} from "../utils/notebookDialogConfig";

// Remember the user's preferred collapse state across page visits.
const COLLAPSE_STORAGE_KEY = "notebook:filter-collapsed";

const readInitialCollapsed = () => {
  try {
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const persistCollapsed = (collapsed) => {
  try {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    /* storage unavailable — ignore */
  }
};

const NotebookFilterSection = ({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
  actionFilter,
  onActionChange,
  entryTypeFilter,
  onEntryTypeChange,
  salesFilter,
  onSalesChange,
  salesOptions,
  canFilterBySales,
  periodFilter,
  onPeriodChange,
  dateFilterBy,
  onDateFilterChange,
  viewMode,
  onViewModeChange,
  isLoading,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [collapsed, setCollapsed] = useState(readInitialCollapsed);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      persistCollapsed(next);
      return next;
    });
  };

  // Tally how many filters are narrowing results so we can surface that
  // when the section is collapsed (so users know filters are active).
  const activeFilterCount =
    (searchInput ? 1 : 0) +
    (statusFilter && statusFilter !== "all" ? 1 : 0) +
    (actionFilter && actionFilter !== "all" ? 1 : 0) +
    (entryTypeFilter && entryTypeFilter !== "all" ? 1 : 0) +
    (salesFilter && salesFilter !== "all" ? 1 : 0) +
    (dateFilterBy && dateFilterBy !== "all" ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const handleClearAll = (event) => {
    event.stopPropagation();
    onSearchChange("");
    onStatusChange("all");
    onActionChange("all");
    onEntryTypeChange("all");
    if (canFilterBySales) {
      onSalesChange("all");
    }
    onDateFilterChange("all");
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", xl: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", xl: "center" }}
          >
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              onClick={toggleCollapsed}
              sx={{ minWidth: 0, cursor: "pointer", userSelect: "none", flex: 1 }}
            >
              <Badge
                badgeContent={hasActiveFilters ? activeFilterCount : 0}
                color="primary"
                overlap="circular"
                sx={{ "& .MuiBadge-badge": { right: 2, top: 2 } }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: hasActiveFilters ? "primary.main" : "action.hover",
                    color: hasActiveFilters ? "primary.contrastText" : "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MdOutlineFilterAlt size={20} />
                </Box>
              </Badge>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Filter งานขาย
                  {hasActiveFilters ? (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        ml: 1,
                        px: 1,
                        py: 0.25,
                        borderRadius: 999,
                        bgcolor: "rgba(25, 118, 210, 0.1)",
                        color: "primary.main",
                        fontWeight: 600,
                      }}
                    >
                      {activeFilterCount} กำลังใช้
                    </Typography>
                  ) : null}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {collapsed
                    ? "คลิกเพื่อแสดงตัวกรองและการค้นหา"
                    : "ค้นหารายการที่ต้องติดตามต่อและสลับมุมมองให้เหมาะกับงานที่กำลังทำ"}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              {hasActiveFilters ? (
                <Tooltip title="ล้างตัวกรองทั้งหมด">
                  <Button
                    size="small"
                    onClick={handleClearAll}
                    startIcon={<MdRestartAlt />}
                    sx={{ textTransform: "none", borderRadius: 999 }}
                  >
                    ล้างตัวกรอง
                  </Button>
                </Tooltip>
              ) : null}

              {!isMobile ? (
                <ToggleButtonGroup
                  exclusive
                  value={viewMode}
                  onChange={(_, value) => {
                    if (value) {
                      onViewModeChange(value);
                    }
                  }}
                  size="small"
                  sx={{
                    alignSelf: { xs: "stretch", xl: "center" },
                    "& .MuiToggleButton-root": {
                      borderRadius: 999,
                      px: 2,
                      textTransform: "none",
                    },
                  }}
                >
                  <ToggleButton value="table">
                    <MdOutlineTableRows style={{ marginRight: 8 }} />
                    ตาราง
                  </ToggleButton>
                  <ToggleButton value="card">
                    <MdOutlineViewAgenda style={{ marginRight: 8 }} />
                    การ์ด
                  </ToggleButton>
                </ToggleButtonGroup>
              ) : null}

              <Tooltip title={collapsed ? "แสดงตัวกรอง" : "ซ่อนตัวกรอง"}>
                <IconButton
                  onClick={toggleCollapsed}
                  size="small"
                  aria-label={collapsed ? "แสดงตัวกรอง" : "ซ่อนตัวกรอง"}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1.5,
                    bgcolor: "background.paper",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  {collapsed ? <MdExpandMore /> : <MdExpandLess />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Collapse in={!collapsed} timeout="auto" unmountOnExit>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} flexWrap="wrap" useFlexGap>
              <TextField
                value={searchInput}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="ค้นหาลูกค้า เบอร์โทร หรือผู้ติดต่อ"
                size="small"
                sx={{ minWidth: { xs: "100%", md: 320 }, flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdOutlineSearch />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel>สถานะ</InputLabel>
                <Select
                  value={statusFilter}
                  label="สถานะ"
                  onChange={(event) => onStatusChange(event.target.value)}
                >
                  <MenuItem value="all">ทุกสถานะ</MenuItem>
                  {NOTEBOOK_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel>Next action</InputLabel>
                <Select
                  value={actionFilter}
                  label="Next action"
                  onChange={(event) => onActionChange(event.target.value)}
                >
                  <MenuItem value="all">ทุก Next action</MenuItem>
                  {NOTEBOOK_ACTION_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={entryTypeFilter}
                  label="Type"
                  onChange={(event) => onEntryTypeChange(event.target.value)}
                >
                  <MenuItem value="all">ทุกประเภท</MenuItem>
                  {NOTEBOOK_ENTRY_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {canFilterBySales ? (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Sales</InputLabel>
                  <Select
                    value={salesFilter}
                    label="Sales"
                    onChange={(event) => onSalesChange(event.target.value)}
                  >
                    <MenuItem value="all">ทุกคน</MenuItem>
                    {salesOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}
            </Stack>
          </Collapse>
        </Stack>
      </Box>

      <Collapse in={!collapsed} timeout="auto" unmountOnExit>
        <Divider />

        <Box sx={{ px: { xs: 1, md: 1.5 }, pt: 1, pb: 0.5 }}>
          <PeriodTabs
            periodFilter={periodFilter}
            onPeriodChange={onPeriodChange}
            filters={[
              {
                label: "ประเภทวันที่",
                value: dateFilterBy,
                onChange: onDateFilterChange,
                options: [
                  { value: "all", label: "สร้างหรืออัปเดต" },
                  { value: "nb_date", label: "วันติดตาม" },
                  { value: "created_at", label: "วันที่สร้าง" },
                  { value: "updated_at", label: "วันที่อัปเดต" },
                ],
              },
            ]}
            isLoading={isLoading}
          />
        </Box>
      </Collapse>
    </Paper>
  );
};

export default NotebookFilterSection;
