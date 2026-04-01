import { endOfMonth, format, startOfMonth } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { useLazyGetNotebookExportQuery } from "../../../features/Notebook/notebookApi";
import { showError } from "../../../utils/toast";
import { DATE_PRESETS } from "../utils/datePresets";
import {
  buildNotebookCsvContent,
  buildNotebookExportRows,
  filterNotebookExportData,
} from "../utils/notebookExport";

export const useNotebookExport = ({ open, filters, currentUser }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [activePreset, setActivePreset] = useState("เดือนนี้");
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  const [fetchNotebookExport, { data: exportItems = [], isFetching, isLoading, error }] =
    useLazyGetNotebookExportQuery();

  useEffect(() => {
    if (!open) {
      return;
    }

    fetchNotebookExport(filters);
  }, [open, fetchNotebookExport, filters]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDateRange({
      start: filters.start_date || format(startOfMonth(new Date()), "yyyy-MM-dd"),
      end: filters.end_date || format(endOfMonth(new Date()), "yyyy-MM-dd"),
    });
    setActivePreset(null);
  }, [open, filters.start_date, filters.end_date]);

  useEffect(() => {
    if (open) {
      setSelectedIds(exportItems.map((item) => item.id));
    }
  }, [open, exportItems]);

  useEffect(() => {
    if (error) {
      showError(
        "ไม่สามารถดึงข้อมูลเพื่อ export ได้: " + (error?.data?.message || "Internal Server Error")
      );
    }
  }, [error]);

  const filteredItems = useMemo(
    () => filterNotebookExportData(exportItems, dateRange, filters.date_filter_by || "all"),
    [exportItems, dateRange, filters.date_filter_by]
  );

  const selectedItems = useMemo(
    () => filteredItems.filter((item) => selectedIds.includes(item.id)),
    [filteredItems, selectedIds]
  );

  const exportRows = useMemo(
    () => buildNotebookExportRows(selectedItems, dateRange),
    [selectedItems, dateRange]
  );

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
    if (exportRows.length === 0) {
      return;
    }

    const firstName = currentUser?.user_firstname || "";
    const lastName = currentUser?.user_lastname || "";
    const exporterName = `ผู้ส่งออก: ${`${firstName} ${lastName}`.trim()}`.trim();

    const csvContent = buildNotebookCsvContent({
      rows: exportRows,
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
    selectedIds,
    dateRange,
    activePreset,
    isLoading,
    isFetching,
    isAllSelected,
    handlePresetClick,
    handleDateChange,
    handleToggleSelection,
    handleSelectAll,
    handleExportCsv,
  };
};
