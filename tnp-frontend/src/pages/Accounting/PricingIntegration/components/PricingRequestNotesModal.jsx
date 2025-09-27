// src/pages/Accounting/PricingIntegration/components/PricingRequestNotesModal.jsx
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import NotesIcon from "@mui/icons-material/Notes";
import PersonIcon from "@mui/icons-material/Person";
import ScheduleIcon from "@mui/icons-material/Schedule";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Collapse,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import moment from "moment";
import React from "react";

/**
 * โมดัล Notes สำหรับ Pricing Request (โฟกัส sale/price)
 * - แสดง "โน้ตล่าสุด 1 อัน" ต่อประเภท (sales, price)
 * - ปุ่ม "ดูประวัติ" เพื่อกางรายการทั้งหมดของประเภทนั้น
 * - ฟอร์แมตข้อความแบบ pre-wrap + แสดงผู้เขียน | เวลา (DD/MM HH:mm)
 */

const StyledDialog = styled(Dialog)(() => ({
  "& .MuiPaper-root": {
    borderRadius: 12,
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
    border: "1px solid #EEE",
  },
}));

const StyledDialogTitle = styled(DialogTitle)(() => ({
  background: "#fff",
  color: "#333",
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #F0F0F0",
}));

const SectionHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 0",
  marginBottom: 8,
  borderBottom: "1px solid #F0F0F0",
}));

const NoteCard = styled(Card)(() => ({
  background: "#fff",
  border: "1px solid #EAEAEA",
  borderRadius: 10,
}));

const Pill = styled(Chip)(() => ({
  backgroundColor: "#F5F5F5",
  color: "#555",
  fontWeight: 600,
  fontSize: "0.75rem",
}));

// แบ่งกลุ่มจาก prn_type เป็น sale / price (ตัด manager ออก)
function groupNotes(list) {
  const g = { sale: [], price: [] };
  (list || []).forEach((n) => {
    const t = (n?.prn_type || "sale").toLowerCase();
    if (t === "price") g.price.push(n);
    else if (t === "sale") g.sale.push(n);
  });
  return g;
}

// พยายามอ่านวันที่จากหลายฟิลด์ แล้วเรียงใหม่→เก่า
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

// แสดงการ์ดโน้ต 1 ใบ (ฟอร์แมตเหมือน PricingNote: pre-wrap + author | time)
function NoteItem({ type, note }) {
  const author = note?.created_by_name || note?.created_name || note?.user_name || "-";
  const when = note?.prn_created_date
    ? moment(note.prn_created_date).format("DD/MM HH:mm")
    : note?.formatted_date || note?.created_at_display || "";

  const typeLabel = type === "price" ? "price" : "note sales";

  return (
    <NoteCard>
      <CardContent sx={{ p: 2 }}>
        {/* meta แถวบน */}
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

        {/* เนื้อหา */}
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.primary" }}>
          {note?.prn_text ?? note?.text ?? ""}
        </Typography>
      </CardContent>
    </NoteCard>
  );
}

// ส่วนละประเภท: แสดงล่าสุด 1 + ปุ่มดูประวัติ -> กางทั้งหมด
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

      {/* ล่าสุด 1 อัน */}
      {latest ? (
        <NoteItem type={typeKey} note={latest} />
      ) : (
        <Alert severity="info" sx={{ bgcolor: "#fff" }}>
          <Typography variant="body2">ไม่มี {title.toLowerCase()} สำหรับงานนี้</Typography>
        </Alert>
      )}

      {/* ประวัติทั้งหมดของประเภทนั้น */}
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

export default function PricingRequestNotesModal({
  open,
  onClose,
  pricingRequestId,
  workName = "ไม่ระบุ",
}) {
  const [notesData, setNotesData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // โหลดโน้ตเมื่อเปิดโมดัล
  React.useEffect(() => {
    if (open && pricingRequestId) {
      fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pricingRequestId]);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_END_POINT_URL}/pricing-requests/${pricingRequestId}/notes`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("authToken") || localStorage.getItem("token") || ""
            }`,
          },
        }
      );
      const json = await resp.json();
      if (json?.success) {
        setNotesData(json?.data);
      } else {
        setError(json?.message || "ไม่สามารถดึงข้อมูล Notes ได้");
      }
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <Box display="flex" alignItems="center" gap={1} p={2}>
          <CircularProgress size={22} />
          <Typography variant="body2">กำลังโหลด Notes...</Typography>
        </Box>
      );
    }
    if (error) {
      return (
        <Alert
          severity="error"
          sx={{ m: 2 }}
          action={
            <Button onClick={fetchNotes} size="small">
              ลองใหม่
            </Button>
          }
        >
          <Typography variant="body2">{error}</Typography>
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

    // รองรับโครงสร้างจาก API (อิงของเดิม)
    const list = Array.isArray(notesData?.notes)
      ? notesData.notes
      : Array.isArray(notesData)
        ? notesData
        : null;

    // เคสโครงสร้างใหม่ที่แยก sale_notes / price_notes
    const saleNotes =
      notesData?.sale_notes ??
      list?.filter((n) => (n?.prn_type || "").toLowerCase() === "sale") ??
      [];
    const priceNotes =
      notesData?.price_notes ??
      list?.filter((n) => (n?.prn_type || "").toLowerCase() === "price") ??
      [];

    // เข้าทรงเดียวกับ PricingNote: แสดงล่าสุด 1 + ประวัติ (ต่อประเภท)
    return (
      <Box sx={{ p: 2, bgcolor: "#FAFAFA" }}>
        <Card sx={{ mb: 2, border: "1px solid #EEE", bgcolor: "#fff" }}>
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

        {/* PRICE */}
        <LatestWithHistorySection title="price" typeKey="price" items={priceNotes} />
        <Divider sx={{ my: 1.25 }} />
        {/* SALES */}
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
      PaperProps={{ sx: { maxHeight: "85vh", bgcolor: "#FAFAFA" } }}
    >
      <StyledDialogTitle>
        <Typography variant="h6" fontWeight={700}>
          📝 Pricing Request Notes
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
          <HistoryIcon sx={{ opacity: 0 }} /> {/* spacer ให้ขนาดปุ่มฝั่งขวาเท่ากัน */}
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 0 }}>{renderBody()}</DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "#F8F9FA", borderTop: "1px solid #E0E0E0" }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>
          ปิด
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}
