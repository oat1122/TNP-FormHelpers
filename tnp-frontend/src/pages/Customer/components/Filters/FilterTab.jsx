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
import { setGroupSelected, setPaginationModel } from "../../../../features/Customer/customerSlice";

/**
 * FilterTab - Component หลักสำหรับเลือกกลุ่มลูกค้า
 * แยก UI ออกเป็น Mobile และ Desktop parts
 *
 * UX-Optimized: Uses refetch callback pattern for smooth data transitions
 *
 * @param {Function} refetchCustomers - Callback to trigger data refetch (from RTK Query)
 */
function FilterTab({ refetchCustomers }) {
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

      // Use refetch callback for smooth UX (keeps existing data while loading)
      if (refetchCustomers) {
        refetchCustomers();
      }

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
