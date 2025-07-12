import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import {
  DateRange,
  Today,
  Weekend,
  CalendarToday,
  Event,
  EventNote,
  NavigateNext,
} from '@mui/icons-material';

const TimePeriodSelector = ({ value, onChange, label = 'ช่วงเวลาการคำนวณ' }) => {
  const timePeriods = [
    {
      value: 'today',
      label: 'วันนี้',
      icon: <Today fontSize="small" />,
      description: 'คำนวณกำลังการผลิตสำหรับวันนี้',
    },
    {
      value: 'tomorrow',
      label: 'พรุ่งนี้',
      icon: <NavigateNext fontSize="small" />,
      description: 'คำนวณกำลังการผลิตสำหรับพรุ่งนี้',
    },
    {
      value: 'thisWeek',
      label: 'อาทิตนี้',
      icon: <DateRange fontSize="small" />,
      description: 'คำนวณกำลังการผลิตสำหรับอาทิตนี้',
    },
    {
      value: 'nextWeek',
      label: 'อาทิตหน้า',
      icon: <Weekend fontSize="small" />,
      description: 'คำนวณกำลังการผลิตสำหรับอาทิตหน้า',
    },
    {
      value: 'thisMonth',
      label: 'เดือนนี้',
      icon: <CalendarToday fontSize="small" />,
      description: 'คำนวณกำลังการผลิตสำหรับเดือนนี้',
    },
    {
      value: 'nextMonth',
      label: 'เดือนหน้า',
      icon: <Event fontSize="small" />,
      description: 'คำนวณกำลังการผลิตสำหรับเดือนหน้า',
    },
    {
      value: 'thisQuarter',
      label: 'ไตรมาสนี้',
      icon: <EventNote fontSize="small" />,
      description: 'คำนวณกำลังการผลิตสำหรับไตรมาสนี้',
    },
  ];

  const selectedPeriod = timePeriods.find(period => period.value === value);

  return (
    <Box sx={{ minWidth: 300 }}>
      <FormControl fullWidth size="small">
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          label={label}
          renderValue={(selected) => {
            const period = timePeriods.find(p => p.value === selected);
            return period ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {period.icon}
                {period.label}
              </Box>
            ) : selected;
          }}
        >
          {timePeriods.map((period) => (
            <MenuItem key={period.value} value={period.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                {period.icon}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {period.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {period.description}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {selectedPeriod && (
        <Box sx={{ mt: 1 }}>
          <Chip
            icon={selectedPeriod.icon}
            label={selectedPeriod.description}
            variant="outlined"
            size="small"
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default TimePeriodSelector; 