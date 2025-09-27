/**
 * Custom hooks for invoice approval workflows
 * จัดการ logic ของการอนุมัติใบแจ้งหนี้แยกตาม deposit mode
 */

import { useState, useEffect } from "react";

import {
  useSubmitInvoiceMutation,
  useApproveInvoiceMutation,
  useSubmitInvoiceAfterDepositMutation,
  useApproveInvoiceAfterDepositMutation,
  useUpdateInvoiceDepositDisplayOrderMutation,
} from "../../../../../features/Accounting/accountingApi";

export const useInvoiceApproval = (invoice) => {
  // เพิ่ม state สำหรับสถานะแยกฝั่ง
  const [localStatusBefore, setLocalStatusBefore] = useState(invoice?.status_before || "draft");
  const [localStatusAfter, setLocalStatusAfter] = useState(invoice?.status_after || "draft");
  const [localStatus, setLocalStatus] = useState(invoice?.status); // เก็บไว้เพื่อ backward compatibility

  // Current deposit display mode: 'before' | 'after'
  const [depositMode, setDepositMode] = useState(invoice?.deposit_display_order || "after");

  // API hooks for approval flows
  const [submitInvoice] = useSubmitInvoiceMutation();
  const [approveInvoice] = useApproveInvoiceMutation();
  const [submitInvoiceAfterDeposit] = useSubmitInvoiceAfterDepositMutation();
  const [approveInvoiceAfterDeposit] = useApproveInvoiceAfterDepositMutation();
  const [updateDepositOrder] = useUpdateInvoiceDepositDisplayOrderMutation();

  // Sync local state with invoice prop changes
  useEffect(() => {
    setLocalStatusBefore(invoice?.status_before || "draft");
    setLocalStatusAfter(invoice?.status_after || "draft");
    setLocalStatus(invoice?.status);
    setDepositMode(invoice?.deposit_display_order || "after");
  }, [
    invoice?.status_before,
    invoice?.status_after,
    invoice?.status,
    invoice?.deposit_display_order,
  ]);

  // Helper function to get current side status
  const getActiveSideStatus = () => {
    return depositMode === "before" ? localStatusBefore : localStatusAfter;
  };

  // Helper function to check if can approve current side
  const canApproveActiveSide = () => {
    const status = getActiveSideStatus();
    return status === "draft" || status === "pending";
  };

  // Approve handler for current side
  const handleApprove = async () => {
    try {
      if (!invoice?.id) return;

      if (depositMode === "after") {
        // After-deposit flow
        if (localStatusAfter === "approved") {
          return; // Already approved
        }

        // Auto-submit if still draft
        if (localStatusAfter === "draft") {
          const submitted = await submitInvoiceAfterDeposit(invoice.id).unwrap();
          const newStatus = submitted?.data?.status_after || "pending";
          setLocalStatusAfter(newStatus);
        }

        // Approve after deposit
        const res = await approveInvoiceAfterDeposit({ id: invoice.id }).unwrap();
        const newStatus = res?.data?.status_after || "approved";
        setLocalStatusAfter(newStatus);
        // Update overall status for backward compatibility
        setLocalStatus(res?.data?.status || "approved");
      } else {
        // Before-deposit flow
        if (localStatusBefore === "approved") {
          return; // Already approved
        }

        // Auto-submit if still draft
        if (localStatusBefore === "draft") {
          const submitted = await submitInvoice(invoice.id).unwrap();
          const newStatus = submitted?.data?.status_before || "pending";
          setLocalStatusBefore(newStatus);
        }

        // Approve before deposit
        const res = await approveInvoice({ id: invoice.id }).unwrap();
        const newStatus = res?.data?.status_before || "approved";
        setLocalStatusBefore(newStatus);
        // Update overall status for backward compatibility
        setLocalStatus(res?.data?.status || "approved");
      }
    } catch (e) {
      console.error("Approve invoice failed", e);
      throw e;
    }
  };

  // Handle deposit mode change
  const handleDepositModeChange = async (newMode, hasEvidence) => {
    if (!hasEvidence) return; // ปิดใช้งานเมื่อยังไม่มีหลักฐานการชำระ

    const previousMode = depositMode;
    setDepositMode(newMode); // optimistic UI for switch only

    try {
      if (invoice?.id) {
        await updateDepositOrder({ id: invoice.id, order: newMode });
        // ไม่ auto-submit หรือเปลี่ยนสถานะเมื่อสลับโหมด เพื่อให้ผู้ใช้กดอนุมัติเองในแต่ละโหมด
      }
    } catch (e) {
      console.error("Failed to persist deposit display order", e);
      setDepositMode(previousMode); // revert on error
      throw e;
    }
  };

  // Check if user can approve (role-based)
  const canUserApprove = () => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    return userData?.role === "admin" || userData?.role === "account";
  };

  return {
    localStatusBefore,
    localStatusAfter,
    localStatus,
    depositMode,
    getActiveSideStatus,
    canApproveActiveSide,
    canUserApprove,
    handleApprove,
    handleDepositModeChange,
  };
};
