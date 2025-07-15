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
const SalesFilterSection = ({
  draftFilters,
  salesList,
  selectionHelpers,
}) => {
  const {
    handleSalesChange,
    selectAllSales,
    clearSalesSelection,
  } = selectionHelpers;

  return (
    <Grid xs={12} md={6} lg={4}>
      <FilterSectionPaper elevation={3}>
        <Stack spacing={2.5}>
          {/* Header */}
          <FilterHeaderBox>
            <FilterIconBox>
              <MdPerson style={{ fontSize: 20, color: "white" }} />
            </FilterIconBox>
            <Box>
              <FilterTitle variant="subtitle1">
                พนักงานขาย (SALES)
              </FilterTitle>
              <FilterDescription variant="caption">
                เลือกพนักงานขายที่ต้องการกรองข้อมูล
              </FilterDescription>
            </Box>
          </FilterHeaderBox>

          {/* Sales Selection */}
          <FilterContentBox>
            <StyledFormControl fullWidth size="small">
              <Typography 
                variant="body2" 
                sx={{ 
                  color: "text.secondary",
                  mb: 1,
                  fontSize: "0.95rem"
                }}
              >
                {draftFilters.salesName.length > 0
                  ? `เลือกแล้ว ${draftFilters.salesName.length} คน`
                  : "เลือกพนักงานขาย"}
              </Typography>
              <select
                multiple
                value={draftFilters.salesName}
                onChange={handleSalesChange}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  border: "1px solid rgba(148, 12, 12, 0.3)",
                  padding: "8px 16px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "white",
                  "&:focus": {
                    borderColor: "#940c0c",
                    boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)",
                  }
                }}
              >
                {salesList && salesList.length > 0 ? (
                  salesList.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                ) : (
                  <option disabled>ไม่พบข้อมูลพนักงานขาย</option>
                )}
              </select>
              
              {/* Selected sales display */}
              {draftFilters.salesName.length > 0 && (
                <Box
                  sx={{
                    mt: 1.5,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.8,
                  }}
                >
                  {draftFilters.salesName.slice(0, 5).map((name) => (
                    <Chip
                      key={name}
                      label={name}
                      size="small"
                      sx={{
                        bgcolor: "rgba(148, 12, 12, 0.1)",
                        color: "#940c0c",
                        fontWeight: 600,
                        borderRadius: "8px",
                        height: "26px",
                      }}
                    />
                  ))}
                  {draftFilters.salesName.length > 5 && (
                    <Chip
                      label={`+${draftFilters.salesName.length - 5} คน`}
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
            </StyledFormControl>
          </FilterContentBox>

          {/* Quick Actions */}
          <Box
            sx={{
              mt: 1.5,
              display: "flex",
              gap: 1.5,
              justifyContent: "center",
            }}
          >
            <Button
              size="small"
              variant="text"
              onClick={selectAllSales}
              disabled={
                draftFilters.salesName.length === salesList.length
              }
              sx={{
                color: "#940c0c",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                py: 0.8,
                "&:hover": {
                  bgcolor: "rgba(148, 12, 12, 0.08)",
                },
                "&.Mui-disabled": {
                  color: "rgba(0, 0, 0, 0.26)",
                },
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
                "&:hover": {
                  bgcolor: "rgba(148, 12, 12, 0.08)",
                },
                "&.Mui-disabled": {
                  color: "rgba(0, 0, 0, 0.26)",
                },
              }}
            >
              ล้างการเลือก
            </Button>
          </Box>

          {/* Status Display */}
          {draftFilters.salesName.length > 0 && (
            <Box
              sx={{
                mt: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(148, 12, 12, 0.06)",
                border: "1px dashed rgba(148, 12, 12, 0.3)",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#940c0c", fontWeight: 600 }}
              >
                เลือกพนักงานขายแล้ว: {draftFilters.salesName.length} คน
              </Typography>
            </Box>
          )}
        </Stack>
      </FilterSectionPaper>
    </Grid>
  );
};

export default SalesFilterSection; 