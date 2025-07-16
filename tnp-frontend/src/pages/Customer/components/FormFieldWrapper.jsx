import React from "react";
import { Box, Typography, Chip, Tooltip } from "@mui/material";
import { MdError, MdCheckCircle, MdInfoOutline } from "react-icons/md";
import { styled } from "@mui/material/styles";

// Styled components
const FieldContainer = styled(Box)(({ theme, hasError, isRequired, isCompleted }) => ({
  position: "relative",
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: hasError 
    ? "rgba(178, 0, 0, 0.04)" // ใช้สีแดงของ theme
    : isCompleted 
    ? "rgba(46, 125, 50, 0.04)"
    : theme.palette.background.paper,
  border: `1px solid ${
    hasError 
      ? "#B20000" // สีแดงหลักของ theme
      : isCompleted 
      ? "#2e7d32"
      : "transparent"
  }`,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: hasError 
      ? "rgba(178, 0, 0, 0.06)"
      : isCompleted 
      ? "rgba(46, 125, 50, 0.06)"
      : theme.palette.action.hover,
  },
}));

const FieldLabel = styled(Typography)(({ theme, isRequired, hasError }) => ({
  fontWeight: 600,
  fontSize: "0.875rem",
  color: hasError 
    ? "#B20000" // สีแดงหลักของ theme
    : isRequired 
    ? "#B20000" // ใช้สีแดงแทน primary
    : theme.palette.text.secondary,
  marginBottom: theme.spacing(0.5),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const RequiredIndicator = styled(Chip)(({ theme }) => ({
  height: 18,
  fontSize: "0.6rem",
  fontWeight: 600,
  backgroundColor: "#B20000", // สีแดงหลักของ theme
  color: "#ffffff",
  "& .MuiChip-label": {
    paddingInline: theme.spacing(0.5),
  },
}));

const OptionalIndicator = styled(Chip)(({ theme }) => ({
  height: 18,
  fontSize: "0.6rem",
  fontWeight: 400,
  backgroundColor: "#EBEBEB", // สีเทาของ theme
  color: "#212429", // สีเทาเข้มของ theme
  "& .MuiChip-label": {
    paddingInline: theme.spacing(0.5),
  },
}));

const StatusIcon = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  zIndex: 1,
}));

const HelpText = styled(Typography)(({ theme, hasError }) => ({
  fontSize: "0.75rem",
  marginTop: theme.spacing(0.5),
  color: hasError 
    ? "#B20000" // สีแดงหลักของ theme
    : theme.palette.text.secondary,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

/**
 * FormFieldWrapper - ห่อ form fields ด้วย visual indicators และ accessibility
 * @param {Object} props
 * @param {React.ReactNode} props.children - Form field component
 * @param {string} props.label - ป้ายกำกับของ field
 * @param {boolean} props.required - บังคับกรอกหรือไม่
 * @param {string} props.error - ข้อความ error
 * @param {string} props.helperText - ข้อความช่วยเหลือ
 * @param {any} props.value - ค่าปัจจุบันของ field
 * @param {string} props.placeholder - placeholder text
 * @param {string} props.tooltip - tooltip text
 * @param {React.ReactNode} props.icon - icon สำหรับ label
 * @param {boolean} props.showProgress - แสดง progress indicator หรือไม่
 */
const FormFieldWrapper = ({
  children,
  label,
  required = false,
  error = "",
  helperText = "",
  value,
  placeholder = "",
  tooltip = "",
  icon = null,
  showProgress = true,
  ...rest
}) => {
  // ตรวจสอบว่า field มีค่าแล้วหรือไม่
  const hasValue = value !== undefined && value !== null && value !== "";
  const isCompleted = required ? hasValue : hasValue;
  const hasError = !!error;

  // สร้าง accessibility props
  const fieldId = `field-${label?.replace(/\s+/g, "-").toLowerCase()}`;
  const errorId = hasError ? `${fieldId}-error` : undefined;
  const helperId = helperText ? `${fieldId}-helper` : undefined;

  return (
    <FieldContainer 
      hasError={hasError} 
      isRequired={required} 
      isCompleted={isCompleted}
      {...rest}
    >
      {/* Status Icon */}
      {showProgress && (
        <StatusIcon>
          {hasError ? (
            <Tooltip title="มีข้อผิดพลาด">
              <MdError color="#B20000" size={20} />
            </Tooltip>
          ) : isCompleted ? (
            <Tooltip title="กรอกข้อมูลครบถ้วนแล้ว">
              <MdCheckCircle color="#2e7d32" size={20} />
            </Tooltip>
          ) : required ? (
            <Tooltip title="จำเป็นต้องกรอกข้อมูล">
              <MdInfoOutline color="#B20000" size={20} />
            </Tooltip>
          ) : null}
        </StatusIcon>
      )}

      {/* Field Label */}
      {label && (
        <FieldLabel isRequired={required} hasError={hasError}>
          {icon && icon}
          {label}
          {tooltip && (
            <Tooltip title={tooltip} arrow>
              <MdInfoOutline size={16} style={{ cursor: "help" }} />
            </Tooltip>
          )}
          {required ? (
            <RequiredIndicator label="จำเป็น" size="small" />
          ) : (
            <OptionalIndicator label="ไม่บังคับ" size="small" />
          )}
        </FieldLabel>
      )}

      {/* Form Field */}
      <Box sx={{ position: "relative" }}>
        {React.cloneElement(children, {
          id: fieldId,
          "aria-describedby": [errorId, helperId].filter(Boolean).join(" "),
          "aria-invalid": hasError,
          error: hasError,
          placeholder: placeholder || `กรุณากรอก${label}`,
        })}
      </Box>

      {/* Helper Text or Error Message */}
      {(error || helperText) && (
        <HelpText hasError={hasError} id={errorId || helperId}>
          {hasError && <MdError size={14} />}
          {error || helperText}
        </HelpText>
      )}
    </FieldContainer>
  );
};

export default FormFieldWrapper; 