import React from "react";
import {
  Grid,
  Paper,
  Stack,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  InputAdornment,
  MenuItem,
  Chip,
  Checkbox,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import { MdPerson } from "react-icons/md";

function SalesFilter({
  draftFilters,
  salesList,
  handleSalesChange,
  selectAllSales,
  clearSalesSelection,
}) {
  return (
    <Grid xs={12} md={6} lg={4}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          height: "100%",
          backgroundColor: "white",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)",
          "&:hover": {
            boxShadow: "0 8px 20px rgba(148, 12, 12, 0.15)",
            transform: "translateY(-3px)",
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
              <MdPerson style={{ fontSize: 20, color: "white" }} />
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
                พนักงานขาย (SALES)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                เลือกพนักงานขายที่ต้องการกรองข้อมูล
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(148, 12, 12, 0.04)",
              border: "1px solid rgba(148, 12, 12, 0.15)",
              backdropFilter: "blur(8px)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "text.secondary", "&.Mui-focused": { color: "#940c0c" } }}>
                {draftFilters.salesName.length > 0
                  ? `เลือกแล้ว ${draftFilters.salesName.length} คน`
                  : "เลือกพนักงานขาย"}
              </InputLabel>
              <Select
                multiple
                value={draftFilters.salesName}
                onChange={handleSalesChange}
                input={
                  <OutlinedInput
                    label={
                      draftFilters.salesName.length > 0
                        ? `เลือกแล้ว ${draftFilters.salesName.length} คน`
                        : "เลือกพนักงานขาย"
                    }
                    sx={{
                      "&.Mui-focused": {
                        boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)",
                      },
                      borderRadius: 1.5,
                      height: 48,
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#940c0c",
                        borderWidth: "1.5px",
                      },
                    }}
                  />
                }
                startAdornment={
                  <InputAdornment position="start">
                    <MdPerson style={{ color: "#940c0c" }} />
                  </InputAdornment>
                }
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                    {selected.slice(0, 3).map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        sx={{
                          bgcolor: "rgba(148, 12, 12, 0.1)",
                          color: "#940c0c",
                          fontWeight: 600,
                          borderRadius: "8px",
                          height: "26px",
                          "& .MuiChip-deleteIcon": {
                            color: "#940c0c",
                            "&:hover": { color: "#b71c1c" },
                          },
                        }}
                      />
                    ))}
                    {selected.length > 3 && (
                      <Chip
                        label={`+${selected.length - 3} คน`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(148, 12, 12, 0.1)",
                          color: "#940c0c",
                          fontWeight: 600,
                          borderRadius: "8px",
                          height: "26px",
                        }}
                      />
                    )}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: { maxHeight: 300 },
                    sx: {
                      borderRadius: 2,
                      mt: 0.5,
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                      border: "1px solid rgba(148, 12, 12, 0.2)",
                      borderRadius: "12px",
                      "& .MuiMenuItem-root": {
                        borderRadius: 1.5,
                        my: 0.4,
                        mx: 0.6,
                        padding: "8px 16px",
                        "&:hover": { bgcolor: "rgba(148, 12, 12, 0.08)" },
                        "&.Mui-selected": {
                          bgcolor: "rgba(148, 12, 12, 0.12)",
                          "&:hover": { bgcolor: "rgba(148, 12, 12, 0.16)" },
                        },
                      },
                      "& .MuiCheckbox-root": {
                        color: "rgba(0, 0, 0, 0.54)",
                        "&.Mui-checked": { color: "#940c0c" },
                      },
                    },
                  },
                }}
              >
                {salesList && salesList.length > 0 ? (
                  salesList.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox
                        checked={draftFilters.salesName.indexOf(name) > -1}
                        sx={{ "&.Mui-checked": { color: "#940c0c" } }}
                      />
                      <ListItemText
                        primary={name}
                        primaryTypographyProps={{
                          fontWeight:
                            draftFilters.salesName.indexOf(name) > -1 ? 600 : 400,
                        }}
                      />
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <ListItemText primary="ไม่พบข้อมูลพนักงานขาย" />
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 1.5, display: "flex", gap: 1.5, justifyContent: "center" }}>
            <Button
              size="small"
              variant="text"
              onClick={selectAllSales}
              disabled={draftFilters.salesName.length === salesList.length}
              sx={{
                color: "#940c0c",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                py: 0.8,
                "&:hover": { bgcolor: "rgba(148, 12, 12, 0.08)" },
                "&.Mui-disabled": { color: "rgba(0, 0, 0, 0.26)" },
              }}
            >
              เลือกทั้งหมด
            </Button>
            <Divider orientation="vertical" flexItem />
            <Button
              size="small"
              variant="text"
              onClick={clearSalesSelection}
              disabled={draftFilters.salesName.length === 0}
              sx={{
                color: "#940c0c",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                py: 0.8,
                "&:hover": { bgcolor: "rgba(148, 12, 12, 0.08)" },
                "&.Mui-disabled": { color: "rgba(0, 0, 0, 0.26)" },
              }}
            >
              ล้างการเลือก
            </Button>
          </Box>
          {draftFilters.salesName.length > 0 && (
            <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: "rgba(148, 12, 12, 0.06)", border: "1px dashed rgba(148, 12, 12, 0.3)" }}>
              <Typography variant="caption" sx={{ color: "#940c0c", fontWeight: 600 }}>
                เลือกพนักงานขายแล้ว: {draftFilters.salesName.length} คน
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Grid>
  );
}

export default SalesFilter;
