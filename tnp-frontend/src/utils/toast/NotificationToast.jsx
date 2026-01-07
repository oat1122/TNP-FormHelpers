import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiBell, FiX, FiUser, FiInfo, FiAlertCircle } from "react-icons/fi";
import { LuUserPlus, LuMessageSquare } from "react-icons/lu";

/**
 * Icon mapping based on notification type
 */
const ICON_MAP = {
  user: FiUser,
  "user-plus": LuUserPlus,
  message: LuMessageSquare,
  alert: FiAlertCircle,
  info: FiInfo,
  default: FiBell,
};

/**
 * Premium color themes with gradients and glows
 */
const THEME_MAP = {
  "user-plus": {
    primary: "#8B5CF6",
    secondary: "#A78BFA",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
    glow: "rgba(139, 92, 246, 0.5)",
    accent: "#DDD6FE",
  },
  alert: {
    primary: "#F59E0B",
    secondary: "#FBBF24",
    gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    glow: "rgba(245, 158, 11, 0.5)",
    accent: "#FEF3C7",
  },
  message: {
    primary: "#3B82F6",
    secondary: "#60A5FA",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    glow: "rgba(59, 130, 246, 0.5)",
    accent: "#DBEAFE",
  },
  default: {
    primary: "#6366F1",
    secondary: "#818CF8",
    gradient: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
    glow: "rgba(99, 102, 241, 0.5)",
    accent: "#E0E7FF",
  },
};

/**
 * Premium NotificationToast Component
 * Glass morphism design with animated elements
 */
const NotificationToast = ({ t, title, message, icon = "default", onClose, duration = 5000 }) => {
  const IconComponent = ICON_MAP[icon] || ICON_MAP.default;
  const theme = THEME_MAP[icon] || THEME_MAP.default;
  const [progress, setProgress] = useState(100);

  // Animated progress bar
  useEffect(() => {
    if (!t.visible || duration === Infinity) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [t.visible, duration]);

  const handleClose = () => {
    toast.dismiss(t.id);
    onClose?.();
  };

  // Inject keyframes
  const keyframes = `
    @keyframes slideInBounce {
      0% { transform: translateX(120%) scale(0.8); opacity: 0; }
      60% { transform: translateX(-8px) scale(1.02); opacity: 1; }
      80% { transform: translateX(4px) scale(0.99); }
      100% { transform: translateX(0) scale(1); opacity: 1; }
    }
    @keyframes slideOut {
      0% { transform: translateX(0) scale(1); opacity: 1; }
      100% { transform: translateX(120%) scale(0.8); opacity: 0; }
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 ${theme.glow}; }
      50% { box-shadow: 0 0 20px 4px ${theme.glow}; }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-3px); }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "360px",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "20px",
          overflow: "hidden",
          animation: t.visible
            ? "slideInBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
            : "slideOut 0.4s ease-in forwards",
          boxShadow: `
            0 25px 60px -15px rgba(0, 0, 0, 0.15),
            0 10px 30px -10px ${theme.glow},
            inset 0 1px 0 rgba(255, 255, 255, 0.8)
          `,
          border: "1px solid rgba(255, 255, 255, 0.5)",
          fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Main content */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            padding: "20px 20px 16px 20px",
          }}
        >
          {/* Icon Container */}
          <div
            style={{
              flexShrink: 0,
              width: "52px",
              height: "52px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "14px",
              background: theme.gradient,
              boxShadow: `0 8px 20px -4px ${theme.glow}`,
            }}
          >
            <IconComponent
              style={{
                width: "26px",
                height: "26px",
                color: "#FFFFFF",
              }}
            />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: "4px" }}>
            {/* Title */}
            <h4
              style={{
                margin: 0,
                marginBottom: "6px",
                fontSize: "16px",
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h4>

            {/* Message */}
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#475569",
                lineHeight: 1.6,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {message}
            </p>

            {/* Timestamp */}
            <span
              style={{
                display: "inline-block",
                marginTop: "10px",
                fontSize: "11px",
                fontWeight: 500,
                color: theme.primary,
                background: theme.accent,
                padding: "4px 10px",
                borderRadius: "20px",
              }}
            >
              เมื่อสักครู่
            </span>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            style={{
              flexShrink: 0,
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "rgba(0, 0, 0, 0.04)",
              borderRadius: "10px",
              cursor: "pointer",
              color: "#94A3B8",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FEE2E2";
              e.currentTarget.style.color = "#EF4444";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.04)";
              e.currentTarget.style.color = "#94A3B8";
              e.currentTarget.style.transform = "scale(1)";
            }}
            aria-label="ปิด"
          >
            <FiX style={{ width: "18px", height: "18px" }} />
          </button>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: "3px",
            background: "rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
              transition: "width 0.1s linear",
              borderRadius: "0 2px 2px 0",
            }}
          />
        </div>
      </div>
    </>
  );
};

/**
 * Show a premium notification toast
 * @param {Object} options
 * @param {string} options.title - Toast title
 * @param {string} options.message - Toast message
 * @param {string} options.icon - Icon type: 'user', 'user-plus', 'message', 'alert', 'info', 'default'
 * @param {number} options.duration - Duration in ms (default: 5000)
 * @param {Function} options.onClose - Callback when toast is closed
 * @returns {string} Toast ID
 */
export const showNotificationToast = ({
  title = "การแจ้งเตือน",
  message,
  icon = "default",
  duration = 5000,
  onClose,
}) => {
  return toast.custom(
    (t) => (
      <NotificationToast
        t={t}
        title={title}
        message={message}
        icon={icon}
        onClose={onClose}
        duration={duration}
      />
    ),
    {
      duration,
      position: "top-right",
    }
  );
};

export default NotificationToast;
