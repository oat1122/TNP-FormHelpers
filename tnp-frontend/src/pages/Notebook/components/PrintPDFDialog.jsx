/**
 * PrintPDFDialog Component
 * Dialog for selecting customers and date range before printing PDF
 */
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { th } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { MdPictureAsPdf, MdSelectAll } from "react-icons/md";

import NotebookPDF from "./NotebookPDF";

// Quick date filter options
const DATE_PRESETS = [
  {
    label: "เดือนนี้",
    getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }),
  },
  {
    label: "เดือนที่แล้ว",
    getValue: () => ({
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: "3 เดือนล่าสุด",
    getValue: () => ({
      start: startOfMonth(subMonths(new Date(), 2)),
      end: endOfMonth(new Date()),
    }),
  },
];

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
      if (!item.nb_date) return true;
      const itemDate = new Date(item.nb_date);
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600 }}>พิมพ์รายงาน PDF</DialogTitle>

      <DialogContent dividers>
        {/* Date Range Filter */}
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
            <TextField
              type="date"
              label="จากวันที่"
              size="small"
              value={dateRange.start}
              onChange={(e) => handleDateChange("start", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              type="date"
              label="ถึงวันที่"
              size="small"
              value={dateRange.end}
              onChange={(e) => handleDateChange("end", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
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
                      item.nb_date
                        ? format(new Date(item.nb_date), "dd MMM yyyy", { locale: th })
                        : "-"
                    }
                    primaryTypographyProps={{ sx: { fontFamily: "Kanit", fontSize: 14 } }}
                    secondaryTypographyProps={{ sx: { fontSize: 12 } }}
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

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: "Kanit" }}>
          ยกเลิก
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
