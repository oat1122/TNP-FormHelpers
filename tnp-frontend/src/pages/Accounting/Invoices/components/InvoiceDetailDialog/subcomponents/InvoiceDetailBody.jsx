import { Box, CircularProgress, Typography } from "@mui/material";

import EditModeTabs from "./EditModeTabs";
import InvoiceWarningsBanner from "../../calculation/InvoiceWarningsBanner";

/**
 * Body ของ InvoiceDetailDialog —
 *  - loading state
 *  - error state
 *  - warnings banner + EditModeTabs
 *
 * แยกออกจาก shell เพื่อให้ shell เป็น orchestration อย่างเดียว (no big JSX block).
 */
const InvoiceDetailBody = ({ isLoading, error, validation, editModeTabsProps }) => {
  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" gap={1} p={2}>
        <CircularProgress size={22} />
        <Typography variant="body2">กำลังโหลดรายละเอียด…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">ไม่สามารถโหลดข้อมูลได้</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {(validation.hasWarnings || !validation.isValid) && (
        <Box sx={{ mb: 2 }}>
          <InvoiceWarningsBanner
            validation={validation}
            collapsible={validation.warnings.length > 1}
          />
        </Box>
      )}

      <EditModeTabs {...editModeTabsProps} />
    </Box>
  );
};

export default InvoiceDetailBody;
