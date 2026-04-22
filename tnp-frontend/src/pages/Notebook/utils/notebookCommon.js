import { format } from "date-fns";
import { th } from "date-fns/locale";
import dayjs from "dayjs";

export const formatDate = (date, formatStr = "dd/MM/yyyy") => {
  if (!date) return "";

  try {
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-").map(Number);
      return format(new Date(year, month - 1, day), formatStr, { locale: th });
    }

    return format(new Date(date), formatStr, { locale: th });
  } catch {
    return "";
  }
};

export const getStatusColor = (status) => {
  if (status === "ได้งาน") return "success";
  if (status === "พิจารณา") return "info";
  if (status === "ยังไม่มีแผนทำ") return "warning";
  if (status === "หลุด" || status === "ไม่ได้งาน") return "error";

  return "default";
};

export const getStatusStyle = () => ({});

export const CLOSED_NOTEBOOK_STATUSES = ["ได้งาน", "หลุด", "ไม่ได้งาน"];

export const getNotebookContactLines = (row) => {
  if (row?.nb_entry_type === "personal_activity") {
    return [row.nb_additional_info?.trim() || "ยังไม่มีข้อความ"];
  }

  const lines = [];

  if (row.nb_contact_number?.trim()) {
    lines.push(row.nb_contact_number.trim());
  }

  if (row.nb_email?.trim()) {
    lines.push(row.nb_email.trim());
  }

  if (row.nb_contact_person?.trim()) {
    lines.push(`ติดต่อ: ${row.nb_contact_person.trim()}`);
  }

  return lines.length ? lines : ["ไม่มีข้อมูลติดต่อ"];
};

export const getNotebookNotePreview = (row) =>
  row.nb_additional_info?.trim() || row.nb_remarks?.trim() || "ยังไม่มีบันทึกล่าสุด";

export const getNotebookActionHighlightSx = () => ({
  width: "100%",
  px: 1.4,
  py: 1.15,
  borderRadius: 2.5,
  border: "1px solid rgba(249, 115, 22, 0.28)",
  background: "linear-gradient(135deg, rgba(255,237,213,0.96) 0%, rgba(255,247,237,0.98) 100%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
  cursor: "pointer",
  transition: "transform 120ms ease, box-shadow 120ms ease",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 10px 20px rgba(249, 115, 22, 0.12)",
  },
});

export const isNotebookQueueAssignableRow = (row, scopeFilter = "all") =>
  row?.nb_entry_type !== "customer_care" &&
  row?.nb_entry_type !== "personal_activity" &&
  scopeFilter === "queue" &&
  row?.nb_workflow === "lead_queue" &&
  !row?.nb_manage_by &&
  !row?.nb_converted_at;

export const isUntouchedQueueClaim = (row) => {
  if (!row || row.nb_workflow !== "lead_queue" || !row.nb_manage_by || row.nb_converted_at) {
    return false;
  }

  const hasStatus = Boolean(row.nb_status && String(row.nb_status).trim());
  const hasNotes = Boolean(
    (row.nb_additional_info && String(row.nb_additional_info).trim()) ||
      (row.nb_remarks && String(row.nb_remarks).trim())
  );
  const hasFollowup = Boolean(row.nb_next_followup_date);
  const hasFollowupNote = Boolean(
    row.nb_next_followup_note && String(row.nb_next_followup_note).trim()
  );

  return !hasStatus && !hasNotes && !hasFollowup && !hasFollowupNote;
};

export const getNotebookIntelligenceChips = (row) => {
  const dueDate = row.nb_date ? dayjs(row.nb_date).startOf("day") : null;
  const today = dayjs().startOf("day");
  const tomorrow = today.add(1, "day");
  const chips = [];
  const isClosed = CLOSED_NOTEBOOK_STATUSES.includes(row.nb_status);

  if (!isClosed && dueDate && dueDate.isBefore(today, "day")) {
    chips.push({
      key: "overdue",
      label: "⚠️ เกินกำหนด",
      color: "error",
      variant: "filled",
    });
  } else if (
    !isClosed &&
    dueDate &&
    (dueDate.isSame(today, "day") || dueDate.isSame(tomorrow, "day"))
  ) {
    chips.push({
      key: "due-soon",
      label: "⏰ ใกล้ถึงกำหนด",
      color: "warning",
      variant: "filled",
    });
  }

  if (
    !isClosed &&
    (row.nb_status === "พิจารณา" || row.nb_action === "โทร" || row.nb_action === "ได้เข้าพบ")
  ) {
    chips.push({
      key: "important",
      label: "🔥 สำคัญ",
      color: "secondary",
      variant: "outlined",
    });
  }

  return chips;
};

export const getNotebookFollowupChip = (row) => {
  if (!row?.nb_next_followup_date || CLOSED_NOTEBOOK_STATUSES.includes(row?.nb_status)) {
    return null;
  }

  const followupDate = dayjs(row.nb_next_followup_date).startOf("day");
  if (!followupDate.isValid()) {
    return null;
  }

  const today = dayjs().startOf("day");
  const dateLabel = followupDate.format("DD/MM/YYYY");

  if (followupDate.isBefore(today, "day")) {
    const daysOverdue = today.diff(followupDate, "day");
    return {
      key: "followup-overdue",
      label: `ติดตาม ${dateLabel} · เลย ${daysOverdue} วัน`,
      textColor: "error.main",
      severity: "overdue",
    };
  }

  if (followupDate.isSame(today, "day")) {
    return {
      key: "followup-today",
      label: `ติดตามวันนี้`,
      textColor: "warning.dark",
      severity: "today",
    };
  }

  const daysUntil = followupDate.diff(today, "day");
  if (daysUntil <= 3) {
    return {
      key: "followup-soon",
      label: `ติดตาม ${dateLabel} · อีก ${daysUntil} วัน`,
      textColor: "info.main",
      severity: "upcoming",
    };
  }

  return {
    key: "followup-scheduled",
    label: `ติดตาม ${dateLabel}`,
    textColor: "text.secondary",
    severity: "scheduled",
  };
};
