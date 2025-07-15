import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { filterValidation } from "../constants/filterConstants";

// Set up dayjs with Thai locale and Buddhist era
dayjs.extend(buddhistEra);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale("th");

/**
 * Custom Buddhist Era Adapter for MUI Date Pickers
 * Handles conversion between Buddhist and Gregorian calendars
 */
export class AdapterBuddhistDayjs extends AdapterDayjs {
  constructor({ locale }) {
    super({ locale });
  }

  /**
   * Format date with Buddhist year display
   * @param {dayjs.Dayjs} value - Date value to format
   * @param {string} formatString - Format string
   * @returns {string} Formatted date string with Buddhist year
   */
  format = (value, formatString) => {
    // Handle Buddhist year display
    const yearFormats = ["YYYY", "YY"];
    let formattedDate = value.format(formatString);

    yearFormats.forEach((yearFormat) => {
      if (formatString.includes(yearFormat)) {
        const gregorianYear = value.year();
        const buddhistYear = gregorianYear + filterValidation.buddhistYearOffset;
        
        if (yearFormat === "YYYY") {
          formattedDate = formattedDate.replace(gregorianYear, buddhistYear);
        } else {
          const shortYear = (gregorianYear % 100).toString().padStart(2, "0");
          const shortBuddhistYear = (buddhistYear % 100)
            .toString()
            .padStart(2, "0");
          formattedDate = formattedDate.replace(shortYear, shortBuddhistYear);
        }
      }
    });

    return formattedDate;
  };

  /**
   * Parse date string with Buddhist year input support
   * @param {string} value - Date string to parse
   * @param {string} format - Expected format
   * @returns {dayjs.Dayjs|null} Parsed date or null if invalid
   */
  parse = (value, format) => {
    if (!value) return null;

    // Handle Buddhist year input (e.g., "25/12/2567")
    const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const match = value.match(datePattern);

    if (match) {
      const [_, day, month, year] = match;
      const buddhistYear = parseInt(year, 10);
      const gregorianYear = buddhistYear - filterValidation.buddhistYearOffset;

      // Validate the year is reasonable
      if (gregorianYear < 1900 || gregorianYear > 2100) {
        return null;
      }

      return dayjs(`${day}/${month}/${gregorianYear}`, "DD/MM/YYYY");
    }

    return dayjs(value, format);
  };
}

/**
 * Date range calculation helpers for quick selection
 */
export const dateRangeCalculators = {
  today: () => {
    const today = dayjs();
    return {
      startDate: today.startOf("day"),
      endDate: today.endOf("day"),
    };
  },

  yesterday: () => {
    const yesterday = dayjs().subtract(1, "day");
    return {
      startDate: yesterday.startOf("day"),
      endDate: yesterday.endOf("day"),
    };
  },

  thisWeek: () => {
    const today = dayjs();
    return {
      startDate: today.startOf("week"),
      endDate: today.endOf("week"),
    };
  },

  lastWeek: () => {
    const lastWeek = dayjs().subtract(1, "week");
    return {
      startDate: lastWeek.startOf("week"),
      endDate: lastWeek.endOf("week"),
    };
  },

  thisMonth: () => {
    const today = dayjs();
    return {
      startDate: today.startOf("month"),
      endDate: today.endOf("month"),
    };
  },

  lastMonth: () => {
    const lastMonth = dayjs().subtract(1, "month");
    return {
      startDate: lastMonth.startOf("month"),
      endDate: lastMonth.endOf("month"),
    };
  },

  last3Months: () => {
    const today = dayjs();
    return {
      startDate: today.subtract(3, "month").startOf("day"),
      endDate: today.endOf("day"),
    };
  },

  thisYear: () => {
    const today = dayjs();
    return {
      startDate: today.startOf("year"),
      endDate: today.endOf("year"),
    };
  },
};

/**
 * Format date for display purposes
 * @param {dayjs.Dayjs} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateDisplay = (date) => {
  return date?.format(filterValidation.dateFormat) || "";
};

/**
 * Validate if date range is valid
 * @param {dayjs.Dayjs} startDate - Start date
 * @param {dayjs.Dayjs} endDate - End date
 * @returns {boolean} True if range is valid
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true; // Allow partial ranges
  return startDate.isSameOrBefore(endDate);
}; 