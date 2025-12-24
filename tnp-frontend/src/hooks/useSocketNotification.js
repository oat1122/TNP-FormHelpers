import { useEffect, useRef, useMemo, useCallback } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import {
  useGetUnreadNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../features/Notification";

// URL ของ Notification Server - ใช้ค่าจาก .env
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

/**
 * Safely parse user data from localStorage
 */
const getUserData = () => {
  try {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Failed to parse userData:", error);
    return null;
  }
};

/**
 * Custom hook for real-time Socket.io notifications + RTK Query for data management
 *
 * Features:
 * - Socket.io connection for real-time notifications
 * - RTK Query for fetching notifications (on mount + on socket event)
 * - Mark as read functionality
 * - NO polling - uses WebSocket events to trigger refetch
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableNotifications - Enable notifications (default: true)
 * @returns {Object} - { unreadCount, notifications, isLoading, error, refresh, markAsRead, markAllAsRead }
 */
export const useSocketNotification = (options = {}) => {
  const { enableNotifications = true } = options;
  const socketRef = useRef(null);
  const user = useMemo(() => getUserData(), []);

  // Check if user should receive notifications
  const shouldFetch =
    enableNotifications && user && ["admin", "manager", "sale"].includes(user.role);

  // RTK Query for fetching notifications - NO polling, fetch on demand
  const { data, isLoading, error, refetch } = useGetUnreadNotificationsQuery(undefined, {
    skip: !shouldFetch,
    pollingInterval: 0, // Disable polling - use WebSocket events instead
  });

  // RTK Mutations
  const [markAsReadMutation] = useMarkAsReadMutation();
  const [markAllAsReadMutation] = useMarkAllAsReadMutation();

  // Show toast notification
  const showToast = useCallback((notificationData) => {
    toast(notificationData.message, {
      icon:
        notificationData.type === "success"
          ? "✅"
          : notificationData.type === "error"
            ? "❌"
            : "🔔",
      duration: 5000,
      position: "top-right",
      style: {
        border: "1px solid #713200",
        padding: "16px",
        color: "#713200",
      },
    });
  }, []);

  // Socket.io connection - triggers refetch on notification events
  useEffect(() => {
    if (!user?.user_id) return;

    // Connect to Socket.io server
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to Notification Server");
      // Join user-specific room
      socketRef.current.emit("join_user", user.user_id);
    });

    socketRef.current.on("connect_error", (error) => {
      console.warn("⚠️ Socket connection error:", error.message);
    });

    // Listen for notification events - trigger refetch when received
    socketRef.current.on("notification", (notificationData) => {
      console.log("📩 Received Notification:", notificationData);
      showToast(notificationData);

      // Refetch notifications when new event arrives (WebSocket-triggered)
      if (shouldFetch) {
        refetch();
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("❌ Disconnected from Notification Server");
      }
    };
  }, [user?.user_id, shouldFetch, refetch, showToast]);

  /**
   * Mark specific notifications as read
   * @param {string[]} customerIds - Array of customer IDs to mark as read
   */
  const markAsRead = useCallback(
    async (customerIds) => {
      if (!customerIds || customerIds.length === 0) return false;
      try {
        await markAsReadMutation(customerIds).unwrap();
        return true;
      } catch (err) {
        console.error("Error marking notifications as read:", err);
        return false;
      }
    },
    [markAsReadMutation]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation().unwrap();
      return true;
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      return false;
    }
  }, [markAllAsReadMutation]);

  return {
    unreadCount: data?.data?.unread_count || 0,
    notifications: data?.data?.notifications || [],
    isLoading,
    error: error?.message || null,
    refresh: refetch,
    markAsRead,
    markAllAsRead,
  };
};

export default useSocketNotification;
