import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { addNotification } from "../../../features/Accounting/accountingSlice";

/**
 * Custom hook สำหรับจัดการ optimistic updates และ cache invalidation
 * ลดการ refresh หน้าและเพิ่มประสิทธิภาพ UX
 */
export const useOptimisticUpdates = () => {
  const dispatch = useDispatch();

  /**
   * จัดการ mutations ด้วย optimistic updates
   * @param {Function} mutationFn - RTK Query mutation function
   * @param {Object} options - การตั้งค่าเพิ่มเติม
   */
  const executeMutation = useCallback(
    async (mutationFn, options = {}) => {
      const {
        successTitle = "ดำเนินการสำเร็จ",
        successMessage = "อัปเดตข้อมูลเรียบร้อยแล้ว",
        errorTitle = "เกิดข้อผิดพลาด",
        errorMessage = "ไม่สามารถดำเนินการได้",
        showSuccessNotification = true,
        showErrorNotification = true,
        onSuccess,
        onError,
      } = options;

      try {
        const result = await mutationFn.unwrap();

        // แสดงการแจ้งเตือนความสำเร็จ
        if (showSuccessNotification) {
          dispatch(
            addNotification({
              type: "success",
              title: successTitle,
              message: successMessage,
            })
          );
        }

        // เรียก callback เมื่อสำเร็จ (ถ้ามี)
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        // แสดงการแจ้งเตือนข้อผิดพลาด
        if (showErrorNotification) {
          dispatch(
            addNotification({
              type: "error",
              title: errorTitle,
              message: error?.data?.message || error?.message || errorMessage,
            })
          );
        }

        // เรียก callback เมื่อเกิดข้อผิดพลาด (ถ้ามี)
        if (onError) {
          onError(error);
        }

        // ส่งต่อ error เพื่อให้ component สามารถจัดการเพิ่มเติมได้
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * Helper functions สำหรับ operations ทั่วไป
   */
  const operations = {
    // การอนุมัติเอกสาร
    approve: (mutationFn, id, notes) =>
      executeMutation(() => mutationFn({ id, notes }), {
        successTitle: "อนุมัติเรียบร้อย",
        successMessage: "เอกสารได้รับการอนุมัติแล้ว",
      }),

    // การปฏิเสธเอกสาร
    reject: (mutationFn, id, reason) =>
      executeMutation(() => mutationFn({ id, reason }), {
        successTitle: "ปฏิเสธเรียบร้อย",
        successMessage: "ได้ดำเนินการปฏิเสธเอกสารแล้ว",
      }),

    // การส่งกลับแก้ไข
    sendBack: (mutationFn, id, reason) =>
      executeMutation(() => mutationFn({ id, reason }), {
        successTitle: "ส่งกลับแก้ไข",
        successMessage: "ส่งเอกสารกลับให้แก้ไขเรียบร้อย",
      }),

    // การส่งเพื่อตรวจสอบ
    submitForReview: (mutationFn, id) =>
      executeMutation(() => mutationFn(id), {
        successTitle: "ส่งตรวจสอบเรียบร้อย",
        successMessage: "เอกสารถูกส่งเพื่อตรวจสอบแล้ว",
      }),

    // การอัปโหลดไฟล์
    uploadFile: (mutationFn, id, files, description = "") =>
      executeMutation(() => mutationFn({ id, files, description }), {
        successTitle: "อัปโหลดสำเร็จ",
        successMessage: "อัปโหลดไฟล์เรียบร้อยแล้ว",
      }),

    // การแก้ไขข้อมูล
    update: (mutationFn, data) =>
      executeMutation(() => mutationFn(data), {
        successTitle: "อัปเดตเรียบร้อย",
        successMessage: "ข้อมูลได้รับการอัปเดตแล้ว",
      }),

    // การสร้างใหม่
    create: (mutationFn, data) =>
      executeMutation(() => mutationFn(data), {
        successTitle: "สร้างเรียบร้อย",
        successMessage: "สร้างข้อมูลใหม่เรียบร้อยแล้ว",
      }),

    // การลบ
    delete: (mutationFn, id) =>
      executeMutation(() => mutationFn(id), {
        successTitle: "ลบเรียบร้อย",
        successMessage: "ลบข้อมูลเรียบร้อยแล้ว",
      }),

    // การมาร์คเป็นส่งแล้ว
    markSent: (mutationFn, id, payload) =>
      executeMutation(() => mutationFn({ id, ...payload }), {
        successTitle: "บันทึกการส่งแล้ว",
        successMessage: "เปลี่ยนสถานะเป็นส่งแล้วเรียบร้อย",
      }),
  };

  return {
    executeMutation,
    operations,
  };
};

/**
 * Hook เฉพาะสำหรับการจัดการ Quotations
 */
export const useQuotationOptimisticUpdates = () => {
  const { operations } = useOptimisticUpdates();

  return {
    approveQuotation: operations.approve,
    rejectQuotation: operations.reject,
    sendBackQuotation: operations.sendBack,
    submitQuotation: operations.submitForReview,
    uploadEvidence: operations.uploadFile,
    markQuotationSent: operations.markSent,
  };
};

/**
 * Hook เฉพาะสำหรับการจัดการ Invoices
 */
export const useInvoiceOptimisticUpdates = () => {
  const { operations } = useOptimisticUpdates();

  return {
    approveInvoice: operations.approve,
    submitInvoice: operations.submitForReview,
    updateInvoice: operations.update,
    createInvoice: operations.create,
    uploadEvidence: operations.uploadFile,
  };
};

/**
 * Hook เฉพาะสำหรับการจัดการ Delivery Notes
 */
export const useDeliveryNoteOptimisticUpdates = () => {
  const { operations } = useOptimisticUpdates();

  return {
    createDeliveryNote: operations.create,
    updateDeliveryNote: operations.update,
    deleteDeliveryNote: operations.delete,
  };
};

export default useOptimisticUpdates;
