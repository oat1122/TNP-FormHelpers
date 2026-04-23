import { format } from "date-fns";

const REPORT_VISIBLE_FIELDS = ["nb_status", "nb_action", "nb_additional_info", "nb_remarks"];
const IMPORTANT_PDF_FIELDS = ["nb_status", "nb_action", "nb_additional_info"];
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseHistoryPayload = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  return typeof value === "object" ? value : {};
};

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

const getChangedFields = (history) => {
  const oldValues = parseHistoryPayload(history?.old_values);
  const newValues = parseHistoryPayload(history?.new_values);
  const keys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

  return [...keys].filter((fieldName) => oldValues[fieldName] !== newValues[fieldName]);
};

const getHistoryActorId = (history) =>
  history?.action_by?.user_id ?? history?.action_by?.id ?? history?.action_by ?? null;

const shouldIncludeHistoryForReport = (
  notebook,
  history,
  rangeStart,
  rangeEnd,
  reportMode,
  reportActorId
) => {
  const historyAt = new Date(history.created_at);
  const isInRange = historyAt >= rangeStart && historyAt <= rangeEnd;

  if (!isInRange || history.action === "deleted") {
    return false;
  }

  if (history.action === "customer_info_updated") {
    return false;
  }

  if (
    reportMode === "self" &&
    reportActorId &&
    String(getHistoryActorId(history) ?? "") !== String(reportActorId)
  ) {
    return false;
  }

  if (
    reportMode === "self" &&
    ["customer_care", "personal_activity"].includes(notebook.nb_entry_type)
  ) {
    return history.action === "created" || history.action === "updated";
  }

  if (history.action === "created") {
    return true;
  }

  const changedFields = getChangedFields(history);
  return changedFields.some((field) => REPORT_VISIBLE_FIELDS.includes(field));
};

const resolveHistoryValue = (historyEntry, fieldName) => {
  const reportNewValues = parseHistoryPayload(historyEntry?.report_new_values);
  const reportOldValues = parseHistoryPayload(historyEntry?.report_old_values);
  const newValues = parseHistoryPayload(historyEntry?.new_values);
  const oldValues = parseHistoryPayload(historyEntry?.old_values);

  return (
    reportNewValues[fieldName] ??
    reportOldValues[fieldName] ??
    newValues[fieldName] ??
    oldValues[fieldName] ??
    null
  );
};

const resolveRowValue = (historyEntry, notebook, fieldName) => {
  const historyValue = resolveHistoryValue(historyEntry, fieldName);

  if (historyValue !== null && historyValue !== undefined) {
    return historyValue;
  }

  if (!historyEntry) {
    return notebook?.[fieldName] ?? null;
  }

  return null;
};

const buildCustomerLabel = ({ customerName, isOnline }) => {
  let customer = customerName || "-";
  if (isOnline) {
    customer += " / online";
  }

  return customer;
};

const buildDisplayDate = (value, fallback) => {
  const itemDate = value ? new Date(value) : fallback;
  return format(itemDate, "dd/MM/yyyy");
};

const buildPersonalActivityRow = ({ notebook, historyEntry, at, index }) => {
  const reportDate = resolveRowValue(historyEntry, notebook, "nb_date") || notebook?.nb_date || at;
  const displayDate = buildDisplayDate(reportDate, at);
  const activityText = resolveRowValue(historyEntry, notebook, "nb_additional_info") ?? "-";

  return {
    id: historyEntry?.id || `personal-${notebook.id}-${index}`,
    notebookId: notebook?.id ?? null,
    rowType: "personal_activity",
    date: displayDate,
    dateGroupValue: displayDate,
    time: "",
    customer: "",
    additionalInfo: activityText,
    contactNumber: "-",
    email: "-",
    contactPerson: "-",
    action: "-",
    status: "-",
    remarks: "-",
    historyAction: historyEntry?.action || null,
    changedFields: historyEntry ? getChangedFields(historyEntry) : [],
    activityAt: at.toISOString(),
    personalText: `${displayDate} ${activityText}`.trim(),
  };
};

const buildActivityRow = ({ notebook, historyEntry, at, reportMode, index }) => {
  if (notebook?.nb_entry_type === "personal_activity") {
    return buildPersonalActivityRow({ notebook, historyEntry, at, index });
  }

  const isUpdateEntry = historyEntry?.action === "updated";
  const rawDate = isUpdateEntry ? at : resolveRowValue(historyEntry, notebook, "nb_date") || at;
  const displayDate = buildDisplayDate(rawDate, at);

  const rawTime = reportMode === "self" ? null : resolveRowValue(historyEntry, notebook, "nb_time");
  const displayTime = rawTime
    ? String(rawTime)
        .split(/[:.]/)
        .slice(0, 2)
        .map((part) => part.padStart(2, "0"))
        .join(".")
    : format(at, "HH.mm");
  const customerName = resolveRowValue(historyEntry, notebook, "nb_customer_name");
  const isOnline = resolveRowValue(historyEntry, notebook, "nb_is_online");

  return {
    id: historyEntry?.id || `notebook-${notebook.id}-${index}`,
    notebookId: notebook?.id ?? null,
    rowType: "standard",
    date: displayDate,
    dateGroupValue: displayDate,
    time: displayTime,
    customer: buildCustomerLabel({ customerName, isOnline }),
    additionalInfo: resolveRowValue(historyEntry, notebook, "nb_additional_info") ?? "-",
    contactNumber: resolveRowValue(historyEntry, notebook, "nb_contact_number") ?? "-",
    email: resolveRowValue(historyEntry, notebook, "nb_email") ?? "-",
    contactPerson: resolveRowValue(historyEntry, notebook, "nb_contact_person") ?? "-",
    action: resolveRowValue(historyEntry, notebook, "nb_action") ?? "-",
    status: resolveRowValue(historyEntry, notebook, "nb_status") ?? "-",
    remarks: resolveRowValue(historyEntry, notebook, "nb_remarks") ?? "-",
    historyAction: historyEntry?.action || null,
    changedFields: historyEntry ? getChangedFields(historyEntry) : [],
    activityAt: at.toISOString(),
  };
};

const groupNotebookPdfRows = (rows = []) =>
  rows.map((row) => ({
    ...row,
    pageRepeatValues: {
      date: row.date || row.dateGroupValue,
      time: row.time,
      customer: row.customer,
    },
    groupedFields: {
      date: Boolean(row.groupedFields?.date),
      time: Boolean(row.groupedFields?.time),
      customer: Boolean(row.groupedFields?.customer),
    },
  }));

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

export const buildNotebookExportRows = (
  selectedData = [],
  dateRange,
  { reportMode = "standard", reportActorId = null } = {}
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
      (left, right) => new Date(left.created_at) - new Date(right.created_at)
    );
    const relevantHistories = sortedHistories.filter((history) =>
      shouldIncludeHistoryForReport(
        notebook,
        history,
        rangeStart,
        rangeEnd,
        reportMode,
        reportActorId
      )
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

  flatRows.sort((left, right) => left.at - right.at);

  let previousDateValue = null;

  return flatRows.map((item, index) => {
    const row = buildActivityRow({
      ...item,
      reportMode,
      index,
    });
    const shouldGroupDate =
      row.rowType !== "personal_activity" && row.dateGroupValue === previousDateValue;
    previousDateValue = row.dateGroupValue;

    return {
      ...row,
      date: shouldGroupDate ? "" : row.date,
    };
  });
};

export const buildNotebookPdfRows = (rows = []) => {
  const filteredRows = rows.filter((row) => {
    if (row.rowType === "personal_activity") {
      return true;
    }

    if (row.historyAction !== "updated") {
      return true;
    }

    return row.changedFields.some((field) => IMPORTANT_PDF_FIELDS.includes(field));
  });

  const latestPersonalActivityRows = new Map();
  const nonPersonalRows = [];

  filteredRows.forEach((row) => {
    if (row.rowType !== "personal_activity") {
      nonPersonalRows.push(row);
      return;
    }

    const personalKey = row.notebookId ?? row.id;
    const existingRow = latestPersonalActivityRows.get(personalKey);

    if (!existingRow || new Date(row.activityAt) >= new Date(existingRow.activityAt)) {
      latestPersonalActivityRows.set(personalKey, row);
    }
  });

  const rowsForPdf = [...nonPersonalRows, ...latestPersonalActivityRows.values()].sort(
    (left, right) => new Date(left.activityAt) - new Date(right.activityAt)
  );

  const rowsWithDateGrouping = rowsForPdf.map((row, index) => {
    if (row.rowType === "personal_activity") {
      return {
        ...row,
        groupedFields: {
          date: false,
          time: false,
          customer: false,
        },
      };
    }

    const previousRow = rowsForPdf[index - 1];
    const shouldHideDate =
      previousRow &&
      previousRow.rowType !== "personal_activity" &&
      previousRow.dateGroupValue === row.dateGroupValue;

    return {
      ...row,
      date: shouldHideDate ? "" : row.dateGroupValue,
      groupedFields: {
        date: shouldHideDate,
        time: false,
        customer: false,
      },
    };
  });

  return groupNotebookPdfRows(rowsWithDateGrouping).map((row, index) => ({
    ...row,
    zebraIndex: index,
  }));
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
