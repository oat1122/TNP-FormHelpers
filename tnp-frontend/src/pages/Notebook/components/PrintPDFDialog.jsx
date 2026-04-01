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
  Stack,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { MdFileDownload, MdPictureAsPdf, MdSelectAll } from "react-icons/md";

import NotebookPDF from "./NotebookPDF";
import { DATE_PRESETS } from "../utils/datePresets";

const PrintPDFDialog = ({
  open,
  onClose,
  items,
  filteredItems,
  exportRows,
  selectedIds,
  dateRange,
  activePreset,
  loadingState,
  currentUser,
  onPresetClick,
  onDateChange,
  onToggleSelection,
  onSelectAll,
  onExportCsv,
  isAllSelected,
}) => {
  const fullName = `${currentUser?.user_firstname || ""} ${
    currentUser?.user_lastname || ""
  }`.trim();
  const userName = fullName || currentUser?.user_nickname || currentUser?.username || "ไม่ระบุ";
  const isLoading = loadingState.isLoading || loadingState.isFetching;
  const selectionSummary =
    filteredItems.length === 0
      ? "ไม่มีรายการให้เลือก"
      : `เลือกแล้ว ${selectedIds.length} จาก ${filteredItems.length} รายการ`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600 }}>Export ข้อมูล</DialogTitle>

      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: "Kanit" }}>
                สรุปการ export
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                <Chip
                  label={`ข้อมูลทั้งหมด ${items.length} รายการ`}
                  variant="outlined"
                  sx={{ fontFamily: "Kanit" }}
                />
                <Chip
                  label={`ตรงตามช่วงเวลา ${filteredItems.length} รายการ`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontFamily: "Kanit" }}
                />
                <Chip
                  label={selectionSummary}
                  color={selectedIds.length > 0 ? "success" : "default"}
                  variant="outlined"
                  sx={{ fontFamily: "Kanit" }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
                PDF และ CSV จะใช้ข้อมูลชุดเดียวกันตามตัวกรองและรายการที่คุณเลือก
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: "Kanit" }}>
                ช่วงเวลาและเงื่อนไขที่ใช้ export
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                {DATE_PRESETS.map((preset) => (
                  <Chip
                    key={preset.label}
                    label={preset.label}
                    onClick={() => onPresetClick(preset.label)}
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
                  onChange={(newValue) =>
                    newValue && onDateChange("start", format(newValue, "yyyy-MM-dd"))
                  }
                  format="dd MMMM yyyy"
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                    },
                  }}
                />
                <DatePicker
                  label="ถึงวันที่"
                  value={new Date(dateRange.end)}
                  onChange={(newValue) =>
                    newValue && onDateChange("end", format(newValue, "yyyy-MM-dd"))
                  }
                  format="dd MMMM yyyy"
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                    },
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                ระบบจะโหลดข้อมูล export แยกจากตารางหลัก และคงการกรองของหน้า list ไว้ตามเดิม
              </Typography>
            </Box>

            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontFamily: "Kanit" }}>
                  เลือกรายการ ({selectedIds.length}/{filteredItems.length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<MdSelectAll />}
                  onClick={onSelectAll}
                  disabled={isLoading || filteredItems.length === 0}
                  sx={{ fontFamily: "Kanit" }}
                >
                  {isAllSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                </Button>
              </Box>

              <List
                dense
                sx={{
                  maxHeight: 320,
                  overflow: "auto",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                }}
              >
                {isLoading ? (
                  <ListItem sx={{ justifyContent: "center", py: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <CircularProgress size={28} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        กำลังโหลดข้อมูล export...
                      </Typography>
                    </Box>
                  </ListItem>
                ) : filteredItems.length === 0 ? (
                  <ListItem sx={{ py: 4 }}>
                    <ListItemText
                      primary="ไม่มีข้อมูลในช่วงเวลาที่เลือก"
                      secondary="ลองขยายช่วงเวลา หรือปรับประเภทวันที่ก่อน export"
                      primaryTypographyProps={{ textAlign: "center" }}
                      secondaryTypographyProps={{ textAlign: "center" }}
                    />
                  </ListItem>
                ) : (
                  filteredItems.map((item) => (
                    <ListItemButton key={item.id} onClick={() => onToggleSelection(item.id)} dense>
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
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              display="block"
                              sx={{ fontSize: 12 }}
                            >
                              สร้าง:{" "}
                              {item.created_at
                                ? format(new Date(item.created_at), "dd MMM yyyy", {
                                    locale: th,
                                  })
                                : "-"}
                            </Typography>
                            <Typography
                              component="span"
                              variant="body2"
                              display="block"
                              sx={{ fontSize: 12, color: "text.secondary" }}
                            >
                              อัปเดต:{" "}
                              {item.updated_at
                                ? format(new Date(item.updated_at), "dd MMM yyyy", {
                                    locale: th,
                                  })
                                : "-"}
                            </Typography>
                          </>
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
          </Stack>
        </DialogContent>
      </LocalizationProvider>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: "Kanit" }}>
          ยกเลิก
        </Button>
        <Button
          variant="outlined"
          startIcon={<MdFileDownload />}
          onClick={onExportCsv}
          disabled={exportRows.length === 0 || isLoading}
          sx={{ fontFamily: "Kanit", borderColor: "#388e3c", color: "#388e3c" }}
        >
          ดาวน์โหลด CSV ({exportRows.length})
        </Button>
        <PDFDownloadLink
          document={<NotebookPDF rows={exportRows} userName={userName} dateRange={dateRange} />}
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
              {loading ? "กำลังสร้าง PDF..." : `ดาวน์โหลด PDF (${exportRows.length})`}
            </Button>
          )}
        </PDFDownloadLink>
      </DialogActions>
    </Dialog>
  );
};

export default PrintPDFDialog;
