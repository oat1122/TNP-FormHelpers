import axios from "./axios";

/**
 * Notification API - Axios-based functions
 */
export const notificationApi = {
  /**
   * Fetch unread notifications
   */
  getUnreadNotifications: () => axios.get("/notifications/unread"),

  /**
   * Mark specific notifications as read
   * @param {string[]} customerIds - Array of customer IDs
   */
  markAsRead: (customerIds) =>
    axios.post("/notifications/mark-as-read", { customer_ids: customerIds }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: () => axios.post("/notifications/mark-all-as-read"),
};

export default notificationApi;
