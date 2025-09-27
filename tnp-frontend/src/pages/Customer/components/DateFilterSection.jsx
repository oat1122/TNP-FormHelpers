import { Grid2 as Grid, Stack, Typography, Box, InputAdornment, IconButton } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import React from "react";
import { MdDateRange, MdClear } from "react-icons/md";

import { dateRangeOptions, filterValidation } from "../constants/filterConstants";
import {
  FilterSectionPaper,
  FilterHeaderBox,
  FilterIconBox,
  FilterTitle,
  FilterDescription,
  FilterContentBox,
  QuickButton,
} from "../styles/FilterStyledComponents";
import { AdapterBuddhistDayjs } from "../utils/dateAdapters";

/**
 * Date Filter Section Component
 * Handles date range selection with Buddhist calendar support
 */
const DateFilterSection = ({ draftFilters, dateHelpers }) => {
  const { handleQuickDateRange, clearStartDate, clearEndDate, setStartDate, setEndDate } =
    dateHelpers;

  // Date picker common props for consistent styling
  const datePickerCommonProps = {
    slotProps: {
      textField: {
        size: "medium",
        fullWidth: true,
        sx: {
          "& .MuiInputLabel-root": {
            color: "text.secondary",
            fontSize: "0.95rem",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#940c0c",
          },
          "& .MuiOutlinedInput-root": {
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(148, 12, 12, 0.5)",
            },
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#940c0c",
            borderWidth: "1.5px",
          },
        },
        InputProps: {
          sx: {
            "&.Mui-focused": {
              boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)",
            },
            borderRadius: 1.5,
            height: 48,
          },
        },
      },
      day: {
        sx: {
          fontWeight: "bold",
          "&.Mui-selected": {
            bgcolor: "#940c0c",
            "&:hover": {
              bgcolor: "#b71c1c",
            },
          },
        },
      },
      calendarHeader: {
        sx: { bgcolor: "rgba(148, 12, 12, 0.08)", py: 1 },
      },
      layout: {
        sx: {
          ".MuiPickersCalendarHeader-root": {
            fontWeight: "bold",
            color: "#940c0c",
          },
        },
      },
      popper: {
        sx: {
          "& .MuiPaper-root": {
            boxShadow: "0px 5px 20px rgba(0,0,0,0.15)",
            borderRadius: "16px",
            border: "1px solid rgba(148, 12, 12, 0.2)",
          },
        },
      },
    },
    format: filterValidation.dateFormat,
  };

  return (
    <Grid xs={12} md={6} lg={4}>
      <FilterSectionPaper elevation={3}>
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          {/* Header with enhanced mobile layout */}
          <FilterHeaderBox>
            <FilterIconBox>
              <MdDateRange style={{ fontSize: 20, color: "white" }} />
            </FilterIconBox>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <FilterTitle variant="subtitle1">วันที่สร้างลูกค้า</FilterTitle>
              <FilterDescription variant="caption">
                เลือกช่วงวันที่สร้างลูกค้าที่ต้องการ
              </FilterDescription>
            </Box>
          </FilterHeaderBox>

          {/* Date Picker Fields with responsive layout */}
          <FilterContentBox>
            <LocalizationProvider dateAdapter={AdapterBuddhistDayjs}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: { xs: 2, md: 2 },
                }}
              >
                <DatePicker
                  label="วันที่เริ่มต้น"
                  value={draftFilters.dateRange.startDate}
                  onChange={setStartDate}
                  {...datePickerCommonProps}
                  slotProps={{
                    ...datePickerCommonProps.slotProps,
                    textField: {
                      ...datePickerCommonProps.slotProps.textField,
                      fullWidth: true,
                      size: "medium",
                      InputProps: {
                        ...datePickerCommonProps.slotProps.textField.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <MdDateRange
                              style={{
                                color: "#940c0c",
                                fontSize: "1.2rem",
                              }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            {draftFilters.dateRange.startDate && (
                              <IconButton
                                size="small"
                                aria-label="clear start date"
                                onClick={clearStartDate}
                                edge="end"
                                sx={{
                                  color: "#940c0c",
                                  "&:hover": {
                                    bgcolor: "rgba(148, 12, 12, 0.1)",
                                  },
                                }}
                              >
                                <MdClear />
                              </IconButton>
                            )}
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
                <DatePicker
                  label="วันที่สิ้นสุด"
                  value={draftFilters.dateRange.endDate}
                  onChange={setEndDate}
                  {...datePickerCommonProps}
                  slotProps={{
                    ...datePickerCommonProps.slotProps,
                    textField: {
                      ...datePickerCommonProps.slotProps.textField,
                      fullWidth: true,
                      size: "medium",
                      InputProps: {
                        ...datePickerCommonProps.slotProps.textField.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <MdDateRange
                              style={{
                                color: "#940c0c",
                                fontSize: "1.2rem",
                              }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            {draftFilters.dateRange.endDate && (
                              <IconButton
                                size="small"
                                aria-label="clear end date"
                                onClick={clearEndDate}
                                edge="end"
                                sx={{
                                  color: "#940c0c",
                                  "&:hover": {
                                    bgcolor: "rgba(148, 12, 12, 0.1)",
                                  },
                                }}
                              >
                                <MdClear />
                              </IconButton>
                            )}
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
              </Box>
            </LocalizationProvider>
          </FilterContentBox>

          {/* Quick Date Range Buttons with responsive grid */}
          <Typography
            variant="subtitle2"
            sx={{
              mt: { xs: 0.5, sm: 1 },
              mb: { xs: 1, sm: 0.5 },
              fontWeight: 600,
              color: "text.primary",
              fontSize: { xs: "0.875rem", sm: "0.9375rem" },
            }}
          >
            ช่วงเวลาที่ใช้บ่อย:
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
              },
              gap: { xs: 1, sm: 1.5 },
              "& button": {
                flexGrow: 1,
                whiteSpace: "nowrap",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                minHeight: { xs: "32px", sm: "36px" },
                padding: { xs: "6px 8px", sm: "8px 16px" },
              },
            }}
          >
            {dateRangeOptions.map((option) => (
              <QuickButton
                key={option.key}
                size="small"
                variant="outlined"
                onClick={() => handleQuickDateRange(option.key)}
                sx={{
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(148, 12, 12, 0.2)",
                  },
                }}
              >
                {option.label}
              </QuickButton>
            ))}
          </Box>

          {/* Status indicator for selected range */}
          {(draftFilters.dateRange.startDate || draftFilters.dateRange.endDate) && (
            <Box
              sx={{
                mt: 1,
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: "rgba(148, 12, 12, 0.05)",
                border: "1px solid rgba(148, 12, 12, 0.2)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                🗓️ ช่วงที่เลือก:{" "}
                {draftFilters.dateRange.startDate
                  ? draftFilters.dateRange.startDate.format("DD/MM/YYYY")
                  : "ไม่ระบุ"}{" "}
                -{" "}
                {draftFilters.dateRange.endDate
                  ? draftFilters.dateRange.endDate.format("DD/MM/YYYY")
                  : "ไม่ระบุ"}
              </Typography>
            </Box>
          )}
        </Stack>
      </FilterSectionPaper>
    </Grid>
  );
};

export default DateFilterSection;
