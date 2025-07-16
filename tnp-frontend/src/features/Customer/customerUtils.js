import moment from "moment";
import dayjs from "dayjs";
import "dayjs/locale/th";
import relativeTime from "dayjs/plugin/relativeTime";

// Setup dayjs plugins
dayjs.extend(relativeTime);
dayjs.locale("th");

// แปลงค่าวันที่ recall ให้อยู่ในรูปแบบแสดงจำนวนวันที่เหลือจนถึงวันที่ต้องติดต่อ หรือจำนวนวันที่เกินกำหนดแล้ว
export function formatCustomRelativeTime(dateString) {
  if (!dateString) {
    return 0;
  }
  
  const recallDate = moment(dateString).startOf('day');
  const today = moment().startOf('day');
  
  // คำนวณจำนวนวันระหว่าง recall date กับวันนี้
  const diffInDays = recallDate.diff(today, 'days');
  
  // ถ้า recall date เป็นในอนาคต = ยังไม่ถึงเวลาต้องติดต่อ
  if (diffInDays > 0) {
    return diffInDays; // จำนวนวันที่เหลือ
  }
  
  // ถ้า recall date เป็นวันนี้หรือผ่านมาแล้ว = ถึงเวลาต้องติดต่อแล้ว
  return Math.abs(diffInDays); // จำนวนวันที่เกินกำหนด (0 สำหรับวันนี้)
}

/**
 * Format a date for relative time display (e.g. 3 วันที่แล้ว)
 *
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted relative time
 */
export const formatRelativeDate = (date) => {
  if (!date) return "-";
  return dayjs(date).fromNow();
};

/**
 * Format days for display in human-readable format
 *
 * @param {number} days - Number of days
 * @returns {string} Formatted days as relative time
 */
export const formatDaysToText = (days) => {
  if (days === null || days === undefined) return "-";

  if (days === 0) return "วันนี้";
  if (days === 1) return "เมื่อวานนี้";
  if (days < 7) return `${days} วันที่แล้ว`;
  if (days < 30) return `${Math.floor(days / 7)} สัปดาห์ที่แล้ว`;
  if (days < 365) return `${Math.floor(days / 30)} เดือนที่แล้ว`;
  return `${Math.floor(days / 365)} ปีที่แล้ว`;
};

/**
 * Get a display name for a channel value
 *
 * @param {string} channelValue - The channel value (1, 2, 3, etc)
 * @returns {string} The channel display name
 */
export const getChannelDisplayName = (channelValue) => {
  const channels = {
    1: "Sales",
    2: "Online",
    3: "Office",
  };

  return channels[channelValue] || "Unknown";
};

/**
 * Format recall days for display, with color indicator
 *
 * @param {number} days - Number of days since last contact
 * @returns {object} Object with text and color properties
 */
export const formatRecallDays = (days) => {
  if (days === null || days === undefined) {
    return { text: "-", color: "inherit" };
  }

  // Determine urgency based on days
  if (days <= 7) {
    return { text: formatDaysToText(days), color: "#4caf50" }; // Green
  } else if (days <= 30) {
    return { text: formatDaysToText(days), color: "#ff9800" }; // Orange
  } else {
    return { text: formatDaysToText(days), color: "#f44336" }; // Red
  }
};

export function genCustomerNo(lastCustomerNumber = null) {
  const currentYear = moment().year().toString();

  let nextId;
  if (lastCustomerNumber) {
    const lastYear = lastCustomerNumber.substring(0, 4);
    const lastId = parseInt(lastCustomerNumber.substring(4), 10);

    nextId = lastYear === currentYear ? lastId + 1 : 1;
  } else {
    nextId = 1;
  }

  return `${currentYear}${nextId.toString().padStart(6, "0")}`;
}
