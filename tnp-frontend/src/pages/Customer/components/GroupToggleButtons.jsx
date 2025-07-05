import React from "react";
import { ToggleButton, ToggleButtonGroup, CircularProgress } from "@mui/material";

export default function GroupToggleButtons({
  sortedGroupList,
  groupSelected,
  handleSelectGroup,
  isLoadingCounts,
  allGroupCounts,
  totalCount,
  hasActiveFilters,
}) {
  return (
    <ToggleButtonGroup
      value={groupSelected}
      exclusive
      onChange={handleSelectGroup}
      color="error-light"
    >
      <ToggleButton value="all">
        {`ทั้งหมด (${
          hasActiveFilters
            ? Object.values(allGroupCounts).reduce((sum, count) => sum + count, 0) || totalCount
            : totalCount
        })`}
        {isLoadingCounts && (
          <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />
        )}
      </ToggleButton>
      {sortedGroupList.map((item, index) => (
        <ToggleButton key={index} value={item.mcg_id}>
          {`${item.mcg_name} (${
            hasActiveFilters
              ? allGroupCounts[item.mcg_id] || 0
              : item.customer_group_count || 0
          })`}
          {isLoadingCounts && (
            <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />
          )}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
