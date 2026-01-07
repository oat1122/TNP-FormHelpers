import { Box, Chip, Typography } from "@mui/material";
import dayjs from "dayjs";
import React, { useContext } from "react";
import { MdDateRange, MdPerson, MdSignalCellularAlt } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";

// Data display components
import { ScrollContext } from "../DataDisplay";

// Hooks
import { useFilterState } from "../../hooks";

// Redux
import { resetFilters } from "../../../../features/Customer/customerSlice";
import { getChannelDisplayName } from "../../../../features/Customer/customerUtils";

// Constants - ใช้ filterColors จาก central config
import { filterColors } from "../../constants/filterConstants";

/**
 * Component to display active filters as tags
 */
function FilterTags() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.customer.filters);
  const { scrollToTop } = useContext(ScrollContext);

  // ใช้ hasActiveFilters จาก useFilterState (centralized logic)
  const { hasActiveFilters } = useFilterState();

  // Check individual filter types for display
  const hasDateFilter = filters.dateRange.startDate || filters.dateRange.endDate;
  const hasSalesFilter = filters.salesName && filters.salesName.length > 0;
  const hasChannelFilter = filters.channel && filters.channel.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dayjs(dateString).format("DD/MM/YYYY");
  };

  // Format date range for display
  const getDateRangeLabel = () => {
    if (filters.dateRange.startDate && filters.dateRange.endDate) {
      return `${formatDate(filters.dateRange.startDate)} - ${formatDate(
        filters.dateRange.endDate
      )}`;
    } else if (filters.dateRange.startDate) {
      return `จาก ${formatDate(filters.dateRange.startDate)}`;
    } else if (filters.dateRange.endDate) {
      return `ถึง ${formatDate(filters.dateRange.endDate)}`;
    }
    return "";
  };

  // Handle clearing all filters
  const handleClearAllFilters = () => {
    dispatch(resetFilters());
    // Scroll to top when removing all filters
    scrollToTop();
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1.2,
        mb: 2.5,
        mt: 1.5,
        backgroundColor: filterColors.primaryLight,
        borderRadius: 2,
        p: hasActiveFilters ? 1.5 : 0,
        border: hasActiveFilters ? `1px dashed ${filterColors.primaryBorder}` : "none",
      }}
    >
      {hasActiveFilters && (
        <Typography
          variant="body2"
          sx={{
            color: filterColors.primary,
            mr: 1,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            px: 1,
          }}
        >
          กรองตาม:
        </Typography>
      )}

      {/* Date Range Filter Tag */}
      {hasDateFilter && (
        <Chip
          icon={<MdDateRange style={{ color: filterColors.primary }} />}
          label={`วันที่: ${getDateRangeLabel()}`}
          size="medium"
          variant="outlined"
          sx={{
            borderRadius: "16px",
            fontWeight: 500,
            px: 0.5,
            borderColor: filterColors.primaryBorder,
            color: filterColors.primary,
            "& .MuiChip-icon": {
              color: filterColors.primary,
            },
            boxShadow: "0 1px 3px rgba(148, 12, 12, 0.1)",
          }}
        />
      )}

      {/* Sales Name Filter Tag */}
      {hasSalesFilter && (
        <Chip
          icon={<MdPerson style={{ color: filterColors.primary }} />}
          label={`Sales: ${filters.salesName.length} คน`}
          size="medium"
          variant="outlined"
          sx={{
            borderRadius: "16px",
            fontWeight: 500,
            px: 0.5,
            borderColor: filterColors.primaryBorder,
            color: filterColors.primary,
            "& .MuiChip-icon": {
              color: filterColors.primary,
            },
            boxShadow: "0 1px 3px rgba(148, 12, 12, 0.1)",
          }}
        />
      )}

      {/* Channel Filter Tag */}
      {hasChannelFilter && (
        <Chip
          icon={<MdSignalCellularAlt style={{ color: filterColors.primary }} />}
          label={`ช่องทาง: ${filters.channel.map((c) => getChannelDisplayName(c)).join(", ")}`}
          size="medium"
          variant="outlined"
          sx={{
            borderRadius: "16px",
            fontWeight: 500,
            px: 0.5,
            borderColor: filterColors.primaryBorder,
            color: filterColors.primary,
            "& .MuiChip-icon": {
              color: filterColors.primary,
            },
            boxShadow: "0 1px 3px rgba(148, 12, 12, 0.1)",
          }}
        />
      )}
      {/* Recall Filter Tag has been removed */}

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <Chip
          label="ล้างตัวกรองทั้งหมด"
          size="medium"
          onClick={handleClearAllFilters}
          sx={{
            ml: "auto",
            fontWeight: 600,
            borderRadius: "16px",
            bgcolor: filterColors.primary,
            color: "#ffffff",
            boxShadow: "0 2px 5px rgba(148, 12, 12, 0.2)",
            "&:hover": {
              bgcolor: filterColors.primaryHover,
              boxShadow: "0 2px 8px rgba(148, 12, 12, 0.3)",
            },
          }}
        />
      )}
    </Box>
  );
}

export default FilterTags;
