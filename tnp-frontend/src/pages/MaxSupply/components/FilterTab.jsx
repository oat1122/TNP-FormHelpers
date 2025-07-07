import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
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
  Stack,
  Divider,
  FormControlLabel,
  Switch,
  Tooltip,
  Badge,
  Paper,
  Autocomplete,
  Slider,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import "moment/locale/th"; // Thai locale

// Icons
import { 
  MdSearch, 
  MdFilterList, 
  MdExpandMore, 
  MdExpandLess,
  MdClear,
  MdTune,
  MdBookmark,
  MdBookmarkBorder,
  MdHistory,
  MdToday,
  MdWarning,
  MdSpeed,
  MdPeople,
  MdInventory,
  MdNumbers,
  MdCalendarMonth,
  MdRestartAlt,
  MdRefresh,
  MdTrendingUp,
  MdAssignment,
} from "react-icons/md";

// State
import { useMaxSupplyStore } from "../../../features/MaxSupply/maxSupplySlice";

// Set moment locale to Thai
moment.locale('th');

function FilterTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [expanded, setExpanded] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [savedFiltersOpen, setSavedFiltersOpen] = useState(false);

  // Zustand store
  const {
    filters,
    statusList,
    priorityList,
    updateFilter,
    resetFilters,
    stats,
    preferences,
    setPreference,
  } = useMaxSupplyStore();

  const handleDateChange = (field, date) => {
    updateFilter('dateRange', {
      ...filters.dateRange,
      [field]: date ? moment(date).toDate() : null,
    });
  };

  const handleQuantityRangeChange = (event, newValue) => {
    updateFilter('quantityRange', {
      min: newValue[0] === 0 ? null : newValue[0],
      max: newValue[1] === 10000 ? null : newValue[1],
    });
  };

  const handlePrintPointsRangeChange = (event, newValue) => {
    updateFilter('printPointsRange', {
      min: newValue[0] === 0 ? null : newValue[0],
      max: newValue[1] === 1000 ? null : newValue[1],
    });
  };

  // Quick filter presets
  const quickFilters = [
    {
      label: 'วันนี้',
      icon: <MdToday />,
      action: () => {
        const today = moment();
        handleDateChange('startDate', today);
        handleDateChange('endDate', today);
      }
    },
    {
      label: 'เร่งด่วน',
      icon: <MdSpeed />,
      action: () => updateFilter('priority', 'urgent'),
      color: 'error'
    },
    {
      label: 'เกินกำหนด',
      icon: <MdWarning />,
      action: () => updateFilter('overdue', true),
      color: 'warning'
    },
    {
      label: 'เริ่มเร็วๆนี้',
      icon: <MdCalendarMonth />,
      action: () => updateFilter('startingSoon', true),
      color: 'info'
    },
    {
      label: 'สถานะใหม่',
      icon: <MdAssignment />,
      action: () => updateFilter('status', 'pending'),
      color: 'primary'
    },
    {
      label: 'กำลังดำเนินการ',
      icon: <MdTrendingUp />,
      action: () => updateFilter('status', 'in_progress'),
      color: 'info'
    },
  ];

  // Date range presets
  const datePresets = [
    {
      label: 'วันนี้',
      getValue: () => ({
        start: moment(),
        end: moment()
      })
    },
    {
      label: 'สัปดาห์นี้',
      getValue: () => ({
        start: moment().startOf('week'),
        end: moment().endOf('week')
      })
    },
    {
      label: 'เดือนนี้',
      getValue: () => ({
        start: moment().startOf('month'),
        end: moment().endOf('month')
      })
    },
    {
      label: 'ไตรมาสนี้',
      getValue: () => ({
        start: moment().startOf('quarter'),
        end: moment().endOf('quarter')
      })
    },
    {
      label: 'ปีนี้',
      getValue: () => ({
        start: moment().startOf('year'),
        end: moment().endOf('year')
      })
    },
    {
      label: '7 วันข้างหน้า',
      getValue: () => ({
        start: moment(),
        end: moment().add(7, 'days')
      })
    },
    {
      label: '30 วันข้างหน้า',
      getValue: () => ({
        start: moment(),
        end: moment().add(30, 'days')
      })
    },
  ];

  const hasActiveFilters = 
    filters.search ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.dateRange?.startDate ||
    filters.dateRange?.endDate ||
    filters.overdue ||
    filters.startingSoon ||
    filters.customer ||
    filters.productType ||
    filters.quantityRange?.min ||
    filters.quantityRange?.max ||
    filters.printPointsRange?.min ||
    filters.printPointsRange?.max;

  const activeFilterCount = [
    filters.search,
    filters.status !== 'all' ? filters.status : null,
    filters.priority !== 'all' ? filters.priority : null,
    filters.dateRange?.startDate,
    filters.dateRange?.endDate,
    filters.overdue,
    filters.startingSoon,
    filters.customer,
    filters.productType,
    filters.quantityRange?.min,
    filters.quantityRange?.max,
    filters.printPointsRange?.min,
    filters.printPointsRange?.max,
  ].filter(Boolean).length;

  const renderQuickStats = () => (
    <Grid container spacing={1} sx={{ mb: 2 }}>
      {[
        { label: 'ทั้งหมด', value: stats?.total || 0, color: 'default', key: 'total' },
        { label: 'รอดำเนินการ', value: stats?.pending || 0, color: 'warning', key: 'pending' },
        { label: 'กำลังทำ', value: stats?.in_progress || 0, color: 'info', key: 'in_progress' },
        { label: 'เสร็จสิ้น', value: stats?.completed || 0, color: 'success', key: 'completed' },
        { label: 'เกินกำหนด', value: stats?.overdue || 0, color: 'error', key: 'overdue' },
      ].map((stat) => (
        <Grid key={stat.label} xs={6} sm={4} md={2.4}>
          <Paper
            sx={{
              p: 1.5,
              textAlign: 'center',
              backgroundColor: stat.color === 'default' ? 'grey.100' : `${stat.color}.light`,
              color: stat.color === 'default' ? 'text.primary' : `${stat.color}.contrastText`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: 1,
              borderColor: stat.color === 'default' ? 'grey.300' : `${stat.color}.main`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                backgroundColor: stat.color === 'default' ? 'grey.200' : `${stat.color}.main`,
                color: stat.color === 'default' ? 'text.primary' : `${stat.color}.contrastText`,
              }
            }}
            onClick={() => {
              if (stat.key === 'overdue') {
                updateFilter('overdue', true);
              } else if (stat.key !== 'total') {
                updateFilter('status', stat.key);
              } else {
                resetFilters();
              }
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {stat.value.toLocaleString()}
            </Typography>
            <Typography variant="caption">
              {stat.label}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Card sx={{ mb: 3, overflow: 'visible' }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MdFilterList />
              ตัวกรองข้อมูล
              {activeFilterCount > 0 && (
                <Badge badgeContent={activeFilterCount} color="primary">
                  <Chip label="มีการกรอง" size="small" color="primary" />
                </Badge>
              )}
            </Box>
          }
          action={
            <Stack direction="row" spacing={1}>
              <Tooltip title="บันทึกตัวกรอง">
                <IconButton size="small" onClick={() => setSavedFiltersOpen(!savedFiltersOpen)}>
                  <MdBookmark />
                </IconButton>
              </Tooltip>
              <Tooltip title="รีเซ็ตตัวกรอง">
                <IconButton 
                  size="small" 
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  color="error"
                >
                  <MdRestartAlt />
                </IconButton>
              </Tooltip>
            </Stack>
          }
          sx={{ 
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '& .MuiCardHeader-action': {
              margin: 0,
            }
          }}
        />
        
        <CardContent sx={{ pb: expanded ? 2 : 1 }}>
          {/* Quick Stats */}
          {renderQuickStats()}

          {/* Quick Filters */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'bold' }}>
              ตัวกรองด่วน
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {quickFilters.map((filter, index) => (
                <Zoom in timeout={200 + index * 100} key={filter.label}>
                  <Chip
                    icon={filter.icon}
                    label={filter.label}
                    onClick={filter.action}
                    color={filter.color || 'primary'}
                    variant="outlined"
                    sx={{
                      '&:hover': {
                        backgroundColor: `${filter.color || 'primary'}.light`,
                      }
                    }}
                  />
                </Zoom>
              ))}
            </Stack>
          </Box>

          {/* Main Filters */}
          <Grid container spacing={2} alignItems="center">
            <Grid xs={12} md={4}>
              <TextField
                label="ค้นหา"
                placeholder="รหัสการผลิต, ลูกค้า, สินค้า..."
                fullWidth
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdSearch />
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>สถานะ</InputLabel>
                <Select
                  value={filters.status || 'all'}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  label="สถานะ"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">
                    <Chip label="ทั้งหมด" size="small" variant="outlined" />
                  </MenuItem>
                  {statusList?.map((status) => (
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
                  value={filters.priority || 'all'}
                  onChange={(e) => updateFilter('priority', e.target.value)}
                  label="ความสำคัญ"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">
                    <Chip label="ทั้งหมด" size="small" variant="outlined" />
                  </MenuItem>
                  {priorityList?.map((priority) => (
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
                  startIcon={<MdTune />}
                  endIcon={expanded ? <MdExpandLess /> : <MdExpandMore />}
                  size="small"
                  fullWidth
                  sx={{ 
                    borderRadius: 2,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2 }
                  }}
                >
                  เพิ่มเติม
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Expandable filters */}
          <Collapse in={expanded}>
            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'text.primary', fontWeight: 'bold' }}>
                ตัวกรองขั้นสูง
              </Typography>
              
              {/* Date Range Section */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdCalendarMonth />
                    กรองตามช่วงวันที่
                  </Typography>
                </Grid>
                
                <Grid xs={12} md={6}>
                  <DatePicker
                    label="วันที่เริ่มต้น"
                    value={filters.dateRange?.startDate ? moment(filters.dateRange.startDate) : null}
                    onChange={(date) => handleDateChange('startDate', date)}
                    format="D MMMM YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }
                      },
                    }}
                  />
                </Grid>

                <Grid xs={12} md={6}>
                  <DatePicker
                    label="วันที่สิ้นสุด"
                    value={filters.dateRange?.endDate ? moment(filters.dateRange.endDate) : null}
                    onChange={(date) => handleDateChange('endDate', date)}
                    format="D MMMM YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }
                      },
                    }}
                  />
                </Grid>

                {/* Quick date presets */}
                <Grid xs={12}>
                  <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary' }}>
                    ช่วงวันที่ที่ใช้บ่อย:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {datePresets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const { start, end } = preset.getValue();
                          handleDateChange('startDate', start);
                          handleDateChange('endDate', end);
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => {
                        handleDateChange('startDate', null);
                        handleDateChange('endDate', null);
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      ล้างวันที่
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Special Filters */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdWarning />
                    ตัวกรองพิเศษ
                  </Typography>
                </Grid>

                <Grid xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.overdue || false}
                        onChange={(e) => updateFilter('overdue', e.target.checked)}
                        color="error"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MdWarning color={theme.palette.error.main} />
                        แสดงเฉพาะงานเกินกำหนด
                        {(stats?.overdue || 0) > 0 && (
                          <Chip label={stats.overdue} size="small" color="error" />
                        )}
                      </Box>
                    }
                  />
                </Grid>

                <Grid xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.startingSoon || false}
                        onChange={(e) => updateFilter('startingSoon', e.target.checked)}
                        color="info"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MdCalendarMonth color={theme.palette.info.main} />
                        งานที่เริ่มใน 3 วันข้างหน้า
                      </Box>
                    }
                  />
                </Grid>
              </Grid>

              {/* Advanced Filters */}
              <Collapse in={advancedExpanded}>
                <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Grid container spacing={3}>
                    <Grid xs={12} md={6}>
                      <TextField
                        label="ลูกค้า"
                        placeholder="กรองตามชื่อลูกค้า"
                        fullWidth
                        value={filters.customer || ''}
                        onChange={(e) => updateFilter('customer', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MdPeople />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>

                    <Grid xs={12} md={6}>
                      <TextField
                        label="ประเภทสินค้า"
                        placeholder="กรองตามประเภทสินค้า"
                        fullWidth
                        value={filters.productType || ''}
                        onChange={(e) => updateFilter('productType', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MdInventory />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>

                    {/* Quantity Range */}
                    <Grid xs={12} md={6}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        ช่วงจำนวน (ชิ้น)
                      </Typography>
                      <Slider
                        value={[
                          filters.quantityRange?.min || 0,
                          filters.quantityRange?.max || 10000
                        ]}
                        onChange={handleQuantityRangeChange}
                        valueLabelDisplay="auto"
                        min={0}
                        max={10000}
                        step={100}
                        marks={[
                          { value: 0, label: '0' },
                          { value: 2500, label: '2.5K' },
                          { value: 5000, label: '5K' },
                          { value: 7500, label: '7.5K' },
                          { value: 10000, label: '10K+' },
                        ]}
                        sx={{ mt: 2 }}
                      />
                    </Grid>

                    {/* Print Points Range */}
                    <Grid xs={12} md={6}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        ช่วงจุดพิมพ์
                      </Typography>
                      <Slider
                        value={[
                          filters.printPointsRange?.min || 0,
                          filters.printPointsRange?.max || 1000
                        ]}
                        onChange={handlePrintPointsRangeChange}
                        valueLabelDisplay="auto"
                        min={0}
                        max={1000}
                        step={10}
                        marks={[
                          { value: 0, label: '0' },
                          { value: 250, label: '250' },
                          { value: 500, label: '500' },
                          { value: 750, label: '750' },
                          { value: 1000, label: '1000+' },
                        ]}
                        sx={{ mt: 2 }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>

              {/* Advanced Toggle */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  onClick={() => setAdvancedExpanded(!advancedExpanded)}
                  endIcon={advancedExpanded ? <MdExpandLess /> : <MdExpandMore />}
                  size="small"
                >
                  {advancedExpanded ? 'ซ่อนตัวกรองขั้นสูง' : 'แสดงตัวกรองขั้นสูง'}
                </Button>
              </Box>
            </Box>
          </Collapse>

          {/* Active filters display */}
          {hasActiveFilters && (
            <Fade in>
              <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>
                  ตัวกรองที่ใช้งาน ({activeFilterCount}):
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {filters.search && (
                    <Chip
                      label={`ค้นหา: "${filters.search}"`}
                      onDelete={() => updateFilter('search', '')}
                      size="small"
                      color="primary"
                      variant="outlined"
                      icon={<MdSearch />}
                    />
                  )}
                  
                  {filters.status !== 'all' && filters.status && (
                    <Chip
                      label={`สถานะ: ${statusList?.find(s => s.value === filters.status)?.label || filters.status}`}
                      onDelete={() => updateFilter('status', 'all')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  
                  {filters.priority !== 'all' && filters.priority && (
                    <Chip
                      label={`ความสำคัญ: ${priorityList?.find(p => p.value === filters.priority)?.label || filters.priority}`}
                      onDelete={() => updateFilter('priority', 'all')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  
                  {filters.dateRange?.startDate && (
                    <Chip
                      label={`เริ่ม: ${moment(filters.dateRange.startDate).format('D MMM YYYY')}`}
                      onDelete={() => handleDateChange('startDate', null)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  
                  {filters.dateRange?.endDate && (
                    <Chip
                      label={`สิ้นสุด: ${moment(filters.dateRange.endDate).format('D MMM YYYY')}`}
                      onDelete={() => handleDateChange('endDate', null)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}

                  {filters.overdue && (
                    <Chip
                      label="เกินกำหนด"
                      onDelete={() => updateFilter('overdue', false)}
                      size="small"
                      color="error"
                      variant="outlined"
                      icon={<MdWarning />}
                    />
                  )}

                  {filters.startingSoon && (
                    <Chip
                      label="เริ่มเร็วๆนี้"
                      onDelete={() => updateFilter('startingSoon', false)}
                      size="small"
                      color="info"
                      variant="outlined"
                      icon={<MdCalendarMonth />}
                    />
                  )}

                  {filters.customer && (
                    <Chip
                      label={`ลูกค้า: ${filters.customer}`}
                      onDelete={() => updateFilter('customer', '')}
                      size="small"
                      color="primary"
                      variant="outlined"
                      icon={<MdPeople />}
                    />
                  )}

                  {filters.productType && (
                    <Chip
                      label={`สินค้า: ${filters.productType}`}
                      onDelete={() => updateFilter('productType', '')}
                      size="small"
                      color="primary"
                      variant="outlined"
                      icon={<MdInventory />}
                    />
                  )}
                </Box>
                
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={resetFilters}
                    startIcon={<MdClear />}
                    size="small"
                    sx={{ borderRadius: 2 }}
                  >
                    ล้างตัวกรองทั้งหมด
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
}

export default FilterTab;
