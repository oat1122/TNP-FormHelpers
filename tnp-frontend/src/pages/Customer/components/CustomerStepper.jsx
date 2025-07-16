import React from "react";
import {
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Box,
  Typography,
  styled,
} from "@mui/material";
import {
  MdBusiness,
  MdAssignment,
  MdPerson,
  MdVerifiedUser,
  MdCheck,
  MdWarning,
} from "react-icons/md";

// สี theme ของบริษัท
const PRIMARY_RED = "#B20000";
const LIGHT_RED = "#E36264";
const GREY_MAIN = "#EBEBEB";
const GREY_DARK = "#212429";

// Styled Components
const StyledStepConnector = styled(StepConnector)(({ theme }) => ({
  "& .MuiStepConnector-line": {
    borderColor: GREY_MAIN,
    borderTopWidth: 2,
    minHeight: 2,
  },
  "&.Mui-active": {
    "& .MuiStepConnector-line": {
      borderColor: PRIMARY_RED,
    },
  },
  "&.Mui-completed": {
    "& .MuiStepConnector-line": {
      borderColor: PRIMARY_RED,
    },
  },
}));

const StyledStepIconRoot = styled("div")(({ theme, active, completed, error }) => ({
  backgroundColor: error ? LIGHT_RED : (completed || active) ? PRIMARY_RED : GREY_MAIN,
  zIndex: 1,
  color: error ? "#fff" : (completed || active) ? "#fff" : GREY_DARK,
  width: 50,
  height: 50,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  border: `2px solid ${error ? LIGHT_RED : (completed || active) ? PRIMARY_RED : GREY_MAIN}`,
  fontSize: "1.2rem",
  fontWeight: active ? 600 : 400,
  transition: theme.transitions.create(["background-color", "color"], {
    duration: theme.transitions.duration.shorter,
  }),
}));

// Step icons
const stepIcons = {
  1: <MdBusiness />,
  2: <MdAssignment />,
  3: <MdPerson />,
  4: <MdVerifiedUser />,
};

// Custom Step Icon Component
function CustomStepIcon({ active, completed, error, icon }) {
  return (
    <StyledStepIconRoot active={active} completed={completed} error={error}>
      {completed ? <MdCheck /> : error ? <MdWarning /> : stepIcons[String(icon)]}
    </StyledStepIconRoot>
  );
}

// Step Labels
const stepLabels = [
  "ประเภทธุรกิจ",
  "รายละเอียดธุรกิจ", 
  "ข้อมูลของคุณ",
  "การยืนยัน"
];

const stepDescriptions = [
  "เลือกประเภทธุรกิจและชื่อบริษัท",
  "ข้อมูลติดต่อและที่อยู่",
  "ผู้ดูแลและข้อมูลเพิ่มเติม",
  "ตรวจสอบข้อมูลก่อนบันทึก"
];

/**
 * CustomerStepper - Horizontal stepper component สำหรับ customer form
 * @param {Object} props
 * @param {number} props.activeStep - ขั้นตอนปัจจุบัน (0-3)
 * @param {Array} props.completedSteps - array ของขั้นตอนที่เสร็จแล้ว
 * @param {Array} props.errorSteps - array ของขั้นตอนที่มีข้อผิดพลาด
 * @param {Function} props.onStepClick - callback เมื่อคลิกที่ step
 */
const CustomerStepper = ({ 
  activeStep = 0,
  completedSteps = [],
  errorSteps = [],
  onStepClick 
}) => {
  return (
    <Box sx={{ width: "100%", mb: 3 }}>
      <Stepper 
        activeStep={activeStep} 
        connector={<StyledStepConnector />}
        sx={{
          "& .MuiStepLabel-root": {
            cursor: "pointer",
          }
        }}
      >
        {stepLabels.map((label, index) => {
          const isCompleted = completedSteps.includes(index);
          const isError = errorSteps.includes(index);
          const isActive = activeStep === index;
          
          return (
            <Step 
              key={label} 
              completed={isCompleted}
              onClick={() => onStepClick && onStepClick(index)}
            >
              <StepLabel
                StepIconComponent={(props) => (
                  <CustomStepIcon 
                    {...props} 
                    error={isError}
                    active={isActive}
                    completed={isCompleted}
                  />
                )}
                sx={{
                  "& .MuiStepLabel-label": {
                    color: isError ? LIGHT_RED : (isCompleted || isActive) ? PRIMARY_RED : GREY_DARK,
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: "Kanit",
                    fontSize: "0.9rem",
                    "&.Mui-active": {
                      color: PRIMARY_RED,
                      fontWeight: 600,
                    },
                    "&.Mui-completed": {
                      color: PRIMARY_RED,
                      fontWeight: 500,
                    },
                  },
                  "& .MuiStepLabel-iconContainer": {
                    transition: "transform 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                  },
                }}
              >
                <Typography variant="body2" component="div" sx={{ fontFamily: "Kanit" }}>
                  {label}
                </Typography>
                <Typography 
                  variant="caption" 
                  component="div" 
                  sx={{ 
                    color: "text.secondary", 
                    fontFamily: "Kanit",
                    fontSize: "0.75rem",
                    mt: 0.5
                  }}
                >
                  {stepDescriptions[index]}
                </Typography>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

export default CustomerStepper; 