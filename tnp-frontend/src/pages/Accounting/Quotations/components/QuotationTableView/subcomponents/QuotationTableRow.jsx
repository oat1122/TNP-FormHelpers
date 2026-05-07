import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import PostAddIcon from "@mui/icons-material/PostAdd";
import UndoIcon from "@mui/icons-material/Undo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import { formatUserDisplay } from "../../../../../../utils/formatUser";
import { useQuotationCardLogic } from "../../QuotationCard/hooks/useQuotationCardLogic";
import { useQuotationStatusReversal } from "../../QuotationCard/hooks/useQuotationStatusReversal";
import StatusReversalDialog from "../../QuotationCard/subcomponents/StatusReversalDialog";
import statusColor from "../../QuotationCard/utils/statusMap";
import { formatTHB } from "../../shared/utils/quotationFormatters";
import { formatDateTH } from "../../shared/utils/quotationFormatters";
import { chipColorMap, statusLabelMap } from "../utils/tableLookups";
import { bodyCellSx } from "../utils/tableStyles";

const QuotationTableRow = ({
  q,
  idx,
  getCompanyName,
  onViewDetail,
  onDownloadPDF,
  onDuplicate,
  onEdit,
  canEditQuotations = false,
  onGoToInvoice,
  onActionSuccess,
}) => {
  const status = q?.status || "draft";
  const sColor = statusColor[status] || "default";
  const isApproved = status === "approved";
  const hasInvoices = Number(q?.invoices_count || 0) > 0;
  const hasSignature = Array.isArray(q?.signature_images) && q.signature_images.length > 0;

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
          "&:hover": { bgcolor: "primary.50" },
          transition: "background-color 0.15s ease",
        }}
        onClick={() => onViewDetail?.(q)}
      >
        <TableCell sx={{ ...bodyCellSx, textAlign: "center", color: "text.secondary" }}>
          {idx + 1}
        </TableCell>

        <TableCell sx={bodyCellSx}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: "primary.main", fontSize: "0.85rem" }}
          >
            {q?.number && !String(q.number).startsWith("DRAFT-") ? q.number : "ร่าง"}
          </Typography>
        </TableCell>

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

        <TableCell sx={bodyCellSx}>
          <Chip
            label={getCompanyName(q?.company_id)}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24, borderRadius: 1 }}
          />
        </TableCell>

        <TableCell sx={{ ...bodyCellSx, textAlign: "center" }}>
          <Chip
            label={statusLabelMap[status] || status}
            size="small"
            color={chipColorMap[sColor] || "default"}
            variant={sColor === "default" ? "outlined" : "filled"}
            sx={{ fontWeight: 600, fontSize: "0.73rem", height: 24, minWidth: 72 }}
          />
        </TableCell>

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
            {formatTHB(q?.total_amount)}
          </Typography>
        </TableCell>

        <TableCell sx={{ ...bodyCellSx, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
            {formatDateTH(q?.created_at)}
          </Typography>
        </TableCell>

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

            {canEditQuotations && onEdit && (
              <Tooltip
                title={hasInvoices ? "ไม่สามารถแก้ไขได้ — มีใบแจ้งหนี้ที่อ้างอิงแล้ว" : "แก้ไข"}
                arrow
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={hasInvoices}
                    onClick={() => onEdit?.(q.id)}
                    sx={{ color: hasInvoices ? undefined : "warning.main" }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
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

            {onGoToInvoice && isApproved && (
              <Tooltip
                title={(() => {
                  if (hasInvoices) return "ไปยังใบแจ้งหนี้";
                  if (!hasSignature)
                    return "ต้องอัพโหลดหลักฐานการเซ็นในใบเสนอราคาก่อน — เปิดการแก้ไข แท็บ 'หลักฐาน'";
                  return "สร้างใบแจ้งหนี้";
                })()}
                arrow
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={!hasInvoices && !hasSignature}
                    onClick={() => onGoToInvoice?.(q)}
                    sx={{ color: hasInvoices ? "info.dark" : "success.main" }}
                  >
                    {hasInvoices ? (
                      <AccountBalanceIcon sx={{ fontSize: 18 }} />
                    ) : (
                      <PostAddIcon sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        </TableCell>
      </TableRow>

      <StatusReversalDialog
        open={isReversalDialogOpen}
        onClose={handleCloseReversalDialog}
        onSubmit={handleReverseStatus}
        isLoading={isReversing}
      />
    </>
  );
};

export default QuotationTableRow;
