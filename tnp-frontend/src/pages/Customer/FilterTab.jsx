import React, { useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import GroupToggleButtons from "./components/GroupToggleButtons";
import useGroupCounts from "./components/useGroupCounts";
import {
  setGroupSelected,
  setPaginationModel,
  fetchFilteredCustomers,
} from "../../features/Customer/customerSlice";
import ScrollContext from "./ScrollContext";

function FilterTab() {
  const dispatch = useDispatch();
  const groupList = useSelector((state) => state.customer.groupList);
  const totalCount = useSelector((state) => state.customer.totalCount);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const filters = useSelector((state) => state.customer.filters);
  const { scrollToTop } = useContext(ScrollContext);
  
  // เช็คว่ามีการกรองข้อมูลอยู่หรือไม่
  const hasActiveFilters =
      filters.dateRange.startDate ||
      filters.dateRange.endDate ||
      (filters.salesName && filters.salesName.length > 0) ||
      (filters.channel && filters.channel.length > 0);

  const { isLoadingCounts, allGroupCounts } = useGroupCounts(
    filters,
    hasActiveFilters
  );

  const handleSelectGroup = (event, newVal) => {
    if (newVal !== null) {
      console.log(`เปลี่ยนกลุ่มเป็น: ${newVal}, คงตัวกรองเดิมไว้:`, filters);
      
      // Update the selected group
      dispatch(setGroupSelected(newVal));
      
      // Reset pagination to first page
      dispatch(setPaginationModel({ page: 0, pageSize: 30 }));
      
      // เรียกข้อมูลใหม่โดยใช้ตัวกรองปัจจุบัน (ไม่รีเซ็ตตัวกรองอีกต่อไป)
      dispatch(fetchFilteredCustomers({
        dateRange: filters.dateRange,
        salesName: filters.salesName,
        channel: filters.channel
      }));

      // Scroll to top when changing groups
      scrollToTop();
    }
  };

  // Sort groups by mcg_sort to ensure they're shown in the right order: A, B, C, D
  const sortedGroupList = [...groupList].sort(
    (a, b) => a.mcg_sort - b.mcg_sort
  );

  return (
    <GroupToggleButtons
      sortedGroupList={sortedGroupList}
      groupSelected={groupSelected}
      handleSelectGroup={handleSelectGroup}
      isLoadingCounts={isLoadingCounts}
      allGroupCounts={allGroupCounts}
      totalCount={totalCount}
      hasActiveFilters={hasActiveFilters}
    />
  );
}

export default FilterTab;
