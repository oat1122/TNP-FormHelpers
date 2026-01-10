/**
 * Custom Toast Notification System
 *
 * Modern & Minimalist toast notifications using react-hot-toast + Tailwind CSS
 *
 * @example
 * // Notification Toast (real-time)
 * import { showNotificationToast } from '@/utils/toast';
 * showNotificationToast({
 *   title: 'ลูกค้าใหม่',
 *   message: 'คุณได้รับมอบหมายลูกค้าใหม่',
 *   icon: 'user-plus',
 * });
 *
 * @example
 * // Status Toasts
 * import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
 * showSuccess('บันทึกข้อมูลสำเร็จ');
 * showError('เกิดข้อผิดพลาด');
 * const loadingId = showLoading('กำลังบันทึก...');
 * dismissToast(loadingId);
 */

import toast from "react-hot-toast";

// Components
export { default as NotificationToast } from "./NotificationToast";
export { default as StatusToast } from "./StatusToast";

// Notification Toast
export { showNotificationToast } from "./NotificationToast";

// Status Toasts
export { showSuccess, showError, showLoading } from "./StatusToast";

/**
 * Dismiss a specific toast by ID
 * @param {string} toastId - Toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};
