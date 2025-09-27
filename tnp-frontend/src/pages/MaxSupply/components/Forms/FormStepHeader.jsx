import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ArrowBack, AutoAwesome, CheckCircle } from "@mui/icons-material";

const FormStepHeader = ({ isEditMode, onBack, autoFillPreview, steps, activeStep, isMobile }) => {
  const theme = useTheme();

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Button startIcon={<ArrowBack />} onClick={onBack} variant="outlined" size="small">
          กลับ
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {isEditMode ? "แก้ไขงาน Max Supply" : "สร้างงาน Max Supply ใหม่"}
        </Typography>
      </Box>

      {/* Auto Fill Preview */}
      {autoFillPreview && (
        <Alert severity="success" icon={<AutoAwesome />} sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>ข้อมูลถูกกรอกอัตโนมัติจาก NewWorkSheet:</strong>
            <br />
            ลูกค้า: {autoFillPreview.customer_name} | จำนวน: {autoFillPreview.total_quantity} ตัว |
            ประเภท: {autoFillPreview.production_type} | ครบกำหนด:{" "}
            {autoFillPreview.due_date.format("DD/MM/YYYY")}
            {autoFillPreview.newworks_code && ` | รหัส: ${autoFillPreview.newworks_code}`}
            {autoFillPreview.fabric_info?.fabric_name &&
              ` | ผ้า: ${autoFillPreview.fabric_info.fabric_name}`}
          </Typography>
        </Alert>
      )}

      {/* Progress Stepper */}
      <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              icon={
                <Avatar
                  sx={{
                    bgcolor: activeStep >= index ? "primary.main" : "grey.400",
                    width: 32,
                    height: 32,
                  }}
                >
                  {activeStep > index ? <CheckCircle /> : step.icon}
                </Avatar>
              }
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {step.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default FormStepHeader;
