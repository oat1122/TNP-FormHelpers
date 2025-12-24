import React from "react";
import {
  Today as TodayIcon,
  DateRange as WeekIcon,
  Event as MonthIcon,
  EventNote as QuarterIcon,
  CalendarToday as YearIcon,
} from "@mui/icons-material";

/**
 * Period tab configuration for dashboard
 */
export const PERIOD_TABS = [
  { value: "today", label: "วันนี้", icon: <TodayIcon fontSize="small" /> },
  { value: "week", label: "สัปดาห์นี้", icon: <WeekIcon fontSize="small" /> },
  { value: "month", label: "เดือนนี้", icon: <MonthIcon fontSize="small" /> },
  { value: "quarter", label: "ไตรมาสนี้", icon: <QuarterIcon fontSize="small" /> },
  { value: "year", label: "ปีนี้", icon: <YearIcon fontSize="small" /> },
];

/**
 * Source filter options
 */
export const SOURCE_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "telesales", label: "Telesales" },
  { value: "sales", label: "Sales" },
  { value: "online", label: "Online" },
  { value: "office", label: "Office" },
];
