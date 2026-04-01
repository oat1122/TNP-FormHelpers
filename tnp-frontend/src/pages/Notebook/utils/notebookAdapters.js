import dayjs from "dayjs";

export const getStoredNotebookUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userData") || "{}");
  } catch {
    return {};
  }
};

export const getDefaultNotebookPeriodFilter = () => ({
  mode: "month",
  shiftUnit: "month",
  startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
  endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
});

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

export const buildNotebookFilterSummary = ({
  keyword,
  periodFilter,
  dateFilterBy,
  statusFilter,
  actionFilter,
  salesFilter,
  salesOptions = [],
  defaults,
}) => {
  const dateTypeLabelMap = {
    all: "สร้างหรืออัปเดต",
    nb_date: "วันติดตาม",
    created_at: "วันที่สร้าง",
    updated_at: "วันที่อัปเดต",
  };

  const salesLabel =
    salesOptions.find((option) => String(option.value) === String(salesFilter))?.label || salesFilter;
  const dateLabel = `ช่วง ${periodFilter.startDate} ถึง ${periodFilter.endDate}`;
  const chips = [
    {
      key: "date",
      label: dateLabel,
    },
    {
      key: "date-type",
      label: `วันที่: ${dateTypeLabelMap[dateFilterBy] || "ทั้งหมด"}`,
    },
  ];

  if (keyword) {
    chips.unshift({
      key: "keyword",
      label: `ค้นหา: "${keyword}"`,
    });
  }

  if (statusFilter && statusFilter !== "all") {
    chips.push({
      key: "status",
      label: `สถานะ: ${statusFilter}`,
    });
  }

  if (actionFilter && actionFilter !== "all") {
    chips.push({
      key: "action",
      label: `Next action: ${actionFilter}`,
    });
  }

  if (salesFilter && salesFilter !== "all" && salesLabel) {
    chips.push({
      key: "sales",
      label: `Sales: ${salesLabel}`,
    });
  }

  const hasCustomFilters =
    Boolean(keyword) ||
    dateFilterBy !== defaults.dateFilterBy ||
    statusFilter !== defaults.statusFilter ||
    actionFilter !== defaults.actionFilter ||
    String(salesFilter) !== String(defaults.salesFilter) ||
    periodFilter.startDate !== defaults.periodFilter.startDate ||
    periodFilter.endDate !== defaults.periodFilter.endDate ||
    periodFilter.mode !== defaults.periodFilter.mode;

  return {
    chips,
    hasCustomFilters,
    keywordLabel: keyword ? `ค้นหา: "${keyword}"` : "",
    typeLabel: `วันที่: ${dateTypeLabelMap[dateFilterBy] || "ทั้งหมด"}`,
    dateLabel,
    statusLabel: statusFilter && statusFilter !== "all" ? `สถานะ: ${statusFilter}` : "",
    actionLabel: actionFilter && actionFilter !== "all" ? `Next action: ${actionFilter}` : "",
    salesLabel:
      salesFilter && salesFilter !== "all" && salesLabel ? `Sales: ${salesLabel}` : "",
  };
};
