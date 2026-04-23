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

// Max characters per visual line, tuned against column widths at fontSize 8pt
// in Kanit. Thai text has no spaces so @react-pdf/renderer can't break it on
// its own; we hard-wrap long runs into new lines so content stays inside the
// column without losing any data.
const COLUMN_MAX_CHARS = {
  customer: 22,
  additionalInfo: 22,
  contactPerson: 12,
  email: 18,
  remarks: 8,
  action: 20,
};

const LEAD_SUMMARY_MAX_CHARS = {
  customer: 36,
  contactPerson: 26,
  contactNumber: 20,
  ownerStatus: 24,
};

// Thai combining marks that visually attach to the previous base consonant.
// Splitting such a mark onto the next line orphans it (e.g. "ไม่" → "ไม" / "่").
// Ranges: mai han-akat, vowels above/below, tone marks, thanthakhat, etc.
const THAI_COMBINING_MARK_REGEX = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;
// Lead vowels render before their base consonant, so a line must not end with one.
const THAI_LEAD_VOWEL_REGEX = /[\u0E40-\u0E44]/;

// Use ICU's Thai word dictionary when available (Chromium/Edge 87+, Safari 14.1+
// all ship it). Falls back to whitespace splits when Intl.Segmenter is missing.
const wordSegmenter = (() => {
  try {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      return new Intl.Segmenter(["th"], { granularity: "word" });
    }
  } catch {
    /* ignore and fall through to whitespace fallback */
  }
  return null;
})();

const getSegments = (text) => {
  if (wordSegmenter) {
    return Array.from(wordSegmenter.segment(text), (entry) => entry.segment);
  }
  // Fallback: keep whitespace groups as their own segments
  return text.split(/(\s+)/).filter((part) => part !== "");
};

// Break a single "word" (segment) into chunks of up to `limit` characters
// while refusing to orphan a Thai combining mark or end a chunk with a lead
// vowel. Only used when the segment itself exceeds the per-line budget.
const splitOverlongWord = (word, limit) => {
  const chunks = [];
  let start = 0;
  while (start < word.length) {
    let end = Math.min(start + limit, word.length);
    if (end < word.length) {
      // Don't start the next chunk with a combining mark — pull it back to us.
      while (end > start + 1 && THAI_COMBINING_MARK_REGEX.test(word[end])) {
        end -= 1;
      }
      // Don't end this chunk with a lead vowel — its base consonant is next.
      while (end > start + 1 && THAI_LEAD_VOWEL_REGEX.test(word[end - 1])) {
        end -= 1;
      }
    }
    chunks.push(word.slice(start, end));
    start = end;
  }
  return chunks;
};

// Greedy wrap: fill the current visual line with segments until the next one
// would push it past `maxCharsPerLine`, then start a fresh line.
const wrapSingleLine = (line, maxCharsPerLine) => {
  if (!maxCharsPerLine || line.length <= maxCharsPerLine) {
    return line;
  }

  const segments = getSegments(line);
  const output = [];
  let current = "";

  const commit = () => {
    const trimmed = current.replace(/\s+$/u, "");
    if (trimmed !== "") {
      output.push(trimmed);
    }
    current = "";
  };

  for (const segment of segments) {
    if (segment.length > maxCharsPerLine) {
      commit();
      const pieces = splitOverlongWord(segment, maxCharsPerLine);
      for (let index = 0; index < pieces.length - 1; index += 1) {
        output.push(pieces[index]);
      }
      current = pieces[pieces.length - 1] ?? "";
    } else if (current.length + segment.length > maxCharsPerLine) {
      commit();
      // Drop leading whitespace on the new line
      current = /^\s+$/u.test(segment) ? "" : segment;
    } else {
      current += segment;
    }
  }
  commit();

  return output.length > 0 ? output.join("\n") : line;
};

const wrapLongText = (value, maxCharsPerLine) => {
  const str = wrapText(value);
  if (!str || !maxCharsPerLine) {
    return str;
  }
  return str
    .split("\n")
    .map((line) => wrapSingleLine(line, maxCharsPerLine))
    .join("\n");
};

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
  <View style={[styles.tableRow, styles.tableHeader]} fixed>
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
      rows.map((row) => {
        let rowStyle = row.zebraIndex % 2 === 0 ? styles.rowEven : styles.rowOdd;
        if (row.rowType === "recall_action") {
          rowStyle = [rowStyle, styles.recallActionRow];
        } else if (row.rowType === "personal_activity") {
          rowStyle = [rowStyle, styles.personalActivityRow];
        }

        const textColorOverride =
          row.rowType === "recall_action"
            ? styles.recallActionText
            : row.rowType === "personal_activity"
              ? styles.personalActivityText
              : null;

        const textStylePrimary = textColorOverride
          ? [styles.primaryText, textColorOverride]
          : styles.primaryText;
        const textStyleSecondary = textColorOverride
          ? [styles.secondaryText, textColorOverride]
          : styles.secondaryText;
        const textStyleTertiary = textColorOverride
          ? [styles.tertiaryText, textColorOverride]
          : styles.tertiaryText;
        const textStyleAction = textColorOverride
          ? [styles.actionText, textColorOverride]
          : styles.actionText;

        return (
          <View key={row.id} style={[styles.tableRow, rowStyle]} wrap={false}>
            <View style={[styles.tableCell, styles.colDate]}>
              {renderCellText(row.date, textStyleTertiary)}
            </View>
            <View style={[styles.tableCell, styles.colTime]}>
              {renderCellText(row.time, textStyleTertiary)}
            </View>
            <View style={[styles.tableCell, styles.colCustomer]}>
              {renderCellText(
                wrapLongText(row.customer, COLUMN_MAX_CHARS.customer),
                textStylePrimary
              )}
            </View>
            <View style={[styles.tableCell, styles.colAdditional]}>
              {renderCellText(
                wrapLongText(row.additionalInfo, COLUMN_MAX_CHARS.additionalInfo),
                textStyleSecondary
              )}
            </View>
            <View style={[styles.tableCell, styles.colContact]}>
              {renderCellText(row.contactNumber, textStyleTertiary)}
            </View>
            <View style={[styles.tableCell, styles.colEmail]}>
              {renderCellText(wrapLongText(row.email, COLUMN_MAX_CHARS.email), textStyleTertiary)}
            </View>
            <View style={[styles.tableCell, styles.colPerson]}>
              {renderCellText(
                wrapLongText(row.contactPerson, COLUMN_MAX_CHARS.contactPerson),
                textStyleTertiary
              )}
            </View>
            <View style={[styles.tableCell, styles.colAction]}>
              {renderCellText(wrapLongText(row.action, COLUMN_MAX_CHARS.action), textStyleAction)}
            </View>
            <View style={[styles.tableCell, styles.colStatus]}>{renderStatusCell(row.status)}</View>
            <View style={[styles.tableCell, styles.colRemarks]}>
              {renderCellText(
                wrapLongText(row.remarks, COLUMN_MAX_CHARS.remarks),
                textStyleTertiary
              )}
            </View>
          </View>
        );
      })
    )}
  </View>
);

const renderLeadSummaryTableHeader = () => (
  <View style={[styles.tableRow, sectionStyles.queueTableHeader]} fixed>
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
            {renderCellText(
              wrapLongText(row.customer, LEAD_SUMMARY_MAX_CHARS.customer),
              styles.primaryText
            )}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColPerson]}>
            {renderCellText(
              wrapLongText(row.contactPerson, LEAD_SUMMARY_MAX_CHARS.contactPerson),
              styles.secondaryText
            )}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColPhone]}>
            {renderCellText(
              wrapLongText(row.contactNumber, LEAD_SUMMARY_MAX_CHARS.contactNumber),
              styles.secondaryText
            )}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColStatus]}>
            {renderCellText(
              wrapLongText(row.ownerStatus, LEAD_SUMMARY_MAX_CHARS.ownerStatus),
              styles.secondaryText
            )}
          </View>
        </View>
      ))
    )}
  </View>
);

const renderFooter = () => (
  <Text
    style={styles.footer}
    render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`}
    fixed
  />
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
  const recallCount = rows.filter((r) => r.rowType === "recall_action").length;

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
          {renderFooter()}
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

        <View wrap={false}>
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
              <Text style={sectionStyles.summaryLabel}>จำนวนครั้ง Recall</Text>
              <Text style={sectionStyles.summaryValue}>{recallCount}</Text>
            </View>
            <View style={sectionStyles.summaryCard}>
              <Text style={sectionStyles.summaryLabel}>ช่วงวันที่</Text>
              <Text style={sectionStyles.summaryValue}>{formattedRange || "-"}</Text>
            </View>
          </View>
        </View>

        {renderLeadSummaryTable(leadSummaryRows)}
        {renderFooter()}
      </Page>

      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={sectionStyles.sectionTitle}>Daily Activity Report</Text>
          <Text style={sectionStyles.sectionSubtitle}>
            ตารางกิจกรรมประจำวันจาก activity/history รวมธุระส่วนตัวและ recall แบบบรรทัดข้อความ
          </Text>
        </View>
        {renderActivityTable(rows)}
        {renderFooter()}
      </Page>
    </Document>
  );
};

export default NotebookPDF;
