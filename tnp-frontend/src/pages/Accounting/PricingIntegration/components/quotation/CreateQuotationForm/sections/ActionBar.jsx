import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { Box, Tooltip } from "@mui/material";

import { PrimaryButton, SecondaryButton } from "../../../styles/quotationFormStyles";

/**
 * Sticky action bar (Phase 1 + 5 of create-quotation-redesign).
 *
 * Sticks to the viewport bottom so submit is reachable without scrolling.
 * `disableReason` shows as a tooltip when the submit button is disabled, so
 * the user knows what to fix before retrying.
 */
const ActionBar = ({ onBack, onSubmitReview, isSubmitting, isDisabled, disableReason = "" }) => {
  const submitButton = (
    <PrimaryButton onClick={onSubmitReview} disabled={isSubmitting || isDisabled}>
      {isSubmitting ? "กำลังส่ง…" : "ส่งตรวจสอบ"}
    </PrimaryButton>
  );

  return (
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        mt: 3,
        mx: -3,
        px: 3,
        py: 1.5,
        display: "flex",
        justifyContent: "space-between",
        gap: 1,
        bgcolor: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid",
        borderColor: "divider",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.04)",
        zIndex: 10,
      }}
    >
      <SecondaryButton onClick={onBack} startIcon={<ArrowBackIcon />}>
        ยกเลิก
      </SecondaryButton>
      <Box display="flex" gap={1}>
        {isDisabled && disableReason ? (
          <Tooltip title={disableReason} arrow placement="top">
            <span>{submitButton}</span>
          </Tooltip>
        ) : (
          submitButton
        )}
      </Box>
    </Box>
  );
};

export default ActionBar;
