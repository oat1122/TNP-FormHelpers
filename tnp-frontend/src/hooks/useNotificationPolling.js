import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for polling customer allocation notifications
 *
 * This hook polls the backend API every 30 seconds to check for new customer allocations
 * Only active when user is logged in and has 'sale' role
 *
 * @param {number} interval - Polling interval in milliseconds (default: 30000ms = 30s)
 * @returns {Object} - { unreadCount, notifications, isLoading, error, refresh, markAsRead, markAllAsRead }
 */
export const useNotificationPolling = (interval = 30000) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get auth token from localStorage
  const authToken = localStorage.getItem("authToken");

  // Safely parse user data
  const getUserData = () => {
    try {
      const userData = localStorage.getItem("userData");
      return userData ? JSON.parse(userData) : {};
    } catch (error) {
      console.error("Failed to parse userData:", error);
      return {};
    }
  };
  const user = getUserData();

  // Only poll if user is logged in and has appropriate role (admin, manager, or sale)
  const shouldPoll = authToken && ['admin', 'manager', 'sale'].includes(user.role);

  /**
   * Fetch unread notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    if (!shouldPoll) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_END_POINT_URL}/notifications/unread`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        credentials: "include",
      });

      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        localStorage.removeItem("isLoggedIn");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        setUnreadCount(data.unread_count || 0);
        setNotifications(data.notifications || []);
      } else {
        throw new Error(data.message || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message);
      setUnreadCount(0);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, shouldPoll]);

  /**
   * Mark specific notifications as read
   * @param {string[]} customerIds - Array of customer IDs to mark as read
   */
  const markAsRead = useCallback(
    async (customerIds) => {
      if (!authToken || !customerIds || customerIds.length === 0) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_END_POINT_URL}/notifications/mark-as-read`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            credentials: "include",
            body: JSON.stringify({ customer_ids: customerIds }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "success") {
          // Refresh notifications after marking as read
          await fetchNotifications();
          return true;
        } else {
          throw new Error(data.message || "Failed to mark as read");
        }
      } catch (err) {
        console.error("Error marking notifications as read:", err);
        return false;
      }
    },
    [authToken, fetchNotifications]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!authToken) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_END_POINT_URL}/notifications/mark-all-as-read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        // Refresh notifications after marking all as read
        await fetchNotifications();
        return true;
      } else {
        throw new Error(data.message || "Failed to mark all as read");
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      return false;
    }
  }, [authToken, fetchNotifications]);

  // Initial fetch on mount
  useEffect(() => {
    if (shouldPoll) {
      fetchNotifications();
    }
  }, [shouldPoll, fetchNotifications]);

  // Set up polling interval
  useEffect(() => {
    if (!shouldPoll || interval <= 0) return;

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, interval);

    return () => clearInterval(intervalId);
  }, [shouldPoll, interval, fetchNotifications]);

  return {
    unreadCount,
    notifications,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};

export default useNotificationPolling;
