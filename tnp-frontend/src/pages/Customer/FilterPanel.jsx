import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid2 as Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Chip,
  Checkbox,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Slider,
  Paper,
  Divider,
} from "@mui/material";
import { useMemo, useCallback } from "react";
import { debounce } from 'lodash';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MdExpandMore, MdClear, MdFilterList, MdDateRange, MdPerson, MdSignalCellularAlt, MdPhone, MdLanguage, MdBusiness, MdEmail } from "react-icons/md";
import { RiRefreshLine } from "react-icons/ri";
import { IoSearch } from "react-icons/io5";
import FilterTab from "./FilterTab";
import {
  useGetUserByRoleQuery,
} from "../../features/globalApi";
import {
  setFilters,
  setSalesList,
  setPaginationModel,
  resetFilters,
} from "../../features/Customer/customerSlice";
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { formatCustomRelativeTime } from "../../features/Customer/customerUtils";

// Set up dayjs with Thai locale and Buddhist era
dayjs.extend(buddhistEra);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('th');

// Custom Buddhist Era Adapter
class AdapterBuddhistDayjs extends AdapterDayjs {
  constructor({ locale }) {
    super({ locale });
  }

  format = (value, formatString) => {
    // Handle Buddhist year display
    const yearFormats = ['YYYY', 'YY'];
    let formattedDate = value.format(formatString);
    
    yearFormats.forEach(yearFormat => {
      if (formatString.includes(yearFormat)) {
        const gregorianYear = value.year();
        const buddhistYear = gregorianYear + 543;
        if (yearFormat === 'YYYY') {
          formattedDate = formattedDate.replace(gregorianYear, buddhistYear);
        } else {
          const shortYear = (gregorianYear % 100).toString().padStart(2, '0');
          const shortBuddhistYear = (buddhistYear % 100).toString().padStart(2, '0');
          formattedDate = formattedDate.replace(shortYear, shortBuddhistYear);
        }
      }
    });
    
    return formattedDate;
  };

  parse = (value, format) => {
    if (!value) return null;
    
    // Handle Buddhist year input (e.g., "25/12/2567")
    const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const match = value.match(datePattern);
    
    if (match) {
      const [_, day, month, year] = match;
      const buddhistYear = parseInt(year, 10);
      const gregorianYear = buddhistYear - 543;
      
      // Validate the year is reasonable
      if (gregorianYear < 1900 || gregorianYear > 2100) {
        return null;
      }
      
      return dayjs(`${day}/${month}/${gregorianYear}`, 'DD/MM/YYYY');
    }
    
    return dayjs(value, format);
  };
}  // Channel options (matching the channelMap in CustomerList.jsx)
const channelOptions = [
  { value: "1", label: "Sales", icon: <MdPerson />, color: "#4caf50" },
  { value: "2", label: "Online", icon: <MdLanguage />, color: "#2196f3" },
  { value: "3", label: "Office", icon: <MdBusiness />, color: "#ff9800" },
  { value: "4", label: "Mobile", icon: <MdPhone />, color: "#9c27b0" },
  { value: "5", label: "Email", icon: <MdEmail />, color: "#f44336" },
];

function FilterPanel() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.customer.filters);
  const salesList = useSelector((state) => state.customer.salesList);
  const itemList = useSelector((state) => state.customer.itemList);
  const userInfo = useSelector((state) => state.global.userInfo);
  const [expanded, setExpanded] = useState(false);
  
  // Get sales list from API
  const { data: salesData, isLoading: salesLoading } = useGetUserByRoleQuery("sale");
  
  // Multi-select states
  const [selectedSales, setSelectedSales] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  
  // Local filter states
  const [localFilters, setLocalFilters] = useState({
    dateRange: {
      startDate: null,
      endDate: null,
    },
    salesName: [],
    channel: [],
    recallRange: {
      minDays: "",
      maxDays: "",
    },
  });
  
  // Debounced filter application
  const debouncedApplyFilters = useCallback(
    debounce((filtersToApply) => {
      console.log('🔥 Applying debounced filters:', filtersToApply);
      dispatch(setPaginationModel({ page: 0, pageSize: 30 }));
      dispatch(setFilters(filtersToApply));
    }, 500), // Wait 500ms after the user stops typing
    [dispatch]
  );
  
  // Cleanup debounced function on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (debouncedApplyFilters && typeof debouncedApplyFilters.cancel === 'function') {
        debouncedApplyFilters.cancel();
      }
    };
  }, [debouncedApplyFilters]);

  // Count filtered items
  const filteredCount = useMemo(() => {
    return itemList?.length || 0;
  }, [itemList]);
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    if (filters.salesName && filters.salesName.length > 0) count++;
    if (filters.channel && filters.channel.length > 0) count++;
    if (filters.recallRange.minDays !== null || filters.recallRange.maxDays !== null) count++;
    return count;
  }, [filters]);
  // Update sales list from API
  useEffect(() => {
    if (salesData && salesData.sale_role && salesData.sale_role.length > 0) {
      const salesNames = salesData.sale_role.map(user => user.username).filter(Boolean);
      console.log('Updated sales list from API:', salesNames);
      console.log('Total sales count:', salesNames.length);
      dispatch(setSalesList(salesNames));
    }
  }, [salesData, dispatch]);

  // Sync Redux filters to local state
  useEffect(() => {
    try {
      console.log('Syncing Redux filters to local:', filters);
      
      setLocalFilters(prev => ({
        dateRange: {
          startDate: filters.dateRange.startDate ? dayjs(filters.dateRange.startDate) : null,
          endDate: filters.dateRange.endDate ? dayjs(filters.dateRange.endDate) : null,
        },
        salesName: Array.isArray(filters.salesName) ? filters.salesName : [],
        channel: Array.isArray(filters.channel) ? filters.channel : [],
        recallRange: {
          minDays: filters.recallRange.minDays !== null ? filters.recallRange.minDays.toString() : "",
          maxDays: filters.recallRange.maxDays !== null ? filters.recallRange.maxDays.toString() : "",
        },
      }));
      
      setSelectedSales(Array.isArray(filters.salesName) ? filters.salesName : []);
      setSelectedChannels(Array.isArray(filters.channel) ? filters.channel : []);
      
      console.log('Local filters synced successfully');
    } catch (error) {
      console.warn('Error updating local filters:', error);
    }
  }, [filters]);
    // Apply filters
  const handleApplyFilters = useCallback(() => {
    try {
      // Validate recall range
      const minDays = localFilters.recallRange.minDays && localFilters.recallRange.minDays.trim() !== '' ? 
                      parseInt(localFilters.recallRange.minDays, 10) : null;
      const maxDays = localFilters.recallRange.maxDays && localFilters.recallRange.maxDays.trim() !== '' ? 
                      parseInt(localFilters.recallRange.maxDays, 10) : null;
      
      if (minDays !== null && maxDays !== null && minDays > maxDays) {
        alert('วันที่ขาดการติดต่อต่ำสุดต้องน้อยกว่าหรือเท่ากับวันสูงสุด');
        return;
      }

      const filtersToApply = {
        dateRange: {
          startDate: localFilters.dateRange.startDate?.isValid() ? localFilters.dateRange.startDate.format('YYYY-MM-DD') : null,
          endDate: localFilters.dateRange.endDate?.isValid() ? localFilters.dateRange.endDate.format('YYYY-MM-DD') : null,
        },
        salesName: Array.isArray(selectedSales) ? selectedSales : [],
        channel: Array.isArray(selectedChannels) ? selectedChannels : [],
        recallRange: {
          minDays: minDays !== null && !isNaN(minDays) ? minDays : null,
          maxDays: maxDays !== null && !isNaN(maxDays) ? maxDays : null,
        },
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('=== APPLYING FILTERS ===');
        console.log('Local filters:', localFilters);
        console.log('Selected sales:', selectedSales);
        console.log('Selected channels:', selectedChannels);
        console.log('Final filters to apply:', filtersToApply);
      }
      
      // Use debounced function instead of direct dispatch
      debouncedApplyFilters(filtersToApply);
      
      // Collapse filter panel after applying
      setExpanded(false);
      
      console.log('Filters prepared for debounced application!');
    } catch (error) {
      console.error('Error applying filters:', error);
      alert('เกิดข้อผิดพลาดในการใช้งานตัวกรอง');
    }
  }, [localFilters, selectedSales, selectedChannels, debouncedApplyFilters]);
  // Reset filters
  const handleResetFilters = () => {
    setLocalFilters({
      dateRange: {
        startDate: null,
        endDate: null,
      },
      salesName: [],
      channel: [],
      recallRange: {
        minDays: "",
        maxDays: "",
      },
    });
    setSelectedSales([]);
    setSelectedChannels([]);
    dispatch(resetFilters());
    dispatch(setPaginationModel({ page: 0, pageSize: 30 }));
    
    // Collapse filter panel after reset
    setExpanded(false);
  };

  // Quick date range buttons
  const handleQuickDateRange = (type) => {
    const today = dayjs();
    let startDate, endDate;
    
    switch(type) {
      case 'today':
        startDate = today.startOf('day');
        endDate = today.endOf('day');
        break;
      case 'yesterday':
        startDate = today.subtract(1, 'day').startOf('day');
        endDate = today.subtract(1, 'day').endOf('day');
        break;
      case 'thisWeek':
        startDate = today.startOf('week');
        endDate = today.endOf('week');
        break;
      case 'lastWeek':
        startDate = today.subtract(1, 'week').startOf('week');
        endDate = today.subtract(1, 'week').endOf('week');
        break;
      case 'thisMonth':
        startDate = today.startOf('month');
        endDate = today.endOf('month');
        break;
      case 'lastMonth':
        startDate = today.subtract(1, 'month').startOf('month');
        endDate = today.subtract(1, 'month').endOf('month');
        break;
      case 'last30Days':
        startDate = today.subtract(30, 'days').startOf('day');
        endDate = today.endOf('day');
        break;
      case 'last7Days':
        startDate = today.subtract(7, 'days').startOf('day');
        endDate = today.endOf('day');
        break;
      default:
        return;
    }
    
    console.log(`Setting quick date range - ${type}:`, { 
      startDate: startDate.format('YYYY-MM-DD'), 
      endDate: endDate.format('YYYY-MM-DD') 
    });
    
    setLocalFilters(prev => ({
      ...prev,
      dateRange: { startDate, endDate }
    }));
      // Auto-apply filters for quick date range
    const filtersToApply = {
      dateRange: {
        startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
        endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
      },
      salesName: selectedSales,
      channel: selectedChannels,
      recallRange: {
        minDays: localFilters.recallRange.minDays && !isNaN(parseInt(localFilters.recallRange.minDays)) ? 
                 parseInt(localFilters.recallRange.minDays) : null,
        maxDays: localFilters.recallRange.maxDays && !isNaN(parseInt(localFilters.recallRange.maxDays)) ? 
                 parseInt(localFilters.recallRange.maxDays) : null,
      },
    };
    
    dispatch(setFilters(filtersToApply));
    dispatch(setPaginationModel({ page: 0, pageSize: 30 }));
  };

  // Recall range presets
  const recallPresets = [
    { label: '0-7 วัน', min: 0, max: 7 },
    { label: '8-15 วัน', min: 8, max: 15 },
    { label: '16-30 วัน', min: 16, max: 30 },
    { label: '31-45 วัน', min: 31, max: 45 },
    { label: '46-60 วัน', min: 46, max: 60 },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      {/* Group filter tabs */}
      <Box sx={{ mb: 2 }}>
        <FilterTab />
      </Box>

      {/* Advanced filters */}
      <Accordion 
        expanded={expanded} 
        onChange={(e, isExpanded) => setExpanded(isExpanded)}
        sx={{ 
          borderRadius: 2, 
          boxShadow: 2,
          '&:before': { display: 'none' },
          background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
        }}
      >
        <AccordionSummary
          expandIcon={<MdExpandMore />}
          aria-controls="panel1a-content"
          id="panel1a-header"
          sx={{ 
            minHeight: 56,
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              justifyContent: 'space-between',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ fontSize: 24, color: '#1976d2' }}><IoSearch /></Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ระบบกรองข้อมูลขั้นสูง
            </Typography>
            {activeFilterCount > 0 && (
              <Chip 
                label={`${activeFilterCount} ตัวกรอง`} 
                color="error" 
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          {filteredCount !== itemList?.length && (
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mr: 2 }}>
              กำลังแสดง {filteredCount} จาก {itemList?.length} รายการ
            </Typography>
          )}
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 3 }}>
          <LocalizationProvider dateAdapter={AdapterBuddhistDayjs} adapterLocale="th">
            <Grid container spacing={3}>
              {/* Date range filter */}
              <Grid size={12}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, background: '#fafafa' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MdDateRange style={{ fontSize: 20, color: '#1976d2' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        ช่วงวันที่สร้างข้อมูลลูกค้า
                      </Typography>
                      {(filters.dateRange.startDate || filters.dateRange.endDate) && (
                        <Chip 
                          label={`${filteredCount} รายการ`} 
                          color="primary" 
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <DatePicker
                          label="วันที่เริ่มต้น"
                          value={localFilters.dateRange.startDate}
                          onChange={(newValue) => 
                            setLocalFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, startDate: newValue }
                            }))
                          }
                          format="DD/MM/YYYY"
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              placeholder: "วันที่เริ่มต้น",
                              InputProps: {
                                endAdornment: localFilters.dateRange.startDate && (
                                  <InputAdornment position="end">
                                    <IconButton
                                      size="small"
                                      onClick={() => setLocalFilters(prev => ({
                                        ...prev,
                                        dateRange: { ...prev.dateRange, startDate: null }
                                      }))}
                                    >
                                      <MdClear />
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              },
                            },
                          }}
                          maxDate={dayjs()}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <DatePicker
                          label="วันที่สิ้นสุด"
                          value={localFilters.dateRange.endDate}
                          onChange={(newValue) => 
                            setLocalFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, endDate: newValue }
                            }))
                          }
                          format="DD/MM/YYYY"
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              placeholder: "วันที่สิ้นสุด",
                              InputProps: {
                                endAdornment: localFilters.dateRange.endDate && (
                                  <InputAdornment position="end">
                                    <IconButton
                                      size="small"
                                      onClick={() => setLocalFilters(prev => ({
                                        ...prev,
                                        dateRange: { ...prev.dateRange, endDate: null }
                                      }))}
                                    >
                                      <MdClear />
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              },
                            },
                          }}
                          minDate={localFilters.dateRange.startDate}
                          maxDate={dayjs()}
                        />
                      </Grid>
                    </Grid>
                    
                    {/* Quick date range buttons */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('today')}
                        sx={{ borderRadius: 2, minWidth: 80 }}
                      >
                        วันนี้
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('yesterday')}
                        sx={{ borderRadius: 2, minWidth: 80 }}
                      >
                        เมื่อวาน
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('last7Days')}
                        sx={{ borderRadius: 2, minWidth: 80 }}
                      >
                        7 วันที่แล้ว
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('thisWeek')}
                        sx={{ borderRadius: 2, minWidth: 80 }}
                      >
                        สัปดาห์นี้
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('lastWeek')}
                        sx={{ borderRadius: 2, minWidth: 80 }}
                      >
                        สัปดาห์ที่แล้ว
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('thisMonth')}
                        sx={{ borderRadius: 2, minWidth: 80 }}
                      >
                        เดือนนี้
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('lastMonth')}
                        sx={{ borderRadius: 2, minWidth: 80 }}
                      >
                        เดือนที่แล้ว
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('last30Days')}
                        sx={{ borderRadius: 2, minWidth: 80 }}
                      >
                        30 วันที่แล้ว
                      </Button>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Sales Name and Channel Filters */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                  <Stack spacing={3}>
                    {/* Sales Name Filter */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <MdPerson style={{ fontSize: 20, color: '#1976d2' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          ชื่อผู้รับผิดชอบ (SALES NAME)
                        </Typography>
                      </Box>
                      <FormControl fullWidth size="small">
                        <InputLabel>เลือกแล้ว {selectedSales.length} คน</InputLabel>
                        <Select
                          multiple
                          value={selectedSales}
                          onChange={(e) => {
                            const value = e.target.value;
                            console.log('Sales selection changed:', value);
                            setSelectedSales(typeof value === 'string' ? value.split(',') : value);
                          }}
                          input={<OutlinedInput label={`เลือกแล้ว ${selectedSales.length} คน`} />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.slice(0, 3).map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                              {selected.length > 3 && (
                                <Chip label={`+${selected.length - 3} คน`} size="small" />
                              )}
                            </Box>
                          )}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 300,
                              },
                            },
                          }}
                        >                            {salesList && salesList.length > 0 ? (
                            salesList.map((name) => (
                              <MenuItem key={name} value={name}>
                                <Checkbox checked={selectedSales.indexOf(name) > -1} />
                                <ListItemText primary={name} />
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled>
                              <ListItemText primary="ไม่พบข้อมูลพนักงานขาย" />
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setSelectedSales(salesList)}
                          disabled={selectedSales.length === salesList.length}
                        >
                          เลือกทั้งหมด
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setSelectedSales([])}
                          disabled={selectedSales.length === 0}
                        >
                          ล้างการเลือก
                        </Button>
                      </Box>
                    </Box>

                    {/* Channel Filter */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <MdSignalCellularAlt style={{ fontSize: 20, color: '#1976d2' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          ช่องทางการติดต่อ (CHANNEL)
                        </Typography>
                      </Box>
                      <FormControl fullWidth size="small">
                        <InputLabel>เลือกแล้ว {selectedChannels.length} ช่องทาง</InputLabel>
                        <Select
                          multiple
                          value={selectedChannels}
                          onChange={(e) => {
                            const value = e.target.value;
                            console.log('Channel selection changed:', value);
                            setSelectedChannels(typeof value === 'string' ? value.split(',') : value);
                          }}
                          input={<OutlinedInput label={`เลือกแล้ว ${selectedChannels.length} ช่องทาง`} />}                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => {
                                const channel = channelOptions.find(c => c.value === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    icon={channel?.icon}
                                    label={channel?.label} 
                                    size="small"
                                    sx={{ bgcolor: channel?.color, color: 'white' }}
                                  />
                                );
                              })}
                            </Box>
                          )}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 300,
                              },
                            },
                          }}
                        >                          {channelOptions.map((channel) => (
                            <MenuItem key={channel.value} value={channel.value}>
                              <Checkbox checked={selectedChannels.indexOf(channel.value) > -1} />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {channel.icon}
                                <ListItemText primary={channel.label} />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setSelectedChannels(channelOptions.map(c => c.value))}
                          disabled={selectedChannels.length === channelOptions.length}
                        >
                          เลือกทั้งหมด
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setSelectedChannels([])}
                          disabled={selectedChannels.length === 0}
                        >
                          ล้างการเลือก
                        </Button>
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Recall days filter */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MdPhone style={{ fontSize: 20, color: '#1976d2' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        ช่วงเวลาที่ขาดการติดต่อ (RECALL)
                      </Typography>
                      {(filters.recallRange.minDays !== null || filters.recallRange.maxDays !== null) && (
                        <Chip 
                          label={`${filteredCount} รายการ`} 
                          color="warning" 
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ px: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        กำลังแสดงลูกค้าที่ขาดการติดต่อ {localFilters.recallRange.minDays || 0} - {localFilters.recallRange.maxDays || 60} วัน
                      </Typography>                        <Slider
                        value={[
                          parseInt(localFilters.recallRange.minDays) || 0,
                          parseInt(localFilters.recallRange.maxDays) || 60
                        ]}
                        onChange={(e, newValue) => {
                          if (Array.isArray(newValue) && newValue.length === 2) {
                            setLocalFilters(prev => ({
                              ...prev,
                              recallRange: {
                                minDays: Math.max(0, newValue[0]).toString(),
                                maxDays: Math.min(60, newValue[1]).toString()
                              }
                            }));
                          }
                        }}
                        valueLabelDisplay="auto"
                        min={0}
                        max={60}
                        marks={[
                          { value: 0, label: '0' },
                          { value: 15, label: '15' },
                          { value: 30, label: '30' },
                          { value: 45, label: '45' },
                          { value: 60, label: '60' },
                        ]}
                        sx={{ mt: 3, mb: 1 }}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="จำนวนวันต่ำสุด"
                          type="number"
                          value={localFilters.recallRange.minDays}
                          onChange={(e) => 
                            setLocalFilters(prev => ({
                              ...prev,
                              recallRange: { ...prev.recallRange, minDays: e.target.value }
                            }))
                          }
                          InputProps={{
                            inputProps: { min: 0, max: 60 }
                          }}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="จำนวนวันสูงสุด"
                          type="number"
                          value={localFilters.recallRange.maxDays}
                          onChange={(e) => 
                            setLocalFilters(prev => ({
                              ...prev,
                              recallRange: { ...prev.recallRange, maxDays: e.target.value }
                            }))
                          }
                          InputProps={{
                            inputProps: { min: 0, max: 60 }
                          }}
                        />
                      </Grid>
                    </Grid>
                    
                    {/* Recall presets */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {recallPresets.map((preset) => (
                        <Button
                          key={preset.label}
                          size="small"
                          variant="outlined"
                          onClick={() => 
                            setLocalFilters(prev => ({
                              ...prev,
                              recallRange: {
                                minDays: preset.min.toString(),
                                maxDays: preset.max ? preset.max.toString() : '60'
                              }
                            }))
                          }
                          sx={{ borderRadius: 2 }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Control buttons */}
              <Grid size={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<RiRefreshLine />}
                    onClick={handleResetFilters}
                    sx={{ 
                      minWidth: 150,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    รีเซ็ตตัวกรอง
                  </Button>                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<MdFilterList />}
                    onClick={handleApplyFilters}
                    sx={{ 
                      minWidth: 150,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: 3,
                      '&:hover': {
                        boxShadow: 5,
                      }
                    }}
                  >
                    ใช้งานตัวกรอง
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default FilterPanel;