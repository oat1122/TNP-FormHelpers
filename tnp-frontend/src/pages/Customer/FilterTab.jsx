import React, { useState, useContext, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ToggleButton, ToggleButtonGroup, CircularProgress } from "@mui/material";
import {
  setGroupSelected,
  setPaginationModel,
  fetchFilteredCustomers,
} from "../../features/Customer/customerSlice";
import ScrollContext from "./ScrollContext";
import { apiConfig } from "../../api/apiConfig";

function FilterTab() {
  const dispatch = useDispatch();
  const groupList = useSelector((state) => state.customer.groupList);
  const totalCount = useSelector((state) => state.customer.totalCount);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const itemList = useSelector((state) => state.customer.itemList);
  const filters = useSelector((state) => state.customer.filters);
  const { scrollToTop } = useContext(ScrollContext);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [allGroupCounts, setAllGroupCounts] = useState({});
  
  // เช็คว่ามีการกรองข้อมูลอยู่หรือไม่
  const hasActiveFilters =
      filters.dateRange.startDate ||
      filters.dateRange.endDate ||
      (filters.salesName && filters.salesName.length > 0) ||
      (filters.channel && filters.channel.length > 0);

  // ดึงตัวเลขจำนวนข้อมูลของทุกกลุ่มตามการกรองปัจจุบัน
  useEffect(() => {
    const fetchAllGroupCounts = async () => {
      // ถ้าไม่มีการกรอง ไม่จำเป็นต้องดึงข้อมูลพิเศษ
      if (!hasActiveFilters) {
        setAllGroupCounts({});
        return;
      }
      
      try {
        setIsLoadingCounts(true);
        
        // สร้างพารามิเตอร์สำหรับการกรอง (เหมือนกับที่ใช้ใน fetchFilteredCustomers)
        const userData = JSON.parse(localStorage.getItem("userData"));
        const params = new URLSearchParams();
        
        // Add user ID
        params.append("user", userData?.user_id);
        
        // Add filter parameters
        if (filters.dateRange.startDate) {
          params.append("start_date", filters.dateRange.startDate);
        }
        if (filters.dateRange.endDate) {
          params.append("end_date", filters.dateRange.endDate);
        }
        if (Array.isArray(filters.salesName) && filters.salesName.length > 0) {
          params.append("sales_names", filters.salesName.join(","));
        }
        if (Array.isArray(filters.channel) && filters.channel.length > 0) {
          params.append("channels", filters.channel.join(","));
        }
        
        // Parameter to request all group counts without limiting by group
        params.append("counts_only", "true");
        
        const response = await fetch(
          `${apiConfig.baseUrl}/customerGroupCounts?${params.toString()}`, 
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          }
        );
        
        if (!response.ok) throw new Error("Failed to fetch group counts");
        
        const data = await response.json();
        setAllGroupCounts(data.group_counts || {});
      } catch (error) {
        console.error("Error fetching group counts:", error);
      } finally {
        setIsLoadingCounts(false);
      }
    };
    
    // ดึงข้อมูลจำนวนในแต่ละกลุ่มเมื่อการกรองเปลี่ยน
    fetchAllGroupCounts();
  }, [filters, hasActiveFilters]);

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
    <>      <ToggleButtonGroup
        value={groupSelected}
        exclusive
        onChange={handleSelectGroup}
        color="error-light"
      >
        <ToggleButton value="all">
          {`ทั้งหมด (${
            hasActiveFilters ? 
              (Object.values(allGroupCounts).reduce((sum, count) => sum + count, 0) || totalCount) 
              : totalCount
          })`}
          {isLoadingCounts && <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />}
        </ToggleButton>
        {sortedGroupList.map((item, index) => (
          <ToggleButton key={index} value={item.mcg_id}>
            {`${item.mcg_name} (${
              hasActiveFilters
                ? allGroupCounts[item.mcg_id] || 0
                : item.customer_group_count || 0
            })`}
            {isLoadingCounts && <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </>
  );
}

export default FilterTab;
