import dayjs from "dayjs";

export const getStoredNotebookUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userData") || "{}");
  } catch {
    return {};
  }
};

export const buildNotebookDraft = ({ notebook, currentUser, isAdmin }) => ({
  nb_date: notebook?.nb_date || dayjs().format("YYYY-MM-DD"),
  nb_time: notebook?.nb_time || dayjs().format("HH:mm"),
  nb_customer_name: notebook?.nb_customer_name || "",
  nb_is_online: Boolean(notebook?.nb_is_online),
  nb_additional_info: notebook?.nb_additional_info || "",
  nb_contact_number: notebook?.nb_contact_number || "",
  nb_email: notebook?.nb_email || "",
  nb_contact_person: notebook?.nb_contact_person || "",
  nb_action: notebook?.nb_action || "",
  nb_status: notebook?.nb_status || "",
  nb_remarks: notebook?.nb_remarks || "",
  nb_manage_by: isAdmin ? (notebook?.nb_manage_by ?? "") : (currentUser?.user_id ?? null),
});

export const buildNotebookFilterSummary = ({ keyword, periodFilter, dateFilterBy }) => {
  const dateTypeLabelMap = {
    all: "สร้างหรืออัปเดต",
    created_at: "วันที่สร้าง",
    updated_at: "วันที่อัปเดต",
  };

  const dateLabel = `${periodFilter.startDate} ถึง ${periodFilter.endDate}`;
  const keywordLabel = keyword ? `คำค้นหา: "${keyword}"` : "คำค้นหา: ทั้งหมด";
  const typeLabel = `ประเภทวันที่: ${dateTypeLabelMap[dateFilterBy] || "ทั้งหมด"}`;

  return {
    label: `${keywordLabel} | ${typeLabel} | ช่วงเวลา ${dateLabel}`,
    keywordLabel,
    typeLabel,
    dateLabel,
  };
};
