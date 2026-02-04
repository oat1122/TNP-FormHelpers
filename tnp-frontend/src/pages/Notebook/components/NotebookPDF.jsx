/**
 * NotebookPDF Component
 * PDF report for Notebook entries using @react-pdf/renderer
 */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Import font configuration
import "../../../utils/pdfFontConfig";

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Kanit",
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
    width: "auto",
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
  },
  tableCell: {
    padding: 6,
    borderWidth: 0.5,
    borderColor: "#ddd",
  },
  // Column widths
  colDate: { width: "12%" },
  colCustomer: { width: "20%" },
  colContact: { width: "12%" },
  colAction: { width: "14%" },
  colStatus: { width: "12%" },
  colRemarks: { width: "30%" },
  // Text styles
  headerText: {
    fontWeight: 600,
    fontSize: 9,
  },
  cellText: {
    fontSize: 9,
  },
  statusSuccess: { color: "#2e7d32" },
  statusInfo: { color: "#1976d2" },
  statusWarning: { color: "#ed6c02" },
  statusError: { color: "#d32f2f" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
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

// Helper functions
const formatDate = (dateStr, withTime = false) => {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), withTime ? "dd/MM/yy HH:mm" : "dd/MM/yy", { locale: th });
  } catch {
    return "-";
  }
};

const getStatusStyle = (status) => {
  if (status === "ได้งาน") return styles.statusSuccess;
  if (status === "พิจารณา") return styles.statusInfo;
  if (status === "ยังไม่แผนทำ") return styles.statusWarning;
  if (status === "หลุด" || status === "ไม่ได้งาน") return styles.statusError;
  return {};
};

const FIELD_LABELS = {
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

const formatValue = (key, value) => {
  if (value === null || value === undefined || value === "" || value === "-")
    return "(ไม่มีข้อมูล)";
  if (key.includes("date") || key.includes("at"))
    return formatDate(value, key.includes("time") || key.includes("at"));
  if (key === "nb_is_online") return value ? "Yes" : "No";
  return String(value);
};

const getHistoryChanges = (history) => {
  // 1. Only show if action is 'updated'
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

    // If it's not an update or no new values, just show action
    if (!newVals || Object.keys(newVals).length === 0) return [];

    const changes = [];
    Object.keys(newVals).forEach((key) => {
      // Skip ignored fields
      if (key === "updated_at" || key === "nb_time") return;

      const label = FIELD_LABELS[key] || key;
      const oldVal = formatValue(key, oldVals[key]);
      const newVal = formatValue(key, newVals[key]);

      // Only show if different
      if (oldVal !== newVal) {
        changes.push({ label, oldVal, newVal });
      }
    });

    return changes;
  } catch (e) {
    return [];
  }
};

// PDF Document Component
const NotebookPDF = ({ data = [], userName = "", dateRange = null }) => {
  const printDate = format(new Date(), "dd MMMM yyyy HH:mm", { locale: th });

  // Format date range for display
  const formatDateRange = () => {
    if (!dateRange?.start || !dateRange?.end) return "";
    try {
      const start = format(new Date(dateRange.start), "dd MMM yyyy", { locale: th });
      const end = format(new Date(dateRange.end), "dd MMM yyyy", { locale: th });
      return `${start} - ${end}`;
    } catch {
      return "";
    }
  };

  return (
    <Document title="รายงานสมุดจดบันทึก">
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>รายงานสมุดจดบันทึก (Notebook Report)</Text>
          {dateRange && <Text style={styles.subtitle}>ช่วงเวลา: {formatDateRange()}</Text>}
          <Text style={styles.subtitle}>
            พิมพ์เมื่อ: {printDate}
            {userName ? ` | โดย: ${userName}` : ""}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCell, styles.colDate]}>
              <Text style={styles.headerText}>วันที่</Text>
            </View>
            <View style={[styles.tableCell, styles.colCustomer]}>
              <Text style={styles.headerText}>ชื่อลูกค้า / บริษัท</Text>
            </View>
            <View style={[styles.tableCell, styles.colContact]}>
              <Text style={styles.headerText}>เบอร์ติดต่อ</Text>
            </View>
            <View style={[styles.tableCell, styles.colAction]}>
              <Text style={styles.headerText}>การกระทำ</Text>
            </View>
            <View style={[styles.tableCell, styles.colStatus]}>
              <Text style={styles.headerText}>สถานะ</Text>
            </View>
            <View style={[styles.tableCell, styles.colRemarks]}>
              <Text style={styles.headerText}>หมายเหตุ</Text>
            </View>
          </View>

          {/* Table Rows */}
          {data.length === 0 ? (
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { width: "100%" }]}>
                <Text style={styles.cellText}>ไม่มีข้อมูล</Text>
              </View>
            </View>
          ) : (
            data.map((item, index) => (
              <View key={item.id || index} wrap={false}>
                <View style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.colDate]}>
                    <Text style={styles.cellText}>{formatDate(item.nb_date)}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colCustomer]}>
                    <Text style={styles.cellText}>
                      {item.nb_customer_name || "-"}
                      {item.nb_is_online ? " (Online)" : ""}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.colContact]}>
                    <Text style={styles.cellText}>{item.nb_contact_number || "-"}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colAction]}>
                    <Text style={styles.cellText}>{item.nb_action || "-"}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colStatus]}>
                    <Text style={[styles.cellText, getStatusStyle(item.nb_status)]}>
                      {item.nb_status || "-"}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.colRemarks]}>
                    <Text style={styles.cellText}>{item.nb_remarks || "-"}</Text>
                  </View>
                </View>
                {/* History Rows */}
                {item.histories?.map((history, hIndex) => {
                  const changes = getHistoryChanges(history);
                  if (changes.length === 0) return null;

                  return (
                    <View key={`hist-${index}-${hIndex}`} style={styles.historyRow}>
                      <View style={styles.historyDateCell}>
                        <Text style={styles.historyText}>
                          {formatDate(history.created_at, true)}
                        </Text>
                      </View>
                      <View style={styles.historyDetailCell}>
                        <Text style={styles.historyText}>
                          {changes.map((change, cIndex) => (
                            <Text key={cIndex}>
                              <Text style={{ fontWeight: 600 }}>{change.label}: </Text>
                              <Text>
                                {change.oldVal} {"->"} {change.newVal}
                              </Text>
                              {cIndex < changes.length - 1 ? ", " : ""}
                            </Text>
                          ))}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

export default NotebookPDF;
