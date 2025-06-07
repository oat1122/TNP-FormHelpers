import React, { useState, useEffect } from "react";
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
import { useMemo } from "react";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MdExpandMore, MdClear, MdFilterList } from "react-icons/md";
import { RiRefreshLine } from "react-icons/ri";
import FilterTab from "./FilterTab";
import {
  setFilters,
  setSalesList,
  setPaginationModel,
  resetFilters,
} from "../../features/Customer/customerSlice";
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { formatCustomRelativeTime } from "../../features/Customer/customerUtils";

// ตั้งค่า dayjs ให้ใช้ภาษาไทยและ พ.ศ.
dayjs.extend(buddhistEra);
dayjs.locale('th');

// เพิ่ม Channel options พร้อมไอคอน
const channelOptions = [
  { value: "", label: "ทั้งหมด", icon: null },
  { value: "1", label: "Sales", icon: "📞", color: "#4caf50" },
  { value: "2", label: "Online", icon: "💻", color: "#2196f3" },
  { value: "3", label: "Office", icon: "🏢", color: "#ff9800" },
  { value: "4", label: "Mobile", icon: "📱", color: "#9c27b0" },
  { value: "5", label: "Email", icon: "📧", color: "#f44336" },
];

function FilterPanel() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.customer.filters);
  const salesList = useSelector((state) => state.customer.salesList);
  const itemList = useSelector((state) => state.customer.itemList);
  const [expanded, setExpanded] = useState(true);
  
  // State สำหรับ multi-select
  const [selectedSales, setSelectedSales] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  
  // นับจำนวนข้อมูลที่กรองแล้ว
  const filteredCount = useMemo(() => {
    if (!itemList || itemList.length === 0) return 0;
    
    let filtered = [...itemList];
    
    // กรองตาม recall range
    if (filters.recallRange.minDays !== null || filters.recallRange.maxDays !== null) {
      filtered = filtered.filter((item) => {
        const recallDays = parseInt(formatCustomRelativeTime(item.cd_last_datetime), 10);
        const minDays = filters.recallRange.minDays;
        const maxDays = filters.recallRange.maxDays;
        
        let matchesMin = true;
        let matchesMax = true;
        
        if (minDays !== null && minDays !== "") {
          matchesMin = recallDays >= minDays;
        }
        
        if (maxDays !== null && maxDays !== "") {
          matchesMax = recallDays <= maxDays;
        }
        
        return matchesMin && matchesMax;
      });
    }
    
    // กรองตามวันที่สร้าง
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      filtered = filtered.filter((item) => {
        const createdDate = dayjs(item.cus_created_date);
        let matchesStart = true;
        let matchesEnd = true;
        
        if (filters.dateRange.startDate) {
          matchesStart = createdDate.isAfter(dayjs(filters.dateRange.startDate).subtract(1, 'day'));
        }
        
        if (filters.dateRange.endDate) {
          matchesEnd = createdDate.isBefore(dayjs(filters.dateRange.endDate).add(1, 'day'));
        }
        
        return matchesStart && matchesEnd;
      });
    }
    
    // กรองตาม sales (รองรับ multi-select)
    if (filters.salesName && filters.salesName.length > 0) {
      filtered = filtered.filter(item => 
        filters.salesName.includes(item.cus_manage_by?.username)
      );
    }
    
    // กรองตาม channel (รองรับ multi-select)
    if (filters.channel && filters.channel.length > 0) {
      filtered = filtered.filter(item => 
        filters.channel.includes(item.cus_channel?.toString())
      );
    }
    
    return filtered.length;
  }, [itemList, filters]);
  
  // จำนวน filter ที่ active
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    if (filters.salesName && filters.salesName.length > 0) count++;
    if (filters.channel && filters.channel.length > 0) count++;
    if (filters.recallRange.minDays !== null || filters.recallRange.maxDays !== null) count++;
    return count;
  }, [filters]);
  
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

  // สร้างรายชื่อพนักงานขายจาก itemList
  useEffect(() => {
    if (itemList && itemList.length > 0) {
      const uniqueSales = [...new Set(itemList.map(item => item.cus_manage_by?.username))]
        .filter(Boolean)
        .sort();
      dispatch(setSalesList(uniqueSales));
    }
  }, [itemList, dispatch]);

  // อัพเดท localFilters เมื่อ filters ใน Redux เปลี่ยน
  useEffect(() => {
    setLocalFilters({
      dateRange: {
        startDate: filters.dateRange.startDate ? dayjs(filters.dateRange.startDate) : null,
        endDate: filters.dateRange.endDate ? dayjs(filters.dateRange.endDate) : null,
      },
      salesName: filters.salesName || [],
      channel: filters.channel || [],
      recallRange: {
        minDays: filters.recallRange.minDays || "",
        maxDays: filters.recallRange.maxDays || "",
      },
    });
    setSelectedSales(filters.salesName || []);
    setSelectedChannels(filters.channel || []);
  }, [filters]);

  const handleApplyFilters = () => {
    // แปลง dayjs object เป็น string ก่อนส่งไป Redux
    const filtersToApply = {
      dateRange: {
        startDate: localFilters.dateRange.startDate ? localFilters.dateRange.startDate.format('YYYY-MM-DD') : null,
        endDate: localFilters.dateRange.endDate ? localFilters.dateRange.endDate.format('YYYY-MM-DD') : null,
      },
      salesName: selectedSales,
      channel: selectedChannels,
      recallRange: {
        minDays: localFilters.recallRange.minDays ? parseInt(localFilters.recallRange.minDays) : null,
        maxDays: localFilters.recallRange.maxDays ? parseInt(localFilters.recallRange.maxDays) : null,
      },
    };
    
    dispatch(setFilters(filtersToApply));
    dispatch(setPaginationModel({ page: 0, pageSize: 30 })); // Default 30 rows
  };

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
        startDate = today.subtract(30, 'days');
        endDate = today;
        break;
      default:
        return;
    }
    
    setLocalFilters(prev => ({
      ...prev,
      dateRange: { startDate, endDate }
    }));
  };

  // Recall range presets
  const recallPresets = [
    { label: '0-7 วัน', min: 0, max: 7 },
    { label: '8-30 วัน', min: 8, max: 30 },
    { label: '31-60 วัน', min: 31, max: 60 },
    { label: '61-90 วัน', min: 61, max: 90 },
    { label: 'มากกว่า 90 วัน', min: 91, max: null },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      {/* ตัวกรองกลุ่มเดิม */}
      <Box sx={{ mb: 2 }}>
        <FilterTab />
      </Box>

      {/* ตัวกรองเพิ่มเติม */}
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
            <MdFilterList size={24} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ระบบกรองข้อมูล
            </Typography>
            {activeFilterCount > 0 && (
              <Chip 
                label={`${activeFilterCount} ตัวกรองที่ใช้งาน`} 
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
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
            <Grid container spacing={3}>
              {/* ตัวกรองช่วงวันที่สร้างลูกค้า */}
              <Grid size={12}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, background: '#fafafa' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        📅 ช่วงวันที่สร้างข้อมูลลูกค้า
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
                          label="เลือกช่วงวันที่"
                          value={localFilters.dateRange.startDate}
                          onChange={(newValue) => 
                            setLocalFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, startDate: newValue }
                            }))
                          }
                          format="DD/MM/BBBB"
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
                          label="เมื่อวาน"
                          value={localFilters.dateRange.endDate}
                          onChange={(newValue) => 
                            setLocalFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, endDate: newValue }
                            }))
                          }
                          format="DD/MM/BBBB"
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
                    
                    {/* ปุ่มลัดเลือกช่วงเวลา */}
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

              {/* Sales Name และ Channel Filters */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
                        👤 ชื่อผู้รับผิดชอบ (SALES NAME)
                      </Typography>
                      <FormControl fullWidth size="small">
                        <InputLabel>เลือกแล้ว {selectedSales.length} คน</InputLabel>
                        <Select
                          multiple
                          value={selectedSales}
                          onChange={(e) => setSelectedSales(e.target.value)}
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
                        >
                          <MenuItem value="" onClick={() => setSelectedSales([])}>
                            <em>ล้างการเลือกทั้งหมด</em>
                          </MenuItem>
                          <Divider />
                          {salesList.map((name) => (
                            <MenuItem key={name} value={name}>
                              <Checkbox checked={selectedSales.indexOf(name) > -1} />
                              <ListItemText primary={name} />
                            </MenuItem>
                          ))}
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

                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
                        📡 ช่องทางการติดต่อ (CHANNEL)
                      </Typography>
                      <FormControl fullWidth size="small">
                        <InputLabel>เลือกแล้ว {selectedChannels.length} ช่องทาง</InputLabel>
                        <Select
                          multiple
                          value={selectedChannels}
                          onChange={(e) => setSelectedChannels(e.target.value)}
                          input={<OutlinedInput label={`เลือกแล้ว ${selectedChannels.length} ช่องทาง`} />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => {
                                const channel = channelOptions.find(c => c.value === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={`${channel?.icon} ${channel?.label}`} 
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
                          <MenuItem value="" onClick={() => setSelectedChannels([])}>
                            <em>ล้างการเลือกทั้งหมด</em>
                          </MenuItem>
                          <Divider />
                          {channelOptions.slice(1).map((channel) => (
                            <MenuItem key={channel.value} value={channel.value}>
                              <Checkbox checked={selectedChannels.indexOf(channel.value) > -1} />
                              <ListItemText primary={`${channel.icon} ${channel.label}`} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* ตัวกรองวันที่ขาดการติดต่อ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        📞 ช่วงเวลาที่ขาดการติดต่อ (RECALL)
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
                        กำลังแสดงลูกค้าที่ขาดการติดต่อ {localFilters.recallRange.minDays || 0} - {localFilters.recallRange.maxDays || 297} วัน
                      </Typography>
                      <Slider
                        value={[
                          localFilters.recallRange.minDays || 0,
                          localFilters.recallRange.maxDays || 297
                        ]}
                        onChange={(e, newValue) => {
                          setLocalFilters(prev => ({
                            ...prev,
                            recallRange: {
                              minDays: newValue[0].toString(),
                              maxDays: newValue[1].toString()
                            }
                          }));
                        }}
                        valueLabelDisplay="auto"
                        min={0}
                        max={297}
                        marks={[
                          { value: 0, label: '0' },
                          { value: 30, label: '30' },
                          { value: 60, label: '60' },
                          { value: 90, label: '90' },
                          { value: 180, label: '180' },
                          { value: 297, label: '297' },
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
                            inputProps: { min: 0, max: 297 }
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
                            inputProps: { min: 0, max: 297 }
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
                                maxDays: preset.max ? preset.max.toString() : '297'
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

              {/* ปุ่มควบคุม */}
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
                    แสดงตัวกรองทั้งหมด
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