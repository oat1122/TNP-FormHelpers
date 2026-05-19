import { Document, Page, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import "../../../utils/pdfFontConfig";
import { buildNotebookDailySummary } from "../utils/notebookExport";
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

// Visual character budget per column for single-line truncation. Each row
// renders exactly one line; anything past the budget collapses into an
// ellipsis. Budgets are tuned conservatively against Kanit SemiBold 8pt on
// A4 landscape with the column widths defined in pdfUtils.js — they leave a
// few points of headroom so the renderer's trailing-cluster clipping bug
// doesn't bite real content (Thai combining marks count as zero width since
// they stack on top of the base consonant).
const COLUMN_MAX_CHARS = {
  customer: 22,
  additionalInfo: 22,
  contactPerson: 11,
  email: 18,
  remarks: 7,
  action: 18,
};

const LEAD_SUMMARY_MAX_CHARS = {
  customer: 34,
  contactPerson: 22,
  contactNumber: 18,
  ownerStatus: 22,
};

// Thai combining marks that visually attach to the previous base consonant.
// Splitting such a mark onto the next line orphans it (e.g. "ไม่" → "ไม" / "่").
// Ranges: mai han-akat, vowels above/below, tone marks, thanthakhat, etc.
const THAI_COMBINING_MARK_REGEX = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;
// Lead vowels render before their base consonant, so a line must not end with one.
const THAI_LEAD_VOWEL_REGEX = /[\u0E40-\u0E44]/;

// Visual length excludes Thai combining marks because they stack on top of
// the previous base consonant and add no horizontal width. Lets the wrap
// budget match what space the string actually occupies on paper.
const THAI_COMBINING_MARK_GLOBAL_REGEX = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g;
const visualLength = (text) =>
  text ? text.replace(THAI_COMBINING_MARK_GLOBAL_REGEX, "").length : 0;

// Single-line truncate. Collapses any embedded newlines into a space, then
// trims to `maxVisualChars` visual columns and appends an ellipsis if the
// original exceeded the budget. Combining marks contribute zero width so the
// budget tracks the actual horizontal length of the rendered text.
const ELLIPSIS = "...";
const ELLIPSIS_VISUAL_LENGTH = ELLIPSIS.length;
const truncateText = (value, maxVisualChars) => {
  const str = wrapText(value);
  if (!str) {
    return "";
  }
  const collapsed = str
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!maxVisualChars || visualLength(collapsed) <= maxVisualChars) {
    return collapsed;
  }

  const budget = Math.max(1, maxVisualChars - ELLIPSIS_VISUAL_LENGTH);
  let visual = 0;
  let cut = 0;
  for (const ch of collapsed) {
    const charVisual = THAI_COMBINING_MARK_REGEX.test(ch) ? 0 : 1;
    if (visual + charVisual > budget) {
      break;
    }
    visual += charVisual;
    cut += ch.length;
  }
  // Don't end the truncated string with a Thai lead vowel — its base consonant
  // would have followed, so dropping just the vowel orphans the cluster.
  while (cut > 0 && THAI_LEAD_VOWEL_REGEX.test(collapsed[cut - 1])) {
    cut -= 1;
  }
  return collapsed.slice(0, cut).trimEnd() + ELLIPSIS;
};

const renderStatusCell = (value) => {
  if (!value || value === "-") {
    return <Text style={[styles.cellText, styles.cellTextEmpty]}>-</Text>;
  }

  return (
    <View style={[styles.statusBadge, getStatusStyle(value)]}>
      <Text style={styles.statusBadgeText}>{safeThai(String(value).trim())}</Text>
    </View>
  );
};

// Single-line cell render. Appends a non-breaking space as a trailing buffer
// because @react-pdf/renderer's Thai text shaping (Kanit font, "ัด"-style
// clusters specifically) sometimes drops the final consonant of a Text node.
// The trailing nbsp absorbs that clip instead of a real consonant. Multi-line
// content is collapsed and ellipsised upstream by `truncateText`.
const TRAILING_BUFFER = " ";
// Convenience for static Thai literals rendered outside renderCellText
// (table headers, daily summary labels, status badges, page titles). Same
// fix as renderCellText — give the shaper a sacrificial trailing cluster.
const safeThai = (text) => `${text ?? ""}${TRAILING_BUFFER}`;

const renderCellText = (value, style = styles.cellText) => {
  const text = wrapText(value);
  if (!text) {
    return <Text style={style}>-</Text>;
  }
  return <Text style={style}>{text + TRAILING_BUFFER}</Text>;
};

const renderActivityTableHeader = () => (
  <View style={[styles.tableRow, styles.tableHeader]} fixed>
    <View style={[styles.tableCell, styles.colDate]}>
      <Text style={styles.headerText}>{safeThai("วันที่")}</Text>
    </View>
    <View style={[styles.tableCell, styles.colTime]}>
      <Text style={styles.headerText}>{safeThai("เวลา")}</Text>
    </View>
    <View style={[styles.tableCell, styles.colCustomer]}>
      <Text style={styles.headerText}>{safeThai("ลูกค้า / บริษัท")}</Text>
    </View>
    <View style={[styles.tableCell, styles.colAdditional]}>
      <Text style={styles.headerText}>{safeThai("เพิ่มเติม")}</Text>
    </View>
    <View style={[styles.tableCell, styles.colContact]}>
      <Text style={styles.headerText}>{safeThai("เบอร์")}</Text>
    </View>
    <View style={[styles.tableCell, styles.colEmail]}>
      <Text style={styles.headerText}>{safeThai("E-mail")}</Text>
    </View>
    <View style={[styles.tableCell, styles.colPerson]}>
      <Text style={styles.headerText}>{safeThai("ผู้ติดต่อ")}</Text>
    </View>
    <View style={[styles.tableCell, styles.colAction]}>
      <Text style={styles.actionHeaderText}>{safeThai("การกระทำ")}</Text>
    </View>
    <View style={[styles.tableCell, styles.colStatus]}>
      <Text style={styles.headerText}>{safeThai("สถานะ")}</Text>
    </View>
    <View style={[styles.tableCell, styles.colRemarks]}>
      <Text style={styles.headerText}>{safeThai("หมายเหตุ")}</Text>
    </View>
  </View>
);

const renderDailySummaryRow = (dateLabel, summary) => (
  <View key={`summary-${dateLabel}`} style={styles.dailySummaryRow} wrap={false}>
    <Text style={styles.dailySummaryDate}>{safeThai(`วันที่ ${dateLabel}`)}</Text>
    <Text style={styles.dailySummaryItem}>{safeThai(`โทรออก: ${summary.called}`)}</Text>
    <Text style={styles.dailySummaryItem}>{safeThai(`รีคอล: ${summary.recall}`)}</Text>
    <Text style={styles.dailySummaryItem}>{safeThai(`เป็นลูกค้า: ${summary.converted}`)}</Text>
    <Text style={styles.dailySummaryTotal}>{safeThai(`ทั้งหมด ${summary.total} ราย`)}</Text>
  </View>
);

const renderActivityTable = (rows = []) => {
  const dailySummary = buildNotebookDailySummary(rows);
  const renderedSummaryKeys = new Set();

  return (
    <View style={styles.table}>
      {renderActivityTableHeader()}

      {rows.length === 0 ? (
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { width: "100%" }]}>
            <Text style={styles.cellText}>{safeThai("ไม่มีข้อมูล")}</Text>
          </View>
        </View>
      ) : (
        rows.flatMap((row) => {
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

          // Insert daily summary header above the first non-personal row of each date group.
          // Personal activities don't contribute to the summary and we skip them for the trigger
          // so the summary always sits next to the call/recall/converted rows it describes.
          const dateKey = row.dateGroupValue || row.date;
          const isSummaryEligible = row.rowType !== "personal_activity";
          const shouldRenderSummary =
            isSummaryEligible &&
            dateKey &&
            !renderedSummaryKeys.has(dateKey) &&
            dailySummary.has(dateKey);

          if (shouldRenderSummary) {
            renderedSummaryKeys.add(dateKey);
          }

          const summaryRow = shouldRenderSummary
            ? renderDailySummaryRow(dateKey, dailySummary.get(dateKey))
            : null;

          const dataRow = (
            <View key={row.id} style={[styles.tableRow, rowStyle]} wrap={false}>
              <View style={[styles.tableCell, styles.colDate]}>
                {renderCellText(row.date, textStyleTertiary)}
              </View>
              <View style={[styles.tableCell, styles.colTime]}>
                {renderCellText(row.time, textStyleTertiary)}
              </View>
              <View style={[styles.tableCell, styles.colCustomer]}>
                {renderCellText(
                  truncateText(row.customer, COLUMN_MAX_CHARS.customer),
                  textStylePrimary
                )}
              </View>
              <View style={[styles.tableCell, styles.colAdditional]}>
                {renderCellText(
                  truncateText(row.additionalInfo, COLUMN_MAX_CHARS.additionalInfo),
                  textStyleSecondary
                )}
              </View>
              <View style={[styles.tableCell, styles.colContact]}>
                {renderCellText(row.contactNumber, textStyleTertiary)}
              </View>
              <View style={[styles.tableCell, styles.colEmail]}>
                {renderCellText(truncateText(row.email, COLUMN_MAX_CHARS.email), textStyleTertiary)}
              </View>
              <View style={[styles.tableCell, styles.colPerson]}>
                {renderCellText(
                  truncateText(row.contactPerson, COLUMN_MAX_CHARS.contactPerson),
                  textStyleTertiary
                )}
              </View>
              <View style={[styles.tableCell, styles.colAction]}>
                {renderCellText(truncateText(row.action, COLUMN_MAX_CHARS.action), textStyleAction)}
              </View>
              <View style={[styles.tableCell, styles.colStatus]}>
                {renderStatusCell(row.status)}
              </View>
              <View style={[styles.tableCell, styles.colRemarks]}>
                {renderCellText(
                  truncateText(row.remarks, COLUMN_MAX_CHARS.remarks),
                  textStyleTertiary
                )}
              </View>
            </View>
          );

          return summaryRow ? [summaryRow, dataRow] : [dataRow];
        })
      )}
    </View>
  );
};

const renderLeadSummaryTableHeader = () => (
  <View style={[styles.tableRow, sectionStyles.queueTableHeader]} fixed>
    <View style={[styles.tableCell, sectionStyles.queueColDate]}>
      <Text style={styles.headerText}>{safeThai("วันที่เพิ่มเข้า queue")}</Text>
    </View>
    <View style={[styles.tableCell, sectionStyles.queueColCustomer]}>
      <Text style={styles.headerText}>{safeThai("ลูกค้า")}</Text>
    </View>
    <View style={[styles.tableCell, sectionStyles.queueColPerson]}>
      <Text style={styles.headerText}>{safeThai("ผู้ติดต่อ")}</Text>
    </View>
    <View style={[styles.tableCell, sectionStyles.queueColPhone]}>
      <Text style={styles.headerText}>{safeThai("เบอร์โทร")}</Text>
    </View>
    <View style={[styles.tableCell, sectionStyles.queueColStatus]}>
      <Text style={styles.headerText}>{safeThai("สถานะ")}</Text>
    </View>
  </View>
);

const renderLeadSummaryTable = (leadSummaryRows = []) => (
  <View style={styles.table}>
    {renderLeadSummaryTableHeader()}
    {leadSummaryRows.length === 0 ? (
      <View style={styles.tableRow}>
        <View style={[styles.tableCell, { width: "100%" }]}>
          <Text style={styles.cellText}>{safeThai("ไม่มี lead addition ในช่วงเวลานี้")}</Text>
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
              truncateText(row.customer, LEAD_SUMMARY_MAX_CHARS.customer),
              styles.primaryText
            )}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColPerson]}>
            {renderCellText(
              truncateText(row.contactPerson, LEAD_SUMMARY_MAX_CHARS.contactPerson),
              styles.secondaryText
            )}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColPhone]}>
            {renderCellText(
              truncateText(row.contactNumber, LEAD_SUMMARY_MAX_CHARS.contactNumber),
              styles.secondaryText
            )}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColStatus]}>
            {renderCellText(
              truncateText(row.ownerStatus, LEAD_SUMMARY_MAX_CHARS.ownerStatus),
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
    render={({ pageNumber, totalPages }) => safeThai(`หน้า ${pageNumber} / ${totalPages}`)}
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
            <Text style={styles.title}>{safeThai("รายงานสมุดจดบันทึก (Notebook Report)")}</Text>
            {formattedRange ? (
              <Text style={styles.subtitle}>{safeThai(`ช่วงเวลา: ${formattedRange}`)}</Text>
            ) : null}
            <Text style={styles.subtitle}>
              {safeThai(`พิมพ์เมื่อ: ${printDate}${userName ? ` | โดย: ${userName}` : ""}`)}
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
          {formattedRange ? (
            <Text style={styles.subtitle}>{safeThai(`ช่วงเวลา: ${formattedRange}`)}</Text>
          ) : null}
          <Text style={styles.subtitle}>
            {safeThai(`พิมพ์เมื่อ: ${printDate}${userName ? ` | โดย: ${userName}` : ""}`)}
          </Text>
        </View>

        <View wrap={false}>
          <Text style={sectionStyles.sectionTitle}>Lead Intake Summary</Text>
          <Text style={sectionStyles.sectionSubtitle}>
            {safeThai(
              "สรุปรายการที่เพิ่มลูกค้าเข้า Notebook queue ในช่วงวันที่ที่เลือก โดยอิงวันที่เพิ่ม lead เข้า queue"
            )}
          </Text>

          <View style={sectionStyles.summaryCardRow}>
            <View style={sectionStyles.summaryCard}>
              <Text style={sectionStyles.summaryLabel}>{safeThai("ผู้ส่งออก")}</Text>
              <Text style={sectionStyles.summaryValue}>{userName || "-"}</Text>
            </View>
            <View style={sectionStyles.summaryCard}>
              <Text style={sectionStyles.summaryLabel}>{safeThai("จำนวน lead additions")}</Text>
              <Text style={sectionStyles.summaryValue}>{leadSummaryRows.length}</Text>
            </View>
            <View style={sectionStyles.summaryCard}>
              <Text style={sectionStyles.summaryLabel}>{safeThai("จำนวนครั้ง Recall")}</Text>
              <Text style={sectionStyles.summaryValue}>{recallCount}</Text>
            </View>
            <View style={sectionStyles.summaryCard}>
              <Text style={sectionStyles.summaryLabel}>{safeThai("ช่วงวันที่")}</Text>
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
            {safeThai(
              "ตารางกิจกรรมประจำวันจาก activity/history รวมธุระส่วนตัวและ recall แบบบรรทัดข้อความ"
            )}
          </Text>
        </View>
        {renderActivityTable(rows)}
        {renderFooter()}
      </Page>
    </Document>
  );
};

export default NotebookPDF;
