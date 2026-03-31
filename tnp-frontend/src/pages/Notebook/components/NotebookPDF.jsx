/**
 * NotebookPDF Component
 * PDF report for Notebook export rows using @react-pdf/renderer
 */
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import "../../../utils/pdfFontConfig";
import { styles, getStatusStyle } from "../utils/pdfUtils";

const NotebookPDF = ({ rows = [], userName = "", dateRange = null }) => {
  const printDate = format(new Date(), "dd MMMM yyyy HH:mm", { locale: th });

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
        <View style={styles.header}>
          <Text style={styles.title}>รายงานสมุดจดบันทึก (Notebook Report)</Text>
          {dateRange && <Text style={styles.subtitle}>ช่วงเวลา: {formatDateRange()}</Text>}
          <Text style={styles.subtitle}>
            พิมพ์เมื่อ: {printDate}
            {userName ? ` | โดย: ${userName}` : ""}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCell, styles.colDate]}>
              <Text style={styles.headerText}>วันที่</Text>
            </View>
            <View style={[styles.tableCell, styles.colTime]}>
              <Text style={styles.headerText}>เวลา</Text>
            </View>
            <View style={[styles.tableCell, styles.colCustomer]}>
              <Text style={styles.headerText}>ชื่อลูกค้า / บริษัท</Text>
            </View>
            <View style={[styles.tableCell, styles.colAdditional]}>
              <Text style={styles.headerText}>เพิ่มเติม</Text>
            </View>
            <View style={[styles.tableCell, styles.colContact]}>
              <Text style={styles.headerText}>เบอร์</Text>
            </View>
            <View style={[styles.tableCell, styles.colEmail]}>
              <Text style={styles.headerText}>E-mail</Text>
            </View>
            <View style={[styles.tableCell, styles.colPerson]}>
              <Text style={styles.headerText}>ผู้ติดต่อ</Text>
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

          {rows.length === 0 ? (
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { width: "100%" }]}>
                <Text style={styles.cellText}>ไม่มีข้อมูล</Text>
              </View>
            </View>
          ) : (
            rows.map((row) => (
              <View key={row.id} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.colDate]}>
                  <Text style={styles.cellText}>{row.date || "-"}</Text>
                </View>
                <View style={[styles.tableCell, styles.colTime]}>
                  <Text style={styles.cellText}>{row.time || "-"}</Text>
                </View>
                <View style={[styles.tableCell, styles.colCustomer]}>
                  <Text style={styles.cellText}>{row.customer || "-"}</Text>
                </View>
                <View style={[styles.tableCell, styles.colAdditional]}>
                  <Text style={styles.cellText}>{row.additionalInfo || "-"}</Text>
                </View>
                <View style={[styles.tableCell, styles.colContact]}>
                  <Text style={styles.cellText}>{row.contactNumber || "-"}</Text>
                </View>
                <View style={[styles.tableCell, styles.colEmail]}>
                  <Text style={styles.cellText}>{row.email || "-"}</Text>
                </View>
                <View style={[styles.tableCell, styles.colPerson]}>
                  <Text style={styles.cellText}>{row.contactPerson || "-"}</Text>
                </View>
                <View style={[styles.tableCell, styles.colAction]}>
                  <Text style={styles.cellText}>{row.action || "-"}</Text>
                </View>
                <View style={[styles.tableCell, styles.colStatus]}>
                  <Text style={[styles.cellText, getStatusStyle(row.status)]}>{row.status || "-"}</Text>
                </View>
                <View style={[styles.tableCell, styles.colRemarks]}>
                  <Text style={styles.cellText}>{row.remarks || "-"}</Text>
                </View>
              </View>
            ))
          )}
        </View>

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
