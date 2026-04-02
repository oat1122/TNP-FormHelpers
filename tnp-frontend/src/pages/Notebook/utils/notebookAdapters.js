import dayjs from "dayjs";

import {
  shouldNotebookCreateIntoMine,
  shouldNotebookCreateIntoQueue,
} from "../../../utils/userAccess";

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

const normalizeNotebookDate = (value) => {
  if (!value) {
    return "";
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};

export const buildNotebookDraft = ({ notebook, currentUser, isAdmin }) => ({
  nb_date: notebook ? normalizeNotebookDate(notebook?.nb_date) : dayjs().format("YYYY-MM-DD"),
  nb_time: notebook ? notebook?.nb_time || "" : dayjs().format("HH:mm"),
  nb_customer_name: notebook?.nb_customer_name || "",
  nb_is_online: Boolean(notebook?.nb_is_online),
  nb_additional_info: notebook?.nb_additional_info || "",
  nb_contact_number: notebook?.nb_contact_number || "",
  nb_email: notebook?.nb_email || "",
  nb_contact_person: notebook?.nb_contact_person || "",
  nb_action: notebook?.nb_action || "",
  nb_status: notebook?.nb_status || "",
  nb_remarks: notebook?.nb_remarks || "",
  nb_manage_by: isAdmin
    ? (notebook?.nb_manage_by ?? "")
    : shouldNotebookCreateIntoQueue(currentUser)
      ? null
      : (notebook?.nb_manage_by ?? currentUser?.user_id ?? null),
  nb_workflow:
    notebook?.nb_workflow ||
    (shouldNotebookCreateIntoQueue(currentUser) || shouldNotebookCreateIntoMine(currentUser)
      ? "lead_queue"
      : "standard"),
  nb_entry_type: notebook?.nb_entry_type || "standard",
  nb_source_type: notebook?.nb_source_type || "",
  nb_source_customer_id: notebook?.nb_source_customer_id || null,
  nb_source_notebook_id: notebook?.nb_source_notebook_id || null,
  manage_by_user: notebook?.manage_by_user || null,
});

export const buildNotebookFilterSummary = ({
  keyword,
  periodFilter,
  dateFilterBy,
  statusFilter,
  actionFilter,
  entryTypeFilter,
  salesFilter,
  scopeFilter,
  salesOptions = [],
  defaults,
}) => {
  const scopeLabelMap = {
    all: "All",
    mine: "My Customers",
    queue: "Central Queue",
  };

  const dateTypeLabelMap = {
    all: "Created or Updated",
    nb_date: "Follow-up Date",
    created_at: "Created Date",
    updated_at: "Updated Date",
  };
  const entryTypeLabelMap = {
    all: "All entries",
    standard: "จดบันทึก",
    customer_care: "ดูแลลูกค้า",
  };

  const salesLabel =
    salesOptions.find((option) => String(option.value) === String(salesFilter))?.label ||
    salesFilter;
  const dateLabel = `${periodFilter.startDate} - ${periodFilter.endDate}`;
  const chips = [
    {
      key: "date",
      label: dateLabel,
    },
    {
      key: "date-type",
      label: `Date: ${dateTypeLabelMap[dateFilterBy] || "All"}`,
    },
  ];

  if (keyword) {
    chips.unshift({
      key: "keyword",
      label: `Search: "${keyword}"`,
    });
  }

  if (scopeFilter && scopeFilter !== defaults.scopeFilter) {
    chips.unshift({
      key: "scope",
      label: `View: ${scopeLabelMap[scopeFilter] || scopeFilter}`,
    });
  }

  if (statusFilter && statusFilter !== "all") {
    chips.push({
      key: "status",
      label: `Status: ${statusFilter}`,
    });
  }

  if (actionFilter && actionFilter !== "all") {
    chips.push({
      key: "action",
      label: `Next action: ${actionFilter}`,
    });
  }

  if (entryTypeFilter && entryTypeFilter !== "all") {
    chips.push({
      key: "entry-type",
      label: `Type: ${entryTypeLabelMap[entryTypeFilter] || entryTypeFilter}`,
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
    String(scopeFilter) !== String(defaults.scopeFilter) ||
    dateFilterBy !== defaults.dateFilterBy ||
    statusFilter !== defaults.statusFilter ||
    actionFilter !== defaults.actionFilter ||
    entryTypeFilter !== defaults.entryTypeFilter ||
    String(salesFilter) !== String(defaults.salesFilter) ||
    periodFilter.startDate !== defaults.periodFilter.startDate ||
    periodFilter.endDate !== defaults.periodFilter.endDate ||
    periodFilter.mode !== defaults.periodFilter.mode;

  return {
    chips,
    hasCustomFilters,
    scopeLabel: `View: ${scopeLabelMap[scopeFilter] || scopeFilter || "All"}`,
    keywordLabel: keyword ? `Search: "${keyword}"` : "",
    typeLabel: `Date: ${dateTypeLabelMap[dateFilterBy] || "All"}`,
    dateLabel,
    statusLabel: statusFilter && statusFilter !== "all" ? `Status: ${statusFilter}` : "",
    actionLabel: actionFilter && actionFilter !== "all" ? `Next action: ${actionFilter}` : "",
    entryTypeLabel:
      entryTypeFilter && entryTypeFilter !== "all"
        ? `Type: ${entryTypeLabelMap[entryTypeFilter] || entryTypeFilter}`
        : "",
    salesLabel: salesFilter && salesFilter !== "all" && salesLabel ? `Sales: ${salesLabel}` : "",
  };
};
