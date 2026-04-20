import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { Box } from "@mui/material";

import { PrimaryButton, SecondaryButton } from "../../../styles/quotationFormStyles";

const ActionBar = ({ onBack, onSubmitReview, isSubmitting, isDisabled }) => (
  <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", gap: 1 }}>
    <SecondaryButton onClick={onBack} startIcon={<ArrowBackIcon />}>
      ยกเลิก
    </SecondaryButton>
    <Box display="flex" gap={1}>
      <PrimaryButton onClick={onSubmitReview} disabled={isSubmitting || isDisabled}>
        {isSubmitting ? "กำลังส่ง…" : "ส่งตรวจสอบ"}
      </PrimaryButton>
    </Box>
  </Box>
);

export default ActionBar;
