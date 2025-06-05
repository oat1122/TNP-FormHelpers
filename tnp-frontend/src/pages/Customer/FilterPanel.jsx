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
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MdExpandMore } from "react-icons/md";
import FilterTab from "./FilterTab";
import {
  setFilters,
  setSalesList,
  setPaginationModel,
  resetFilters,
} from "../../features/Customer/customerSlice";
import dayjs from 'dayjs';
import 'dayjs/locale/th';

// ตั้งค่า dayjs ให้ใช้ภาษาไทย
dayjs.locale('th');

function FilterPanel() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.customer.filters);
  const salesList = useSelector((state) => state.customer.salesList);
  const channelList = useSelector((state) => state.customer.channelList);
  const itemList = useSelector((state) => state.customer.itemList);
  
  const [localFilters, setLocalFilters] = useState({
    dateRange: {
      startDate: null,
      endDate: null,
    },
    salesName: "",
    channel: "",
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
      salesName: filters.salesName,
      channel: filters.channel,
      recallRange: {
        minDays: filters.recallRange.minDays || "",
        maxDays: filters.recallRange.maxDays || "",
      },
    });
  }, [filters]);

  const handleApplyFilters = () => {
    // แปลง dayjs object เป็น string ก่อนส่งไป Redux
    const filtersToApply = {
      dateRange: {
        startDate: localFilters.dateRange.startDate ? localFilters.dateRange.startDate.format('YYYY-MM-DD') : null,
        endDate: localFilters.dateRange.endDate ? localFilters.dateRange.endDate.format('YYYY-MM-DD') : null,
      },
      salesName: localFilters.salesName,
      channel: localFilters.channel,
      recallRange: {
        minDays: localFilters.recallRange.minDays ? parseInt(localFilters.recallRange.minDays) : null,
        maxDays: localFilters.recallRange.maxDays ? parseInt(localFilters.recallRange.maxDays) : null,
      },
    };
    
    dispatch(setFilters(filtersToApply));
    dispatch(setPaginationModel({ page: 0, pageSize: 10 }));
  };

  const handleResetFilters = () => {
    setLocalFilters({
      dateRange: {
        startDate: null,
        endDate: null,
      },
      salesName: "",
      channel: "",
      recallRange: {
        minDays: "",
        maxDays: "",
      },
    });
    dispatch(resetFilters());
    dispatch(setPaginationModel({ page: 0, pageSize: 10 }));
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* ตัวกรองกลุ่มเดิม */}
      <Box sx={{ mb: 2 }}>
        <FilterTab />
      </Box>

      {/* ตัวกรองเพิ่มเติม */}
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<MdExpandMore />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>ตัวกรองเพิ่มเติม</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
            <Grid container spacing={2}>
              {/* ตัวกรองช่วงวันที่ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2">ช่วงวันที่</Typography>
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
                      },
                    }}
                  />
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
                      },
                    }}
                  />
                </Stack>
              </Grid>

              {/* ตัวกรองพนักงานขายและช่องทาง */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2">พนักงานขายและช่องทาง</Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="ชื่อพนักงานขาย"
                    value={localFilters.salesName}
                    onChange={(e) => 
                      setLocalFilters(prev => ({ ...prev, salesName: e.target.value }))
                    }
                  >
                    <MenuItem value="">ทั้งหมด</MenuItem>
                    {salesList.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="ช่องทางการขาย"
                    value={localFilters.channel}
                    onChange={(e) => 
                      setLocalFilters(prev => ({ ...prev, channel: e.target.value }))
                    }
                  >
                    {channelList.map((channel) => (
                      <MenuItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Grid>

              {/* ตัวกรองวันที่ขาดการติดต่อ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2">วันที่ขาดการติดต่อ (RECALL)</Typography>
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
                      inputProps: { min: 0 }
                    }}
                  />
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
                      inputProps: { min: 0 }
                    }}
                  />
                </Stack>
              </Grid>

              {/* ปุ่มควบคุม */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2} sx={{ height: '100%', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    onClick={handleApplyFilters}
                  >
                    ค้นหา
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    onClick={handleResetFilters}
                  >
                    รีเซ็ตตัวกรอง
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