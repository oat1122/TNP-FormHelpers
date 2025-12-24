/**
 * DatePicker Configuration
 * ใช้สำหรับกำหนด styling และ behavior ของ DatePicker components
 */
import { filterColors, filterValidation } from "../constants/filterConstants";

/**
 * สร้าง common props สำหรับ DatePicker ที่ใช้ filterColors
 * @returns {Object} DatePicker slotProps configuration
 */
export const createDatePickerProps = () => ({
  slotProps: {
    textField: {
      size: "medium",
      fullWidth: true,
      sx: {
        "& .MuiInputLabel-root": {
          color: "text.secondary",
          fontSize: "0.95rem",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: filterColors.primary,
        },
        "& .MuiOutlinedInput-root": {
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: filterColors.border.focus,
          },
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: filterColors.primary,
          borderWidth: "1.5px",
        },
      },
      InputProps: {
        sx: {
          "&.Mui-focused": {
            boxShadow: `0 0 0 2px ${filterColors.primaryBorder}`,
          },
          borderRadius: 1.5,
          height: 48,
        },
      },
    },
    day: {
      sx: {
        fontWeight: "bold",
        "&.Mui-selected": {
          bgcolor: filterColors.primary,
          "&:hover": {
            bgcolor: filterColors.primaryHover,
          },
        },
      },
    },
    calendarHeader: {
      sx: { bgcolor: filterColors.primaryLight, py: 1 },
    },
    layout: {
      sx: {
        ".MuiPickersCalendarHeader-root": {
          fontWeight: "bold",
          color: filterColors.primary,
        },
      },
    },
    popper: {
      sx: {
        "& .MuiPaper-root": {
          boxShadow: "0px 5px 20px rgba(0,0,0,0.15)",
          borderRadius: "16px",
          border: `1px solid ${filterColors.primaryBorder}`,
        },
      },
    },
  },
  format: filterValidation.dateFormat,
});

/**
 * Styling สำหรับ clear button ใน DatePicker
 */
export const datePickerClearButtonSx = {
  color: filterColors.primary,
  "&:hover": {
    bgcolor: filterColors.primaryLight,
  },
};

/**
 * Styling สำหรับ date range indicator box
 */
export const dateRangeIndicatorSx = {
  mt: 1,
  p: 1.5,
  borderRadius: 1.5,
  backgroundColor: filterColors.primaryLight,
  border: `1px solid ${filterColors.primaryBorder}`,
};

/**
 * Icon styling สำหรับ DatePicker
 */
export const datePickerIconStyle = {
  color: filterColors.primary,
  fontSize: "1.2rem",
};
