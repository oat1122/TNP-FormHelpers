import { StyleSheet } from "@react-pdf/renderer";

import { formatDate as commonFormatDate } from "./notebookCommon";

export const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
    fontFamily: "Kanit",
    lineHeight: 1.45,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#d8dee4",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  table: {
    display: "table",
    width: "100%",
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeader: {
    backgroundColor: "#eeeeee",
  },
  rowEven: {
    backgroundColor: "#ffffff",
  },
  rowOdd: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 0.5,
    borderColor: "#ddd",
    justifyContent: "center",
  },
  colDate: { width: "6%" },
  colTime: { width: "5%" },
  colCustomer: { width: "16%" },
  colAdditional: { width: "18%" },
  colContact: { width: "9%" },
  colEmail: { width: "13%" },
  colPerson: { width: "9%" },
  colAction: { width: "11%" },
  colStatus: { width: "7%" },
  colRemarks: { width: "6%" },
  headerText: {
    fontWeight: 700,
    fontSize: 8,
    lineHeight: 1.3,
    color: "#111",
  },
  cellText: {
    fontSize: 8,
    lineHeight: 1.6,
    maxWidth: "100%",
    flexShrink: 1,
  },
  cellTextCompact: {
    fontSize: 7,
    lineHeight: 1.55,
    maxWidth: "100%",
    flexShrink: 1,
  },
  cellTextEmpty: {
    color: "#a0a7b4",
  },
  primaryText: {
    fontSize: 9,
    fontWeight: 600,
    lineHeight: 1.45,
    color: "#111",
  },
  secondaryText: {
    fontSize: 8,
    lineHeight: 1.45,
    color: "#333",
  },
  tertiaryText: {
    fontSize: 7,
    lineHeight: 1.45,
    color: "#999",
  },
  personalActivityRow: {
    backgroundColor: "#fff5f5",
  },
  personalActivityCell: {
    width: "100%",
    borderColor: "#f3c1c1",
  },
  personalActivityText: {
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1.45,
    color: "#c62828",
  },
  actionHeaderText: {
    fontFamily: "Sarabun",
    fontWeight: 700,
    fontSize: 8,
    lineHeight: 1.25,
    color: "#111",
  },
  actionText: {
    fontFamily: "Sarabun",
    fontSize: 6.6,
    lineHeight: 1.2,
    color: "#333",
  },
  statusBadge: {
    maxWidth: "100%",
    paddingHorizontal: 3,
    paddingVertical: 1.5,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontFamily: "Sarabun",
    fontSize: 6,
    lineHeight: 1.1,
    fontWeight: 600,
    color: "#111",
    textAlign: "center",
  },
  statusSuccess: {
    backgroundColor: "#e8f5e9",
    borderColor: "#2e7d32",
    borderWidth: 0.5,
  },
  statusInfo: {
    backgroundColor: "#e3f2fd",
    borderColor: "#1976d2",
    borderWidth: 0.5,
  },
  statusWarning: {
    backgroundColor: "#fff3e0",
    borderColor: "#ed6c02",
    borderWidth: 0.5,
  },
  statusError: {
    backgroundColor: "#ffebee",
    borderColor: "#d32f2f",
    borderWidth: 0.5,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 24,
    right: 24,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
  historyRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  historyDateCell: {
    width: "15%",
    padding: 6,
    paddingLeft: 10,
  },
  historyDetailCell: {
    width: "85%",
    padding: 6,
  },
  historyText: {
    fontSize: 8,
    color: "#555",
  },
});

export const formatDate = (dateStr, withTime = false) => {
  if (!dateStr) return "-";
  return commonFormatDate(dateStr, withTime ? "dd/MM/yy HH:mm" : "dd/MM/yy");
};

export const getStatusStyle = (status) => {
  if (status === "ได้งาน") return styles.statusSuccess;
  if (status === "พิจารณา") return styles.statusInfo;
  if (status === "ยังไม่มีแผนทำ") return styles.statusWarning;
  if (status === "หลุด" || status === "ไม่ได้งาน") return styles.statusError;
  return {};
};

export const FIELD_LABELS = {
  nb_date: "วันที่",
  nb_time: "เวลา",
  nb_customer_name: "ชื่อลูกค้า",
  nb_is_online: "ออนไลน์",
  nb_additional_info: "ข้อมูลเพิ่มเติม",
  nb_contact_number: "เบอร์ติดต่อ",
  nb_email: "อีเมล",
  nb_contact_person: "ผู้ติดต่อ",
  nb_action: "การกระทำ",
  nb_status: "สถานะ",
  nb_remarks: "หมายเหตุ",
  nb_manage_by: "ผู้ดูแล",
  nb_converted_at: "วันที่ convert",
};

export const formatValue = (key, value) => {
  if (value === null || value === undefined || value === "" || value === "-") {
    return "(ไม่มีข้อมูล)";
  }

  if (key.includes("date") || key.includes("at")) {
    return formatDate(value, key.includes("time") || key.includes("at"));
  }

  if (key === "nb_is_online") {
    return value ? "Yes" : "No";
  }

  return String(value);
};

export const getHistoryChanges = (history) => {
  if (history.action !== "updated") return [];

  try {
    const oldVals =
      typeof history.old_values === "string"
        ? JSON.parse(history.old_values)
        : history.old_values || {};
    const newVals =
      typeof history.new_values === "string"
        ? JSON.parse(history.new_values)
        : history.new_values || {};
    const displayOldVals =
      typeof history.display_old_values === "string"
        ? JSON.parse(history.display_old_values)
        : history.display_old_values || {};
    const displayNewVals =
      typeof history.display_new_values === "string"
        ? JSON.parse(history.display_new_values)
        : history.display_new_values || {};

    if (!newVals || Object.keys(newVals).length === 0) return [];

    const changes = [];
    Object.keys(newVals).forEach((key) => {
      if (key === "updated_at" || key === "nb_time") return;

      const label = FIELD_LABELS[key] || key;
      const oldVal = formatValue(key, displayOldVals[key] ?? oldVals[key]);
      const newVal = formatValue(key, displayNewVals[key] ?? newVals[key]);

      if (oldVal !== newVal) {
        changes.push({ label, oldVal, newVal });
      }
    });

    return changes;
  } catch {
    return [];
  }
};
