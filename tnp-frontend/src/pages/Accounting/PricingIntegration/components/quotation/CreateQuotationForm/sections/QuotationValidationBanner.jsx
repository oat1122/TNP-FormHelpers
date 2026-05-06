import { Alert, AlertTitle, Box, Button, Stack } from "@mui/material";

/**
 * Cross-tab validation banner (Phase 5 of create-quotation-redesign).
 *
 * Surfaces issues that live on a tab the user is not currently looking at.
 * Each issue can carry a `targetTab` so the banner offers a "ไปแก้" jump action.
 *
 * Two severities:
 *   - error    → must fix before submit (e.g. manual job missing required field)
 *   - warning  → soft caution (e.g. final total = 0, deposit > total)
 *
 * Issues prop shape:
 *   [{ id, severity, message, targetTab? }]
 */
const QuotationValidationBanner = ({ issues = [], onJumpToTab }) => {
  if (!issues.length) return null;

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  const renderList = (items, severity) => (
    <Alert severity={severity} variant="outlined" sx={{ "& .MuiAlert-message": { width: "100%" } }}>
      <AlertTitle sx={{ fontWeight: 700 }}>
        {severity === "error"
          ? `พบ ${items.length} ข้อที่ต้องแก้ก่อนส่ง`
          : `คำเตือน (${items.length})`}
      </AlertTitle>
      <Stack spacing={0.75} component="ul" sx={{ pl: 2.5, m: 0 }}>
        {items.map((it) => (
          <Box component="li" key={it.id} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Box sx={{ flex: 1 }}>{it.message}</Box>
            {it.targetTab && onJumpToTab && (
              <Button
                size="small"
                variant="text"
                onClick={() => onJumpToTab(it.targetTab)}
                sx={{ textTransform: "none", flexShrink: 0 }}
              >
                ไปแก้ →
              </Button>
            )}
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

export default QuotationValidationBanner;
