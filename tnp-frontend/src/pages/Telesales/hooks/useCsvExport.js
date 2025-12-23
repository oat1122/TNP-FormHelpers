import { useState, useCallback } from "react";

/**
 * Custom hook for handling CSV export functionality
 *
 * @param {string} period - Current period filter (today, week, month, etc.)
 * @param {string} sourceFilter - Current source filter
 * @returns {Object} Export state and handler
 */
export const useCsvExport = (period, sourceFilter) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = useCallback(() => {
    setIsExporting(true);

    // Use the same base URL as apiConfig (VITE_END_POINT_URL)
    const baseUrl = import.meta.env.VITE_END_POINT_URL || "";
    // Try both token keys for backward compatibility
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    const params = new URLSearchParams({
      period,
      source_filter: sourceFilter,
    });

    // Build the full export URL
    const url = `${baseUrl}/customers/kpi/export?${params.toString()}`;

    // Create temporary link with auth header workaround
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/csv",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Export failed");
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `kpi_export_${period}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => console.error("Export failed:", err))
      .finally(() => setIsExporting(false));
  }, [period, sourceFilter]);

  return { handleExportCsv, isExporting };
};
