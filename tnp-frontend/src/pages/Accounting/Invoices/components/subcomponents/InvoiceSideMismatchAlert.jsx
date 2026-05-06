import { Alert, AlertTitle, Box, Typography } from "@mui/material";

/**
 * Display soft-validation warnings for the active side (มัดจำก่อน / มัดจำหลัง).
 * Each warning has { title, detail } shape from useInvoiceSideValidation.
 *
 * Per audit invoice-side-edit Phase 3.
 */
const InvoiceSideMismatchAlert = ({ warnings = [] }) => {
  if (warnings.length === 0) return null;

  return (
    <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
      <AlertTitle sx={{ fontWeight: 700 }}>พบความไม่สอดคล้อง ({warnings.length})</AlertTitle>
      <Box component="ul" sx={{ pl: 2, m: 0 }}>
        {warnings.map((w, idx) => (
          <Box component="li" key={idx} sx={{ mb: idx < warnings.length - 1 ? 0.75 : 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {w.title}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              {w.detail}
            </Typography>
          </Box>
        ))}
      </Box>
    </Alert>
  );
};

export default InvoiceSideMismatchAlert;
