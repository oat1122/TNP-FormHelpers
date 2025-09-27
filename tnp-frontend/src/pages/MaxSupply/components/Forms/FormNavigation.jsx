import React from "react";
import { Box, Button, Paper, CircularProgress } from "@mui/material";
import { NavigateBefore, NavigateNext, Cancel, Save } from "@mui/icons-material";

const FormNavigation = ({
  activeStep,
  totalSteps,
  isEditMode,
  submitLoading,
  onBack,
  onNext,
  onCancel,
  onSubmit,
}) => {
  return (
    <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button
          disabled={activeStep === 0}
          onClick={onBack}
          startIcon={<NavigateBefore />}
          variant="outlined"
        >
          ย้อนกลับ
        </Button>

        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={onCancel} startIcon={<Cancel />}>
            ยกเลิก
          </Button>

          {activeStep === totalSteps - 1 ? (
            <Button
              variant="contained"
              onClick={onSubmit}
              disabled={submitLoading}
              startIcon={submitLoading ? <CircularProgress size={20} /> : <Save />}
            >
              {submitLoading ? "กำลังบันทึก..." : isEditMode ? "อัปเดต" : "สร้างงาน"}
            </Button>
          ) : (
            <Button variant="contained" onClick={onNext} endIcon={<NavigateNext />}>
              ถัดไป
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default FormNavigation;
