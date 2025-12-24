/**
 * FormFields.jsx - Shared form input components
 *
 * UI Primitives for consistent form styling across:
 * - DialogForm (EssentialInfoTab, AdditionalInfoTab)
 * - TelesalesQuickCreateForm
 *
 * @module Forms/ui/FormFields
 */
import React from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Box,
} from "@mui/material";

// =============================================================================
// THEME CONSTANTS (Single source of truth)
// =============================================================================

export const FORM_THEME = {
  PRIMARY_RED: "#9e0000",
  SECONDARY_RED: "#d32f2f",
  BACKGROUND: "#fffaf9",
};

// =============================================================================
// STYLED TEXT FIELD
// =============================================================================

/**
 * StyledTextField - Consistent text input with company theme
 *
 * Features:
 * - Kanit font family
 * - Red highlight on hover/focus
 * - Automatic disabled state for view mode
 * - Required asterisk handling
 *
 * @param {string} label - Field label
 * @param {boolean} required - Shows asterisk if true
 * @param {string} mode - "create" | "edit" | "view"
 * @param {function} onBlur - Blur event handler
 * @param {object} props - Additional TextField props
 */
export const StyledTextField = ({ label, required, mode, onBlur, ...props }) => (
  <TextField
    {...props}
    label={required ? `${label} *` : label}
    size="small"
    fullWidth
    disabled={mode === "view"}
    onBlur={onBlur}
    sx={{
      bgcolor: "white",
      "& .MuiOutlinedInput-root": {
        "&:hover fieldset": {
          borderColor: FORM_THEME.PRIMARY_RED,
        },
        "&.Mui-focused fieldset": {
          borderColor: FORM_THEME.PRIMARY_RED,
        },
      },
      "& .MuiInputLabel-root": {
        "&:hover": {
          color: FORM_THEME.PRIMARY_RED,
        },
        "&.Mui-focused": {
          color: FORM_THEME.PRIMARY_RED,
        },
      },
      ...props.sx,
    }}
    InputProps={{
      style: { fontFamily: "Kanit", fontSize: 14 },
      ...props.InputProps,
    }}
    InputLabelProps={{
      style: { fontFamily: "Kanit", fontSize: 14 },
      ...props.InputLabelProps,
    }}
  />
);

// =============================================================================
// STYLED SELECT
// =============================================================================

/**
 * StyledSelect - Consistent select dropdown with company theme
 *
 * @param {string} label - Field label
 * @param {string} mode - "create" | "edit" | "view"
 * @param {boolean} error - Error state
 * @param {React.ReactNode} children - MenuItem components
 * @param {object} props - Additional Select props
 */
export const StyledSelect = ({ label, mode, error, children, ...props }) => (
  <FormControl fullWidth disabled={mode === "view"} size="small" error={error}>
    <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>{label}</InputLabel>
    <Select
      label={label}
      sx={{
        fontFamily: "Kanit",
        fontSize: 14,
        bgcolor: "white",
      }}
      {...props}
    >
      {children}
    </Select>
  </FormControl>
);

// =============================================================================
// STYLED AUTOCOMPLETE
// =============================================================================

/**
 * StyledAutocomplete - Consistent autocomplete with company theme
 *
 * @param {string} label - Field label
 * @param {string} placeholder - Input placeholder
 * @param {string} mode - "create" | "edit" | "view"
 * @param {boolean} error - Error state
 * @param {string} helperText - Helper/error text
 * @param {boolean} required - Shows asterisk if true
 * @param {object} props - Additional Autocomplete props
 */
export const StyledAutocomplete = ({
  label,
  placeholder,
  mode,
  error,
  helperText,
  required,
  ...props
}) => (
  <Autocomplete
    fullWidth
    disabled={mode === "view"}
    renderInput={(params) => (
      <TextField
        {...params}
        label={required ? `${label} *` : label}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        size="small"
        sx={{
          bgcolor: "white",
          "& .MuiInputBase-input": {
            fontFamily: "Kanit",
            fontSize: 14,
          },
          "& .MuiInputLabel-root": {
            fontFamily: "Kanit",
            fontSize: 14,
          },
          "& .MuiOutlinedInput-root": {
            "&:hover fieldset": { borderColor: FORM_THEME.PRIMARY_RED },
            "&.Mui-focused fieldset": { borderColor: FORM_THEME.PRIMARY_RED },
          },
        }}
      />
    )}
    ListboxProps={{
      sx: {
        maxHeight: 300,
        "& .MuiAutocomplete-option": {
          fontFamily: "Kanit",
        },
      },
    }}
    renderOption={(optionProps, option, state) => {
      // Use getOptionLabel if available, otherwise use option directly
      const label = props.getOptionLabel ? props.getOptionLabel(option) : option;
      return (
        <Box
          component="li"
          {...optionProps}
          sx={{
            fontFamily: "Kanit",
            fontSize: "0.875rem",
            padding: "12px 16px",
            "&:hover": {
              bgcolor: `${FORM_THEME.PRIMARY_RED}08`,
            },
          }}
        >
          {label}
        </Box>
      );
    }}
    {...props}
  />
);

// =============================================================================
// STYLED MENU ITEM (for use with StyledSelect)
// =============================================================================

/**
 * StyledMenuItem - Consistent menu item with Kanit font
 */
export const StyledMenuItem = ({ children, ...props }) => (
  <MenuItem sx={{ fontFamily: "Kanit" }} {...props}>
    {children}
  </MenuItem>
);

export default {
  FORM_THEME,
  StyledTextField,
  StyledSelect,
  StyledAutocomplete,
  StyledMenuItem,
};
