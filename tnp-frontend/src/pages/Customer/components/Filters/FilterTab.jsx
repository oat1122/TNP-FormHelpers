import { useTheme, useMediaQuery } from "@mui/material";
import React, { useContext } from "react";
import { useSelector, useDispatch } from "react-redux";

// Data display components
import { ScrollContext } from "../DataDisplay";

// Parts
import { FilterGroupMobile, FilterGroupDesktop } from "./parts";

// Hooks
import { useFilterGroupCounts, useFilterState } from "../../hooks";

// Redux
import {
  setGroupSelected,
  setPaginationModel,
  fetchFilteredCustomers,
} from "../../../../features/Customer/customerSlice";

/**
 * FilterTab - Component หลักสำหรับเลือกกลุ่มลูกค้า
 * แยก UI ออกเป็น Mobile และ Desktop parts
 */
function FilterTab() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const groupList = useSelector((state) => state.customer.groupList);
  const totalCount = useSelector((state) => state.customer.totalCount);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const filters = useSelector((state) => state.customer.filters);
  const { scrollToTop } = useContext(ScrollContext);

  // Get hasActiveFilters from useFilterState (centralized logic)
  const { hasActiveFilters } = useFilterState();

  // Use hook for group counts - pass hasActiveFilters as parameter
  const { allGroupCounts, isLoadingCounts } = useFilterGroupCounts(filters, hasActiveFilters);

  // Sort groups by mcg_sort
  const sortedGroupList = [...groupList].sort((a, b) => a.mcg_sort - b.mcg_sort);

  // Logic คำนวณ computedTotalCount ย้ายมาที่ parent (จุดที่ 3)
  const computedTotalCount = hasActiveFilters
    ? Object.values(allGroupCounts).reduce((sum, count) => sum + count, 0) || totalCount
    : totalCount;

  // Handle group selection
  const handleSelectGroup = (event, newVal) => {
    const value = newVal || event.target.value;

    if (value !== null && value !== undefined) {
      console.log(`เปลี่ยนกลุ่มเป็น: ${value}, คงตัวกรองเดิมไว้:`, filters);

      dispatch(setGroupSelected(value));
      dispatch(setPaginationModel({ page: 0, pageSize: 30 }));
      dispatch(
        fetchFilteredCustomers({
          dateRange: filters.dateRange,
          salesName: filters.salesName,
          channel: filters.channel,
        })
      );
      scrollToTop();
    }
  };

  // Common props for both Mobile and Desktop - ส่งค่าที่คำนวณแล้วลงไป
  const groupProps = {
    groupSelected,
    onSelectGroup: handleSelectGroup,
    sortedGroupList,
    totalCount,
    computedTotalCount, // ส่งค่าที่คำนวณแล้ว
    allGroupCounts,
    isLoadingCounts,
    hasActiveFilters,
  };

  return isMobile ? <FilterGroupMobile {...groupProps} /> : <FilterGroupDesktop {...groupProps} />;
}

export default FilterTab;
