import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { th } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { MdFileDownload, MdPictureAsPdf, MdSelectAll } from "react-icons/md";

import NotebookPDF from "./NotebookPDF";
import { DATE_PRESETS } from "../utils/datePresets";

const PrintPDFDialog = ({ open, onClose, data = [] }) => {
  // Get current user from localStorage (as used throughout the app)
  const user = JSON.parse(localStorage.getItem("userData") || "{}");

  // Format user name: prefer firstname+lastname > nickname > username
  const firstName = user.user_firstname || "";
  const lastName = user.user_lastname || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const userName = fullName || user.user_nickname || user.username || "ไม่ระบุ";

  // States
  const [selectedIds, setSelectedIds] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [activePreset, setActivePreset] = useState("เดือนนี้");

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(data.map((item) => item.id));
    }
  }, [open, data]);

  // Filter data by date range
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!item.updated_at) return false;
      const itemDate = new Date(item.updated_at);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, dateRange]);

  // Selected data for PDF
  const selectedData = useMemo(() => {
    return filteredData.filter((item) => selectedIds.includes(item.id));
  }, [filteredData, selectedIds]);

  // Handlers
  const handlePresetClick = (preset) => {
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

  const handleToggle = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((item) => item.id));
    }
  };

  const isAllSelected = selectedIds.length === filteredData.length && filteredData.length > 0;

  // Export CSV function — one row per history entry
  const handleExportCSV = () => {
    if (selectedData.length === 0) return;

    // Header values
    const exportMonth = format(new Date(dateRange.start), "MMMM", { locale: th });
    const exportYear = new Date(dateRange.start).getFullYear() + 543;
    const monthHeader = `ประจำเดือน ${exportMonth} ${exportYear}`;
    const exporterName = `ผู้ส่งออก: ${firstName} ${lastName}`.trim();

    // CSV Headers
    const row1 = [exporterName, "", "", "", "", "", "", "", "", monthHeader];
    const row2 = [
      "",
      "เวลา",
      "ชื่อลูกค้า / บริษัท\n(ถ้าเป็นออนไลน์ใส่ / online)",
      "เพิ่มเติม",
      "",
      "",
      "",
      "ขั้นตอน",
      "",
      "",
    ];
    const row3 = [
      "",
      "",
      "",
      "",
      "เบอร์ติดต่อ",
      "E-mail",
      "ชื่อผู้ติดต่อ",
      "การกระทำ",
      "สถานะ",
      "หมายเหตุ",
    ];

    // Flatten: one row per history entry where nb_additional_info OR nb_remarks changed
    // AND the history entry falls within the selected date range
    const TEXT_FIELDS = ["nb_additional_info", "nb_remarks"];
    const rangeStart = new Date(dateRange.start);
    const rangeEnd = new Date(dateRange.end);
    rangeEnd.setHours(23, 59, 59, 999);
    const flatRows = [];

    selectedData.forEach((notebook) => {
      const histories = notebook.histories || [];

      if (histories.length === 0) {
        // No histories — use the notebook's current values as single row
        flatRows.push({ notebook, historyEntry: null, at: new Date(notebook.updated_at || notebook.created_at) });
      } else {
        // Sort histories ascending (oldest first = top of CSV)
        const sorted = [...histories].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        // Only include entries where a text field changed AND within the date range
        const relevant = sorted.filter((h) => {
          const hAt = new Date(h.created_at);
          const inRange = hAt >= rangeStart && hAt <= rangeEnd;
          const hasTextField = TEXT_FIELDS.some((f) => h.new_values && f in h.new_values);
          return inRange && hasTextField;
        });

        if (relevant.length === 0) {
          // No matching histories in range — skip this notebook (don't add a row)
          // unless notebook itself has no histories at all (handled above)
          return;
        }

        relevant.forEach((h) => {
          flatRows.push({ notebook, historyEntry: h, at: new Date(h.created_at) });
        });
      }
    });

    // Sort entire flat list by timestamp ascending
    flatRows.sort((a, b) => a.at - b.at);

    // Generate CSV rows
    let previousDateStr = null;

    const rows = flatRows.map(({ notebook, historyEntry, at }) => {
      // Resolve field values: history new_values takes priority, fallback to notebook
      const nv = historyEntry?.new_values || {};
      const ov = historyEntry?.old_values || {};

      // Date: prefer nb_date from new_values, then notebook nb_date, then history created_at
      const rawDate = nv.nb_date || notebook.nb_date;
      const itemDate = rawDate ? new Date(rawDate) : at;
      const dayMonth = format(itemDate, "dd/MM");
      const year = itemDate.getFullYear() + 543;
      const currentDateStr = `${dayMonth}/${year}`;

      const displayDateStr = currentDateStr === previousDateStr ? "" : currentDateStr;
      previousDateStr = currentDateStr;

      // Time: history new_values → notebook nb_time → history created_at
      const rawTime = nv.nb_time || notebook.nb_time;
      let timeStr = "-";
      if (rawTime) {
        const timeParts = rawTime.split(/[:.]/).slice(0, 2);
        timeStr = timeParts.map((p) => p.padStart(2, "0")).join(".");
      } else {
        timeStr = format(at, "HH.mm");
      }

      // Fields: history new_values → notebook
      const additionalInfo = nv.nb_additional_info ?? notebook.nb_additional_info;
      const remarks       = nv.nb_remarks       ?? notebook.nb_remarks;
      const status        = nv.nb_status        ?? notebook.nb_status;
      const action        = nv.nb_action        ?? notebook.nb_action;

      let customerCol = notebook.nb_customer_name || "-";
      if (notebook.nb_is_online) customerCol += " / online";

      return [
        displayDateStr,
        timeStr,
        customerCol,
        additionalInfo || "-",
        notebook.nb_contact_number ? `="${notebook.nb_contact_number}"` : "-",
        notebook.nb_email || "-",
        notebook.nb_contact_person || "-",
        action || "-",
        status || "-",
        remarks || "-",
      ];
    });

    // Create CSV content with BOM for Thai characters
    const bom = "\uFEFF";
    const csvContent =
      bom +
      [row1, row2, row3, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              const cellString = String(cell).replace(/"/g, '""');
              return `"${cellString}"`;
            })
            .join(",")
        )
        .join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notebook_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600 }}>Export ข้อมูล</DialogTitle>

      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <DialogContent dividers>
          {/* Date Range Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: "Kanit" }}>
              ช่วงเวลา
              <Box
                component="span"
                sx={{ fontSize: "0.7rem", fontWeight: 400, ml: 1, color: "text.secondary" }}
              >
                (เรียงตามวันที่อัพเดทล่าสุด)
              </Box>
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
              {DATE_PRESETS.map((preset) => (
                <Chip
                  key={preset.label}
                  label={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  color={activePreset === preset.label ? "primary" : "default"}
                  variant={activePreset === preset.label ? "filled" : "outlined"}
                  size="small"
                  sx={{ fontFamily: "Kanit" }}
                />
              ))}
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <DatePicker
                label="จากวันที่"
                value={new Date(dateRange.start)}
                onChange={(newValue) => {
                  if (newValue) handleDateChange("start", format(newValue, "yyyy-MM-dd"));
                }}
                format="dd MMMM yyyy"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: { flex: 1 },
                  },
                }}
              />
              <DatePicker
                label="ถึงวันที่"
                value={new Date(dateRange.end)}
                onChange={(newValue) => {
                  if (newValue) handleDateChange("end", format(newValue, "yyyy-MM-dd"));
                }}
                format="dd MMMM yyyy"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: { flex: 1 },
                  },
                }}
              />
            </Box>
          </Box>

          {/* Customer Selection */}
          <Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontFamily: "Kanit" }}>
                เลือกรายการ ({selectedData.length}/{filteredData.length})
              </Typography>
              <Button
                size="small"
                startIcon={<MdSelectAll />}
                onClick={handleSelectAll}
                sx={{ fontFamily: "Kanit" }}
              >
                {isAllSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
              </Button>
            </Box>

            <List
              dense
              sx={{
                maxHeight: 300,
                overflow: "auto",
                border: "1px solid #e0e0e0",
                borderRadius: 1,
              }}
            >
              {filteredData.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="ไม่พบข้อมูลในช่วงเวลานี้"
                    sx={{ textAlign: "center", color: "text.secondary" }}
                  />
                </ListItem>
              ) : (
                filteredData.map((item) => (
                  <ListItemButton key={item.id} onClick={() => handleToggle(item.id)} dense>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        edge="start"
                        checked={selectedIds.includes(item.id)}
                        tabIndex={-1}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.nb_customer_name || "ไม่ระบุชื่อ"}
                      secondary={
                        <Box component="span">
                          <Typography
                            component="span"
                            variant="body2"
                            display="block"
                            sx={{ fontSize: 12 }}
                          >
                            สร้าง:{" "}
                            {item.created_at
                              ? format(new Date(item.created_at), "dd MMM yyyy", { locale: th })
                              : "-"}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body2"
                            display="block"
                            sx={{ fontSize: 12, color: "text.secondary" }}
                          >
                            อัพเดท:{" "}
                            {item.updated_at
                              ? format(new Date(item.updated_at), "dd MMM yyyy", { locale: th })
                              : "-"}
                          </Typography>
                        </Box>
                      }
                      primaryTypographyProps={{ sx: { fontFamily: "Kanit", fontSize: 14 } }}
                    />
                    {item.nb_status && (
                      <Chip
                        label={item.nb_status}
                        size="small"
                        color={
                          item.nb_status === "ได้งาน"
                            ? "success"
                            : item.nb_status === "พิจารณา"
                              ? "info"
                              : "default"
                        }
                        sx={{ fontSize: 11 }}
                      />
                    )}
                  </ListItemButton>
                ))
              )}
            </List>
          </Box>
        </DialogContent>
      </LocalizationProvider>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: "Kanit" }}>
          ยกเลิก
        </Button>
        <Button
          variant="outlined"
          startIcon={<MdFileDownload />}
          onClick={handleExportCSV}
          disabled={selectedData.length === 0}
          sx={{ fontFamily: "Kanit", borderColor: "#388e3c", color: "#388e3c" }}
        >
          ดาวน์โหลด CSV ({selectedData.length})
        </Button>
        <PDFDownloadLink
          document={
            <NotebookPDF
              data={selectedData}
              userName={userName}
              dateRange={{
                start: dateRange.start,
                end: dateRange.end,
              }}
            />
          }
          fileName={`notebook_report_${format(new Date(), "yyyy-MM-dd")}.pdf`}
          style={{ textDecoration: "none" }}
        >
          {({ loading }) => (
            <Button
              variant="contained"
              startIcon={<MdPictureAsPdf />}
              disabled={loading || selectedData.length === 0}
              sx={{ fontFamily: "Kanit" }}
            >
              {loading ? "กำลังสร้าง..." : `ดาวน์โหลด PDF (${selectedData.length})`}
            </Button>
          )}
        </PDFDownloadLink>
      </DialogActions>
    </Dialog>
  );
};

export default PrintPDFDialog;
