import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../../../../api/axios";

import { useGetAllCustomerQuery } from "../../../../features/Customer/customerApi";
import {
  setItemList,
  setGroupList,
  setTotalCount,
} from "../../../../features/Customer/customerSlice";
import { open_dialog_error } from "../../../../utils/import_lib";

/**
 * Get subordinate sub_role code based on HEAD user's sub_role
 */
const getSubordinateSubRoleCode = (userSubRole) => {
  if (userSubRole === "HEAD_ONLINE") return "SALES_ONLINE";
  if (userSubRole === "HEAD_OFFLINE") return "SALES_OFFLINE";
  return null;
};

/**
 * Check if user is a HEAD
 */
const isHeadUser = (subRoleCode) => {
  return subRoleCode === "HEAD_ONLINE" || subRoleCode === "HEAD_OFFLINE";
};

/**
 * Hook สำหรับจัดการ Data Fetching และ Redux Sync
 *
 * For HEAD users:
 * - viewMode = "my" → see only their own assigned customers
 * - viewMode = "team" → see their subordinates' customers
 *
 * @param {Array} serverSortModel - Sort model จาก useCustomerTableConfig
 * @param {Function} scrollToTop - Function สำหรับ scroll ไปด้านบน
 * @param {string} viewMode - "my" | "team" (for HEAD users)
 * @returns {Object} Data states และ methods
 */
export const useCustomerData = (serverSortModel, scrollToTop, viewMode = "my") => {
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("userData"));

  // Extract user's sub_role
  const userSubRole = useMemo(() => {
    return user?.sub_roles?.[0]?.msr_code || null;
  }, [user]);

  // Check if user is HEAD
  const isHead = useMemo(() => isHeadUser(userSubRole), [userSubRole]);

  // Selectors from Redux
  const itemList = useSelector((state) => state.customer.itemList);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const keyword = useSelector((state) => state.global.keyword);
  const paginationModel = useSelector((state) => state.customer.paginationModel);
  const filters = useSelector((state) => state.customer.filters);
  const isLoading = useSelector((state) => state.customer.isLoading);

  // Local state
  const [totalItems, setTotalItems] = useState(0);
  const [subordinateUserIds, setSubordinateUserIds] = useState([]);
  const [subordinatesLoaded, setSubordinatesLoaded] = useState(false);

  // Fetch subordinate user IDs for HEAD users
  useEffect(() => {
    const fetchSubordinates = async () => {
      const subordinateSubRole = getSubordinateSubRoleCode(userSubRole);

      // Only HEAD users need to fetch subordinates
      if (!subordinateSubRole) {
        setSubordinatesLoaded(true);
        return;
      }

      try {
        const response = await axiosInstance.get(
          `/users/by-sub-role?sub_role_codes=${subordinateSubRole}`
        );

        const ids = response.data?.data?.map((u) => u.user_id) || [];
        setSubordinateUserIds(ids);
      } catch (error) {
        console.error("Failed to fetch subordinate users:", error);
        setSubordinateUserIds([]);
      } finally {
        setSubordinatesLoaded(true);
      }
    };

    // Only fetch if user is a HEAD
    if (isHead) {
      fetchSubordinates();
    } else {
      setSubordinatesLoaded(true);
    }
  }, [userSubRole, isHead]);

  // API Query with role-based filtering
  const queryPayload = useMemo(() => {
    const basePayload = {
      group: groupSelected,
      page: paginationModel.page,
      per_page: paginationModel.pageSize,
      user_id: user.user_id,
      search: keyword,
      filters: filters,
      sortModel: serverSortModel,
    };

    // Sales users (non-HEAD) only see their assigned customers
    if (user.role === "sale" && !isHead) {
      basePayload.user_id = user.user_id;
    }

    // HEAD users - check view mode
    if (isHead && subordinateUserIds.length > 0) {
      if (viewMode === "team") {
        // Team mode: see subordinates' customers
        basePayload.subordinate_user_ids = subordinateUserIds;
      }
      // "my" mode: no subordinate_user_ids, will filter by user_id in backend
    }

    return basePayload;
  }, [
    groupSelected,
    paginationModel,
    user,
    keyword,
    filters,
    serverSortModel,
    userSubRole,
    subordinateUserIds,
    viewMode,
    isHead,
  ]);

  // Skip query until subordinates are loaded for HEAD users in team mode
  const shouldSkipQuery = useMemo(() => {
    if (isHead && viewMode === "team") {
      return !subordinatesLoaded;
    }
    return false;
  }, [isHead, subordinatesLoaded, viewMode]);

  const { data, error, isFetching, isSuccess, refetch } = useGetAllCustomerQuery(queryPayload, {
    skip: shouldSkipQuery,
  });

  // Handle API response
  useEffect(() => {
    if (isSuccess) {
      if (data.status === "error") {
        open_dialog_error("Fetch customer error", data.message);
      } else if (data.data) {
        dispatch(setItemList(data.data));

        const hasActiveFilters =
          filters.dateRange.startDate ||
          filters.dateRange.endDate ||
          (filters.salesName && filters.salesName.length > 0) ||
          (filters.channel && filters.channel.length > 0);

        if (!hasActiveFilters || data.groups) {
          dispatch(setGroupList(data.groups));
        }

        dispatch(setTotalCount(data.total_count));
        setTotalItems(data.pagination.total_items);

        if (
          paginationModel.page === 0 &&
          data.data?.length > 0 &&
          itemList?.length > 0 &&
          data.data[0]?.cus_id !== itemList[0]?.cus_id
        ) {
          scrollToTop();
        }
      }
    }
  }, [data, dispatch, filters, itemList, paginationModel.page, scrollToTop, isSuccess]);

  // Filter rows ที่มี ID ที่ถูกต้องและข้อมูลครบ
  const validRows = useMemo(() => {
    if (!itemList || !Array.isArray(itemList)) {
      return [];
    }

    return itemList.filter((row) => {
      // ต้องมี ID ที่ใช้งานได้
      const hasValidId = row.cus_id || row.id;
      // ต้องเป็น object ที่มีข้อมูล
      const hasValidData = row && typeof row === "object";

      return hasValidId && hasValidData;
    });
  }, [itemList]);

  return {
    validRows,
    totalItems,
    isFetching: isFetching || (!subordinatesLoaded && isHead && viewMode === "team"),
    isLoading: isLoading || (!subordinatesLoaded && isHead && viewMode === "team"),
    refetch,
    paginationModel,
    filters,
    groupSelected,
    userSubRole,
    isHead,
    subordinateUserIds,
  };
};
