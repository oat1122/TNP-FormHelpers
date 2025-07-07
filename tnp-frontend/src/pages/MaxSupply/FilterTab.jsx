import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid2 as Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Typography,
  Collapse,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";

// Icons
import { 
  MdSearch, 
  MdFilterList, 
  MdExpandMore, 
  MdExpandLess,
  MdClear,
} from "react-icons/md";

// State
import { useMaxSupplyStore } from "../../features/MaxSupply/maxSupplySlice";

function FilterTab() {
  const [expanded, setExpanded] = useState(false);

  // Zustand store
  const {
    filters,
    statusList,
    priorityList,
    updateFilter,
    resetFilters,
  } = useMaxSupplyStore();

  const handleDateChange = (field, date) => {
    updateFilter('dateRange', {
      ...filters.dateRange,
      [field]: date ? moment(date).toDate() : null,
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.dateRange.startDate ||
    filters.dateRange.endDate;

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: expanded ? 2 : 1 }}>
          {/* Always visible filters */}
          <Grid container spacing={2} alignItems="center">
            <Grid xs={12} md={4}>
              <TextField
                label="ค้นหา"
                placeholder="รหัสการผลิต, ลูกค้า, สินค้า..."
                fullWidth
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdSearch />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>

            <Grid xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>สถานะ</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  label="สถานะ"
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  {statusList.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={status.label}
                          size="small"
                          color={status.color}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>ความสำคัญ</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) => updateFilter('priority', e.target.value)}
                  label="ความสำคัญ"
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  {priorityList.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={priority.label}
                          size="small"
                          color={priority.color}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => setExpanded(!expanded)}
                  startIcon={<MdFilterList />}
                  endIcon={expanded ? <MdExpandLess /> : <MdExpandMore />}
                  size="small"
                  fullWidth
                >
                  เพิ่มเติม
                </Button>
                
                {hasActiveFilters && (
                  <IconButton
                    onClick={resetFilters}
                    size="small"
                    color="error"
                    title="ล้างตัวกรอง"
                  >
                    <MdClear />
                  </IconButton>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Expandable filters */}
          <Collapse in={expanded}>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                กรองตามช่วงวันที่
              </Typography>
              
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <DatePicker
                    label="วันที่เริ่มต้น"
                    value={filters.dateRange.startDate ? moment(filters.dateRange.startDate) : null}
                    onChange={(date) => handleDateChange('startDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </Grid>

                <Grid xs={12} md={6}>
                  <DatePicker
                    label="วันที่สิ้นสุด"
                    value={filters.dateRange.endDate ? moment(filters.dateRange.endDate) : null}
                    onChange={(date) => handleDateChange('endDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* Quick date filters */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  ช่วงวันที่ที่ใช้บ่อย
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const today = moment();
                      handleDateChange('startDate', today);
                      handleDateChange('endDate', today);
                    }}
                  >
                    วันนี้
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const startOfWeek = moment().startOf('week');
                      const endOfWeek = moment().endOf('week');
                      handleDateChange('startDate', startOfWeek);
                      handleDateChange('endDate', endOfWeek);
                    }}
                  >
                    สัปดาห์นี้
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const startOfMonth = moment().startOf('month');
                      const endOfMonth = moment().endOf('month');
                      handleDateChange('startDate', startOfMonth);
                      handleDateChange('endDate', endOfMonth);
                    }}
                  >
                    เดือนนี้
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const startOfYear = moment().startOf('year');
                      const endOfYear = moment().endOf('year');
                      handleDateChange('startDate', startOfYear);
                      handleDateChange('endDate', endOfYear);
                    }}
                  >
                    ปีนี้
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => {
                      handleDateChange('startDate', null);
                      handleDateChange('endDate', null);
                    }}
                  >
                    ล้างวันที่
                  </Button>
                </Box>
              </Box>
            </Box>
          </Collapse>

          {/* Active filters display */}
          {hasActiveFilters && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                ตัวกรองที่ใช้งาน:
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {filters.search && (
                  <Chip
                    label={`ค้นหา: "${filters.search}"`}
                    onDelete={() => updateFilter('search', '')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                
                {filters.status !== 'all' && (
                  <Chip
                    label={`สถานะ: ${statusList.find(s => s.value === filters.status)?.label}`}
                    onDelete={() => updateFilter('status', 'all')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                
                {filters.priority !== 'all' && (
                  <Chip
                    label={`ความสำคัญ: ${priorityList.find(p => p.value === filters.priority)?.label}`}
                    onDelete={() => updateFilter('priority', 'all')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                
                {filters.dateRange.startDate && (
                  <Chip
                    label={`เริ่ม: ${moment(filters.dateRange.startDate).format('DD/MM/YYYY')}`}
                    onDelete={() => handleDateChange('startDate', null)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                
                {filters.dateRange.endDate && (
                  <Chip
                    label={`สิ้นสุด: ${moment(filters.dateRange.endDate).format('DD/MM/YYYY')}`}
                    onDelete={() => handleDateChange('endDate', null)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
}

export default FilterTab;
