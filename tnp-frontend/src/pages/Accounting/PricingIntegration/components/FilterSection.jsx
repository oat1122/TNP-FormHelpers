import React from 'react';
import {
    Grid,
    TextField,
    InputAdornment,
    IconButton,
    Stack,
    Tooltip,
    Paper,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const FilterSection = ({
    searchQuery,
    onSearchChange,
    dateRange,
    onDateRangeChange,
    onRefresh,
    onResetFilters
}) => {
    return (
        <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        placeholder="ค้นหาด้วยชื่อบริษัท, หมายเลข PR, หรือชื่องาน"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <DatePicker
                        label="วันที่เริ่มต้น"
                        value={dateRange.start}
                        onChange={(date) => onDateRangeChange(prev => ({ ...prev, start: date }))}
                        slotProps={{ textField: { fullWidth: true } }}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <DatePicker
                        label="วันที่สิ้นสุด"
                        value={dateRange.end}
                        onChange={(date) => onDateRangeChange(prev => ({ ...prev, end: date }))}
                        slotProps={{ textField: { fullWidth: true } }}
                    />
                </Grid>

                <Grid item xs={12} md={2}>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="รีเฟรชข้อมูล">
                            <IconButton
                                onClick={onRefresh}
                                color="primary"
                                sx={{
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'primary.dark' },
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="ล้างตัวกรอง">
                            <IconButton
                                onClick={onResetFilters}
                                color="secondary"
                            >
                                <FilterIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default FilterSection;
