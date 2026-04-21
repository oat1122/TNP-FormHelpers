import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import ReceiptIcon from "@mui/icons-material/Receipt";
import UndoIcon from "@mui/icons-material/Undo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useCallback } from "react";

import { useQuotationCardLogic } from "./QuotationCard/hooks/useQuotationCardLogic";
import { useQuotationStatusReversal } from "./QuotationCard/hooks/useQuotationStatusReversal";
import StatusReversalDialog from "./QuotationCard/subcomponents/StatusReversalDialog";
import statusColor from "./QuotationCard/utils/statusMap";
import { useGetCompaniesQuery } from "../../../../features/Accounting/accountingApi";
import { formatUserDisplay } from "../../../../utils/formatUser";

/* ── lookup maps ── */
const statusLabelMap = {
  draft: "แบบร่าง",
  pending_review: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ถูกปฏิเสธ",
  sent: "ส่งแล้ว",
  completed: "เสร็จสิ้น",
};

const chipColorMap = {
  default: undefined,
  warning: "warning",
  success: "success",
  error: "error",
  info: "info",
};

/* ── helpers ── */
const fmt = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
});
const formatCurrency = (v) => fmt.format(Number(v || 0));

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

/* ── shared styles ── */
const headCellSx = {
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.8rem",
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
  py: 1.8,
  px: 2,
  borderBottom: "none",
  textTransform: "uppercase",
};

const bodyCellSx = {
  py: 1.6,
  px: 2,
  fontSize: "0.855rem",
  borderBottom: "1px solid",
  borderColor: "divider",
};

/* ═══════════════════════════════════════════════════
   QuotationTableRow — per-row component so hooks work
   ═══════════════════════════════════════════════════ */
function QuotationTableRow({
  q,
  idx,
  getCompanyName,
  onViewDetail,
  onDownloadPDF,
  onDuplicate,
  onCreateInvoice,
  onActionSuccess,
}) {
  const status = q?.status || "draft";
  const sColor = statusColor[status] || "default";
  const isApproved = status === "approved";

  // Reuse the same hook logic from QuotationCard
  const { canApprove, canRevokeApproval, approving, submitting, onApprove } = useQuotationCardLogic(
    q,
    onActionSuccess
  );

  const {
    isReversalDialogOpen,
    handleOpenReversalDialog,
    handleCloseReversalDialog,
    handleReverseStatus,
    isReversing,
  } = useQuotationStatusReversal(q?.id, onActionSuccess);

  return (
    <>
      <TableRow
        hover
        sx={{
          cursor: "pointer",
          bgcolor: idx % 2 === 0 ? "transparent" : "action.hover",
          "&:hover": {
            bgcolor: "primary.50",
          },
          transition: "background-color 0.15s ease",
        }}
        onClick={() => onViewDetail?.(q)}
      >
        {/* # */}
        <TableCell sx={{ ...bodyCellSx, textAlign: "center", color: "text.secondary" }}>
          {idx + 1}
        </TableCell>

        {/* เลขที่เอกสาร */}
        <TableCell sx={bodyCellSx}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              fontSize: "0.85rem",
            }}
          >
            {q?.number && !String(q.number).startsWith("DRAFT-") ? q.number : "ร่าง"}
          </Typography>
        </TableCell>

        {/* ชื่อลูกค้า */}
        <TableCell sx={bodyCellSx}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 260,
            }}
          >
            {q?.customer?.cus_company || q?.customer_name || "-"}
          </Typography>
        </TableCell>

        {/* บริษัท */}
        <TableCell sx={bodyCellSx}>
          <Chip
            label={getCompanyName(q?.company_id)}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 500,
              fontSize: "0.75rem",
              height: 24,
              borderRadius: 1,
            }}
          />
        </TableCell>

        {/* สถานะ */}
        <TableCell sx={{ ...bodyCellSx, textAlign: "center" }}>
          <Chip
            label={statusLabelMap[status] || status}
            size="small"
            color={chipColorMap[sColor] || "default"}
            variant={sColor === "default" ? "outlined" : "filled"}
            sx={{
              fontWeight: 600,
              fontSize: "0.73rem",
              height: 24,
              minWidth: 72,
            }}
          />
        </TableCell>

        {/* ยอดรวม */}
        <TableCell sx={{ ...bodyCellSx, textAlign: "right" }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              fontFamily: "'Tabular Nums', monospace",
              fontVariantNumeric: "tabular-nums",
              fontSize: "0.88rem",
            }}
          >
            {formatCurrency(q?.total_amount)}
          </Typography>
        </TableCell>

        {/* วันที่สร้าง */}
        <TableCell sx={{ ...bodyCellSx, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
            {formatDate(q?.created_at)}
          </Typography>
        </TableCell>

        {/* ผู้สร้าง */}
        <TableCell sx={bodyCellSx}>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 130,
              fontSize: "0.8rem",
            }}
          >
            {formatUserDisplay(q)}
          </Typography>
        </TableCell>

        {/* จัดการ */}
        <TableCell sx={{ ...bodyCellSx, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
          <Box sx={{ display: "inline-flex", gap: 0.25, alignItems: "center" }}>
            <Tooltip title="ดูรายละเอียด" arrow>
              <IconButton
                size="small"
                onClick={() => onViewDetail?.(q)}
                sx={{ color: "primary.main" }}
              >
                <VisibilityIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="ดาวน์โหลด PDF" arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={!isApproved}
                  onClick={() => onDownloadPDF?.(q.id)}
                  sx={{ color: isApproved ? "success.main" : undefined }}
                >
                  <DownloadIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>

            {/* อนุมัติ */}
            {canApprove && (
              <Tooltip title="อนุมัติ" arrow>
                <span>
                  <IconButton
                    size="small"
                    disabled={approving || submitting}
                    onClick={onApprove}
                    sx={{ color: "success.main" }}
                  >
                    {approving || submitting ? (
                      <CircularProgress size={16} />
                    ) : (
                      <CheckCircleIcon sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* ย้อนสถานะ */}
            {canRevokeApproval && (
              <Tooltip title="ย้อนสถานะเป็น Draft" arrow>
                <span>
                  <IconButton
                    size="small"
                    disabled={isReversing}
                    onClick={handleOpenReversalDialog}
                    sx={{ color: "warning.main" }}
                  >
                    {isReversing ? (
                      <CircularProgress size={16} />
                    ) : (
                      <UndoIcon sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {onDuplicate && (
              <Tooltip title="ทำสำเนา" arrow>
                <IconButton
                  size="small"
                  onClick={() => onDuplicate?.(q.id)}
                  sx={{ color: "secondary.main" }}
                >
                  <FileCopyIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}

            {onCreateInvoice && isApproved && q?.signature_image_url && (
              <Tooltip title="สร้างใบแจ้งหนี้" arrow>
                <IconButton
                  size="small"
                  onClick={() => onCreateInvoice?.(q)}
                  sx={{ color: "info.main" }}
                >
                  <ReceiptIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>
      </TableRow>

      {/* Dialog ยืนยันการย้อนสถานะ */}
      <StatusReversalDialog
        open={isReversalDialogOpen}
        onClose={handleCloseReversalDialog}
        onSubmit={handleReverseStatus}
        isLoading={isReversing}
      />
    </>
  );
}

/* ══════════════════════════════════════════════════
   QuotationTableView — main table component
   ══════════════════════════════════════════════════ */
export default function QuotationTableView({
  data = [],
  onViewDetail,
  onDownloadPDF,
  onDuplicate,
  onCreateInvoice,
  onActionSuccess,
}) {
  const { data: companiesResp } = useGetCompaniesQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  const companies = useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);

  const getCompanyName = useCallback(
    (companyId) => {
      const c = companies.find((c) => c.id === companyId);
      return c?.short_code || c?.name || "-";
    },
    [companies]
  );

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        overflow: "auto",
      }}
    >
      <Table sx={{ minWidth: 1000 }}>
        {/* ── Column widths ── */}
        <colgroup>
          <col style={{ width: "4%" }} /> {/* # */}
          <col style={{ width: "12%" }} /> {/* เลขที่ */}
          <col style={{ width: "20%" }} /> {/* ลูกค้า */}
          <col style={{ width: "9%" }} /> {/* บริษัท */}
          <col style={{ width: "9%" }} /> {/* สถานะ */}
          <col style={{ width: "12%" }} /> {/* ยอดรวม */}
          <col style={{ width: "9%" }} /> {/* วันที่สร้าง */}
          <col style={{ width: "10%" }} /> {/* ผู้สร้าง */}
          <col style={{ width: "15%" }} /> {/* จัดการ (wider for more buttons) */}
        </colgroup>

        <TableHead>
          <TableRow
            sx={{
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            }}
          >
            <TableCell sx={{ ...headCellSx, textAlign: "center" }}>#</TableCell>
            <TableCell sx={headCellSx}>เลขที่เอกสาร</TableCell>
            <TableCell sx={headCellSx}>ชื่อลูกค้า</TableCell>
            <TableCell sx={headCellSx}>บริษัท</TableCell>
            <TableCell sx={{ ...headCellSx, textAlign: "center" }}>สถานะ</TableCell>
            <TableCell sx={{ ...headCellSx, textAlign: "right" }}>ยอดรวม</TableCell>
            <TableCell sx={{ ...headCellSx, textAlign: "center" }}>วันที่สร้าง</TableCell>
            <TableCell sx={headCellSx}>ผู้สร้าง</TableCell>
            <TableCell sx={{ ...headCellSx, textAlign: "center" }}>จัดการ</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
                ไม่พบข้อมูล
              </TableCell>
            </TableRow>
          )}

          {data.map((q, idx) => (
            <QuotationTableRow
              key={q.id}
              q={q}
              idx={idx}
              getCompanyName={getCompanyName}
              onViewDetail={onViewDetail}
              onDownloadPDF={onDownloadPDF}
              onDuplicate={onDuplicate}
              onCreateInvoice={onCreateInvoice}
              onActionSuccess={onActionSuccess}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
