import DownloadIcon from "@mui/icons-material/Download";
import { Button, CircularProgress, Tooltip } from "@mui/material";
import { useState } from "react";

import { showError } from "../../../utils/accountingToast";
import { exportQuotationReportCsv } from "../utils/reportExportCsv";

const ReportExportButton = ({ filters = {}, disabled = false }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportQuotationReportCsv(filters);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Export error:", err);
      showError("Export ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="ดาวน์โหลดรายงานเป็น CSV">
      <span>
        <Button
          variant="outlined"
          size="small"
          startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
          onClick={handleExport}
          disabled={disabled || loading}
          sx={{ whiteSpace: "nowrap" }}
        >
          Export CSV
        </Button>
      </span>
    </Tooltip>
  );
};

export default ReportExportButton;
