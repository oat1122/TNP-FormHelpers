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

const chunkRows = (rows = [], size = 18) => {
  if (rows.length === 0) {
    return [[]];
  }

  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
};

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

const wrapText = (value) => String(value ?? "").trim();

const renderStatusCell = (value) => {
  if (!value || value === "-") {
    return <Text style={[styles.cellText, styles.cellTextEmpty]}>-</Text>;
  }

  return (
    <View style={[styles.statusBadge, getStatusStyle(value)]}>
      <Text style={styles.statusBadgeText}>{String(value).trim()}</Text>
    </View>
  );
};

const renderCellText = (value, style = styles.cellText) => (
  <Text style={style}>{wrapText(value) || "-"}</Text>
);

const renderActivityTableHeader = () => (
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
      <Text style={styles.actionHeaderText}>การกระทำ</Text>
    </View>
    <View style={[styles.tableCell, styles.colStatus]}>
      <Text style={styles.headerText}>สถานะ</Text>
    </View>
    <View style={[styles.tableCell, styles.colRemarks]}>
      <Text style={styles.headerText}>หมายเหตุ</Text>
    </View>
  </View>
);

const renderActivityTable = (rows = []) => (
  <View style={styles.table}>
    {renderActivityTableHeader()}

    {rows.length === 0 ? (
      <View style={styles.tableRow}>
        <View style={[styles.tableCell, { width: "100%" }]}>
          <Text style={styles.cellText}>ไม่มีข้อมูล</Text>
        </View>
      </View>
    ) : (
      rows.map((row) =>
        row.rowType === "personal_activity" ? (
          <View
            key={row.id}
            style={[
              styles.tableRow,
              row.zebraIndex % 2 === 0 ? styles.rowEven : styles.rowOdd,
              styles.personalActivityRow,
            ]}
            wrap={false}
          >
            <View style={[styles.tableCell, styles.personalActivityCell]}>
              <Text style={styles.personalActivityText}>
                {row.personalText || `${row.date || row.dateGroupValue} ${row.additionalInfo || "-"}`}
              </Text>
            </View>
          </View>
        ) : (
          <View
            key={row.id}
            style={[styles.tableRow, row.zebraIndex % 2 === 0 ? styles.rowEven : styles.rowOdd]}
            wrap={false}
          >
            <View style={[styles.tableCell, styles.colDate]}>
              {renderCellText(row.date, styles.tertiaryText)}
            </View>
            <View style={[styles.tableCell, styles.colTime]}>
              {renderCellText(row.time, styles.tertiaryText)}
            </View>
            <View style={[styles.tableCell, styles.colCustomer]}>
              {renderCellText(row.customer, styles.primaryText)}
            </View>
            <View style={[styles.tableCell, styles.colAdditional]}>
              {renderCellText(row.additionalInfo, styles.secondaryText)}
            </View>
            <View style={[styles.tableCell, styles.colContact]}>
              {renderCellText(row.contactNumber, styles.tertiaryText)}
            </View>
            <View style={[styles.tableCell, styles.colEmail]}>
              {renderCellText(row.email, styles.tertiaryText)}
            </View>
            <View style={[styles.tableCell, styles.colPerson]}>
              {renderCellText(row.contactPerson, styles.tertiaryText)}
            </View>
            <View style={[styles.tableCell, styles.colAction]}>
              {renderCellText(row.action, styles.actionText)}
            </View>
            <View style={[styles.tableCell, styles.colStatus]}>{renderStatusCell(row.status)}</View>
            <View style={[styles.tableCell, styles.colRemarks]}>
              {renderCellText(row.remarks, styles.tertiaryText)}
            </View>
          </View>
        )
      )
    )}
  </View>
);

const renderLeadSummaryTableHeader = () => (
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
);

const renderLeadSummaryTable = (leadSummaryRows = []) => (
  <View style={styles.table}>
    {renderLeadSummaryTableHeader()}
    {leadSummaryRows.length === 0 ? (
      <View style={styles.tableRow}>
        <View style={[styles.tableCell, { width: "100%" }]}>
          <Text style={styles.cellText}>ไม่มี lead addition ในช่วงเวลานี้</Text>
        </View>
      </View>
    ) : (
      leadSummaryRows.map((row) => (
        <View key={row.id} style={styles.tableRow} wrap={false}>
          <View style={[styles.tableCell, sectionStyles.queueColDate]}>
            {renderCellText(row.date, styles.secondaryText)}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColCustomer]}>
            {renderCellText(row.customer, styles.primaryText)}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColPerson]}>
            {renderCellText(row.contactPerson, styles.secondaryText)}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColPhone]}>
            {renderCellText(row.contactNumber, styles.secondaryText)}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColStatus]}>
            {renderCellText(row.ownerStatus, styles.secondaryText)}
          </View>
        </View>
      ))
    )}
  </View>
);

const renderFooter = () => (
  <Text style={styles.footer} render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`} fixed />
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
  const standardActivityPages = chunkRows(rows, 18);
  const selfLeadSummaryPages = chunkRows(leadSummaryRows, 14);
  const selfActivityPages = chunkRows(rows, 18);

  if (reportMode !== "self") {
    return (
      <Document title="Notebook Report">
        {standardActivityPages.map((pageRows, pageIndex) => (
          <Page key={`notebook-report-${pageIndex}`} size="A4" orientation="landscape" style={styles.page}>
            {pageIndex === 0 ? (
              <View style={styles.header}>
                <Text style={styles.title}>รายงานสมุดจดบันทึก (Notebook Report)</Text>
                {formattedRange ? <Text style={styles.subtitle}>ช่วงเวลา: {formattedRange}</Text> : null}
                <Text style={styles.subtitle}>
                  พิมพ์เมื่อ: {printDate}
                  {userName ? ` | โดย: ${userName}` : ""}
                </Text>
              </View>
            ) : null}
            {renderActivityTable(pageRows)}
            {renderFooter()}
          </Page>
        ))}
      </Document>
    );
  }

  return (
    <Document title="Notebook Self Report">
      {selfLeadSummaryPages.map((pageRows, pageIndex) => (
        <Page
          key={`notebook-self-summary-${pageIndex}`}
          size="A4"
          orientation="landscape"
          style={styles.page}
        >
          {pageIndex === 0 ? (
            <>
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
                สรุปรายการที่เพิ่มลูกค้าเข้า Notebook queue ในช่วงวันที่ที่เลือก โดยอิงวันที่เพิ่ม lead เข้า queue
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
            </>
          ) : null}
          {renderLeadSummaryTable(pageRows)}
          {renderFooter()}
        </Page>
      ))}

      {selfActivityPages.map((pageRows, pageIndex) => (
        <Page
          key={`notebook-self-activity-${pageIndex}`}
          size="A4"
          orientation="landscape"
          style={styles.page}
        >
          {pageIndex === 0 ? (
            <View style={styles.header}>
              <Text style={sectionStyles.sectionTitle}>Daily Activity Report</Text>
              <Text style={sectionStyles.sectionSubtitle}>
                ตารางกิจกรรมประจำวันจาก activity/history รวมธุระส่วนตัวแบบบรรทัดข้อความ
              </Text>
            </View>
          ) : null}
          {renderActivityTable(pageRows)}
          {renderFooter()}
        </Page>
      ))}
    </Document>
  );
};

export default NotebookPDF;
