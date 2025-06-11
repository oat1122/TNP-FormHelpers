import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Chip, Typography } from '@mui/material';
import { MdDateRange, MdPerson, MdSignalCellularAlt, MdPhone } from 'react-icons/md';
import dayjs from 'dayjs';
import { resetFilters } from '../../features/Customer/customerSlice';
import { getChannelDisplayName, formatDaysToText } from '../../features/Customer/customerUtils';

/**
 * Component to display active filters as tags
 */
function FilterTags() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.customer.filters);
  
  // Check if any filters are active
  const hasDateFilter = filters.dateRange.startDate || filters.dateRange.endDate;
  const hasSalesFilter = filters.salesName && filters.salesName.length > 0;
  const hasChannelFilter = filters.channel && filters.channel.length > 0;
  const hasRecallFilter = filters.recallRange.minDays !== null || filters.recallRange.maxDays !== null;
  
  const hasAnyFilters = hasDateFilter || hasSalesFilter || hasChannelFilter || hasRecallFilter;
  
  if (!hasAnyFilters) {
    return null;
  }
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return dayjs(dateString).format('DD/MM/YYYY');
  };
  
  // Format date range for display
  const getDateRangeLabel = () => {
    if (filters.dateRange.startDate && filters.dateRange.endDate) {
      return `${formatDate(filters.dateRange.startDate)} - ${formatDate(filters.dateRange.endDate)}`;
    } else if (filters.dateRange.startDate) {
      return `จาก ${formatDate(filters.dateRange.startDate)}`;
    } else if (filters.dateRange.endDate) {
      return `ถึง ${formatDate(filters.dateRange.endDate)}`;
    }
    return '';
  };
  
  // Format recall range for display
  const getRecallRangeLabel = () => {
    if (filters.recallRange.minDays !== null && filters.recallRange.maxDays !== null) {
      return `${filters.recallRange.minDays} - ${filters.recallRange.maxDays} วัน`;
    } else if (filters.recallRange.minDays !== null) {
      return `> ${filters.recallRange.minDays} วัน`;
    } else if (filters.recallRange.maxDays !== null) {
      return `< ${filters.recallRange.maxDays} วัน`;
    }
    return '';
  };
  
  // Handle clearing all filters
  const handleClearAllFilters = () => {
    dispatch(resetFilters());
  };
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 1,
        mb: 2,
        mt: 1
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
        กรองตาม:
      </Typography>
      
      {/* Date Range Filter Tag */}
      {hasDateFilter && (
        <Chip
          icon={<MdDateRange />}
          label={`วันที่: ${getDateRangeLabel()}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
      
      {/* Sales Name Filter Tag */}
      {hasSalesFilter && (
        <Chip
          icon={<MdPerson />}
          label={`Sales: ${filters.salesName.length} คน`}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
      
      {/* Channel Filter Tag */}
      {hasChannelFilter && (
        <Chip
          icon={<MdSignalCellularAlt />}
          label={`ช่องทาง: ${filters.channel.map(c => getChannelDisplayName(c)).join(', ')}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
      
      {/* Recall Filter Tag */}
      {hasRecallFilter && (
        <Chip
          icon={<MdPhone />}
          label={`ขาดติดต่อ: ${getRecallRangeLabel()}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
      
      {/* Clear All Filters */}
      {hasAnyFilters && (
        <Chip
          label="ล้างตัวกรองทั้งหมด"
          size="small"
          color="error"
          onClick={handleClearAllFilters}
          sx={{ ml: 1 }}
        />
      )}
    </Box>
  );
}

export default FilterTags;
