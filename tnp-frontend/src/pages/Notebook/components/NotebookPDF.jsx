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
const TRUNCATE_LIMITS = {
  additionalInfo: 28,
  email: 24,
  remarks: 14,
};
const ACTIVITY_PAGE_HEIGHTS = {
  standardFirst: 390,
  selfFirst: 400,
  continuation: 470,
};
const LEAD_SUMMARY_PAGE_HEIGHTS = {
  first: 300,
  continuation: 470,
};
const CELL_VERTICAL_PADDING = 16;
const ROW_EXTRA_BUFFER = 4;
const STATUS_BADGE_ESTIMATED_HEIGHT = 12;
const ACTIVITY_WRAP_LIMITS = {
  customer: 18,
  additionalInfo: 18,
  contactPerson: 14,
  remarks: 10,
};
const LEAD_SUMMARY_WRAP_LIMITS = {
  customer: 18,
  contactPerson: 14,
};
const TEXT_METRICS = {
  primary: { fontSize: 9, lineHeight: 1.45 },
  secondary: { fontSize: 8, lineHeight: 1.45 },
  tertiary: { fontSize: 7, lineHeight: 1.45 },
  action: { fontSize: 6.6, lineHeight: 1.2 },
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

const splitLongTokenParts = (token, chunkSize = 12) => {
  if (!token) {
    return [];
  }

  if (token.length <= chunkSize) {
    return [token];
  }

  const chunks = [];
  for (let index = 0; index < token.length; index += chunkSize) {
    chunks.push(token.slice(index, index + chunkSize));
  }

  return chunks;
};

const splitLongToken = (token, chunkSize = 12) => splitLongTokenParts(token, chunkSize).join("\n");

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

const truncateText = (value, maxLength) => {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value).trim();
  if (!maxLength || normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
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
  const {
    chunkSize = 12,
    compactAt = 28,
    style = null,
    preserveBlank = false,
    truncateAt = null,
    noWrap = false,
  } = options;

  if (preserveBlank && (value === "" || value === null || value === undefined)) {
    return <Text style={styles.cellText}> </Text>;
  }

  if (isEmptyValue(value)) {
    return <Text style={[styles.cellText, styles.cellTextEmpty]}>{EMPTY_CELL_LABEL}</Text>;
  }

  const normalizedValue = truncateAt ? truncateText(value, truncateAt) : String(value).trim();
  const displayValue = noWrap ? normalizedValue : wrapPdfText(normalizedValue, chunkSize);
  const textStyle = getCellTextStyle(displayValue, compactAt);

  return <Text style={style ? [textStyle, style] : textStyle}>{displayValue}</Text>;
};

const renderStatusCell = (value) => {
  if (isEmptyValue(value)) {
    return <Text style={[styles.cellText, styles.cellTextEmpty]}>{EMPTY_CELL_LABEL}</Text>;
  }

  return (
    <View style={[styles.statusBadge, getStatusStyle(value)]}>
      <Text style={styles.statusBadgeText}>{String(value).trim()}</Text>
    </View>
  );
};

const estimateWrappedLineCount = (value, options = {}) => {
  const {
    charsPerLine = 12,
    truncateAt = null,
    preserveBlank = false,
    noWrap = false,
  } = options;

  if (preserveBlank && (value === "" || value === null || value === undefined)) {
    return 1;
  }

  if (isEmptyValue(value)) {
    return 1;
  }

  if (noWrap) {
    return 1;
  }

  const normalizedValue = truncateAt ? truncateText(value, truncateAt) : String(value).trim();
  const tokens = normalizedValue.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return 1;
  }

  let lineCount = 1;
  let currentLength = 0;

  tokens.forEach((token) => {
    const parts = splitLongTokenParts(token, charsPerLine);

    parts.forEach((part) => {
      const separatorLength = currentLength === 0 ? 0 : 1;
      const nextLength = currentLength + separatorLength + part.length;

      if (nextLength <= charsPerLine) {
        currentLength = nextLength;
        return;
      }

      lineCount += 1;
      currentLength = part.length;
    });
  });

  return Math.max(lineCount, 1);
};

const getEstimatedTextHeight = (lineCount, metrics) =>
  lineCount * metrics.fontSize * metrics.lineHeight;

const estimateActivityRowHeight = (row) => {
  const heights = [
    getEstimatedTextHeight(
      estimateWrappedLineCount(row.date, {
        preserveBlank: row.groupedFields?.date,
        noWrap: true,
      }),
      TEXT_METRICS.tertiary
    ),
    getEstimatedTextHeight(
      estimateWrappedLineCount(row.time, {
        preserveBlank: row.groupedFields?.time,
        noWrap: true,
      }),
      TEXT_METRICS.tertiary
    ),
    getEstimatedTextHeight(
      estimateWrappedLineCount(row.customer, {
        preserveBlank: row.groupedFields?.customer,
        charsPerLine: ACTIVITY_WRAP_LIMITS.customer,
      }),
      TEXT_METRICS.primary
    ),
    getEstimatedTextHeight(
      estimateWrappedLineCount(row.additionalInfo, {
        charsPerLine: ACTIVITY_WRAP_LIMITS.additionalInfo,
        truncateAt: TRUNCATE_LIMITS.additionalInfo,
      }),
      TEXT_METRICS.secondary
    ),
    getEstimatedTextHeight(
      estimateWrappedLineCount(row.contactNumber, {
        noWrap: true,
      }),
      TEXT_METRICS.tertiary
    ),
    getEstimatedTextHeight(
      estimateWrappedLineCount(row.email, {
        noWrap: true,
        truncateAt: TRUNCATE_LIMITS.email,
      }),
      TEXT_METRICS.tertiary
    ),
    getEstimatedTextHeight(
      estimateWrappedLineCount(row.contactPerson, {
        charsPerLine: ACTIVITY_WRAP_LIMITS.contactPerson,
      }),
      TEXT_METRICS.tertiary
    ),
    getEstimatedTextHeight(
      estimateWrappedLineCount(row.action, {
        noWrap: true,
      }),
      TEXT_METRICS.action
    ),
    STATUS_BADGE_ESTIMATED_HEIGHT,
    getEstimatedTextHeight(
      estimateWrappedLineCount(row.remarks, {
        charsPerLine: ACTIVITY_WRAP_LIMITS.remarks,
        truncateAt: TRUNCATE_LIMITS.remarks,
      }),
      TEXT_METRICS.tertiary
    ),
  ];

  return Math.max(...heights) + CELL_VERTICAL_PADDING + ROW_EXTRA_BUFFER;
};

const estimateLeadSummaryRowHeight = (row) => {
  const heights = [
    getEstimatedTextHeight(estimateWrappedLineCount(row.date, { noWrap: true }), TEXT_METRICS.secondary),
    getEstimatedTextHeight(
      estimateWrappedLineCount(row.customer, {
        charsPerLine: LEAD_SUMMARY_WRAP_LIMITS.customer,
      }),
      TEXT_METRICS.primary
    ),
    getEstimatedTextHeight(
      estimateWrappedLineCount(row.contactPerson, {
        charsPerLine: LEAD_SUMMARY_WRAP_LIMITS.contactPerson,
      }),
      TEXT_METRICS.secondary
    ),
    getEstimatedTextHeight(estimateWrappedLineCount(row.contactNumber, { noWrap: true }), TEXT_METRICS.secondary),
    getEstimatedTextHeight(estimateWrappedLineCount(row.ownerStatus, { noWrap: true }), TEXT_METRICS.secondary),
  ];

  return Math.max(...heights) + CELL_VERTICAL_PADDING + ROW_EXTRA_BUFFER;
};

const restorePageStartGrouping = (row) => {
  const shouldRestoreDate = Boolean(row.groupedFields?.date && row.pageRepeatValues?.date);
  const shouldRestoreTime = Boolean(row.groupedFields?.time && row.pageRepeatValues?.time);
  const shouldRestoreCustomer = Boolean(row.groupedFields?.customer && row.pageRepeatValues?.customer);

  if (!shouldRestoreDate && !shouldRestoreTime && !shouldRestoreCustomer) {
    return row;
  }

  return {
    ...row,
    date: shouldRestoreDate ? row.pageRepeatValues.date : row.date,
    time: shouldRestoreTime ? row.pageRepeatValues.time : row.time,
    customer: shouldRestoreCustomer ? row.pageRepeatValues.customer : row.customer,
    groupedFields: {
      ...row.groupedFields,
      date: shouldRestoreDate ? false : row.groupedFields?.date,
      time: shouldRestoreTime ? false : row.groupedFields?.time,
      customer: shouldRestoreCustomer ? false : row.groupedFields?.customer,
    },
  };
};

const paginateRows = (
  rows = [],
  { firstPageHeight, continuationPageHeight, getRowHeight, preparePageStartRow = (row) => row }
) => {
  if (rows.length === 0) {
    return [[]];
  }

  const pages = [];
  let currentPageRows = [];
  let usedHeight = 0;
  let currentPageHeightLimit = firstPageHeight;

  rows.forEach((sourceRow) => {
    const candidateRow =
      currentPageRows.length === 0 ? preparePageStartRow(sourceRow) : sourceRow;
    const candidateHeight = getRowHeight(candidateRow);

    if (currentPageRows.length > 0 && usedHeight + candidateHeight > currentPageHeightLimit) {
      pages.push(currentPageRows);
      currentPageRows = [];
      usedHeight = 0;
      currentPageHeightLimit = continuationPageHeight;
    }

    const nextRow = currentPageRows.length === 0 ? preparePageStartRow(sourceRow) : sourceRow;
    currentPageRows.push(nextRow);
    usedHeight += getRowHeight(nextRow);
  });

  if (currentPageRows.length > 0) {
    pages.push(currentPageRows);
  }

  return pages;
};

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
          {renderCellText("ไม่มีข้อมูล")}
        </View>
      </View>
    ) : (
      rows.map((row) => (
        <View
          key={row.id}
          style={[styles.tableRow, row.zebraIndex % 2 === 0 ? styles.rowEven : styles.rowOdd]}
          wrap={false}
        >
          <View style={[styles.tableCell, styles.colDate]}>
            {renderCellText(row.date, {
              noWrap: true,
              style: styles.tertiaryText,
              preserveBlank: row.groupedFields?.date,
            })}
          </View>
          <View style={[styles.tableCell, styles.colTime]}>
            {renderCellText(row.time, {
              noWrap: true,
              compactAt: 16,
              style: styles.tertiaryText,
              preserveBlank: row.groupedFields?.time,
            })}
          </View>
          <View style={[styles.tableCell, styles.colCustomer]}>
            {renderCellText(row.customer, {
              chunkSize: ACTIVITY_WRAP_LIMITS.customer,
              compactAt: 30,
              style: styles.primaryText,
              preserveBlank: row.groupedFields?.customer,
            })}
          </View>
          <View style={[styles.tableCell, styles.colAdditional]}>
            {renderCellText(row.additionalInfo, {
              chunkSize: ACTIVITY_WRAP_LIMITS.additionalInfo,
              compactAt: 24,
              style: styles.secondaryText,
              truncateAt: TRUNCATE_LIMITS.additionalInfo,
            })}
          </View>
          <View style={[styles.tableCell, styles.colContact]}>
            {renderCellText(row.contactNumber, {
              noWrap: true,
              compactAt: 20,
              style: styles.tertiaryText,
            })}
          </View>
          <View style={[styles.tableCell, styles.colEmail]}>
            {renderCellText(row.email, {
              noWrap: true,
              compactAt: 24,
              style: styles.tertiaryText,
              truncateAt: TRUNCATE_LIMITS.email,
            })}
          </View>
          <View style={[styles.tableCell, styles.colPerson]}>
            {renderCellText(row.contactPerson, {
              chunkSize: ACTIVITY_WRAP_LIMITS.contactPerson,
              compactAt: 24,
              style: styles.tertiaryText,
            })}
          </View>
          <View style={[styles.tableCell, styles.colAction]}>
            {renderCellText(row.action, {
              noWrap: true,
              compactAt: 12,
              style: styles.actionText,
            })}
          </View>
          <View style={[styles.tableCell, styles.colStatus]}>{renderStatusCell(row.status)}</View>
          <View style={[styles.tableCell, styles.colRemarks]}>
            {renderCellText(row.remarks, {
              chunkSize: ACTIVITY_WRAP_LIMITS.remarks,
              compactAt: 16,
              style: styles.tertiaryText,
              truncateAt: TRUNCATE_LIMITS.remarks,
            })}
          </View>
        </View>
      ))
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
          {renderCellText("ไม่มี lead addition ในช่วงเวลานี้")}
        </View>
      </View>
    ) : (
      leadSummaryRows.map((row) => (
        <View key={row.id} style={styles.tableRow} wrap={false}>
          <View style={[styles.tableCell, sectionStyles.queueColDate]}>
            {renderCellText(row.date, { noWrap: true, style: styles.secondaryText })}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColCustomer]}>
            {renderCellText(row.customer, {
              chunkSize: LEAD_SUMMARY_WRAP_LIMITS.customer,
              compactAt: 30,
              style: styles.primaryText,
            })}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColPerson]}>
            {renderCellText(row.contactPerson, {
              chunkSize: LEAD_SUMMARY_WRAP_LIMITS.contactPerson,
              compactAt: 24,
              style: styles.secondaryText,
            })}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColPhone]}>
            {renderCellText(row.contactNumber, {
              noWrap: true,
              compactAt: 18,
              style: styles.secondaryText,
            })}
          </View>
          <View style={[styles.tableCell, sectionStyles.queueColStatus]}>
            {renderCellText(row.ownerStatus, {
              noWrap: true,
              compactAt: 18,
              style: styles.secondaryText,
            })}
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
  const standardActivityPages = paginateRows(rows, {
    firstPageHeight: ACTIVITY_PAGE_HEIGHTS.standardFirst,
    continuationPageHeight: ACTIVITY_PAGE_HEIGHTS.continuation,
    getRowHeight: estimateActivityRowHeight,
    preparePageStartRow: restorePageStartGrouping,
  });
  const selfLeadSummaryPages = paginateRows(leadSummaryRows, {
    firstPageHeight: LEAD_SUMMARY_PAGE_HEIGHTS.first,
    continuationPageHeight: LEAD_SUMMARY_PAGE_HEIGHTS.continuation,
    getRowHeight: estimateLeadSummaryRowHeight,
  });
  const selfActivityPages = paginateRows(rows, {
    firstPageHeight: ACTIVITY_PAGE_HEIGHTS.selfFirst,
    continuationPageHeight: ACTIVITY_PAGE_HEIGHTS.continuation,
    getRowHeight: estimateActivityRowHeight,
    preparePageStartRow: restorePageStartGrouping,
  });

  if (reportMode !== "self") {
    return (
      <Document title="Notebook Report">
        {standardActivityPages.map((pageRows, pageIndex) => (
          <Page
            key={`notebook-report-${pageIndex}`}
            size="A4"
            orientation="landscape"
            style={styles.page}
          >
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
                ตารางกิจกรรมตามรูปแบบรายงานเดิม โดยอิงวันที่ทำรายการจาก activity/history จริงในช่วงวันที่ที่เลือก
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
