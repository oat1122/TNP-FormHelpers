import {
  Box,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MdOutlineSearch, MdOutlineTableRows, MdOutlineViewAgenda } from "react-icons/md";

import PeriodTabs from "../../Telesales/sections/PeriodTabs";
import {
  NOTEBOOK_ACTION_OPTIONS,
  NOTEBOOK_ENTRY_TYPE_OPTIONS,
  NOTEBOOK_STATUS_OPTIONS,
} from "../utils/notebookDialogConfig";

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
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Filter งานขาย
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ค้นหารายการที่ต้องติดตามต่อและสลับมุมมองให้เหมาะกับงานที่กำลังทำ
              </Typography>
            </Box>

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
          </Stack>

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
        </Stack>
      </Box>

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
    </Paper>
  );
};

export default NotebookFilterSection;
