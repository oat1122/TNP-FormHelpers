import { useState, useEffect } from "react";
import { apiConfig } from "../../../api/apiConfig";

export default function useGroupCounts(filters, hasActiveFilters) {
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [allGroupCounts, setAllGroupCounts] = useState({});

  useEffect(() => {
    const fetchAllGroupCounts = async () => {
      if (!hasActiveFilters) {
        setAllGroupCounts({});
        return;
      }
      try {
        setIsLoadingCounts(true);
        const userData = JSON.parse(localStorage.getItem("userData"));
        const params = new URLSearchParams();
        params.append("user", userData?.user_id);
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

    fetchAllGroupCounts();
  }, [filters, hasActiveFilters]);

  return { isLoadingCounts, allGroupCounts };
}
