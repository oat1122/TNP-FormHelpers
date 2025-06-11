// filepath: d:\01oat\TNP-FormHelpers\tnp-frontend\src\pages\Customer\FilterPanel.jsx
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
}  

// Channel options
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
  
  // Create a ref for the debounce function to properly handle cleanup
  const debouncedApplyFiltersRef = useRef();
  
  // Create working draft of filter values (only when filters change or when user makes edits)
  const [draftFilters, setDraftFilters] = useState({
    dateRange: {
      startDate: filters.dateRange.startDate ? dayjs(filters.dateRange.startDate) : null,
      endDate: filters.dateRange.endDate ? dayjs(filters.dateRange.endDate) : null,
    },
    salesName: Array.isArray(filters.salesName) ? [...filters.salesName] : [],
    channel: Array.isArray(filters.channel) ? [...filters.channel] : [],
    recallRange: {
      minDays: filters.recallRange.minDays !== null ? filters.recallRange.minDays.toString() : "",
      maxDays: filters.recallRange.maxDays !== null ? filters.recallRange.maxDays.toString() : "",
    }
  });

  // Setup debounced filter function (created only once)
  useEffect(() => {
    debouncedApplyFiltersRef.current = debounce((filtersToApply) => {
      console.log('🔥 Applying debounced filters:', filtersToApply);
      dispatch(setPaginationModel({ page: 0, pageSize: 30 }));
      dispatch(setFilters(filtersToApply));
    }, 500);
    
    // Cleanup debounced function on unmount to prevent memory leaks
    return () => {
      if (debouncedApplyFiltersRef.current?.cancel) {
        debouncedApplyFiltersRef.current.cancel();
      }
    };
  }, [dispatch]);
  
  // Sync Redux filters to draft state when Redux filters change
  useEffect(() => {
    try {
      setDraftFilters({
        dateRange: {
          startDate: filters.dateRange.startDate ? dayjs(filters.dateRange.startDate) : null,
          endDate: filters.dateRange.endDate ? dayjs(filters.dateRange.endDate) : null,
        },
        salesName: Array.isArray(filters.salesName) ? [...filters.salesName] : [],
        channel: Array.isArray(filters.channel) ? [...filters.channel] : [],
        recallRange: {
          minDays: filters.recallRange.minDays !== null ? filters.recallRange.minDays.toString() : "",
          maxDays: filters.recallRange.maxDays !== null ? filters.recallRange.maxDays.toString() : "",
        }
      });
    } catch (error) {
      console.warn('Error updating draft filters from Redux state:', error);
    }
  }, [filters]);

  // Update sales list from API (only once when data is loaded)
  useEffect(() => {
    if (salesData?.sale_role?.length > 0) {
      const salesNames = salesData.sale_role.map(user => user.username).filter(Boolean);
      dispatch(setSalesList(salesNames));
    }
  }, [salesData, dispatch]);

  // Count filtered items
  const filteredCount = useMemo(() => {
    return itemList?.length || 0;
  }, [itemList]);
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    if (filters.salesName?.length > 0) count++;
    if (filters.channel?.length > 0) count++;
    if (filters.recallRange.minDays !== null || filters.recallRange.maxDays !== null) count++;
    return count;
  }, [filters]);

  // Apply filters handler
  const handleApplyFilters = useCallback(() => {
    try {
      // Validate recall range
      const minDays = draftFilters.recallRange.minDays && draftFilters.recallRange.minDays.trim() !== '' ? 
                    parseInt(draftFilters.recallRange.minDays, 10) : null;
      const maxDays = draftFilters.recallRange.maxDays && draftFilters.recallRange.maxDays.trim() !== '' ? 
                    parseInt(draftFilters.recallRange.maxDays, 10) : null;
      
      if (minDays !== null && maxDays !== null && minDays > maxDays) {
        alert('วันที่ขาดการติดต่อต่ำสุดต้องน้อยกว่าหรือเท่ากับวันสูงสุด');
        return;
      }

      const filtersToApply = {
        dateRange: {
          startDate: draftFilters.dateRange.startDate?.isValid() ? draftFilters.dateRange.startDate.format('YYYY-MM-DD') : null,
          endDate: draftFilters.dateRange.endDate?.isValid() ? draftFilters.dateRange.endDate.format('YYYY-MM-DD') : null,
        },
        salesName: draftFilters.salesName,
        channel: draftFilters.channel,
        recallRange: {
          minDays: minDays !== null && !isNaN(minDays) ? minDays : null,
          maxDays: maxDays !== null && !isNaN(maxDays) ? maxDays : null,
        },
      };
      
      // Call the debounced function
      debouncedApplyFiltersRef.current(filtersToApply);
      
      // Collapse filter panel after applying
      setExpanded(false);
    } catch (error) {
      console.error('Error applying filters:', error);
      alert('เกิดข้อผิดพลาดในการใช้งานตัวกรอง');
    }
  }, [draftFilters]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setDraftFilters({
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
    dispatch(resetFilters());
    dispatch(setPaginationModel({ page: 0, pageSize: 30 }));
    
    // Collapse filter panel after reset
    setExpanded(false);
  }, [dispatch]);

  // Quick date range buttons
  const handleQuickDateRange = useCallback((type) => {
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
      case 'last3Months':
        startDate = today.subtract(3, 'month').startOf('day');
        endDate = today.endOf('day');
        break;
      case 'thisYear':
        startDate = today.startOf('year');
        endDate = today.endOf('year');
        break;
      default:
        startDate = null;
        endDate = null;
    }
    
    setDraftFilters(prev => ({
      ...prev,
      dateRange: {
        startDate,
        endDate,
      }
    }));
  }, []);
  
  // Recall range presets
  const recallPresets = useMemo(() => [
    { label: '1 วัน', min: 1, max: 1 },
    { label: '2-3 วัน', min: 2, max: 3 },
    { label: '4-7 วัน', min: 4, max: 7 },
    { label: '1-2 สัปดาห์', min: 7, max: 14 },
    { label: '2-4 สัปดาห์', min: 14, max: 30 },
    { label: '1-2 เดือน', min: 30, max: 60 },
    { label: 'มากกว่า 2 เดือน', min: 60, max: null },
  ], []);
  
  // Calculate formatted dates for display
  const formattedStartDate = useMemo(() => {
    return draftFilters.dateRange.startDate?.format('DD/MM/YYYY') || '';
  }, [draftFilters.dateRange.startDate]);
  
  const formattedEndDate = useMemo(() => {
    return draftFilters.dateRange.endDate?.format('DD/MM/YYYY') || '';
  }, [draftFilters.dateRange.endDate]);
  
  // Handle accordion expand/collapse
  const handleAccordionChange = (_, isExpanded) => {
    setExpanded(isExpanded);
  };

  // Handle date field clearing
  const clearStartDate = () => {
    setDraftFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        startDate: null
      }
    }));
  };

  const clearEndDate = () => {
    setDraftFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        endDate: null
      }
    }));
  };

  // Handle sales selection - we now work directly with draftFilters
  const handleSalesChange = useCallback((e) => {
    const value = e.target.value;
    setDraftFilters(prev => ({
      ...prev,
      salesName: typeof value === 'string' ? value.split(',') : value
    }));
  }, []);

  // Handle channel selection - we now work directly with draftFilters
  const handleChannelChange = useCallback((e) => {
    const value = e.target.value;
    setDraftFilters(prev => ({
      ...prev,
      channel: typeof value === 'string' ? value.split(',') : value
    }));
  }, []);

  // Recall range input handlers - memoized to prevent recreating on each render
  const handleMinDaysChange = useCallback((e) => {
    setDraftFilters(prev => ({
      ...prev,
      recallRange: { 
        ...prev.recallRange, 
        minDays: e.target.value 
      }
    }));
  }, []);

  const handleMaxDaysChange = useCallback((e) => {
    setDraftFilters(prev => ({
      ...prev,
      recallRange: { 
        ...prev.recallRange, 
        maxDays: e.target.value 
      }
    }));
  }, []);

  // Select all sales handler
  const selectAllSales = useCallback(() => {
    setDraftFilters(prev => ({
      ...prev,
      salesName: [...salesList]
    }));
  }, [salesList]);

  // Clear sales selection handler
  const clearSalesSelection = useCallback(() => {
    setDraftFilters(prev => ({
      ...prev,
      salesName: []
    }));
  }, []);

  // Preset recall range handler
  const handleRecallPreset = useCallback((preset) => {
    setDraftFilters(prev => ({
      ...prev,
      recallRange: {
        minDays: preset.min.toString(),
        maxDays: preset.max ? preset.max.toString() : '60'
      }
    }));
  }, []);

  return (
    <Box sx={{ mb: 3 }}>
      {/* Advanced filters */}
      <Accordion 
        expanded={expanded} 
        onChange={handleAccordionChange}
        sx={{
          bgcolor: 'background.paper',
          boxShadow: 2,
          borderRadius: 2,
          overflow: 'hidden',
          '&:before': { display: 'none' }, // Remove default divider
        }}
      >
        <AccordionSummary
          expandIcon={<MdExpandMore />}
          sx={{ 
            bgcolor: expanded ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
            borderBottom: expanded ? '1px solid rgba(0, 0, 0, 0.12)' : 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MdFilterList style={{ fontSize: 24, marginRight: 8, color: '#1976d2' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                ตัวกรองขั้นสูง
              </Typography>
              
              {activeFilterCount > 0 && (
                <Chip 
                  label={`${activeFilterCount} กรอง`} 
                  size="small" 
                  color="error"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {filteredCount > 0 ? `พบ ${filteredCount} รายการ` : 'ไม่พบข้อมูล'}
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails sx={{ p: 3 }}>
          <LocalizationProvider dateAdapter={AdapterBuddhistDayjs}>
            <Grid container spacing={3}>
              {/* Date Filter */}
              <Grid size={12} md={6} lg={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    height: '100%',
                  }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MdDateRange style={{ fontSize: 20, color: '#1976d2' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        วันที่สร้างลูกค้า
                      </Typography>
                    </Box>
                    
                    {/* Date picker fields */}
                    <DatePicker
                      label="วันที่เริ่มต้น"
                      value={draftFilters.dateRange.startDate}
                      onChange={(newValue) => 
                        setDraftFilters(prev => ({
                          ...prev, 
                          dateRange: { ...prev.dateRange, startDate: newValue }
                        }))
                      }
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          InputProps: {
                            endAdornment: (
                              <InputAdornment position="end">
                                {draftFilters.dateRange.startDate && (
                                  <IconButton
                                    size="small"
                                    aria-label="clear date"
                                    onClick={clearStartDate}
                                    edge="end"
                                  >
                                    <MdClear />
                                  </IconButton>
                                )}
                              </InputAdornment>
                            ),
                          }
                        }
                      }}
                      format="DD/MM/YYYY"
                    />
                    
                    <DatePicker
                      label="วันที่สิ้นสุด"
                      value={draftFilters.dateRange.endDate}
                      onChange={(newValue) => 
                        setDraftFilters(prev => ({
                          ...prev, 
                          dateRange: { ...prev.dateRange, endDate: newValue }
                        }))
                      }
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          InputProps: {
                            endAdornment: (
                              <InputAdornment position="end">
                                {draftFilters.dateRange.endDate && (
                                  <IconButton
                                    size="small"
                                    aria-label="clear date"
                                    onClick={clearEndDate}
                                    edge="end"
                                  >
                                    <MdClear />
                                  </IconButton>
                                )}
                              </InputAdornment>
                            ),
                          }
                        }
                      }}
                      format="DD/MM/YYYY"
                    />
                    
                    {/* Quick date range buttons */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('today')}
                        sx={{ borderRadius: 2 }}
                      >
                        วันนี้
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('yesterday')}
                        sx={{ borderRadius: 2 }}
                      >
                        เมื่อวาน
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('thisWeek')}
                        sx={{ borderRadius: 2 }}
                      >
                        สัปดาห์นี้
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('lastWeek')}
                        sx={{ borderRadius: 2 }}
                      >
                        สัปดาห์ที่แล้ว
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('thisMonth')}
                        sx={{ borderRadius: 2 }}
                      >
                        เดือนนี้
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange('lastMonth')}
                        sx={{ borderRadius: 2 }}
                      >
                        เดือนที่แล้ว
                      </Button>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              
              {/* Sales Filter */}
              <Grid size={12} md={6} lg={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    height: '100%'
                  }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MdPerson style={{ fontSize: 20, color: '#1976d2' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        พนักงานขาย (SALES)
                      </Typography>
                    </Box>
                    
                    {/* Sales selection */}
                    <FormControl fullWidth size="small">
                      <InputLabel>เลือกแล้ว {draftFilters.salesName.length} คน</InputLabel>
                      <Select
                        multiple
                        value={draftFilters.salesName}
                        onChange={handleSalesChange}
                        input={<OutlinedInput label={`เลือกแล้ว ${draftFilters.salesName.length} คน`} />}
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
                      >
                        {salesList && salesList.length > 0 ? (
                          salesList.map((name) => (
                            <MenuItem key={name} value={name}>
                              <Checkbox checked={draftFilters.salesName.indexOf(name) > -1} />
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
                        onClick={selectAllSales}
                        disabled={draftFilters.salesName.length === salesList.length}
                      >
                        เลือกทั้งหมด
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        onClick={clearSalesSelection}
                        disabled={draftFilters.salesName.length === 0}
                      >
                        ล้างการเลือก
                      </Button>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Channel and Recall Filter */}
              <Grid size={12} md={6} lg={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Stack spacing={3} sx={{ height: '100%' }}>
                    {/* Channel Filter */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <MdSignalCellularAlt style={{ fontSize: 20, color: '#1976d2' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          ช่องทางการติดต่อ (CHANNEL)
                        </Typography>
                      </Box>
                      <FormControl fullWidth size="small">
                        <InputLabel>เลือกแล้ว {draftFilters.channel.length} ช่องทาง</InputLabel>
                        <Select
                          multiple
                          value={draftFilters.channel}
                          onChange={handleChannelChange}
                          input={<OutlinedInput label={`เลือกแล้ว ${draftFilters.channel.length} ช่องทาง`} />}
                          renderValue={(selected) => (
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
                        >
                          {channelOptions.map((channel) => (
                            <MenuItem key={channel.value} value={channel.value}>
                              <Checkbox checked={draftFilters.channel.indexOf(channel.value) > -1} />
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box 
                                  sx={{ 
                                    mr: 1, 
                                    p: 0.5, 
                                    borderRadius: '50%', 
                                    bgcolor: channel.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                  }}
                                >
                                  {channel.icon}
                                </Box>
                                <ListItemText primary={channel.label} />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    
                    <Divider />
                    
                    {/* Recall Filter */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <MdPhone style={{ fontSize: 20, color: '#1976d2' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          ระยะเวลาขาดการติดต่อ (วัน)
                        </Typography>
                      </Box>
                      
                      {/* Recall range input */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="จำนวนวันต่ำสุด"
                            type="number"
                            value={draftFilters.recallRange.minDays}
                            onChange={handleMinDaysChange}
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
                            value={draftFilters.recallRange.maxDays}
                            onChange={handleMaxDaysChange}
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
                            onClick={() => handleRecallPreset(preset)}
                            sx={{ borderRadius: 2 }}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </Box>
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
                  </Button>
                  <Button
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
