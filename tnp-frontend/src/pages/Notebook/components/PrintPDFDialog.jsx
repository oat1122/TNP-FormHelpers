import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
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
import {
  buildNotebookCsvContent,
  buildNotebookExportRows,
  filterNotebookExportData,
} from "../utils/notebookExport";

const PrintPDFDialog = ({
  open,
  onClose,
  data = [],
  isLoading = false,
  initialDateRange,
  dateFilterBy = "all",
}) => {
  const user = JSON.parse(localStorage.getItem("userData") || "{}");
  const firstName = user.user_firstname || "";
  const lastName = user.user_lastname || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const userName = fullName || user.user_nickname || user.username || "ไม่ระบุ";

  const [selectedIds, setSelectedIds] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [activePreset, setActivePreset] = useState("เดือนนี้");

  useEffect(() => {
    if (open) {
      setSelectedIds(data.map((item) => item.id));
    }
  }, [open, data]);

  useEffect(() => {
    if (open && initialDateRange?.start && initialDateRange?.end) {
      setDateRange(initialDateRange);
      setActivePreset(null);
    }
  }, [open, initialDateRange]);

  const filteredData = useMemo(
    () => filterNotebookExportData(data, dateRange, dateFilterBy),
    [data, dateRange, dateFilterBy]
  );

  const selectedData = useMemo(
    () => filteredData.filter((item) => selectedIds.includes(item.id)),
    [filteredData, selectedIds]
  );

  const exportRows = useMemo(
    () => buildNotebookExportRows(selectedData, dateRange),
    [selectedData, dateRange]
  );

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
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((item) => item.id));
    }
  };

  const handleExportCSV = () => {
    if (exportRows.length === 0) {
      return;
    }

    const exporterName = `ผู้ส่งออก: ${firstName} ${lastName}`.trim();
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

  const isAllSelected = selectedIds.length === filteredData.length && filteredData.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600 }}>Export ข้อมูล</DialogTitle>

      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: "Kanit" }}>
              ช่วงเวลา
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

          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontFamily: "Kanit" }}>
                เลือกรายการ ({selectedData.length}/{filteredData.length})
              </Typography>
              <Button
                size="small"
                startIcon={<MdSelectAll />}
                onClick={handleSelectAll}
                disabled={isLoading}
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
              {isLoading ? (
                <ListItem sx={{ justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} />
                </ListItem>
              ) : filteredData.length === 0 ? (
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
                      <Checkbox edge="start" checked={selectedIds.includes(item.id)} tabIndex={-1} size="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.nb_customer_name || "ไม่ระบุชื่อ"}
                      secondary={
                        <Box component="span">
                          <Typography component="span" variant="body2" display="block" sx={{ fontSize: 12 }}>
                            สร้าง:{" "}
                            {item.created_at ? format(new Date(item.created_at), "dd MMM yyyy", { locale: th }) : "-"}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body2"
                            display="block"
                            sx={{ fontSize: 12, color: "text.secondary" }}
                          >
                            อัพเดท:{" "}
                            {item.updated_at ? format(new Date(item.updated_at), "dd MMM yyyy", { locale: th }) : "-"}
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
          disabled={exportRows.length === 0 || isLoading}
          sx={{ fontFamily: "Kanit", borderColor: "#388e3c", color: "#388e3c" }}
        >
          ดาวน์โหลด CSV ({exportRows.length})
        </Button>
        <PDFDownloadLink
          document={
            <NotebookPDF
              rows={exportRows}
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
              disabled={loading || exportRows.length === 0 || isLoading}
              sx={{ fontFamily: "Kanit" }}
            >
              {loading ? "กำลังสร้าง..." : `ดาวน์โหลด PDF (${exportRows.length})`}
            </Button>
          )}
        </PDFDownloadLink>
      </DialogActions>
    </Dialog>
  );
};

export default PrintPDFDialog;
