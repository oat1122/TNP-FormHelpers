import { useState, useCallback } from "react";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../../../../utils/accountingToast";
import { useRevokeApprovalQuotationMutation } from "../../../../../../features/Accounting/accountingApi";

/**
 * Hook สำหรับจัดการการย้อนสถานะใบเสนอราคา
 * @param {string|number} quotationId - ID ของใบเสนอราคา
 * @param {function} onSuccess - Callback ที่จะถูกเรียกเมื่อย้อนสถานะสำเร็จ
 */
export const useQuotationStatusReversal = (quotationId, onSuccess) => {
  const [isReversalDialogOpen, setIsReversalDialogOpen] = useState(false);
  const [revokeApproval, { isLoading: isReversing }] = useRevokeApprovalQuotationMutation();

  const handleOpenReversalDialog = useCallback(() => {
    setIsReversalDialogOpen(true);
  }, []);

  const handleCloseReversalDialog = useCallback(() => {
    if (isReversing) return;
    setIsReversalDialogOpen(false);
  }, [isReversing]);

  const handleReverseStatus = useCallback(
    async (reason) => {
      const loadingId = showLoading("กำลังย้อนสถานะ...");
      try {
        await revokeApproval({ id: quotationId, reason }).unwrap();
        dismissToast(loadingId);
        showSuccess("ย้อนสถานะใบเสนอราคาเป็น Draft เรียบร้อยแล้ว");
        setIsReversalDialogOpen(false);
        onSuccess?.(); // Trigger refetch or local update
      } catch (error) {
        dismissToast(loadingId);
        console.error("Failed to reverse quotation status:", error);
        const errorMessage = error?.data?.message || "เกิดข้อผิดพลาดในการย้อนสถานะ";
        showError(errorMessage);
      }
    },
    [quotationId, revokeApproval, onSuccess]
  );

  return {
    isReversalDialogOpen,
    handleOpenReversalDialog,
    handleCloseReversalDialog,
    handleReverseStatus,
    isReversing,
  };
};
