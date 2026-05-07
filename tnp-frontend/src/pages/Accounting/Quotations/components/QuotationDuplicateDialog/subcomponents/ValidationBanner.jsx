import { Alert, AlertTitle, Box, Stack } from "@mui/material";

/**
 * Validation banner for QuotationDuplicateDialog (Phase 4 of redesign).
 *
 * Renders proactively at the top of dialog content so user sees issues
 * BEFORE attempting to save. Adapted from `QuotationValidationBanner` of
 * `CreateQuotationForm` but stripped of "ไปแก้ →" tab nav (duplicate dialog
 * is single-scroll — no tabs to jump to).
 *
 * Two severities:
 *   - error    → must fix before submit (Save button disabled)
 *   - warning  → soft caution (Save still allowed)
 *
 * Issues prop shape: [{ id, severity, message }]
 */
const ValidationBanner = ({ issues = [] }) => {
  if (!issues.length) return null;

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  const renderList = (items, severity) => (
    <Alert severity={severity} variant="outlined" sx={{ "& .MuiAlert-message": { width: "100%" } }}>
      <AlertTitle sx={{ fontWeight: 700 }}>
        {severity === "error"
          ? `พบ ${items.length} ข้อที่ต้องแก้ก่อนสร้างใบเสนอราคา`
          : `คำเตือน (${items.length})`}
      </AlertTitle>
      <Stack spacing={0.5} component="ul" sx={{ pl: 2.5, m: 0 }}>
        {items.map((it) => (
          <Box component="li" key={it.id}>
            {it.message}
          </Box>
        ))}
      </Stack>
    </Alert>
  );

  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      {errors.length > 0 && renderList(errors, "error")}
      {warnings.length > 0 && renderList(warnings, "warning")}
    </Stack>
  );
};

export default ValidationBanner;
