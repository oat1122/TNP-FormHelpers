import React, { useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Box, Chip, Typography } from "@mui/material";
import {
  MdDateRange,
  MdPerson,
  MdSignalCellularAlt,
  MdPhone,
} from "react-icons/md";
import dayjs from "dayjs";
import { resetFilters } from "../../features/Customer/customerSlice";
import ScrollContext from "./ScrollContext";
import {
  getChannelDisplayName,
  formatDaysToText,
} from "../../features/Customer/customerUtils";

/**
 * Component to display active filters as tags
 */
function FilterTags() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.customer.filters);
  const { scrollToTop } = useContext(ScrollContext);

  // Check if any filters are active
  const hasDateFilter =
    filters.dateRange.startDate || filters.dateRange.endDate;
  const hasSalesFilter = filters.salesName && filters.salesName.length > 0;
  const hasChannelFilter = filters.channel && filters.channel.length > 0;

  const hasAnyFilters = hasDateFilter || hasSalesFilter || hasChannelFilter;

  if (!hasAnyFilters) {
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
        backgroundColor: "rgba(245, 245, 245, 0.5)",
        borderRadius: 2,
        p: hasAnyFilters ? 1.5 : 0,
        border: hasAnyFilters ? "1px dashed rgba(0, 0, 0, 0.12)" : "none",
      }}
    >
      {hasAnyFilters && (
        <Typography
          variant="body2"
          sx={{
            color: "#1976d2",
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
          icon={<MdDateRange style={{ color: "#1976d2" }} />}
          label={`วันที่: ${getDateRangeLabel()}`}
          size="medium"
          color="primary"
          variant="outlined"
          sx={{
            borderRadius: "16px",
            fontWeight: 500,
            px: 0.5,
            "& .MuiChip-icon": {
              color: "#1976d2",
            },
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        />
      )}

      {/* Sales Name Filter Tag */}
      {hasSalesFilter && (
        <Chip
          icon={<MdPerson style={{ color: "#1976d2" }} />}
          label={`Sales: ${filters.salesName.length} คน`}
          size="medium"
          color="primary"
          variant="outlined"
          sx={{
            borderRadius: "16px",
            fontWeight: 500,
            px: 0.5,
            "& .MuiChip-icon": {
              color: "#1976d2",
            },
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        />
      )}

      {/* Channel Filter Tag */}
      {hasChannelFilter && (
        <Chip
          icon={<MdSignalCellularAlt style={{ color: "#1976d2" }} />}
          label={`ช่องทาง: ${filters.channel
            .map((c) => getChannelDisplayName(c))
            .join(", ")}`}
          size="medium"
          color="primary"
          variant="outlined"
          sx={{
            borderRadius: "16px",
            fontWeight: 500,
            px: 0.5,
            "& .MuiChip-icon": {
              color: "#1976d2",
            },
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        />
      )}
      {/* Recall Filter Tag has been removed */}

      {/* Clear All Filters */}
      {hasAnyFilters && (
        <Chip
          label="ล้างตัวกรองทั้งหมด"
          size="medium"
          color="error"
          onClick={handleClearAllFilters}
          sx={{
            ml: "auto",
            fontWeight: 600,
            borderRadius: "16px",
            boxShadow: "0 2px 5px rgba(211, 47, 47, 0.2)",
            "&:hover": {
              boxShadow: "0 2px 8px rgba(211, 47, 47, 0.3)",
            },
          }}
        />
      )}
    </Box>
  );
}

export default FilterTags;
