import { useEffect, useMemo, useState } from "react";

import { useGetSalesBySubRoleQuery } from "../../../features/Customer/customerApi";
import { useAssignNotebooksMutation } from "../../../features/Notebook/notebookApi";
import {
  getNotebookAssignTargetSubRoleCodes,
  hasAnySubRole,
} from "../../../utils/userAccess";

export const useNotebookAssignDialog = ({ open, notebooks, currentUser, onSuccess, onError }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignNotebooks] = useAssignNotebooksMutation();
  const assignTargetCodes = useMemo(
    () => getNotebookAssignTargetSubRoleCodes(currentUser).join(","),
    [currentUser]
  );

  const {
    data: salesData,
    isLoading: loadingUsers,
    error: salesError,
  } = useGetSalesBySubRoleQuery(assignTargetCodes, { skip: !open });

  const isHeadOffline = hasAnySubRole(currentUser, ["HEAD_OFFLINE"]);
  const isSupportSales = hasAnySubRole(currentUser, ["SUPPORT_SALES"]);
  const notebookIds = useMemo(
    () => (notebooks || []).map((notebook) => notebook?.id).filter(Boolean),
    [notebooks]
  );
  const salesUsers = useMemo(() => {
    const users = salesData?.data || [];

    if (!isHeadOffline || !currentUser?.user_id) {
      return users;
    }

    const alreadyIncluded = users.some(
      (user) => Number(user.user_id) === Number(currentUser.user_id)
    );

    return alreadyIncluded ? users : [currentUser, ...users];
  }, [currentUser, isHeadOffline, salesData?.data]);

  useEffect(() => {
    if (salesError) {
      onError?.("ไม่สามารถโหลดรายชื่อผู้รับมอบหมายได้");
    }
  }, [onError, salesError]);

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

  const resetState = () => {
    setSelectedUser(null);
  };

  const handleConfirmAssign = async () => {
    if (!selectedUser || notebookIds.length === 0) {
      return;
    }

    setAssignLoading(true);

    try {
      await assignNotebooks({
        notebook_ids: notebookIds,
        sales_user_id: selectedUser.user_id,
      }).unwrap();

      onSuccess?.({
        assignee: selectedUser,
        count: notebookIds.length,
      });
      resetState();
    } catch (error) {
      onError?.(error?.data?.message || "ไม่สามารถมอบหมาย Notebook ได้");
    } finally {
      setAssignLoading(false);
    }
  };

  return {
    selectedUser,
    setSelectedUser,
    salesUsers,
    loadingUsers,
    assignLoading,
    notebookIds,
    isHeadOffline,
    isSupportSales,
    handleConfirmAssign,
    formatUserName,
    resetState,
  };
};

export default useNotebookAssignDialog;
