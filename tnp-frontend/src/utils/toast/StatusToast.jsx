import React from "react";
import toast from "react-hot-toast";
import { FiCheckCircle, FiXCircle, FiX, FiLoader } from "react-icons/fi";

/**
 * Status configuration for different toast types
 */
const STATUS_CONFIG = {
  success: {
    Icon: FiCheckCircle,
    bg: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
    iconBg: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    iconShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
    textColor: "#065F46",
    borderColor: "rgba(16, 185, 129, 0.15)",
    glowShadow: "0 20px 50px -12px rgba(16, 185, 129, 0.2)",
  },
  error: {
    Icon: FiXCircle,
    bg: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
    iconBg: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    iconShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
    textColor: "#991B1B",
    borderColor: "rgba(239, 68, 68, 0.15)",
    glowShadow: "0 20px 50px -12px rgba(239, 68, 68, 0.2)",
  },
  loading: {
    Icon: FiLoader,
    bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
    iconBg: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    iconShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
    textColor: "#1E40AF",
    borderColor: "rgba(59, 130, 246, 0.15)",
    glowShadow: "0 20px 50px -12px rgba(59, 130, 246, 0.2)",
    spin: true,
  },
};

/**
 * StatusToast Component
 * Modern & Minimalist status toast with inline styles for success, error, and loading states
 */
const StatusToast = ({ t, message, variant = "success", showClose = true }) => {
  const config = STATUS_CONFIG[variant] || STATUS_CONFIG.success;
  const { Icon, bg, iconBg, iconShadow, textColor, borderColor, glowShadow, spin } = config;

  const handleClose = () => {
    toast.dismiss(t.id);
  };

  // Keyframes for animations
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
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  // Container styles
  const containerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: "300px",
    maxWidth: "400px",
    padding: "14px 18px",
    background: bg,
    borderRadius: "14px",
    border: `1px solid ${borderColor}`,
    boxShadow: `${glowShadow}, 0 8px 20px -8px rgba(0, 0, 0, 0.08)`,
    animation: t.visible
      ? "slideInBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
      : "slideOut 0.4s ease-in forwards",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  };

  // Icon container styles
  const iconContainerStyle = {
    flexShrink: 0,
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: iconBg,
    boxShadow: iconShadow,
  };

  // Icon styles with optional spin animation
  const iconStyle = {
    width: "18px",
    height: "18px",
    color: "#FFFFFF",
    animation: spin ? "spin 1s linear infinite" : "none",
  };

  // Message styles
  const messageStyle = {
    flex: 1,
    margin: 0,
    fontSize: "14px",
    fontWeight: 500,
    color: textColor,
    lineHeight: 1.5,
  };

  // Close button styles
  const closeButtonStyle = {
    flexShrink: 0,
    padding: "5px",
    border: "none",
    background: "transparent",
    borderRadius: "6px",
    cursor: "pointer",
    color: textColor,
    opacity: 0.5,
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <>
      {/* Inject animation keyframes */}
      <style>{keyframes}</style>
      <div style={containerStyle}>
        {/* Icon Container */}
        <div style={iconContainerStyle}>
          <Icon style={iconStyle} />
        </div>

        {/* Message */}
        <p style={messageStyle}>{message}</p>

        {/* Close Button (not shown for loading) */}
        {showClose && variant !== "loading" && (
          <button
            onClick={handleClose}
            style={closeButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.5)}
            aria-label="ปิด"
          >
            <FiX style={{ width: "16px", height: "16px" }} />
          </button>
        )}
      </div>
    </>
  );
};

/**
 * Show a success toast
 * @param {string} message - Toast message
 * @param {Object} options - Additional options
 * @returns {string} Toast ID
 */
export const showSuccess = (message, options = {}) => {
  return toast.custom((t) => <StatusToast t={t} message={message} variant="success" />, {
    duration: options.duration ?? 3000,
    position: options.position ?? "top-right",
    ...options,
  });
};

/**
 * Show an error toast
 * @param {string} message - Toast message
 * @param {Object} options - Additional options
 * @returns {string} Toast ID
 */
export const showError = (message, options = {}) => {
  return toast.custom((t) => <StatusToast t={t} message={message} variant="error" />, {
    duration: options.duration ?? 5000,
    position: options.position ?? "top-right",
    ...options,
  });
};

/**
 * Show a loading toast
 * @param {string} message - Toast message
 * @param {Object} options - Additional options
 * @returns {string} Toast ID (use to dismiss later)
 */
export const showLoading = (message = "กำลังดำเนินการ...", options = {}) => {
  return toast.custom(
    (t) => <StatusToast t={t} message={message} variant="loading" showClose={false} />,
    {
      duration: Infinity, // Loading toast persists until dismissed
      position: options.position ?? "top-right",
      ...options,
    }
  );
};

export default StatusToast;
