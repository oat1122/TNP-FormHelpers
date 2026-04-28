import { apiConfig } from "../../../../../api/apiConfig";
import { getAuthToken } from "../../../shared/utils/authToken";

const buildExportQuery = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "all") {
      params.append(k, v);
    }
  });
  return params.toString();
};

const triggerCsvDownload = (blob) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `QuotationReport_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  window.URL.revokeObjectURL(blobUrl);
};

// Fetch the quotation report CSV with auth and trigger a browser download.
// Throws on non-OK responses so callers can show a toast/log.
export async function exportQuotationReportCsv(filters) {
  const url = `${apiConfig.baseUrl}/quotations/report/export?${buildExportQuery(filters)}`;
  const token = getAuthToken();

  const headers = { Accept: "text/csv" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) throw new Error("Export failed");

  const blob = await response.blob();
  triggerCsvDownload(blob);
}
