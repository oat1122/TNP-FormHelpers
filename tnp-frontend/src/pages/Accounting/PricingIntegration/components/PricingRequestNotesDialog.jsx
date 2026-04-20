import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import NotesIcon from "@mui/icons-material/Notes";
import PersonIcon from "@mui/icons-material/Person";
import ScheduleIcon from "@mui/icons-material/Schedule";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import moment from "moment";
import React from "react";

import { useGetPricingRequestNotesQuery } from "../../../../features/Accounting/accountingApi";
import { tokens } from "../../shared/styles/tokens";

const StyledDialog = styled(Dialog)(() => ({
  "& .MuiPaper-root": {
    borderRadius: 12,
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
    border: `1px solid ${tokens.border}`,
  },
}));

const StyledDialogTitle = styled(DialogTitle)(() => ({
  background: tokens.white,
  color: tokens.textPrimary,
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: `1px solid ${tokens.borderLight}`,
}));

const SectionHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 0",
  marginBottom: 8,
  borderBottom: `1px solid ${tokens.borderLight}`,
}));

const NoteCard = styled(Card)(() => ({
  background: tokens.white,
  border: `1px solid ${tokens.border}`,
  borderRadius: 10,
}));

const Pill = styled(Chip)(() => ({
  backgroundColor: tokens.bg,
  color: tokens.textSecondary,
  fontWeight: 600,
  fontSize: "0.75rem",
}));

function getTime(note) {
  const raw =
    note?.prn_created_date ||
    note?.created_at ||
    note?.updated_at ||
    note?.created_at_display ||
    "";
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function sortNewestFirst(arr) {
  return [...(arr || [])].sort((a, b) => getTime(b) - getTime(a));
}

function NoteItem({ type, note }) {
  const author = note?.created_by_name || note?.created_name || note?.user_name || "-";
  const when = note?.prn_created_date
    ? moment(note.prn_created_date).format("DD/MM HH:mm")
    : note?.formatted_date || note?.created_at_display || "";

  const typeLabel = type === "price" ? "price" : "note sales";

  return (
    <NoteCard>
      <CardContent sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Pill label={typeLabel} size="small" icon={<PersonIcon sx={{ fontSize: 16 }} />} />
            <Typography variant="body2" color="text.secondary">
              โดย {author}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <ScheduleIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {when}
            </Typography>
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.primary" }}>
          {note?.prn_text ?? note?.text ?? ""}
        </Typography>
      </CardContent>
    </NoteCard>
  );
}

function LatestWithHistorySection({ title, typeKey, items }) {
  const [openHistory, setOpenHistory] = React.useState(false);

  const sorted = sortNewestFirst(items);
  const latest = sorted[0];
  const history = sorted.slice(1);

  return (
    <Box sx={{ mb: 2.5 }}>
      <SectionHeader>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: "uppercase" }}>
            {title}
          </Typography>
          <Chip label={`${items?.length || 0} รายการ`} size="small" />
        </Stack>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Button
            size="small"
            onClick={() => setOpenHistory((v) => !v)}
            startIcon={openHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ textTransform: "none" }}
            disabled={!history.length}
          >
            {!history.length ? "ไม่มีประวัติเพิ่ม" : openHistory ? "ย่อประวัติ" : "ดูประวัติ"}
          </Button>
        </Box>
      </SectionHeader>

      {latest ? (
        <NoteItem type={typeKey} note={latest} />
      ) : (
        <Alert severity="info" sx={{ bgcolor: tokens.white }}>
          <Typography variant="body2">ไม่มี {title.toLowerCase()} สำหรับงานนี้</Typography>
        </Alert>
      )}

      <Collapse in={openHistory} unmountOnExit>
        <Stack spacing={1.25} sx={{ mt: 1.25 }}>
          {history.map((n) => (
            <NoteItem
              key={n.prn_id || `${typeKey}-${getTime(n)}-${(n.prn_text || "").slice(0, 16)}`}
              type={typeKey}
              note={n}
            />
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}

export default function PricingRequestNotesDialog({
  open,
  onClose,
  pricingRequestId,
  workName = "ไม่ระบุ",
}) {
  const {
    data: apiResponse,
    isLoading,
    error: rtkError,
    refetch,
  } = useGetPricingRequestNotesQuery(pricingRequestId, {
    skip: !open || !pricingRequestId,
  });

  const notesData = apiResponse?.success ? apiResponse?.data : null;
  const errorMessage = rtkError
    ? rtkError?.data?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ"
    : apiResponse && apiResponse.success === false
      ? apiResponse?.message || "ไม่สามารถดึงข้อมูล Notes ได้"
      : null;

  const renderBody = () => {
    if (isLoading) {
      return (
        <Box display="flex" alignItems="center" gap={1} p={2}>
          <CircularProgress size={22} />
          <Typography variant="body2">กำลังโหลด Notes...</Typography>
        </Box>
      );
    }
    if (errorMessage) {
      return (
        <Alert
          severity="error"
          sx={{ m: 2 }}
          action={
            <Button onClick={refetch} size="small">
              ลองใหม่
            </Button>
          }
        >
          <Typography variant="body2">{errorMessage}</Typography>
        </Alert>
      );
    }
    if (!notesData) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          <Typography variant="body2">ไม่พบข้อมูล Notes</Typography>
        </Alert>
      );
    }

    const list = Array.isArray(notesData?.notes)
      ? notesData.notes
      : Array.isArray(notesData)
        ? notesData
        : null;

    const saleNotes =
      notesData?.sale_notes ??
      list?.filter((n) => (n?.prn_type || "").toLowerCase() === "sale") ??
      [];
    const priceNotes =
      notesData?.price_notes ??
      list?.filter((n) => (n?.prn_type || "").toLowerCase() === "price") ??
      [];

    return (
      <Box sx={{ p: 2, bgcolor: tokens.bgAlt }}>
        <Card sx={{ mb: 2, border: `1px solid ${tokens.border}`, bgcolor: tokens.white }}>
          <CardContent sx={{ py: 1.25, px: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle1" fontWeight={700}>
                สรุป Notes สำหรับงาน: {workName}
              </Typography>
              <Chip
                icon={<NotesIcon />}
                label={`ทั้งหมด ${[...(saleNotes || []), ...(priceNotes || [])].length} รายการ`}
                size="small"
              />
            </Box>
          </CardContent>
        </Card>

        <LatestWithHistorySection title="price" typeKey="price" items={priceNotes} />
        <Divider sx={{ my: 1.25 }} />
        <LatestWithHistorySection title="note sales" typeKey="sale" items={saleNotes} />
      </Box>
    );
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { maxHeight: "85vh", bgcolor: tokens.bgAlt } }}
    >
      <StyledDialogTitle>
        <Typography variant="h6" fontWeight={700}>
          📝 Pricing Request Notes
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
          <HistoryIcon sx={{ opacity: 0 }} />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 0 }}>{renderBody()}</DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: tokens.bg, borderTop: `1px solid ${tokens.divider}` }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>
          ปิด
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}
