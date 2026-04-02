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
  pdfRows,
  leadSummaryRows,
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
  isSelfReportMode = false,
}) => {
  const fullName = `${currentUser?.user_firstname || ""} ${
    currentUser?.user_lastname || ""
  }`.trim();
  const userName = fullName || currentUser?.user_nickname || currentUser?.username || "Unknown";
  const isLoading = loadingState.isLoading || loadingState.isFetching;
  const selectionSummary =
    filteredItems.length === 0
      ? "ไม่มีรายการให้เลือก"
      : `เลือกแล้ว ${selectedIds.length} จาก ${filteredItems.length} รายการ`;
  const finalPdfRows = pdfRows || exportRows;
  const activitySummary =
    finalPdfRows.length === 0
      ? "ไม่มีกิจกรรมในช่วงวันที่เลือก"
      : `กิจกรรมในช่วงวันที่ ${finalPdfRows.length} รายการ`;
  const canDownloadPdf = finalPdfRows.length > 0 || leadSummaryRows.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
        {isSelfReportMode ? "Export PDF Report" : "Export ข้อมูล"}
      </DialogTitle>

      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: "Kanit" }}>
                สรุปการ export
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                {isSelfReportMode ? (
                  <>
                    <Chip
                      label={`ช่วงวันที่ ${dateRange.start} ถึง ${dateRange.end}`}
                      variant="outlined"
                    />
                    <Chip
                      label={`Lead additions ${leadSummaryRows.length} รายการ`}
                      color="secondary"
                      variant="outlined"
                    />
                    <Chip label={activitySummary} color="info" variant="outlined" />
                  </>
                ) : (
                  <>
                    <Chip label={`ทั้งหมด ${items.length} รายการ`} variant="outlined" />
                    <Chip
                      label={`ตรงตามช่วงเวลา ${filteredItems.length} รายการ`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={selectionSummary}
                      color={selectedIds.length > 0 ? "success" : "default"}
                      variant="outlined"
                    />
                  </>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
                {isSelfReportMode
                  ? "รายงานนี้ใช้ช่วงวันที่เดียวกันทั้ง 2 ส่วน โดย Lead Intake Summary จะอิงวันที่เพิ่ม lead เข้า queue และ Daily Activity Report จะอิงวันที่ทำรายการในประวัติ"
                  : "PDF และ CSV จะใช้ข้อมูลตามตัวกรองและรายการที่เลือก"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: "Kanit" }}>
                ช่วงเวลา
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
            </Box>

            {isSelfReportMode ? (
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1.5,
                  backgroundColor: "#fafafa",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontFamily: "Kanit", mb: 1 }}>
                  เงื่อนไขรายงาน self-report
                </Typography>
                <Stack spacing={0.75}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
                    Lead Intake Summary จะนับตามวันที่เพิ่มลูกค้าเข้า queue ในช่วงวันที่ที่เลือก
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
                    Daily Activity Report จะนับตามวันที่ทำรายการจาก activity/history
                    จริงในช่วงวันที่ที่เลือก
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
                    รายงาน self-report จะ export ทั้งช่วงวันที่ที่เลือก
                    ไม่ได้อิงการติ๊กรายการทีละแถว
                  </Typography>
                </Stack>
              </Box>
            ) : (
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
                        secondary="ลองขยายช่วงเวลาแล้ว export ใหม่"
                        primaryTypographyProps={{ textAlign: "center" }}
                        secondaryTypographyProps={{ textAlign: "center" }}
                      />
                    </ListItem>
                  ) : (
                    filteredItems.map((item) => (
                      <ListItemButton
                        key={item.id}
                        onClick={() => onToggleSelection(item.id)}
                        dense
                      >
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
                            item.created_at
                              ? `สร้าง ${format(new Date(item.created_at), "dd MMM yyyy", {
                                  locale: th,
                                })}`
                              : "-"
                          }
                          primaryTypographyProps={{ sx: { fontFamily: "Kanit", fontSize: 14 } }}
                        />
                      </ListItemButton>
                    ))
                  )}
                </List>
              </Box>
            )}
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
          disabled={finalPdfRows.length === 0 || isLoading}
          sx={{ fontFamily: "Kanit", borderColor: "#388e3c", color: "#388e3c" }}
        >
          ดาวน์โหลด CSV ({finalPdfRows.length})
        </Button>
        <PDFDownloadLink
          document={
            <NotebookPDF
              rows={finalPdfRows}
              leadSummaryRows={leadSummaryRows}
              userName={userName}
              dateRange={dateRange}
              reportMode={isSelfReportMode ? "self" : "standard"}
            />
          }
          fileName={`notebook_report_${format(new Date(), "yyyy-MM-dd")}.pdf`}
          style={{ textDecoration: "none" }}
        >
          {({ loading }) => (
            <Button
              variant="contained"
              startIcon={<MdPictureAsPdf />}
              disabled={loading || !canDownloadPdf || isLoading}
              sx={{ fontFamily: "Kanit" }}
            >
              {loading ? "กำลังสร้าง PDF..." : `ดาวน์โหลด PDF (${finalPdfRows.length})`}
            </Button>
          )}
        </PDFDownloadLink>
      </DialogActions>
    </Dialog>
  );
};

export default PrintPDFDialog;
