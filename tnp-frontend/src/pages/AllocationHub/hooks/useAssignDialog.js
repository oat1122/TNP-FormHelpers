import { useState, useEffect, useMemo } from "react";
import {
  useAssignCustomersMutation,
  useGetSalesBySubRoleQuery,
} from "../../../features/Customer/customerApi";

/**
 * useAssignDialog - Logic hook for customer assignment
 *
 * Handles:
 * - Sales user fetching by sub_role
 * - Assign mutation (normal + force)
 * - Conflict handling
 */
export const useAssignDialog = ({ open, selectedIds, userSubRole, onSuccess, onError }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const [assignCustomers] = useAssignCustomersMutation();

  // Determine sub_role_codes to fetch based on current user's sub_role
  const subRoleCodes = useMemo(() => {
    if (userSubRole === "HEAD_ONLINE") return "SALES_ONLINE";
    if (userSubRole === "HEAD_OFFLINE") return "SALES_OFFLINE";
    return "SALES_ONLINE,SALES_OFFLINE";
  }, [userSubRole]);

  // Fetch sales users using RTK Query - skip when dialog is closed
  const {
    data: salesData,
    isLoading: loadingUsers,
    error: salesError,
  } = useGetSalesBySubRoleQuery(subRoleCodes, { skip: !open });

  const salesUsers = salesData?.data || [];

  // Handle sales fetch error
  useEffect(() => {
    if (salesError) {
      console.error("Failed to fetch sales users by sub_role", salesError);
      onError("ไม่สามารถโหลดรายชื่อเซลล์ได้");
    }
  }, [salesError, onError]);

  // Get label for who can be assigned
  const getAssignLabel = () => {
    if (userSubRole === "HEAD_ONLINE") return "เลือกเซลล์ทีม Online";
    if (userSubRole === "HEAD_OFFLINE") return "เลือกเซลล์ทีม Offline";
    return "เลือกเซลล์ผู้รับผิดชอบ";
  };

  // Format user display name
  const formatUserName = (user) => {
    if (!user) return "";
    const firstName = user.user_firstname || "";
    const lastName = user.user_lastname || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const nickname = user.user_nickname || user.username || "";

    if (fullName && nickname) {
      return `${fullName} (${nickname})`;
    }
    return fullName || nickname || user.username;
  };

  const handleConfirmAssign = async () => {
    if (!selectedUser) return;

    setAssignLoading(true);
    try {
      await assignCustomers({
        customer_ids: selectedIds,
        sales_user_id: selectedUser.user_id,
        force: false,
      }).unwrap();

      onSuccess(selectedIds.length);
      resetState();
    } catch (err) {
      if (err.status === 409 || err.data?.conflict) {
        setConflictData(err.data);
        setShowConflictDialog(true);
      } else {
        onError(err.data?.message || "เกิดข้อผิดพลาดในการจัดสรร");
      }
    } finally {
      setAssignLoading(false);
    }
  };

  const handleForceAssign = async () => {
    if (!selectedUser) return;

    setAssignLoading(true);
    try {
      await assignCustomers({
        customer_ids: selectedIds,
        sales_user_id: selectedUser.user_id,
        force: true,
      }).unwrap();

      onSuccess(selectedIds.length);
      setShowConflictDialog(false);
      setConflictData(null);
      resetState();
    } catch (err) {
      onError(err.data?.message || "เกิดข้อผิดพลาดในการจัดสรรแบบบังคับ");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCancelConflict = () => {
    setShowConflictDialog(false);
    setConflictData(null);
    setAssignLoading(false);
  };

  const resetState = () => {
    setSelectedUser(null);
    setConflictData(null);
    setShowConflictDialog(false);
  };

  return {
    // User selection
    selectedUser,
    setSelectedUser,
    // Sales data
    salesUsers,
    loadingUsers,
    // Assign handlers
    handleConfirmAssign,
    handleForceAssign,
    assignLoading,
    // Conflict handling
    conflictData,
    showConflictDialog,
    handleCancelConflict,
    // Helpers
    getAssignLabel,
    formatUserName,
    resetState,
  };
};

export default useAssignDialog;
