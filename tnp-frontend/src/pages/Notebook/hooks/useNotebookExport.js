import { endOfMonth, format, startOfMonth } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import {
  useLazyGetNotebookExportQuery,
  useLazyGetNotebookSelfReportQuery,
} from "../../../features/Notebook/notebookApi";
import { showError } from "../../../utils/toast";
import { DATE_PRESETS } from "../utils/datePresets";
import {
  buildNotebookCsvContent,
  buildNotebookExportRows,
  buildNotebookLeadSummaryRows,
  buildNotebookPdfRows,
  filterNotebookExportData,
} from "../utils/notebookExport";

export const useNotebookExport = ({ open, filters, currentUser, canSelfReport = false }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [activePreset, setActivePreset] = useState("เดือนนี้");
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  const [fetchNotebookExport, exportQueryState] = useLazyGetNotebookExportQuery();
  const [fetchNotebookSelfReport, selfReportQueryState] = useLazyGetNotebookSelfReportQuery();

  const exportItems = useMemo(() => exportQueryState.data ?? [], [exportQueryState.data]);
  const selfReportData = useMemo(
    () => selfReportQueryState.data ?? { lead_additions: [], activity_items: [] },
    [selfReportQueryState.data]
  );
  const isLoading =
    exportQueryState.isLoading ||
    exportQueryState.isFetching ||
    selfReportQueryState.isLoading ||
    selfReportQueryState.isFetching;

  useEffect(() => {
    if (!open) {
      return;
    }

    fetchNotebookExport({
      ...filters,
      start_date: dateRange.start,
      end_date: dateRange.end,
      entry_type: "standard",
    });

    if (canSelfReport) {
      fetchNotebookSelfReport({
        start_date: dateRange.start,
        end_date: dateRange.end,
      });
    }
  }, [
    canSelfReport,
    dateRange.end,
    dateRange.start,
    fetchNotebookExport,
    fetchNotebookSelfReport,
    filters,
    open,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDateRange({
      start: filters.start_date || format(startOfMonth(new Date()), "yyyy-MM-dd"),
      end: filters.end_date || format(endOfMonth(new Date()), "yyyy-MM-dd"),
    });
    setActivePreset(null);
  }, [filters.end_date, filters.start_date, open]);

  useEffect(() => {
    if (open) {
      setSelectedIds(exportItems.map((item) => item.id));
    }
  }, [exportItems, open]);

  useEffect(() => {
    const exportError = exportQueryState.error || selfReportQueryState.error;
    if (exportError) {
      showError(
        "ไม่สามารถดึงข้อมูล export ได้: " + (exportError?.data?.message || "Internal Server Error")
      );
    }
  }, [exportQueryState.error, selfReportQueryState.error]);

  const filteredItems = useMemo(
    () => filterNotebookExportData(exportItems, dateRange, filters.date_filter_by || "all"),
    [dateRange, exportItems, filters.date_filter_by]
  );

  const selectedItems = useMemo(
    () => filteredItems.filter((item) => selectedIds.includes(item.id)),
    [filteredItems, selectedIds]
  );

  const exportRows = useMemo(
    () => buildNotebookExportRows(selectedItems, dateRange, { reportMode: "standard" }),
    [selectedItems, dateRange]
  );
  const standardPdfRows = useMemo(() => buildNotebookPdfRows(exportRows), [exportRows]);

  const selfReportRows = useMemo(
    () =>
      buildNotebookExportRows(selfReportData.activity_items || [], dateRange, {
        reportMode: "self",
      }),
    [dateRange, selfReportData.activity_items]
  );
  const selfReportPdfRows = useMemo(() => buildNotebookPdfRows(selfReportRows), [selfReportRows]);

  const filteredLeadAdditions = useMemo(
    () => filterNotebookExportData(selfReportData.lead_additions || [], dateRange, "created_at"),
    [dateRange, selfReportData.lead_additions]
  );

  const leadSummaryRows = useMemo(
    () => buildNotebookLeadSummaryRows(filteredLeadAdditions),
    [filteredLeadAdditions]
  );

  const csvRows = canSelfReport ? selfReportRows : exportRows;
  const pdfRows = canSelfReport ? selfReportPdfRows : standardPdfRows;
  const isAllSelected = filteredItems.length > 0 && selectedIds.length === filteredItems.length;

  const handlePresetClick = (presetLabel) => {
    const preset = DATE_PRESETS.find((item) => item.label === presetLabel);
    if (!preset) {
      return;
    }

    const { start, end } = preset.getValue();
    setDateRange({
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
    });
    setActivePreset(preset.label);
  };

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
    setActivePreset(null);
  };

  const handleToggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredItems.map((item) => item.id));
  };

  const handleExportCsv = () => {
    if (csvRows.length === 0) {
      return;
    }

    const firstName = currentUser?.user_firstname || "";
    const lastName = currentUser?.user_lastname || "";
    const exporterName = `ผู้ส่งออก: ${`${firstName} ${lastName}`.trim()}`.trim();

    const csvContent = buildNotebookCsvContent({
      rows: csvRows,
      exporterName,
      dateRange,
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notebook_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    exportItems,
    filteredItems,
    selectedItems,
    exportRows,
    csvRows,
    pdfRows,
    leadSummaryRows,
    selectedIds,
    dateRange,
    activePreset,
    isLoading,
    isFetching: isLoading,
    isAllSelected,
    isSelfReportMode: canSelfReport,
    handlePresetClick,
    handleDateChange,
    handleToggleSelection,
    handleSelectAll,
    handleExportCsv,
  };
};
