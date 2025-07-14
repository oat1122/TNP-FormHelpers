import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Stack,
  Badge,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  FaSearch,
  FaSync,
  FaPlus,
  FaExclamationTriangle,
  FaClock,
} from "react-icons/fa";
import {
  FilterList as FilterListIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const FilterBar = ({
  filters,
  onFilterChange,
  filterExpanded,
  onFilterExpandedChange,
  totalItems,
  maxSupplies,
  getDeadlineStatus,
  onRefresh,
  loading,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const urgentCount = maxSupplies.filter(
    (item) =>
      getDeadlineStatus(item.expected_completion_date) === "urgent" ||
      getDeadlineStatus(item.expected_completion_date) === "overdue"
  ).length;

  return (
    <Card sx={{ mb: 3, overflow: "visible" }}>
      <CardContent>
        {/* Quick Actions & Summary Row */}
        <Box sx={{ mb: 2 }}>
          {/* Header Title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: isMobile ? 2 : 0,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant={isMobile ? "h6" : "h6"}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                lineHeight: 1.2,
              }}
            >
              <AssignmentIcon color="primary" />
              รายการงานผลิต
              <Chip
                label={`${totalItems} งาน`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Typography>
            {urgentCount > 0 && (
              <Badge badgeContent={urgentCount} color="error">
                <Chip
                  label="ใกล้ครบกำหนด"
                  size="small"
                  color="error"
                  icon={<WarningIcon />}
                />
              </Badge>
            )}
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: isMobile ? "center" : "flex-end",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<FaSync />}
              onClick={onRefresh}
              disabled={loading}
              size={isMobile ? "medium" : "small"}
              sx={{
                minWidth: isMobile ? "120px" : "auto",
                flex: isMobile ? "1 1 auto" : "none",
                maxWidth: isMobile ? "150px" : "none",
              }}
            >
              รีเฟรช
            </Button>
            <Button
              variant="contained"
              startIcon={<FaPlus />}
              onClick={() => navigate("/max-supply/create")}
              size={isMobile ? "medium" : "small"}
              sx={{
                background: "linear-gradient(45deg, #B20000, #E36264)",
                "&:hover": {
                  background: "linear-gradient(45deg, #900F0F, #B20000)",
                },
                minWidth: isMobile ? "140px" : "auto",
                flex: isMobile ? "1 1 auto" : "none",
                maxWidth: isMobile ? "180px" : "none",
              }}
            >
              สร้างงานใหม่
            </Button>
          </Box>
        </Box>

        {/* Search and Quick Filters Row */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={12} md={4}>
            <TextField
              fullWidth
              placeholder="ค้นหาด้วยรหัส, ชื่องาน, หรือลูกค้า..."
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaSearch color={theme.palette.primary.main} />
                  </InputAdornment>
                ),
              }}
              size="small"
              sx={{ mb: isMobile ? 1 : 0 }}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => onFilterChange("status", e.target.value)}
                label="สถานะ"
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="pending">รอเริ่ม</MenuItem>
                <MenuItem value="in_progress">กำลังผลิต</MenuItem>
                <MenuItem value="completed">เสร็จสิ้น</MenuItem>
                <MenuItem value="cancelled">ยกเลิก</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>ประเภท</InputLabel>
              <Select
                value={filters.production_type}
                onChange={(e) =>
                  onFilterChange("production_type", e.target.value)
                }
                label="ประเภท"
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="screen">Screen</MenuItem>
                <MenuItem value="dtf">DTF</MenuItem>
                <MenuItem value="sublimation">Sublimation</MenuItem>
                <MenuItem value="embroidery">Embroidery</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={2}>
            <Button
              fullWidth
              variant={filterExpanded ? "contained" : "outlined"}
              startIcon={<FilterListIcon />}
              onClick={() => onFilterExpandedChange(!filterExpanded)}
              size="small"
              sx={{
                mt: isMobile ? 1 : 0,
                minHeight: "40px",
              }}
            >
              ตัวกรองเพิ่มเติม
            </Button>
          </Grid>
        </Grid>

        {/* Advanced Filters (Collapsible) */}
        {filterExpanded && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>ความสำคัญ</InputLabel>
                  <Select
                    value={filters.priority}
                    onChange={(e) =>
                      onFilterChange("priority", e.target.value)
                    }
                    label="ความสำคัญ"
                  >
                    <MenuItem value="all">ทั้งหมด</MenuItem>
                    <MenuItem value="low">ต่ำ</MenuItem>
                    <MenuItem value="normal">ปกติ</MenuItem>
                    <MenuItem value="high">สูง</MenuItem>
                    <MenuItem value="urgent">ด่วน</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="วันที่เริ่ม"
                  type="date"
                  value={filters.date_from}
                  onChange={(e) =>
                    onFilterChange("date_from", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="วันที่สิ้นสุด"
                  type="date"
                  value={filters.date_to}
                  onChange={(e) =>
                    onFilterChange("date_to", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button
                    variant={filters.overdue_only ? "contained" : "outlined"}
                    color="error"
                    size="small"
                    startIcon={<FaExclamationTriangle />}
                    onClick={() =>
                      onFilterChange(
                        "overdue_only",
                        !filters.overdue_only
                      )
                    }
                  >
                    เลยกำหนดเท่านั้น
                  </Button>
                  <Button
                    variant={filters.urgent_only ? "contained" : "outlined"}
                    color="warning"
                    size="small"
                    startIcon={<FaClock />}
                    onClick={() =>
                      onFilterChange("urgent_only", !filters.urgent_only)
                    }
                  >
                    ด่วนเท่านั้น
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterBar;
