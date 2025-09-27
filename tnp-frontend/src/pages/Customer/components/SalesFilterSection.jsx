import React from "react";
import {
  Grid2 as Grid,
  Stack,
  Typography,
  Box,
  Checkbox,
  ListItemText,
  MenuItem,
  OutlinedInput,
  InputAdornment,
  Button,
  Divider,
  Chip,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { MdPerson } from "react-icons/md";
import {
  FilterSectionPaper,
  FilterHeaderBox,
  FilterIconBox,
  FilterTitle,
  FilterDescription,
  FilterContentBox,
  StyledFormControl,
} from "../styles/FilterStyledComponents";
import { filterPanelConfig } from "../constants/filterConstants";

/**
 * Sales Filter Section Component
 * Handles sales person multi-selection with quick actions
 */
const SalesFilterSection = ({ draftFilters, salesList, selectionHelpers }) => {
  const { handleSalesChange, selectAllSales, clearSalesSelection } = selectionHelpers;

  return (
    <Grid xs={12} md={6} lg={4}>
      <FilterSectionPaper elevation={3}>
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          {/* Header with enhanced mobile layout */}
          <FilterHeaderBox>
            <FilterIconBox>
              <MdPerson style={{ fontSize: 20, color: "white" }} />
            </FilterIconBox>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <FilterTitle variant="subtitle1">พนักงานขาย (SALES)</FilterTitle>
              <FilterDescription variant="caption">
                เลือกพนักงานขายที่ต้องการกรองข้อมูล
              </FilterDescription>
            </Box>
          </FilterHeaderBox>

          {/* Sales Selection with improved mobile UX */}
          <FilterContentBox>
            <StyledFormControl fullWidth>
              <Typography
                variant="body2"
                sx={{
                  color: "text.primary",
                  mb: { xs: 1.5, sm: 1 },
                  fontSize: { xs: "0.9rem", sm: "0.95rem" },
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {draftFilters.salesName.length > 0
                  ? `เลือกแล้ว ${draftFilters.salesName.length} คน`
                  : "เลือกพนักงานขาย"}
                {draftFilters.salesName.length > 0 && (
                  <Chip
                    label={`${draftFilters.salesName.length}/${salesList?.length || 0}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(148, 12, 12, 0.1)",
                      color: "#940c0c",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      height: "20px",
                    }}
                  />
                )}
              </Typography>

              <Select
                multiple
                value={draftFilters.salesName}
                onChange={handleSalesChange}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return (
                      <Typography sx={{ color: "text.secondary" }}>เลือกพนักงานขาย</Typography>
                    );
                  }
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.slice(0, 3).map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          size="small"
                          sx={{
                            bgcolor: "rgba(148, 12, 12, 0.1)",
                            color: "#940c0c",
                            fontWeight: 600,
                            borderRadius: "6px",
                            height: "24px",
                            fontSize: "0.75rem",
                          }}
                        />
                      ))}
                      {selected.length > 3 && (
                        <Chip
                          label={`+${selected.length - 3} คน`}
                          size="small"
                          sx={{
                            bgcolor: "rgba(148, 12, 12, 0.15)",
                            color: "#940c0c",
                            fontWeight: 700,
                            borderRadius: "6px",
                            height: "24px",
                            fontSize: "0.75rem",
                          }}
                        />
                      )}
                    </Box>
                  );
                }}
                displayEmpty
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 48 * 4.5 + 8,
                      width: 280,
                      borderRadius: 12,
                      marginTop: 8,
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                    },
                  },
                  MenuListProps: {
                    sx: {
                      padding: 1,
                    },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    border: "1px solid rgba(148, 12, 12, 0.3)",
                    minHeight: "48px",
                    fontFamily: "'Kanit', sans-serif",
                    "&:hover": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(148, 12, 12, 0.5)",
                      },
                    },
                    "&.Mui-focused": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#940c0c",
                        borderWidth: "2px",
                      },
                    },
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                  "& .MuiSelect-select": {
                    padding: "10px 16px",
                    fontSize: "14px",
                  },
                }}
              >
                {salesList && salesList.length > 0 ? (
                  salesList.map((name) => (
                    <MenuItem
                      key={name}
                      value={name}
                      sx={{
                        borderRadius: 1.5,
                        margin: "2px 0",
                        minHeight: "44px",
                        padding: "8px 12px",
                        "&:hover": {
                          bgcolor: "rgba(148, 12, 12, 0.08)",
                        },
                        "&.Mui-selected": {
                          bgcolor: "rgba(148, 12, 12, 0.12)",
                          "&:hover": {
                            bgcolor: "rgba(148, 12, 12, 0.15)",
                          },
                        },
                      }}
                    >
                      <Checkbox
                        checked={draftFilters.salesName.indexOf(name) > -1}
                        size="small"
                        sx={{
                          color: "rgba(148, 12, 12, 0.6)",
                          "&.Mui-checked": {
                            color: "#940c0c",
                          },
                          marginRight: 1,
                        }}
                      />
                      <ListItemText
                        primary={name}
                        sx={{
                          "& .MuiTypography-root": {
                            fontFamily: "'Kanit', sans-serif",
                            fontSize: "14px",
                            fontWeight: draftFilters.salesName.indexOf(name) > -1 ? 600 : 400,
                            color:
                              draftFilters.salesName.indexOf(name) > -1
                                ? "#940c0c"
                                : "text.primary",
                          },
                        }}
                      />
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <Typography sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      ไม่พบข้อมูลพนักงานขาย
                    </Typography>
                  </MenuItem>
                )}
              </Select>

              {/* Selected sales display with better mobile layout */}
              {draftFilters.salesName.length > 0 && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: "rgba(148, 12, 12, 0.05)",
                    border: "1px solid rgba(148, 12, 12, 0.15)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      mb: 1,
                      display: "block",
                    }}
                  >
                    รายชื่อที่เลือก:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.8,
                    }}
                  >
                    {draftFilters.salesName
                      .slice(0, filterPanelConfig.maxSalesSelection || 6)
                      .map((name) => (
                        <Chip
                          key={name}
                          label={name}
                          size="small"
                          sx={{
                            bgcolor: "rgba(148, 12, 12, 0.1)",
                            color: "#940c0c",
                            fontWeight: 600,
                            borderRadius: "8px",
                            height: { xs: "24px", sm: "26px" },
                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            "&:hover": {
                              bgcolor: "rgba(148, 12, 12, 0.15)",
                            },
                          }}
                        />
                      ))}
                    {draftFilters.salesName.length > (filterPanelConfig.maxSalesSelection || 6) && (
                      <Chip
                        label={`+${draftFilters.salesName.length - (filterPanelConfig.maxSalesSelection || 6)} คน`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(148, 12, 12, 0.15)",
                          color: "#940c0c",
                          fontWeight: 700,
                          borderRadius: "8px",
                          height: { xs: "24px", sm: "26px" },
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </StyledFormControl>
          </FilterContentBox>

          {/* Quick Actions with responsive layout */}
          <Box
            sx={{
              mt: { xs: 1, sm: 1.5 },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1, sm: 1.5 },
              justifyContent: "center",
            }}
          >
            <Button
              size="small"
              variant="text"
              onClick={selectAllSales}
              disabled={
                !salesList ||
                salesList.length === 0 ||
                draftFilters.salesName.length === salesList.length
              }
              sx={{
                color: "#940c0c",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1, sm: 0.8 },
                minHeight: { xs: "36px", sm: "auto" },
                width: { xs: "100%", sm: "auto" },
                "&:hover": {
                  bgcolor: "rgba(148, 12, 12, 0.08)",
                  transform: "translateY(-1px)",
                },
                "&.Mui-disabled": {
                  color: "rgba(0, 0, 0, 0.26)",
                },
              }}
            >
              เลือกทั้งหมด ({salesList?.length || 0})
            </Button>

            {/* Vertical divider - hidden on mobile */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", sm: "block" } }}
            />

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
                px: { xs: 2, sm: 2.5 },
                width: { xs: "100%", sm: "auto" },
                py: { xs: 1, sm: 0.8 },
                minHeight: { xs: "36px", sm: "auto" },
                "&:hover": {
                  bgcolor: "rgba(148, 12, 12, 0.08)",
                  transform: "translateY(-1px)",
                },
                "&.Mui-disabled": {
                  color: "rgba(0, 0, 0, 0.26)",
                },
              }}
            >
              ล้างการเลือก
            </Button>
          </Box>

          {/* Status Display with enhanced design */}
          <Box
            sx={{
              mt: { xs: 1, sm: 1 },
              p: { xs: 1.5, sm: 1.5 },
              borderRadius: 2,
              bgcolor:
                draftFilters.salesName.length > 0
                  ? "rgba(148, 12, 12, 0.06)"
                  : "rgba(0, 0, 0, 0.04)",
              border:
                draftFilters.salesName.length > 0
                  ? "1px dashed rgba(148, 12, 12, 0.3)"
                  : "1px dashed rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s ease",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: draftFilters.salesName.length > 0 ? "#940c0c" : "text.secondary",
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.8rem" },
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {draftFilters.salesName.length > 0 ? "✅" : "ℹ️"}
              {draftFilters.salesName.length > 0
                ? `เลือกพนักงานขายแล้ว: ${draftFilters.salesName.length} คน`
                : "ยังไม่ได้เลือกพนักงานขาย"}
            </Typography>
          </Box>
        </Stack>
      </FilterSectionPaper>
    </Grid>
  );
};

export default SalesFilterSection;
