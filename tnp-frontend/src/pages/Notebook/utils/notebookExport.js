import { format } from "date-fns";
import { th } from "date-fns/locale";

const TEXT_FIELDS = ["nb_additional_info", "nb_remarks"];
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateOnly = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const stringValue = String(value);
  if (DATE_ONLY_PATTERN.test(stringValue)) {
    const [year, month, day] = stringValue.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const parseDateTime = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildRangeBoundaries = (dateRange, { dateOnly = false } = {}) => {
  const start = dateOnly ? parseDateOnly(dateRange.start) : parseDateTime(dateRange.start);
  const end = dateOnly ? parseDateOnly(dateRange.end) : parseDateTime(dateRange.end);

  if (!start || !end) {
    return null;
  }

  const normalizedEnd = new Date(end);
  normalizedEnd.setHours(23, 59, 59, 999);

  return {
    start,
    end: normalizedEnd,
  };
};

const inDateRange = (value, rangeStart, rangeEnd, { dateOnly = false } = {}) => {
  const parsedDate = dateOnly ? parseDateOnly(value) : parseDateTime(value);
  if (!parsedDate) {
    return false;
  }

  return parsedDate >= rangeStart && parsedDate <= rangeEnd;
};

export const filterNotebookExportData = (data = [], dateRange, dateFilterBy = "all") => {
  const dateTimeRange = buildRangeBoundaries(dateRange);
  const dateOnlyRange = buildRangeBoundaries(dateRange, { dateOnly: true });

  if (!dateTimeRange || !dateOnlyRange) {
    return [];
  }

  return data.filter((item) => {
    if (dateFilterBy === "nb_date") {
      return inDateRange(item.nb_date, dateOnlyRange.start, dateOnlyRange.end, { dateOnly: true });
    }

    if (dateFilterBy === "created_at") {
      return inDateRange(item.created_at, dateTimeRange.start, dateTimeRange.end);
    }

    if (dateFilterBy === "updated_at") {
      return inDateRange(item.updated_at, dateTimeRange.start, dateTimeRange.end);
    }

    return (
      inDateRange(item.created_at, dateTimeRange.start, dateTimeRange.end) ||
      inDateRange(item.updated_at, dateTimeRange.start, dateTimeRange.end)
    );
  });
};

const shouldIncludeHistoryForReport = (notebook, history, rangeStart, rangeEnd, reportMode) => {
  const historyAt = new Date(history.created_at);
  const isInRange = historyAt >= rangeStart && historyAt <= rangeEnd;

  if (!isInRange || history.action === "deleted") {
    return false;
  }

  if (reportMode === "self" && notebook.nb_entry_type === "customer_care") {
    return history.action === "created" || history.action === "updated";
  }

  return TEXT_FIELDS.some((field) => history.new_values && field in history.new_values);
};

const resolveHistoryValue = (historyEntry, notebook, fieldName) =>
  historyEntry?.new_values?.[fieldName] ??
  historyEntry?.old_values?.[fieldName] ??
  notebook?.[fieldName] ??
  null;

export const buildNotebookExportRows = (
  selectedData = [],
  dateRange,
  { reportMode = "standard" } = {}
) => {
  const rangeStart = new Date(dateRange.start);
  const rangeEnd = new Date(dateRange.end);
  rangeEnd.setHours(23, 59, 59, 999);

  const flatRows = [];

  selectedData.forEach((notebook) => {
    const histories = notebook.histories || [];

    if (histories.length === 0) {
      flatRows.push({
        notebook,
        historyEntry: null,
        at: new Date(notebook.updated_at || notebook.created_at),
      });
      return;
    }

    const sortedHistories = [...histories].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    const relevantHistories = sortedHistories.filter((history) =>
      shouldIncludeHistoryForReport(notebook, history, rangeStart, rangeEnd, reportMode)
    );

    if (relevantHistories.length === 0) {
      return;
    }

    relevantHistories.forEach((history) => {
      flatRows.push({
        notebook,
        historyEntry: history,
        at: new Date(history.created_at),
      });
    });
  });

  flatRows.sort((a, b) => a.at - b.at);

  let previousDateStr = null;

  return flatRows.map(({ notebook, historyEntry, at }, index) => {
    const rawDate =
      reportMode === "self"
        ? at
        : resolveHistoryValue(historyEntry, notebook, "nb_date") || at;
    const itemDate = rawDate ? new Date(rawDate) : at;
    const dayMonth = format(itemDate, "dd/MM");
    const year = itemDate.getFullYear() + 543;
    const currentDateStr = `${dayMonth}/${year}`;
    const displayDate = currentDateStr === previousDateStr ? "" : currentDateStr;
    previousDateStr = currentDateStr;

    const rawTime =
      reportMode === "self" ? null : resolveHistoryValue(historyEntry, notebook, "nb_time");
    let time = "-";
    if (rawTime) {
      const timeParts = String(rawTime).split(/[:.]/).slice(0, 2);
      time = timeParts.map((part) => part.padStart(2, "0")).join(".");
    } else {
      time = format(at, "HH.mm");
    }

    let customer = notebook.nb_customer_name || "-";
    if (notebook.nb_is_online) {
      customer += " / online";
    }

    return {
      id: historyEntry?.id || `notebook-${notebook.id}-${index}`,
      date: displayDate,
      time,
      customer,
      additionalInfo: resolveHistoryValue(historyEntry, notebook, "nb_additional_info") ?? "-",
      contactNumber: notebook.nb_contact_number || "-",
      email: notebook.nb_email || "-",
      contactPerson: notebook.nb_contact_person || "-",
      action: resolveHistoryValue(historyEntry, notebook, "nb_action") ?? "-",
      status: resolveHistoryValue(historyEntry, notebook, "nb_status") ?? "-",
      remarks: resolveHistoryValue(historyEntry, notebook, "nb_remarks") ?? "-",
    };
  });
};

export const buildNotebookCsvContent = ({ rows = [], exporterName = "", dateRange }) => {
  const exportMonth = format(new Date(dateRange.start), "MMMM", { locale: th });
  const exportYear = new Date(dateRange.start).getFullYear() + 543;
  const monthHeader = `ประจำเดือน ${exportMonth} ${exportYear}`;

  const row1 = [exporterName, "", "", "", "", "", "", "", "", monthHeader];
  const row2 = [
    "",
    "เวลา",
    "ชื่อลูกค้า / บริษัท\n(ถ้าเป็นออนไลน์ใส่ / online)",
    "เพิ่มเติม",
    "",
    "",
    "",
    "ขั้นตอน",
    "",
    "",
  ];
  const row3 = [
    "",
    "",
    "",
    "",
    "เบอร์ติดต่อ",
    "E-mail",
    "ชื่อผู้ติดต่อ",
    "การกระทำ",
    "สถานะ",
    "หมายเหตุ",
  ];

  const csvRows = rows.map((row) => [
    row.date,
    row.time,
    row.customer,
    row.additionalInfo,
    row.contactNumber !== "-" ? `="${row.contactNumber}"` : "-",
    row.email,
    row.contactPerson,
    row.action,
    row.status,
    row.remarks,
  ]);

  return (
    "\uFEFF" +
    [row1, row2, row3, ...csvRows]
      .map((row) =>
        row
          .map((cell) => {
            const cellString = String(cell).replace(/"/g, '""');
            return `"${cellString}"`;
          })
          .join(",")
      )
      .join("\n")
  );
};

export const buildNotebookLeadSummaryRows = (leadAdditions = []) =>
  leadAdditions
    .map((item) => ({
      id: item.id,
      createdAt: item.created_at,
      date: item.created_at ? format(new Date(item.created_at), "dd/MM/yyyy HH:mm") : "-",
      customer: item.nb_customer_name || "-",
      contactPerson: item.nb_contact_person || "-",
      contactNumber: item.nb_contact_number || "-",
      email: item.nb_email || "-",
      ownerStatus: item.nb_manage_by ? "Claimed" : "In Central Queue",
    }))
    .sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0));
