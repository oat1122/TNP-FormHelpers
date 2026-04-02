import { Document, Page, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import "../../../utils/pdfFontConfig";
import { getStatusStyle, styles } from "../utils/pdfUtils";

const sectionStyles = {
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: "#555",
    marginBottom: 12,
  },
  summaryCardRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#d8dee4",
    borderRadius: 6,
    padding: 10,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 700,
  },
  queueTableHeader: {
    backgroundColor: "#f4f6f8",
  },
  queueColDate: { width: "18%" },
  queueColCustomer: { width: "28%" },
  queueColPerson: { width: "20%" },
  queueColPhone: { width: "16%" },
  queueColStatus: { width: "18%" },
};

const EMPTY_CELL_LABEL = "-";

const formatDateRange = (dateRange) => {
  if (!dateRange?.start || !dateRange?.end) return "";

  try {
    const start = format(new Date(dateRange.start), "dd MMM yyyy", { locale: th });
    const end = format(new Date(dateRange.end), "dd MMM yyyy", { locale: th });
    return `${start} - ${end}`;
  } catch {
    return "";
  }
};

const splitLongToken = (token, chunkSize = 12) => {
  if (!token || token.length <= chunkSize) {
    return token;
  }

  const chunks = [];
  for (let index = 0; index < token.length; index += chunkSize) {
    chunks.push(token.slice(index, index + chunkSize));
  }

  return chunks.join("\n");
};

const wrapPdfText = (value, chunkSize = 12) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .trim()
    .split(/\s+/)
    .map((segment) => {
      if (!segment) {
        return segment;
      }

      return splitLongToken(segment, chunkSize);
    })
    .join(" ");
};

const getCellTextStyle = (value, compactAt = 28) => {
  const textLength = String(value || "").length;
  return textLength >= compactAt ? styles.cellTextCompact : styles.cellText;
};

const isEmptyValue = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "") ||
  value === "-";

const renderCellText = (value, options = {}) => {
  const { chunkSize = 12, compactAt = 28, style = null } = options;

  if (isEmptyValue(value)) {
    return <Text style={[styles.cellText, styles.cellTextEmpty]}>{EMPTY_CELL_LABEL}</Text>;
  }

  const displayValue = wrapPdfText(value, chunkSize);
  const textStyle = getCellTextStyle(displayValue, compactAt);

  return <Text style={style ? [textStyle, style] : textStyle}>{displayValue}</Text>;
};

const renderActivityTable = (rows = []) => (
  <View style={styles.table}>
    <View style={[styles.tableRow, styles.tableHeader]}>
      <View style={[styles.tableCell, styles.colDate]}>
        <Text style={styles.headerText}>วันที่</Text>
      </View>
      <View style={[styles.tableCell, styles.colTime]}>
        <Text style={styles.headerText}>เวลา</Text>
      </View>
      <View style={[styles.tableCell, styles.colCustomer]}>
        <Text style={styles.headerText}>ลูกค้า / บริษัท</Text>
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
        <View style={[styles.tableCell, { width: "100%" }]}>{renderCellText("ไม่มีข้อมูล")}</View>
      </View>
    ) : (
      rows.map((row) => (
        <View key={row.id} style={styles.tableRow}>
          <View style={[styles.tableCell, styles.colDate]}>{renderCellText(row.date)}</View>
          <View style={[styles.tableCell, styles.colTime]}>
            {renderCellText(row.time, { compactAt: 16 })}
          </View>
          <View style={[styles.tableCell, styles.colCustomer]}>
            {renderCellText(row.customer, { chunkSize: 14, compactAt: 30 })}
          </View>
          <View style={[styles.tableCell, styles.colAdditional]}>
            {renderCellText(row.additionalInfo, { chunkSize: 10, compactAt: 24 })}
          </View>
          <View style={[styles.tableCell, styles.colContact]}>
            {renderCellText(row.contactNumber, { chunkSize: 8, compactAt: 16 })}
          </View>
          <View style={[styles.tableCell, styles.colEmail]}>
            {renderCellText(row.email, { chunkSize: 12, compactAt: 22 })}
          </View>
          <View style={[styles.tableCell, styles.colPerson]}>
            {renderCellText(row.contactPerson, { chunkSize: 12, compactAt: 24 })}
          </View>
          <View style={[styles.tableCell, styles.colAction]}>
            {renderCellText(row.action, { chunkSize: 10, compactAt: 18 })}
          </View>
          <View style={[styles.tableCell, styles.colStatus]}>
            {renderCellText(row.status, {
              chunkSize: 10,
              compactAt: 18,
              style: getStatusStyle(row.status),
            })}
          </View>
          <View style={[styles.tableCell, styles.colRemarks]}>
            {renderCellText(row.remarks, { chunkSize: 10, compactAt: 24 })}
          </View>
        </View>
      ))
    )}
  </View>
);

const renderLeadSummaryTable = (leadSummaryRows = []) => (
  <View style={styles.table}>
    <View style={[styles.tableRow, sectionStyles.queueTableHeader]}>
      <View style={[styles.tableCell, sectionStyles.queueColDate]}>
        <Text style={styles.headerText}>วันที่เพิ่มเข้า queue</Text>
      </View>
      <View style={[styles.tableCell, sectionStyles.queueColCustomer]}>
        <Text style={styles.headerText}>ลูกค้า</Text>
      </View>
      <View style={[styles.tableCell, sectionStyles.queueColPerson]}>
        <Text style={styles.headerText}>ผู้ติดต่อ</Text>
      </View>
      <View style={[styles.tableCell, sectionStyles.queueColPhone]}>
        <Text style={styles.headerText}>เบอร์โทร</Text>
      </View>
      <View style={[styles.tableCell, sectionStyles.queueColStatus]}>
        <Text style={styles.headerText}>สถานะ</Text>
      </View>
    </View>

    {leadSummaryRows.length === 0 ? (
      <View style={styles.tableRow}>
        <View style={[styles.tableCell, { width: "100%" }]}>
          {renderCellText("ไม่มี lead addition ในช่วงเวลานี้")}
        </View>
      </View>
    ) : (
      leadSummaryRows.map((row) => (
        <View key={row.id} style={styles.tableRow}>
          <View style={[styles.tableCell, sectionStyles.queueColDate]}>
            {renderCellText(row.date)}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColCustomer]}>
            {renderCellText(row.customer, { chunkSize: 14, compactAt: 30 })}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColPerson]}>
            {renderCellText(row.contactPerson, { chunkSize: 12, compactAt: 24 })}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColPhone]}>
            {renderCellText(row.contactNumber, { chunkSize: 8, compactAt: 16 })}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColStatus]}>
            {renderCellText(row.ownerStatus, { chunkSize: 10, compactAt: 18 })}
          </View>
        </View>
      ))
    )}
  </View>
);

const NotebookPDF = ({
  rows = [],
  leadSummaryRows = [],
  userName = "",
  dateRange = null,
  reportMode = "standard",
}) => {
  const printDate = format(new Date(), "dd MMMM yyyy HH:mm", { locale: th });
  const formattedRange = formatDateRange(dateRange);

  if (reportMode !== "self") {
    return (
      <Document title="Notebook Report">
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>รายงานสมุดจดบันทึก (Notebook Report)</Text>
            {formattedRange ? (
              <Text style={styles.subtitle}>ช่วงเวลา: {formattedRange}</Text>
            ) : null}
            <Text style={styles.subtitle}>
              พิมพ์เมื่อ: {printDate}
              {userName ? ` | โดย: ${userName}` : ""}
            </Text>
          </View>

          {renderActivityTable(rows)}

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      </Document>
    );
  }

  return (
    <Document title="Notebook Self Report">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Notebook Self Report</Text>
          {formattedRange ? <Text style={styles.subtitle}>ช่วงเวลา: {formattedRange}</Text> : null}
          <Text style={styles.subtitle}>
            พิมพ์เมื่อ: {printDate}
            {userName ? ` | โดย: ${userName}` : ""}
          </Text>
        </View>

        <Text style={sectionStyles.sectionTitle}>Lead Intake Summary</Text>
        <Text style={sectionStyles.sectionSubtitle}>
          สรุปรายการที่เพิ่มลูกค้าเข้า Notebook queue ในช่วงวันที่ที่เลือก โดยอิงวันที่เพิ่ม lead
          เข้า queue
        </Text>

        <View style={sectionStyles.summaryCardRow}>
          <View style={sectionStyles.summaryCard}>
            <Text style={sectionStyles.summaryLabel}>ผู้ส่งออก</Text>
            <Text style={sectionStyles.summaryValue}>{userName || "-"}</Text>
          </View>
          <View style={sectionStyles.summaryCard}>
            <Text style={sectionStyles.summaryLabel}>จำนวน lead additions</Text>
            <Text style={sectionStyles.summaryValue}>{leadSummaryRows.length}</Text>
          </View>
          <View style={sectionStyles.summaryCard}>
            <Text style={sectionStyles.summaryLabel}>ช่วงวันที่</Text>
            <Text style={sectionStyles.summaryValue}>{formattedRange || "-"}</Text>
          </View>
        </View>

        {renderLeadSummaryTable(leadSummaryRows)}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={sectionStyles.sectionTitle}>Daily Activity Report</Text>
          <Text style={sectionStyles.sectionSubtitle}>
            ตารางกิจกรรมตามรูปแบบรายงานเดิม โดยอิงวันที่ทำรายการจาก activity/history
            จริงในช่วงวันที่ที่เลือก
          </Text>
        </View>

        {renderActivityTable(rows)}

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
