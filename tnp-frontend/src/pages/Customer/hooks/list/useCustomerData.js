import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useGetAllCustomerQuery } from "../../../../features/Customer/customerApi";
import {
  setItemList,
  setGroupList,
  setTotalCount,
} from "../../../../features/Customer/customerSlice";
import { open_dialog_error } from "../../../../utils/import_lib";

/**
 * Hook สำหรับจัดการ Data Fetching และ Redux Sync
 * @param {Array} serverSortModel - Sort model จาก useCustomerTableConfig
 * @param {Function} scrollToTop - Function สำหรับ scroll ไปด้านบน
 * @returns {Object} Data states และ methods
 */
export const useCustomerData = (serverSortModel, scrollToTop) => {
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("userData"));

  // Selectors from Redux
  const itemList = useSelector((state) => state.customer.itemList);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const keyword = useSelector((state) => state.global.keyword);
  const paginationModel = useSelector((state) => state.customer.paginationModel);
  const filters = useSelector((state) => state.customer.filters);
  const isLoading = useSelector((state) => state.customer.isLoading);

  // Local state
  const [totalItems, setTotalItems] = useState(0);

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

    // Sales users only see their assigned customers
    if (user.role === "sale") {
      basePayload.user_id = user.user_id;
    }

    return basePayload;
  }, [groupSelected, paginationModel, user, keyword, filters, serverSortModel]);

  const { data, error, isFetching, isSuccess, refetch } = useGetAllCustomerQuery(queryPayload);

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
    isFetching,
    isLoading,
    refetch,
    paginationModel,
    filters,
    groupSelected,
  };
};
