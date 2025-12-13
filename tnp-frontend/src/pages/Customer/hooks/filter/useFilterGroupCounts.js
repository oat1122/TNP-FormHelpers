import { useState, useEffect } from "react";
import { apiConfig } from "../../../../api/apiConfig";

/**
 * useFilterGroupCounts - Hook สำหรับจัดการการดึงจำนวนข้อมูลในแต่ละกลุ่มตาม Filter
 * แยก Logic การดึง group counts ออกจาก FilterTab
 * @param {Object} filters - Current active filters from Redux
 */
export const useFilterGroupCounts = (filters) => {
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [allGroupCounts, setAllGroupCounts] = useState({});

  // เช็คว่ามีการกรองข้อมูลอยู่หรือไม่
  const hasActiveFilters =
    filters.dateRange.startDate ||
    filters.dateRange.endDate ||
    (filters.salesName && filters.salesName.length > 0) ||
    (filters.channel && filters.channel.length > 0);

  useEffect(() => {
    const fetchAllGroupCounts = async () => {
      // ถ้าไม่มีการกรอง ไม่จำเป็นต้องดึงข้อมูลพิเศษ
      if (!hasActiveFilters) {
        setAllGroupCounts({});
        return;
      }

      try {
        setIsLoadingCounts(true);

        // สร้างพารามิเตอร์สำหรับการกรอง
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
            },
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

  return {
    allGroupCounts,
    isLoadingCounts,
    hasActiveFilters,
  };
};
