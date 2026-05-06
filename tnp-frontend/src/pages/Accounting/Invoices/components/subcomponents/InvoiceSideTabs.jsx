import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";

import InvoiceSidePanel from "./InvoiceSidePanel";

/**
 * Tabs container for per-side edit (มัดจำก่อน / มัดจำหลัง).
 *
 * Tab indicators:
 *   ● filled dot — side has unsaved edits (compared to original invoice values)
 *   ⚠ warning icon — side has soft-validation warnings
 *
 * Color theme matches existing DepositCard:
 *   - ก่อน: warning palette (yellow)
 *   - หลัง: error palette (red — #E36264 family)
 *
 * Per audit invoice-side-edit Phase 3.
 */

const DirtyDot = () => (
  <Box
    component="span"
    sx={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      bgcolor: "currentColor",
      ml: 0.75,
    }}
    aria-label="มี edits ที่ยังไม่บันทึก"
  />
);

const TabLabel = ({ label, dirty, hasWarning }) => (
  <Stack direction="row" alignItems="center" spacing={0.5}>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {label}
    </Typography>
    {dirty && <DirtyDot />}
    {hasWarning && <WarningAmberIcon sx={{ fontSize: 16, color: "warning.main" }} />}
  </Stack>
);

const InvoiceSideTabs = ({
  invoice,
  beforeFormData,
  afterFormData,
  setBeforeField,
  setAfterField,
  dirtyBefore,
  dirtyAfter,
  warnings, // { before: [...], after: [...] } from useInvoiceSideValidation
  activeTab, // "before" | "after"
  onTabChange, // (newTab) => void
}) => {
  const beforeWarnings = warnings?.before ?? [];
  const afterWarnings = warnings?.after ?? [];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
        ข้อมูลเฉพาะ side
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(_e, val) => onTabChange(val)}
          textColor="inherit"
          TabIndicatorProps={{
            sx: {
              bgcolor: activeTab === "before" ? "warning.main" : "#E36264",
              height: 3,
            },
          }}
        >
          <Tab
            value="before"
            label={
              <TabLabel
                label="💰 มัดจำก่อน"
                dirty={dirtyBefore}
                hasWarning={beforeWarnings.length > 0}
              />
            }
            sx={{
              textTransform: "none",
              color: activeTab === "before" ? "warning.main" : "text.primary",
            }}
          />
          <Tab
            value="after"
            label={
              <TabLabel
                label="📋 มัดจำหลัง"
                dirty={dirtyAfter}
                hasWarning={afterWarnings.length > 0}
              />
            }
            sx={{
              textTransform: "none",
              color: activeTab === "after" ? "#E36264" : "text.primary",
            }}
          />
        </Tabs>
      </Box>

      {activeTab === "before" ? (
        <InvoiceSidePanel
          side="before"
          sideData={beforeFormData}
          onChange={setBeforeField}
          invoice={invoice}
          warnings={beforeWarnings}
        />
      ) : (
        <InvoiceSidePanel
          side="after"
          sideData={afterFormData}
          onChange={setAfterField}
          invoice={invoice}
          warnings={afterWarnings}
        />
      )}
    </Box>
  );
};

export default InvoiceSideTabs;
