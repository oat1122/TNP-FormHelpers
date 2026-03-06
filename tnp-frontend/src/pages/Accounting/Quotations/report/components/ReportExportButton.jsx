import React from "react";
import { Button, CircularProgress, Tooltip } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { apiConfig } from "../../../../../api/apiConfig";

const ReportExportButton = ({ filters = {}, disabled = false }) => {
  const [loading, setLoading] = React.useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && v !== "all") {
          params.append(k, v);
        }
      });

      const url = `${apiConfig.baseUrl}/quotations/report/export?${params.toString()}`;

      // Use fetch with auth header
      const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/csv",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `QuotationReport_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
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
