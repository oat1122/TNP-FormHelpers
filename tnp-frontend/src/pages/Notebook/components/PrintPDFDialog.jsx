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
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  MdCheckCircleOutline,
  MdClose,
  MdEventNote,
  MdFileDownload,
  MdInfoOutline,
  MdPictureAsPdf,
  MdSelectAll,
} from "react-icons/md";

import NotebookPDF from "./NotebookPDF";
import { DATE_PRESETS } from "../utils/datePresets";

// Dialog-level font so we don't need to repeat fontFamily on every Typography.
const DIALOG_FONT = { fontFamily: "Kanit" };

const SectionTitle = ({ children }) => (
  <Typography
    variant="overline"
    sx={{
      ...DIALOG_FONT,
      fontWeight: 600,
      letterSpacing: 0.6,
      color: "text.secondary",
      display: "block",
      mb: 1,
    }}
  >
    {children}
  </Typography>
);

const StatCard = ({ label, value, accent }) => (
  <Paper
    variant="outlined"
    sx={{
      flex: 1,
      minWidth: 0,
      px: 2,
      py: 1.5,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 1.5,
      bgcolor: "background.paper",
    }}
  >
    <Typography
      variant="caption"
      sx={{ ...DIALOG_FONT, color: "text.secondary", display: "block", lineHeight: 1.2 }}
    >
      {label}
    </Typography>
    <Typography variant="h6" sx={{ ...DIALOG_FONT, fontWeight: 700, mt: 0.25, lineHeight: 1.3 }}>
      {value}
    </Typography>
  </Paper>
);

const ConditionItem = ({ children }) => (
  <Stack direction="row" spacing={1} alignItems="flex-start">
    <Box sx={{ color: "primary.main", mt: "2px", display: "flex" }}>
      <MdCheckCircleOutline size={16} />
    </Box>
    <Typography variant="body2" sx={{ ...DIALOG_FONT, color: "text.secondary", flex: 1 }}>
      {children}
    </Typography>
  </Stack>
);

const formatRangeLabel = (dateRange) => {
  try {
    const start = format(new Date(dateRange.start), "d MMM yyyy", { locale: th });
    const end = format(new Date(dateRange.end), "d MMM yyyy", { locale: th });
    return `${start} – ${end}`;
  } catch {
    return `${dateRange.start} – ${dateRange.end}`;
  }
};

const PrintPDFDialog = ({
  open,
  onClose,
  items,
  filteredItems,
  exportRows,
  csvRows,
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
  recallActions = [],
}) => {
  const fullName = `${currentUser?.user_firstname || ""} ${
    currentUser?.user_lastname || ""
  }`.trim();
  const userName = fullName || currentUser?.user_nickname || currentUser?.username || "Unknown";
  const isLoading = loadingState.isLoading || loadingState.isFetching;
  const finalPdfRows = pdfRows || exportRows;
  const finalCsvRows = csvRows || exportRows;
  const canDownloadPdf = finalPdfRows.length > 0 || leadSummaryRows.length > 0;
  const rangeLabel = formatRangeLabel(dateRange);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          ...DIALOG_FONT,
          fontWeight: 700,
          pr: 7,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MdPictureAsPdf size={20} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ ...DIALOG_FONT, fontWeight: 700, lineHeight: 1.2 }}>
            {isSelfReportMode ? "Export PDF Report" : "Export ข้อมูล"}
          </Typography>
          <Typography
            variant="caption"
            sx={{ ...DIALOG_FONT, color: "text.secondary", display: "block" }}
          >
            {isSelfReportMode
              ? "รายงาน self-report สำหรับช่วงวันที่ที่เลือก"
              : "เลือกรายการที่ต้องการ export เป็น PDF หรือ CSV"}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="ปิด"
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <MdClose />
        </IconButton>
      </DialogTitle>

      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <DialogContent dividers sx={{ py: 3 }}>
          <Stack spacing={3}>
            {/* === SUMMARY === */}
            <Box>
              <SectionTitle>สรุปการ export</SectionTitle>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Chip
                  icon={<MdEventNote />}
                  label={rangeLabel}
                  variant="outlined"
                  sx={{ ...DIALOG_FONT, fontWeight: 500 }}
                />
              </Stack>

              {isSelfReportMode ? (
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <StatCard
                    label="Lead additions"
                    value={`${leadSummaryRows.length} รายการ`}
                    accent="#7b1fa2"
                  />
                  <StatCard
                    label="Recall"
                    value={`${recallActions.length} ครั้ง`}
                    accent="#ed6c02"
                  />
                  <StatCard
                    label="กิจกรรมในช่วงวันที่"
                    value={`${finalPdfRows.length} รายการ`}
                    accent="#0288d1"
                  />
                </Stack>
              ) : (
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <StatCard label="ทั้งหมด" value={`${items.length} รายการ`} accent="#9e9e9e" />
                  <StatCard
                    label="ตรงตามช่วงเวลา"
                    value={`${filteredItems.length} รายการ`}
                    accent="#1976d2"
                  />
                  <StatCard
                    label="เลือกแล้ว"
                    value={
                      filteredItems.length === 0
                        ? "—"
                        : `${selectedIds.length} / ${filteredItems.length}`
                    }
                    accent={selectedIds.length > 0 ? "#2e7d32" : "#9e9e9e"}
                  />
                </Stack>
              )}
            </Box>

            <Divider />

            {/* === DATE RANGE === */}
            <Box>
              <SectionTitle>ช่วงเวลา</SectionTitle>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {DATE_PRESETS.map((preset) => {
                  const selected = activePreset === preset.label;
                  return (
                    <Chip
                      key={preset.label}
                      label={preset.label}
                      onClick={() => onPresetClick(preset.label)}
                      color={selected ? "primary" : "default"}
                      variant={selected ? "filled" : "outlined"}
                      sx={{
                        ...DIALOG_FONT,
                        fontWeight: selected ? 600 : 500,
                        px: 0.5,
                      }}
                    />
                  );
                })}
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
              </Stack>
            </Box>

            <Divider />

            {/* === CONDITIONS OR SELECTION LIST === */}
            {isSelfReportMode ? (
              <Box
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "primary.light",
                  borderRadius: 1.5,
                  bgcolor: "rgba(25, 118, 210, 0.04)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                  <Box sx={{ color: "primary.main", display: "flex" }}>
                    <MdInfoOutline size={18} />
                  </Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ ...DIALOG_FONT, fontWeight: 600, color: "primary.main" }}
                  >
                    เงื่อนไขรายงาน self-report
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <ConditionItem>
                    <strong>Lead Intake Summary</strong> นับตามวันที่เพิ่มลูกค้าเข้า queue
                    ในช่วงวันที่ที่เลือก
                  </ConditionItem>
                  <ConditionItem>
                    <strong>Daily Activity Report</strong> นับตามวันที่ทำรายการจริงใน
                    activity/history
                  </ConditionItem>
                  <ConditionItem>
                    รายงาน self-report จะ export ทั้งช่วงวันที่ที่เลือก
                    ไม่ได้อิงการติ๊กรายการทีละแถว
                  </ConditionItem>
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
                  <SectionTitle>
                    เลือกรายการ ({selectedIds.length}/{filteredItems.length})
                  </SectionTitle>
                  <Button
                    size="small"
                    startIcon={<MdSelectAll />}
                    onClick={onSelectAll}
                    disabled={isLoading || filteredItems.length === 0}
                    sx={DIALOG_FONT}
                  >
                    {isAllSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                </Box>

                <List
                  dense
                  sx={{
                    maxHeight: 320,
                    overflow: "auto",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1.5,
                    p: 0,
                  }}
                >
                  {isLoading ? (
                    <ListItem sx={{ justifyContent: "center", py: 4 }}>
                      <Box sx={{ textAlign: "center" }}>
                        <CircularProgress size={28} />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ ...DIALOG_FONT, mt: 1 }}
                        >
                          กำลังโหลดข้อมูล export...
                        </Typography>
                      </Box>
                    </ListItem>
                  ) : filteredItems.length === 0 ? (
                    <ListItem sx={{ py: 4 }}>
                      <ListItemText
                        primary="ไม่มีข้อมูลในช่วงเวลาที่เลือก"
                        secondary="ลองขยายช่วงเวลาแล้ว export ใหม่"
                        primaryTypographyProps={{ textAlign: "center", sx: DIALOG_FONT }}
                        secondaryTypographyProps={{ textAlign: "center", sx: DIALOG_FONT }}
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
                          primaryTypographyProps={{ sx: { ...DIALOG_FONT, fontSize: 14 } }}
                          secondaryTypographyProps={{ sx: DIALOG_FONT }}
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

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} sx={DIALOG_FONT} color="inherit">
          ยกเลิก
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          startIcon={<MdFileDownload />}
          onClick={onExportCsv}
          disabled={finalCsvRows.length === 0 || isLoading}
          color="success"
          sx={DIALOG_FONT}
        >
          ดาวน์โหลด CSV ({finalCsvRows.length})
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
              sx={DIALOG_FONT}
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
