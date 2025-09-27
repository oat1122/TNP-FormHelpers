import React from "react";
import { FormControl, InputLabel, Select, MenuItem, Box, Chip, Typography } from "@mui/material";
import {
  DateRange,
  Today,
  Weekend,
  CalendarToday,
  Event,
  EventNote,
  NavigateNext,
} from "@mui/icons-material";

const TimePeriodSelector = ({
  value,
  onChange,
  label = "เลือกช่วงเวลาการคำนวณ",
  size = "medium",
}) => {
  const timePeriods = [
    {
      value: "today",
      label: "วันนี้",
      icon: <Today fontSize="small" />,
      description: "คำนวณจากงานที่เริ่มและยังไม่เสร็จในวันนี้",
    },
    {
      value: "tomorrow",
      label: "พรุ่งนี้",
      icon: <NavigateNext fontSize="small" />,
      description: "คำนวณจากงานที่เริ่มและยังไม่เสร็จในวันพรุ่งนี้",
    },
    {
      value: "thisWeek",
      label: "อาทิตนี้",
      icon: <DateRange fontSize="small" />,
      description: "คำนวณจากงานที่เริ่มและยังไม่เสร็จในอาทิตนี้ (จันทร์-อาทิตย์)",
    },
    {
      value: "nextWeek",
      label: "อาทิตหน้า",
      icon: <Weekend fontSize="small" />,
      description: "คำนวณจากงานที่เริ่มและยังไม่เสร็จในอาทิตหน้า (จันทร์-อาทิตย์)",
    },
    {
      value: "thisMonth",
      label: "เดือนนี้",
      icon: <CalendarToday fontSize="small" />,
      description: "คำนวณจากงานที่เริ่มและยังไม่เสร็จในเดือนนี้",
    },
    {
      value: "nextMonth",
      label: "เดือนหน้า",
      icon: <Event fontSize="small" />,
      description: "คำนวณจากงานที่เริ่มและยังไม่เสร็จในเดือนหน้า",
    },
    {
      value: "thisQuarter",
      label: "ไตรมาสนี้",
      icon: <EventNote fontSize="small" />,
      description: "คำนวณจากงานที่เริ่มและยังไม่เสร็จในไตรมาสนี้ (3 เดือน)",
    },
  ];

  const selectedPeriod = timePeriods.find((period) => period.value === value);

  return (
    <Box sx={{ minWidth: size === "small" ? 280 : 350, maxWidth: size === "small" ? 380 : 450 }}>
      <FormControl fullWidth size={size}>
        <InputLabel sx={{ fontWeight: "bold" }}>{label}</InputLabel>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          label={label}
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              borderWidth: 2,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: 2,
            },
          }}
          renderValue={(selected) => {
            const period = timePeriods.find((p) => p.value === selected);
            return period ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {period.icon}
                <Typography variant="body1" fontWeight="medium">
                  {period.label}
                </Typography>
              </Box>
            ) : (
              selected
            );
          }}
        >
          {timePeriods.map((period) => (
            <MenuItem
              key={period.value}
              value={period.value}
              sx={{
                py: 1.5,
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                "&.Mui-selected": {
                  backgroundColor: "primary.light",
                  "&:hover": {
                    backgroundColor: "primary.light",
                  },
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  width: "100%",
                }}
              >
                {period.icon}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" fontWeight="medium">
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
        <Box sx={{ mt: 1.5 }}>
          <Chip
            icon={selectedPeriod.icon}
            label={selectedPeriod.description}
            variant="outlined"
            size="medium"
            color="primary"
            sx={{
              maxWidth: "100%",
              height: "auto",
              "& .MuiChip-label": {
                whiteSpace: "normal",
                padding: "8px 12px",
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default TimePeriodSelector;
