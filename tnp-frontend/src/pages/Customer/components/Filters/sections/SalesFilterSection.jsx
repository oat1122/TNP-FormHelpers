import { Typography, Box, Button, Divider, Chip } from "@mui/material";
import React from "react";
import { MdPerson, MdSelectAll, MdClear } from "react-icons/md";

// Constants
import { filterPanelConfig, filterColors } from "../../../constants/filterConstants";
// Styled components
import { StyledFormControl } from "../../../styles/FilterStyledComponents";
// UI Components
import { FilterSectionFrame, FilterMultiSelect } from "../ui";

/**
 * Sales Filter Section Component
 * Presentational Component - รับ salesOptions ที่แปลงแล้วจาก parent
 */
const SalesFilterSection = ({ draftFilters, salesList, salesOptions, selectionHelpers }) => {
  const { handleSalesChange, selectAllSales, clearSalesSelection } = selectionHelpers;

  return (
    <FilterSectionFrame
      icon={<MdPerson style={{ fontSize: 20, color: "white" }} />}
      title="พนักงานขาย (SALES)"
      description="เลือกพนักงานขายที่ต้องการกรองข้อมูล"
    >
      {/* Header with count */}
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
                bgcolor: filterColors.primaryLight,
                color: filterColors.primary,
                fontWeight: 600,
                fontSize: "0.75rem",
                height: "20px",
              }}
            />
          )}
        </Typography>

        {/*ใช้ salesOptions ที่ส่งมาจาก parent */}
        <FilterMultiSelect
          options={salesOptions}
          value={draftFilters.salesName}
          onChange={handleSalesChange}
          placeholder="เลือกพนักงานขาย"
          maxChipsDisplay={3}
          moreLabel="คน"
        />

        {/* Selected sales display */}
        {draftFilters.salesName.length > 0 && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: filterColors.primaryLight,
              border: `1px solid ${filterColors.primaryBorder}`,
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
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
              {draftFilters.salesName
                .slice(0, filterPanelConfig.maxSalesSelection || 6)
                .map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    size="small"
                    sx={{
                      bgcolor: filterColors.primaryLight,
                      color: filterColors.primary,
                      fontWeight: 600,
                      borderRadius: "8px",
                      height: { xs: "24px", sm: "26px" },
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                    }}
                  />
                ))}
              {draftFilters.salesName.length > (filterPanelConfig.maxSalesSelection || 6) && (
                <Chip
                  label={`+${draftFilters.salesName.length - (filterPanelConfig.maxSalesSelection || 6)} คน`}
                  size="small"
                  sx={{
                    bgcolor: filterColors.primaryBorder,
                    color: filterColors.primary,
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

      {/* Quick Actions */}
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
          variant="outlined"
          startIcon={<MdSelectAll />}
          onClick={selectAllSales}
          disabled={
            !salesList ||
            salesList.length === 0 ||
            draftFilters.salesName.length === salesList.length
          }
          sx={{
            color: filterColors.primary,
            borderColor: filterColors.primaryBorder,
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            px: { xs: 2, sm: 2.5 },
            py: { xs: 1, sm: 0.8 },
            minHeight: { xs: "36px", sm: "auto" },
            width: { xs: "100%", sm: "auto" },
            "&:hover": {
              bgcolor: filterColors.primaryLight,
              borderColor: filterColors.primary,
            },
            "&.Mui-disabled": {
              color: "rgba(0, 0, 0, 0.26)",
              borderColor: "rgba(0, 0, 0, 0.12)",
            },
          }}
        >
          เลือกทั้งหมด ({salesList?.length || 0})
        </Button>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

        <Button
          size="small"
          variant="text"
          startIcon={<MdClear />}
          onClick={clearSalesSelection}
          disabled={draftFilters.salesName.length === 0}
          sx={{
            color: "text.secondary",
            textTransform: "none",
            fontWeight: 500,
            borderRadius: 2,
            px: { xs: 2, sm: 2.5 },
            py: { xs: 1, sm: 0.8 },
            minHeight: { xs: "36px", sm: "auto" },
            width: { xs: "100%", sm: "auto" },
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.04)",
              color: filterColors.primary,
            },
            "&.Mui-disabled": { color: "rgba(0, 0, 0, 0.26)" },
          }}
        >
          ล้างการเลือก
        </Button>
      </Box>

      {/* Status Display */}
      <Box
        sx={{
          mt: { xs: 1, sm: 1 },
          p: { xs: 1.5, sm: 1.5 },
          borderRadius: 2,
          bgcolor:
            draftFilters.salesName.length > 0 ? filterColors.primaryLight : "rgba(0, 0, 0, 0.04)",
          border:
            draftFilters.salesName.length > 0
              ? `1px dashed ${filterColors.primaryBorder}`
              : "1px dashed rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: draftFilters.salesName.length > 0 ? filterColors.primary : "text.secondary",
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
    </FilterSectionFrame>
  );
};

export default SalesFilterSection;
