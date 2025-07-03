import React from "react";
import {
  Grid,
  Paper,
  Stack,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Button,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { MdDateRange, MdClear } from "react-icons/md";

function DateRangeFilter({
  draftFilters,
  setDraftFilters,
  clearStartDate,
  clearEndDate,
  handleQuickDateRange,
}) {
  return (
    <Grid xs={12} md={6} lg={4}>
      <Paper
        elevation={3}
        sx={{
          p: 2.8,
          borderRadius: 3,
          height: "100%",
          backgroundColor: "white",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 8px 20px rgba(148, 12, 12, 0.15)",
            transform: "translateY(-2px)",
          },
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(148, 12, 12, 0.1)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            height: "5px",
            width: "100%",
            background: "linear-gradient(90deg, #b71c1c 0%, #940c0c 100%)",
          },
        }}
      >
        <Stack spacing={2.5}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #b71c1c 0%, #940c0c 100%)",
                borderRadius: "50%",
                p: 1.2,
                boxShadow: "0 3px 8px rgba(148, 12, 12, 0.3)",
              }}
            >
              <MdDateRange style={{ fontSize: 20, color: "white" }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#940c0c",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "1.05rem",
                }}
              >
                วันที่สร้างลูกค้า
              </Typography>
              <Typography variant="caption" color="text.secondary">
                เลือกช่วงวันที่สร้างลูกค้าที่ต้องการ
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(148, 12, 12, 0.04)",
              border: "1px solid rgba(148, 12, 12, 0.15)",
              backdropFilter: "blur(8px)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <DatePicker
              label="วันที่เริ่มต้น"
              value={draftFilters.dateRange.startDate}
              onChange={(newValue) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  dateRange: {
                    ...prev.dateRange,
                    startDate: newValue,
                  },
                }))
              }
              slotProps={{
                textField: {
                  size: "medium",
                  fullWidth: true,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <MdDateRange style={{ color: "#940c0c", fontSize: "1.2rem" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {draftFilters.dateRange.startDate && (
                          <IconButton
                            size="small"
                            aria-label="clear date"
                            onClick={clearStartDate}
                            edge="end"
                            sx={{
                              color: "#940c0c",
                              "&:hover": { bgcolor: "rgba(148, 12, 12, 0.1)" },
                            }}
                          >
                            <MdClear />
                          </IconButton>
                        )}
                      </InputAdornment>
                    ),
                    sx: {
                      "&.Mui-focused": { boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)" },
                      borderRadius: 1.5,
                      height: 48,
                    },
                  },
                  sx: {
                    "& .MuiInputLabel-root": { color: "text.secondary", fontSize: "0.95rem" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#940c0c" },
                    "& .MuiOutlinedInput-root": {
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(148, 12, 12, 0.5)" },
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#940c0c",
                      borderWidth: "1.5px",
                    },
                  },
                },
              }}
              format="DD/MM/YYYY"
            />
            <DatePicker
              label="วันที่สิ้นสุด"
              value={draftFilters.dateRange.endDate}
              onChange={(newValue) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, endDate: newValue },
                }))
              }
              slotProps={{
                textField: {
                  size: "medium",
                  fullWidth: true,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <MdDateRange style={{ color: "#940c0c", fontSize: "1.2rem" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {draftFilters.dateRange.endDate && (
                          <IconButton
                            size="small"
                            aria-label="clear date"
                            onClick={clearEndDate}
                            edge="end"
                            sx={{
                              color: "#940c0c",
                              "&:hover": { bgcolor: "rgba(148, 12, 12, 0.1)" },
                            }}
                          >
                            <MdClear />
                          </IconButton>
                        )}
                      </InputAdornment>
                    ),
                    sx: {
                      "&.Mui-focused": { boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)" },
                      borderRadius: 1.5,
                      height: 48,
                    },
                  },
                  sx: {
                    "& .MuiInputLabel-root": { color: "text.secondary", fontSize: "0.95rem" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#940c0c" },
                    "& .MuiOutlinedInput-root": {
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(148, 12, 12, 0.5)" },
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#940c0c",
                      borderWidth: "1.5px",
                    },
                  },
                },
              }}
              format="DD/MM/YYYY"
            />
          </Box>
          <Typography
            variant="subtitle2"
            sx={{ mt: 1, mb: 0.5, fontWeight: 500, color: "text.secondary" }}
          >
            ช่วงเวลาที่ใช้บ่อย:
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1.5,
              "& button": { flexGrow: 1, whiteSpace: "nowrap" },
            }}
          >
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickDateRange("today")}
              sx={{
                borderRadius: "12px",
                fontSize: "0.85rem",
                borderColor: "rgba(148, 12, 12, 0.5)",
                color: "#940c0c",
                textTransform: "none",
                fontWeight: 600,
                py: 0.8,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                border: "1.5px solid rgba(148, 12, 12, 0.4)",
                "&:hover": {
                  backgroundColor: "rgba(148, 12, 12, 0.08)",
                  borderColor: "#940c0c",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                },
              }}
            >
              วันนี้
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickDateRange("yesterday")}
              sx={{
                borderRadius: "12px",
                fontSize: "0.85rem",
                borderColor: "rgba(148, 12, 12, 0.5)",
                color: "#940c0c",
                textTransform: "none",
                fontWeight: 600,
                py: 0.8,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                border: "1.5px solid rgba(148, 12, 12, 0.4)",
                "&:hover": {
                  backgroundColor: "rgba(148, 12, 12, 0.08)",
                  borderColor: "#940c0c",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                },
              }}
            >
              เมื่อวาน
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickDateRange("thisWeek")}
              sx={{
                borderRadius: "12px",
                fontSize: "0.85rem",
                borderColor: "rgba(148, 12, 12, 0.5)",
                color: "#940c0c",
                textTransform: "none",
                fontWeight: 600,
                py: 0.8,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                border: "1.5px solid rgba(148, 12, 12, 0.4)",
                "&:hover": {
                  backgroundColor: "rgba(148, 12, 12, 0.08)",
                  borderColor: "#940c0c",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                },
              }}
            >
              สัปดาห์นี้
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickDateRange("lastWeek")}
              sx={{
                borderRadius: "12px",
                fontSize: "0.85rem",
                borderColor: "rgba(148, 12, 12, 0.5)",
                color: "#940c0c",
                textTransform: "none",
                fontWeight: 600,
                py: 0.8,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                border: "1.5px solid rgba(148, 12, 12, 0.4)",
                "&:hover": {
                  backgroundColor: "rgba(148, 12, 12, 0.08)",
                  borderColor: "#940c0c",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                },
              }}
            >
              สัปดาห์ที่แล้ว
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickDateRange("thisMonth")}
              sx={{
                borderRadius: "12px",
                fontSize: "0.85rem",
                borderColor: "rgba(148, 12, 12, 0.5)",
                color: "#940c0c",
                textTransform: "none",
                fontWeight: 600,
                py: 0.8,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                border: "1.5px solid rgba(148, 12, 12, 0.4)",
                "&:hover": {
                  backgroundColor: "rgba(148, 12, 12, 0.08)",
                  borderColor: "#940c0c",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                },
              }}
            >
              เดือนนี้
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickDateRange("lastMonth")}
              sx={{
                borderRadius: "12px",
                fontSize: "0.85rem",
                borderColor: "rgba(148, 12, 12, 0.5)",
                color: "#940c0c",
                textTransform: "none",
                fontWeight: 600,
                py: 0.8,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                border: "1.5px solid rgba(148, 12, 12, 0.4)",
                "&:hover": {
                  backgroundColor: "rgba(148, 12, 12, 0.08)",
                  borderColor: "#940c0c",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                },
              }}
            >
              เดือนที่แล้ว
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Grid>
  );
}

export default DateRangeFilter;
