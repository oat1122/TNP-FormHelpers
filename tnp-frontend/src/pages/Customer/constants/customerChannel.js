/**
 * Customer Channel Constants
 * Must match backend: app/Constants/CustomerChannel.php
 *
 * ใช้แทน Magic Numbers เพื่อความชัดเจน
 * แก้ไขที่เดียวมีผลทั้ง Frontend
 */

// Channel Values
export const CUSTOMER_CHANNEL = {
  SALES: 1,
  ONLINE: 2,
  OFFICE: 3,
};

// Channel Labels (for display)
export const CHANNEL_LABELS = {
  [CUSTOMER_CHANNEL.SALES]: "Sales",
  [CUSTOMER_CHANNEL.ONLINE]: "Online",
  [CUSTOMER_CHANNEL.OFFICE]: "Office",
};

// Channel Labels in Thai
export const CHANNEL_LABELS_TH = {
  [CUSTOMER_CHANNEL.SALES]: "ทีมขายหน้าร้าน",
  [CUSTOMER_CHANNEL.ONLINE]: "ทีมขายออนไลน์",
  [CUSTOMER_CHANNEL.OFFICE]: "ลูกค้าเดินเข้าร้าน",
};

// Channel Colors (MUI color names)
export const CHANNEL_COLORS = {
  [CUSTOMER_CHANNEL.SALES]: "warning", // Orange
  [CUSTOMER_CHANNEL.ONLINE]: "info", // Blue
  [CUSTOMER_CHANNEL.OFFICE]: "success", // Green
};

// Channel Background Colors (for chips, badges)
export const CHANNEL_BG_COLORS = {
  [CUSTOMER_CHANNEL.SALES]: "#fff3e0", // Light orange
  [CUSTOMER_CHANNEL.ONLINE]: "#e3f2fd", // Light blue
  [CUSTOMER_CHANNEL.OFFICE]: "#e8f5e9", // Light green
};

// Transfer Directions (used for UI logic)
export const TRANSFER_DIRECTIONS = {
  TO_SALES: "to_sales",
  TO_ONLINE: "to_online",
};

// Roles that can transfer (matches sub_role.msr_code from database)
export const TRANSFER_ROLES = {
  ADMIN: "admin", // user.role === 'admin'
  HEAD_ONLINE: "HEAD_ONLINE", // sub_roles[].msr_code === 'HEAD_ONLINE'
  HEAD_OFFLINE: "HEAD_OFFLINE", // sub_roles[].msr_code === 'HEAD_OFFLINE'
};

/**
 * Get effective role for transfer permissions
 * Checks sub_roles first (HEAD_ONLINE, HEAD_OFFLINE), then falls back to user.role
 *
 * @param {Object} userData - User data from localStorage
 * @returns {string} Effective role for transfer logic
 */
export const getEffectiveRole = (userData) => {
  if (!userData) return null;

  // Priority 1: Check if user is admin
  if (userData.role === "admin") return TRANSFER_ROLES.ADMIN;

  // Priority 2: Check sub_roles for HEAD status
  const subRoles = userData.sub_roles || [];
  for (const sr of subRoles) {
    const code = sr.msr_code?.toUpperCase();
    if (code === "HEAD_ONLINE") return TRANSFER_ROLES.HEAD_ONLINE;
    if (code === "HEAD_OFFLINE") return TRANSFER_ROLES.HEAD_OFFLINE;
  }

  // Fallback to regular role
  return userData.role;
};

// Helper Functions
export const getChannelLabel = (channel) => CHANNEL_LABELS[channel] || "Unknown";
export const getChannelLabelTh = (channel) => CHANNEL_LABELS_TH[channel] || "ไม่ทราบ";
export const getChannelColor = (channel) => CHANNEL_COLORS[channel] || "default";
export const getChannelBgColor = (channel) => CHANNEL_BG_COLORS[channel] || "#f5f5f5";

/**
 * Check if user can transfer based on role
 * @param {string} role - User's role
 * @param {number} customerChannel - Customer's current channel
 * @returns {{ canTransfer: boolean, targetChannel: number | null, direction: string | null }}
 */
export const canUserTransfer = (role, customerChannel) => {
  // Admin can transfer anything
  if (role === TRANSFER_ROLES.ADMIN) {
    const targetChannel =
      customerChannel === CUSTOMER_CHANNEL.SALES ? CUSTOMER_CHANNEL.ONLINE : CUSTOMER_CHANNEL.SALES;
    return {
      canTransfer: true,
      targetChannel,
      direction:
        targetChannel === CUSTOMER_CHANNEL.SALES
          ? TRANSFER_DIRECTIONS.TO_SALES
          : TRANSFER_DIRECTIONS.TO_ONLINE,
    };
  }

  // Head Online can transfer Online (2) to Sales (1)
  if (role === TRANSFER_ROLES.HEAD_ONLINE && customerChannel === CUSTOMER_CHANNEL.ONLINE) {
    return {
      canTransfer: true,
      targetChannel: CUSTOMER_CHANNEL.SALES,
      direction: TRANSFER_DIRECTIONS.TO_SALES,
    };
  }

  // Head Offline can transfer Sales (1) to Online (2)
  if (role === TRANSFER_ROLES.HEAD_OFFLINE && customerChannel === CUSTOMER_CHANNEL.SALES) {
    return {
      canTransfer: true,
      targetChannel: CUSTOMER_CHANNEL.ONLINE,
      direction: TRANSFER_DIRECTIONS.TO_ONLINE,
    };
  }

  return { canTransfer: false, targetChannel: null, direction: null };
};

/**
 * Get transfer button config based on role
 * @param {string} role - User's role
 * @returns {{ show: boolean, label: string, color: string, direction: string }}
 */
export const getTransferButtonConfig = (role) => {
  switch (role) {
    case TRANSFER_ROLES.ADMIN:
      return {
        show: true,
        label: "โอนลูกค้า",
        color: "secondary",
        direction: "both",
      };
    case TRANSFER_ROLES.HEAD_ONLINE:
      return {
        show: true,
        label: "โอนไป Sales",
        color: "warning",
        direction: TRANSFER_DIRECTIONS.TO_SALES,
      };
    case TRANSFER_ROLES.HEAD_OFFLINE:
      return {
        show: true,
        label: "โอนไป Online",
        color: "info",
        direction: TRANSFER_DIRECTIONS.TO_ONLINE,
      };
    default:
      return {
        show: false,
        label: "",
        color: "default",
        direction: null,
      };
  }
};
