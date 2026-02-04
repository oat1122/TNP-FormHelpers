/**
 * NotebookPDF Component
 * PDF report for Notebook entries using @react-pdf/renderer
 */
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Import font configuration
import "../../../utils/pdfFontConfig";
import { styles, formatDate, getStatusStyle, getHistoryChanges } from "../utils/pdfUtils";

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
