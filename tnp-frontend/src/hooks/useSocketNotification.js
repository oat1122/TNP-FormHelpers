import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";

import axios from "../api/axios";
import {
  notificationRtkApi,
  useGetUnreadNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDismissNotificationMutation,
} from "../features/Notification";
import { showNotificationToast } from "../utils/toast";

// URL ของ Notification Server - ใช้ค่าจาก .env
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

// Constants for pending notifications
const MAX_PENDING_NOTIFICATIONS = 30;
const TOAST_DELAY_MS = 800; // Delay between each toast to prevent overlap

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
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const pendingNotificationsRef = useRef([]); // Queue for notifications when tab is hidden
  const isProcessingQueueRef = useRef(false); // Flag to prevent multiple queue processing
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
  const [dismissNotificationMutation] = useDismissNotificationMutation();

  // Show toast notification with custom NotificationToast
  const showToast = useCallback((notificationData) => {
    // Map notification type to icon
    const iconMap = {
      success: "info",
      error: "alert",
      customer: "user-plus",
      default: "default",
    };
    const icon = iconMap[notificationData.type] || iconMap.default;

    showNotificationToast({
      title: notificationData.title || "การแจ้งเตือน",
      message: notificationData.message,
      icon,
      duration: 5000,
    });
  }, []);

  /**
   * Process pending notifications queue sequentially with delay
   * Shows one toast at a time with TOAST_DELAY_MS between each
   */
  const processPendingQueue = useCallback(() => {
    if (isProcessingQueueRef.current || pendingNotificationsRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;
    const queue = [...pendingNotificationsRef.current];
    pendingNotificationsRef.current = []; // Clear queue

    // Show toasts one by one with delay
    queue.forEach((notification, index) => {
      setTimeout(() => {
        showToast(notification);
        // Reset processing flag after last toast
        if (index === queue.length - 1) {
          isProcessingQueueRef.current = false;
        }
      }, index * TOAST_DELAY_MS);
    });
  }, [showToast]);

  // Listen for page visibility changes to show pending notifications when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to this tab - process pending notifications
        console.log("👀 Page visible - processing pending notifications");
        processPendingQueue();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [processPendingQueue]);

  // Socket.io connection - triggers refetch on notification events
  useEffect(() => {
    if (!user?.user_id) return;

    // Connect to Socket.io server.
    //
    // Auth: Socket.io invokes the `auth` callback on every connection attempt
    // (initial + reconnects), so each handshake gets a fresh HMAC token from
    // Laravel. The server verifies the token and auto-joins us to
    // `user_<id>` — we no longer emit `join_user`. See
    // tnp-notification/.claude/rules/socket-auth.md.
    socketRef.current = io(SOCKET_URL, {
      auth: (cb) => {
        axios
          .get("/auth/socket-token")
          .then(({ data }) => cb(data?.data || {}))
          .catch((err) => {
            // Token fetch failed — connect with empty auth so the server
            // logs us, then refuses room access. The user's HTTP session is
            // already being handled by the axios 401 interceptor.
            console.warn("Socket token fetch failed:", err?.message || err);
            cb({});
          });
      },
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to Notification Server");
    });

    socketRef.current.on("connect_error", (error) => {
      console.warn("⚠️ Socket connection error:", error.message);
    });

    // Listen for notification events - trigger refetch when received
    socketRef.current.on("notification", (notificationData) => {
      console.log("📩 Received Notification:", notificationData);

      // Check if page is visible
      if (document.hidden) {
        // Page is hidden - queue notification for later (max 30)
        if (pendingNotificationsRef.current.length < MAX_PENDING_NOTIFICATIONS) {
          pendingNotificationsRef.current.push(notificationData);
          console.log(
            `📥 Notification queued (${pendingNotificationsRef.current.length}/${MAX_PENDING_NOTIFICATIONS})`
          );
        } else {
          console.warn("⚠️ Pending notifications queue is full, dropping notification");
        }
      } else {
        // Page is visible - show toast immediately
        showToast(notificationData);
      }

      // Refetch notifications when new event arrives (WebSocket-triggered)
      if (shouldFetch) {
        refetch();
      }
    });

    // Sync unread count across tabs/devices (Laravel emits after mark-as-read /
    // mark-all / dismiss). Patch the cache directly — no HTTP refetch.
    socketRef.current.on("notification-sync", ({ unread_count }) => {
      if (typeof unread_count !== "number") return;
      dispatch(
        notificationRtkApi.util.updateQueryData("getUnreadNotifications", undefined, (draft) => {
          if (draft?.data) {
            draft.data.unread_count = unread_count;
          }
        })
      );
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("❌ Disconnected from Notification Server");
      }
    };
  }, [user?.user_id, shouldFetch, refetch, showToast, dispatch]);

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

  /**
   * Dismiss notifications (hide permanently) - for X button
   * @param {string[]} customerIds - Array of customer IDs to dismiss
   */
  const dismissNotification = useCallback(
    async (customerIds) => {
      if (!customerIds || customerIds.length === 0) return false;
      try {
        await dismissNotificationMutation(customerIds).unwrap();
        return true;
      } catch (err) {
        console.error("Error dismissing notifications:", err);
        return false;
      }
    },
    [dismissNotificationMutation]
  );

  return {
    unreadCount: data?.data?.unread_count || 0,
    notifications: data?.data?.notifications || [],
    isLoading,
    error: error?.message || null,
    refresh: refetch,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
};

export default useSocketNotification;
