import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";

/**
 * Custom hook for dashboard polling with visibility detection
 * Automatically pauses when tab is hidden to save resources
 *
 * @param {Object} options Configuration options
 * @param {boolean} options.enabled Whether polling is enabled
 * @param {number} options.intervalMs Polling interval in milliseconds (default: 60000 = 1 minute)
 * @param {Function} options.onRefresh Callback function to execute on refresh (should return Promise)
 * @returns {Object} Polling state and control functions
 */
export const useTelesalesDashboardPolling = ({ enabled = true, intervalMs = 60000, onRefresh }) => {
  const [lastUpdated, setLastUpdated] = useState(dayjs());
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const onRefreshRef = useRef(onRefresh);

  // Keep onRefresh ref updated
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.hidden;
      setIsPaused(hidden);

      // Refresh immediately when tab becomes visible again
      if (!hidden && enabled && onRefreshRef.current) {
        onRefreshRef.current()?.catch((err) => {
          console.error("Polling refresh error on visibility change:", err);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled]);

  // Set up polling interval
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't start interval if not enabled
    if (!enabled) {
      return;
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      // Only refresh if tab is visible
      if (!document.hidden && onRefreshRef.current) {
        onRefreshRef
          .current()
          .then(() => {
            setLastUpdated(dayjs());
          })
          .catch((err) => {
            console.error("Polling refresh error:", err);
          });
      }
    }, intervalMs);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs]);

  // Force refresh function
  const forceRefresh = () => {
    if (onRefreshRef.current) {
      onRefreshRef
        .current()
        .then(() => {
          setLastUpdated(dayjs());
        })
        .catch((err) => {
          console.error("Force refresh error:", err);
        });
    }
  };

  return {
    lastUpdated: lastUpdated.format("HH:mm:ss"),
    isPaused,
    forceRefresh,
  };
};
