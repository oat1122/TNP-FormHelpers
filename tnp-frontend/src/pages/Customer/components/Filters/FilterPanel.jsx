// filepath: src/pages/Customer/components/Filters/FilterPanel.jsx
import { Box, Grid2 as Grid, Typography, Stack, Alert, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import { MdExpandMore, MdFilterList } from "react-icons/md";
import { RiRefreshLine } from "react-icons/ri";

// Filter section components (relative to this file in Filters/)
import { DateFilterSection, SalesFilterSection, ChannelFilterSection } from "./sections";

// Hooks (relative path from Filters/)
import {
  useDateRangeHelpers,
  useFilterActions,
  useFilterState,
  useSelectionHelpers,
  useFilterInitializer,
} from "../../hooks";

// Styled components (relative path from Filters/)
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
} from "../../styles/FilterStyledComponents";

function FilterPanel() {
  const [expanded, setExpanded] = useState(false);

  // 1. Initializer Hook - syncs sales list from API to Redux
  useFilterInitializer();

  // 2. Filter State Hook
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

  // 3. Filter Actions Hook
  const { isFiltering, errorMessage, handleApplyFilters, handleResetFilters, clearErrorMessage } =
    useFilterActions();

  // 4. Helper Hooks
  const dateHelpers = useDateRangeHelpers(setDraftFilters);
  const selectionHelpers = useSelectionHelpers(setDraftFilters, salesList);

  // Data transformation ย้ายมาที่ parent (จุดที่ 2)
  const salesOptions = (salesList || []).map((name) => ({
    value: name,
    label: name,
  }));

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
      {/* Advanced filters with enhanced design */}
      <StyledAccordion expanded={expanded} onChange={handleAccordionChange}>
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
              pr: { xs: 1, sm: 2 },
              gap: { xs: 1, sm: 2 },
            }}
          >
            {/* Left side - Filter icon and title */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: 0, // Allow text truncation if needed
              }}
            >
              <FilterIconBox>
                <MdFilterList
                  style={{
                    fontSize: 24,
                    color: "#ffffff",
                  }}
                />
              </FilterIconBox>
              <Box sx={{ ml: { xs: 1.5, sm: 2 }, flex: 1, minWidth: 0 }}>
                <FilterTitle
                  variant="subtitle1"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  ตัวกรองขั้นสูง
                  {/* Active filter count badge */}
                  {activeFilterCount > 0 && (
                    <StatusChip
                      label={`${activeFilterCount} กรอง`}
                      size="small"
                      variant="active"
                      sx={{
                        fontSize: "0.75rem",
                        height: "20px",
                        display: { xs: "none", sm: "inline-flex" },
                      }}
                    />
                  )}
                </FilterTitle>
                <Typography
                  variant="caption"
                  sx={{
                    display: { xs: "none", md: "block" },
                    color: "text.secondary",
                    fontSize: "0.875rem",
                    lineHeight: 1.2,
                  }}
                >
                  ค้นหาลูกค้าด้วยเงื่อนไขที่หลากหลาย
                </Typography>
                {/* Mobile: Show active filters count */}
                {activeFilterCount > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: { xs: "block", sm: "none" },
                      color: "primary.main",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    มี {activeFilterCount} ตัวกรองที่เปิดใช้งาน
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Right side - Results and status */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 1 },
                flexShrink: 0,
              }}
            >
              {/* Loading indicator */}
              {isFiltering && (
                <CircularProgress
                  size={20}
                  sx={{
                    color: "primary.main",
                    mr: 1,
                  }}
                />
              )}

              {/* Results chip */}
              <StatusChip
                label={
                  isFiltering
                    ? "กำลังค้นหา..."
                    : filteredCount > 0
                      ? `${filteredCount.toLocaleString("th-TH")} รายการ`
                      : "ไม่พบข้อมูล"
                }
                size="small"
                variant={isFiltering ? "info" : filteredCount > 0 ? "success" : "default"}
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  height: { xs: "24px", sm: "28px" },
                  "& .MuiChip-label": {
                    px: { xs: 1, sm: 1.5 },
                  },
                }}
              />
            </Box>
          </Box>
        </StyledAccordionSummary>

        <StyledAccordionDetails>
          {/* Error message with enhanced styling */}
          {errorMessage && (
            <Alert
              severity="error"
              onClose={clearErrorMessage}
              sx={{
                mb: 3,
                borderRadius: 2,
                "& .MuiAlert-icon": {
                  fontSize: "1.25rem",
                },
                "& .MuiAlert-action": {
                  pt: 0,
                },
              }}
            >
              {errorMessage}
            </Alert>
          )}

          {/* Filter sections with improved spacing */}
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <DateFilterSection draftFilters={draftFilters} dateHelpers={dateHelpers} />

            <SalesFilterSection
              draftFilters={draftFilters}
              salesList={salesList}
              salesOptions={salesOptions}
              selectionHelpers={selectionHelpers}
            />

            <ChannelFilterSection draftFilters={draftFilters} selectionHelpers={selectionHelpers} />

            {/* Control buttons with responsive layout */}
            <Grid xs={12}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="flex-end"
                sx={{
                  mt: { xs: 2, sm: 3 },
                  pt: 3,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <SecondaryActionButton
                  variant="outlined"
                  color="inherit"
                  startIcon={<RiRefreshLine style={{ fontSize: "1.3rem" }} />}
                  onClick={handleResetFiltersWithCollapse}
                  sx={{
                    order: { xs: 2, sm: 1 },
                    width: { xs: "100%", sm: "auto" },
                  }}
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
                  sx={{
                    order: { xs: 1, sm: 2 },
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  {isFiltering ? "กำลังกรอง..." : "ใช้งานตัวกรอง"}
                </PrimaryActionButton>
              </Stack>
            </Grid>
          </Grid>
        </StyledAccordionDetails>
      </StyledAccordion>

      {/* Quick status summary - Mobile friendly */}
      {expanded && (activeFilterCount > 0 || filteredCount > 0) && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "background.paper",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            display: { xs: "block", md: "none" },
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            สรุปผลการกรอง:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {activeFilterCount > 0 && (
              <StatusChip
                label={`${activeFilterCount} ตัวกรองที่ใช้`}
                size="small"
                variant="active"
              />
            )}
            <StatusChip
              label={`${filteredCount.toLocaleString("th-TH")} รายการ`}
              size="small"
              variant="success"
            />
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default FilterPanel;
