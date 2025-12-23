import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetPoolTelesalesCustomersQuery,
  useGetPoolTransferredCustomersQuery,
} from "../../../features/Customer/customerApi";
import { CUSTOMER_CHANNEL } from "../../Customer/constants/customerChannel";

/**
 * useAllocationHub - Core logic hook for AllocationHub page
 *
 * Handles:
 * - User authentication/authorization
 * - API queries (telesales, transferred, counts)
 * - Tab/Pagination state management
 * - Selection management
 */
export const useAllocationHub = () => {
  const navigate = useNavigate();

  // Get user data and sub_role
  const userData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userSubRole = useMemo(() => {
    return userData.sub_roles?.[0]?.msr_code || null;
  }, [userData]);

  // Determine channel filter for transferred tab based on sub_role
  const transferredChannel = useMemo(() => {
    if (userSubRole === "HEAD_ONLINE") return CUSTOMER_CHANNEL.ONLINE;
    if (userSubRole === "HEAD_OFFLINE") return CUSTOMER_CHANNEL.SALES;
    return undefined; // Admin sees all
  }, [userSubRole]);

  // Check if user has allocation permission (admin, manager, or HEAD)
  const canAllocate = useMemo(() => {
    if (["admin", "manager"].includes(userData.role)) return true;
    if (userSubRole === "HEAD_ONLINE" || userSubRole === "HEAD_OFFLINE") return true;
    return false;
  }, [userData.role, userSubRole]);

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 30 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    source: "",
    search: "",
    startDate: null,
    endDate: null,
  });

  // Count queries - load immediately for both tabs (per_page: 1 for minimal data)
  const { data: telesalesCountData, refetch: refetchTelesalesCount } =
    useGetPoolTelesalesCustomersQuery({
      page: 0,
      per_page: 1,
    });

  const { data: transferredCountData, refetch: refetchTransferredCount } =
    useGetPoolTransferredCustomersQuery({
      page: 0,
      per_page: 1,
      channel: transferredChannel,
    });

  // API queries based on active tab - full data loaded only when tab is active
  const {
    data: telesalesData,
    isLoading: isTelesalesLoading,
    isFetching: isTelesalesFetching,
    refetch: refetchTelesales,
  } = useGetPoolTelesalesCustomersQuery(
    {
      page: paginationModel.page,
      per_page: paginationModel.pageSize,
      search: filters.search || undefined,
    },
    { skip: activeTab !== 0 }
  );

  const {
    data: transferredData,
    isLoading: isTransferredLoading,
    isFetching: isTransferredFetching,
    refetch: refetchTransferred,
  } = useGetPoolTransferredCustomersQuery(
    {
      page: paginationModel.page,
      per_page: paginationModel.pageSize,
      channel: transferredChannel,
    },
    { skip: activeTab !== 1 }
  );

  // Get counts from count queries (loaded immediately) or fallback to data queries
  const telesalesCount =
    telesalesCountData?.pagination?.total ?? telesalesData?.pagination?.total ?? 0;
  const transferredCount =
    transferredCountData?.pagination?.total ?? transferredData?.pagination?.total ?? 0;

  // Current data based on tab
  const currentData = activeTab === 0 ? telesalesData : transferredData;
  const isLoading = activeTab === 0 ? isTelesalesLoading : isTransferredLoading;
  const isFetching = activeTab === 0 ? isTelesalesFetching : isTransferredFetching;
  const refetch = activeTab === 0 ? refetchTelesales : refetchTransferred;

  // Refetch all counts
  const refetchCounts = () => {
    refetchTelesalesCount();
    refetchTransferredCount();
  };

  // Reset selection on tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedIds([]);
    setPaginationModel({ page: 0, pageSize: 30 });
  };

  // Role guard - check authorization
  useEffect(() => {
    if (!userData.user_id) {
      navigate("/customer");
      return;
    }
    if (!canAllocate) {
      navigate("/customer");
    }
  }, [navigate, userData, canAllocate]);

  return {
    // User data
    userData,
    userSubRole,
    canAllocate,
    // Tab management
    activeTab,
    handleTabChange,
    // Data
    currentData,
    telesalesCount,
    transferredCount,
    isLoading,
    isFetching,
    // Pagination
    paginationModel,
    setPaginationModel,
    // Selection
    selectedIds,
    setSelectedIds,
    // Filters
    filters,
    setFilters,
    // Actions
    refetch,
    refetchCounts,
  };
};

export default useAllocationHub;
