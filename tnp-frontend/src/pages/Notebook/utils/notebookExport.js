import { format } from "date-fns";
import { th } from "date-fns/locale";

const TEXT_FIELDS = ["nb_additional_info", "nb_remarks"];

const inDateRange = (value, rangeStart, rangeEnd) => {
  if (!value) return false;
  const date = new Date(value);
  return date >= rangeStart && date <= rangeEnd;
};

export const filterNotebookExportData = (data = [], dateRange, dateFilterBy = "all") => {
  const rangeStart = new Date(dateRange.start);
  const rangeEnd = new Date(dateRange.end);
  rangeEnd.setHours(23, 59, 59, 999);

  return data.filter((item) => {
    if (dateFilterBy === "created_at") {
      return inDateRange(item.created_at, rangeStart, rangeEnd);
    }

    if (dateFilterBy === "updated_at") {
      return inDateRange(item.updated_at, rangeStart, rangeEnd);
    }

    return (
      inDateRange(item.created_at, rangeStart, rangeEnd) ||
      inDateRange(item.updated_at, rangeStart, rangeEnd)
    );
  });
};

export const buildNotebookExportRows = (selectedData = [], dateRange) => {
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

    const sortedHistories = [...histories].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const relevantHistories = sortedHistories.filter((history) => {
      const historyAt = new Date(history.created_at);
      const isInRange = historyAt >= rangeStart && historyAt <= rangeEnd;
      const hasTextField = TEXT_FIELDS.some((field) => history.new_values && field in history.new_values);
      return isInRange && hasTextField;
    });

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
    const newValues = historyEntry?.new_values || {};
    const rawDate = newValues.nb_date || notebook.nb_date;
    const itemDate = rawDate ? new Date(rawDate) : at;
    const dayMonth = format(itemDate, "dd/MM");
    const year = itemDate.getFullYear() + 543;
    const currentDateStr = `${dayMonth}/${year}`;
    const displayDate = currentDateStr === previousDateStr ? "" : currentDateStr;
    previousDateStr = currentDateStr;

    const rawTime = newValues.nb_time || notebook.nb_time;
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
      additionalInfo: newValues.nb_additional_info ?? notebook.nb_additional_info ?? "-",
      contactNumber: notebook.nb_contact_number || "-",
      email: notebook.nb_email || "-",
      contactPerson: notebook.nb_contact_person || "-",
      action: newValues.nb_action ?? notebook.nb_action ?? "-",
      status: newValues.nb_status ?? notebook.nb_status ?? "-",
      remarks: newValues.nb_remarks ?? notebook.nb_remarks ?? "-",
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
