import React from "react";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { Schedule as ScheduleIcon } from "@mui/icons-material";
import { PERIOD_TABS, SOURCE_OPTIONS } from "../constants/index.jsx";

/**
 * Period Tabs component
 * Displays period selection tabs and source filter dropdown
 *
 * @param {Object} props
 * @param {string} props.period - Current selected period
 * @param {Function} props.onPeriodChange - Period change handler
 * @param {string} props.sourceFilter - Current source filter value
 * @param {Function} props.onSourceFilterChange - Source filter change handler
 * @param {string} props.periodLabel - Display label for current period
 * @param {Object} props.comparison - Comparison data { change, change_percent }
 */
const PeriodTabs = ({
  period,
  onPeriodChange,
  sourceFilter,
  onSourceFilterChange,
  periodLabel,
  comparison,
}) => {
  return (
    <Paper elevation={1} sx={{ mb: 3 }}>
      <Tabs
        value={period}
        onChange={(_, newValue) => onPeriodChange(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        {PERIOD_TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
            sx={{ minHeight: 48, fontFamily: "Kanit" }}
          />
        ))}
      </Tabs>

      {/* Filters Row */}
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontFamily: "Kanit" }}>แหล่งที่มา</InputLabel>
            <Select
              value={sourceFilter}
              onChange={(e) => onSourceFilterChange(e.target.value)}
              label="แหล่งที่มา"
              sx={{ fontFamily: "Kanit" }}
            >
              {SOURCE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: "Kanit" }}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {periodLabel && (
            <Chip label={periodLabel} color="info" variant="outlined" icon={<ScheduleIcon />} />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default PeriodTabs;
