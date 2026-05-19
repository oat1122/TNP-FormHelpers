import { useState } from "react";

import { useRevertInvoiceToDraftMutation } from "../../../../../features/Accounting/accountingApi";
import { showError } from "../../../utils/accountingToast";

/**
 * Custom hook for managing invoice status reversal functionality
 * @param {Object} invoice - The invoice object
 * @returns {Object} Hook state and handlers
 */
export const useInvoiceStatusReversal = (invoice) => {
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingRevertSide, setPendingRevertSide] = useState(null);

  // RTK Query mutation
  const [revertInvoiceToDraft, { isLoading: isReverting }] = useRevertInvoiceToDraftMutation();

  /**
   * Initiates the status reversal process by opening the reason dialog
   * @param {string|null} side - The side to revert ('before', 'after', or null for general)
   */
  const handleRevertToDraft = (side = null) => {
    setPendingRevertSide(side);
    setIsDialogOpen(true);
  };

  /**
   * Handles the reason submission and performs the API call
   * @param {string} reason - The reason for reversal
   */
  const handleReasonSubmit = async (reason) => {
    try {
      await revertInvoiceToDraft({
        id: invoice.id,
        side: pendingRevertSide,
        reason: reason || undefined,
      }).unwrap();

      resetDialog();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to revert invoice:", error);
      }

      const errorMessage = error?.data?.message || error.message || "ไม่ทราบสาเหตุ";
      showError(`เกิดข้อผิดพลาดในการย้อนสถานะ: ${errorMessage}`);

      resetDialog();
    }
  };

  /**
   * Handles dialog close without submission
   */
  const handleDialogClose = () => {
    resetDialog();
  };

  /**
   * Resets all dialog-related states
   */
  const resetDialog = () => {
    setPendingRevertSide(null);
    setIsDialogOpen(false);
  };

  /**
   * Gets the display text for the current revert side
   * @returns {string} Display text for the side being reverted
   */
  const getRevertSideDisplayText = () => {
    if (!pendingRevertSide) return "";
    return pendingRevertSide === "before" ? "มัดจำก่อน" : "มัดจำหลัง";
  };

  return {
    // States
    isDialogOpen,
    pendingRevertSide,
    isReverting,

    // Handlers
    handleRevertToDraft,
    handleReasonSubmit,
    handleDialogClose,

    // Utilities
    getRevertSideDisplayText,
  };
};
