// filepath: d:\01oat\TNP-FormHelpers\tnp-frontend\src\pages\Customer\FilterPanel.jsx
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Grid2 as Grid,
  Typography,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import { MdExpandMore, MdFilterList } from "react-icons/md";
import { RiRefreshLine } from "react-icons/ri";
import { useGetUserByRoleQuery } from "../../features/globalApi";
import { setSalesList } from "../../features/Customer/customerSlice";

// Import custom hooks
import { useFilterState } from "./hooks/useFilterState";
import { useFilterActions } from "./hooks/useFilterActions";
import { useDateRangeHelpers } from "./hooks/useDateRangeHelpers";
import { useSelectionHelpers } from "./hooks/useSelectionHelpers";

// Import styled components
import {
  StyledAccordion,
  StyledAccordionSummary,
  StyledAccordionDetails,
  ExpandIconBox,
  StatusChip,
  FilterIconBox,
  FilterTitle,
  PrimaryActionButton,
  SecondaryActionButton,
} from "./styles/FilterStyledComponents";

// Import filter components
import {
  DateFilterSection,
  SalesFilterSection,
  ChannelFilterSection,
} from "./components/FilterComponents";

function FilterPanel() {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);

  // Get sales list from API
  const { data: salesData, isLoading: salesLoading } =
    useGetUserByRoleQuery("sale");

  // Custom hooks for state management
  const {
    filters,
    draftFilters,
    setDraftFilters,
    salesList,
    filteredCount,
    activeFilterCount,
    prepareFiltersForAPI,
    resetDraftFilters,
  } = useFilterState();

  const {
    isFiltering,
    errorMessage,
    handleApplyFilters,
    handleResetFilters,
    clearErrorMessage,
  } = useFilterActions();

  // Helper hooks
  const dateHelpers = useDateRangeHelpers(setDraftFilters);
  const selectionHelpers = useSelectionHelpers(setDraftFilters, salesList);

  // Update sales list from API (only once when data is loaded)
  useEffect(() => {
    if (salesData?.sale_role?.length > 0) {
      const salesNames = salesData.sale_role
        .map((user) => user.username)
        .filter(Boolean);
      dispatch(setSalesList(salesNames));
    }
  }, [salesData, dispatch]); 
  
  // Handle accordion expand/collapse
  const handleAccordionChange = (_, isExpanded) => {
    setExpanded(isExpanded);
  };

  // Apply filters with collapse
  const handleApplyFiltersWithCollapse = () => {
    handleApplyFilters(draftFilters, prepareFiltersForAPI);
    setExpanded(false); // Collapse filter panel after applying
  };

  // Reset filters with collapse
  const handleResetFiltersWithCollapse = () => {
    handleResetFilters(resetDraftFilters);
    setExpanded(false); // Collapse filter panel after reset
  };


  return (
    <Box sx={{ mb: 3 }}>
      {/* Advanced filters */}
      <StyledAccordion
        expanded={expanded}
        onChange={handleAccordionChange}
      >
        <StyledAccordionSummary
          expanded={expanded}
          expandIcon={
            <ExpandIconBox expanded={expanded}>
              <MdExpandMore style={{ fontSize: 24 }} />
            </ExpandIconBox>
          }
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              pr: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <FilterIconBox>
                <MdFilterList
                  style={{
                    fontSize: 24,
                    color: expanded ? "#fff" : "#940c0c",
                  }}
                />
              </FilterIconBox>
              <Box>
                <FilterTitle
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    fontSize: "1.15rem",
                    color: expanded ? "#940c0c" : "text.primary",
                    letterSpacing: "0.5px",
                    textShadow: expanded
                      ? "0 1px 1px rgba(148, 12, 12, 0.15)"
                      : "none",
                  }}
                >
                  ตัวกรองขั้นสูง
                </FilterTitle>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    mt: 0.3,
                  }}
                >
                  ค้นหาลูกค้าด้วยเงื่อนไขที่หลากหลาย
                </Typography>
              </Box>
              {activeFilterCount > 0 && (
                <StatusChip
                  label={`${activeFilterCount} กรอง`}
                  size="small"
                  variant="active"
                  sx={{ ml: 2 }}
                />
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <StatusChip
                label={
                  filteredCount > 0
                    ? `พบ ${filteredCount.toLocaleString("th-TH")} รายการ`
                    : "ไม่พบข้อมูล"
                }
                size="small"
                variant={filteredCount > 0 ? "success" : "default"}
              />
            </Box>
          </Box>
        </StyledAccordionSummary>
        <StyledAccordionDetails>
          {errorMessage && (
            <Alert
              severity="error"
              onClose={clearErrorMessage}
              sx={{ mb: 2, borderRadius: 1.5 }}
            >
              {errorMessage}
            </Alert>
          )}
          
                    <Grid container spacing={3}>
            {/* Filter Sections */}
            <DateFilterSection
              draftFilters={draftFilters}
              dateHelpers={dateHelpers}
            />
            
            <SalesFilterSection
              draftFilters={draftFilters}
              salesList={salesList}
              selectionHelpers={selectionHelpers}
            />
            
            <ChannelFilterSection
              draftFilters={draftFilters}
              selectionHelpers={selectionHelpers}
            />

            {/* Control buttons */}
            <Grid xs={12}>
              <Stack
                direction="row"
                spacing={2}
                justifyContent="flex-end"
                sx={{ mt: 3 }}
              >
                <SecondaryActionButton
                  variant="outlined"
                  color="inherit"
                  startIcon={<RiRefreshLine style={{ fontSize: "1.3rem" }} />}
                  onClick={handleResetFiltersWithCollapse}
                >
                  รีเซ็ตตัวกรอง
                </SecondaryActionButton>

                <PrimaryActionButton
                  variant="contained"
                  startIcon={
                    isFiltering ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <MdFilterList style={{ fontSize: "1.3rem" }} />
                    )
                  }
                  onClick={handleApplyFiltersWithCollapse}
                  disabled={isFiltering}
                >
                  {isFiltering ? "กำลังกรอง..." : "ใช้งานตัวกรอง"}
                </PrimaryActionButton>
              </Stack>
            </Grid>
          </Grid>
        </StyledAccordionDetails>
      </StyledAccordion>
    </Box>
  );
}

export default FilterPanel;
