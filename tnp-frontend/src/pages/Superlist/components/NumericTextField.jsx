import { TextField } from "@mui/material";
import React from "react";

import { formatWithCommas, stripCommas, validateNumericInput } from "../utils";

/**
 * NumericTextField - TextField component with comma formatting
 * Handles numeric input with automatic comma formatting and validation
 */
const NumericTextField = ({ value, onChange, decimal = true, ...props }) => {
  const [focused, setFocused] = React.useState(false);
  const [localVal, setLocalVal] = React.useState("");

  const displayValue = focused ? localVal : formatWithCommas(value);

  const handleFocus = (e) => {
    setLocalVal(value == null ? "" : String(value));
    setFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    const raw = stripCommas(localVal);
    if (onChange) onChange(raw);
    props.onBlur?.(e);
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    if (validateNumericInput(raw, decimal)) {
      setLocalVal(raw);
    }
  };

  return (
    <TextField
      {...props}
      type="text"
      value={displayValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      inputProps={{
        ...props.inputProps,
        inputMode: decimal ? "decimal" : "numeric",
      }}
    />
  );
};

export default NumericTextField;
