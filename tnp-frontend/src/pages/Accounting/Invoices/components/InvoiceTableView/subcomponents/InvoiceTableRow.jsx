import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import UndoIcon from "@mui/icons-material/Undo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

import InvoiceHeaderTypeDialog from "./InvoiceHeaderTypeDialog";
import { formatUserDisplay } from "../../../../../../utils/formatUser";
import {
  formatDateTH,
  formatTHB,
} from "../../../../Quotations/components/shared/utils/quotationFormatters";
import { useInvoiceApproval } from "../../hooks/useInvoiceApproval";
import { useInvoiceStatusReversal } from "../../hooks/useInvoiceStatusReversal";
import StatusReversalDialog from "../../subcomponents/StatusReversalDialog";
import { useInvoiceTableDownloads } from "../hooks/useInvoiceTableDownloads";
import { chipColorMap, depositSideLabel, statusLabelMap } from "../utils/tableLookups";
import { bodyCellSx } from "../utils/tableStyles";

const DOWNLOAD_MENU_ITEMS = [
  { kind: "tax", mode: "before", label: "ใบกำกับภาษี (ก่อน)", icon: DescriptionIcon },
  { kind: "tax", mode: "after", label: "ใบกำกับภาษี (หลัง)", icon: DescriptionIcon },
  { kind: "taxFull", mode: "full", label: "ใบกำกับภาษี (100%)", icon: DescriptionIcon },
  { divider: true, key: "div" },
  { kind: "receipt", mode: "before", label: "ใบเสร็จ (ก่อน)", icon: ReceiptLongIcon },
  { kind: "receipt", mode: "after", label: "ใบเสร็จ (หลัง)", icon: ReceiptLongIcon },
  { kind: "receiptFull", mode: "full", label: "ใบเสร็จ (100%)", icon: ReceiptLongIcon },
];

const getDisplayNumber = (inv, mode) => {
  if (mode === "after") {
    return inv?.number_after || inv?.number || inv?.number_before || "-";
  }
  return inv?.number_before || inv?.number || inv?.number_after || "-";
};

const InvoiceTableRow = ({
  inv,
  idx,
  getCompanyName,
  onViewDetail,
  onGoToQuotation,
  onActionSuccess,
}) => {
  const approval = useInvoiceApproval(inv);
  const reversal = useInvoiceStatusReversal(inv);
  const downloads = useInvoiceTableDownloads();

  // Preview-mode picker menu (เปิดแท็บใหม่ดู PDF "ก่อน" หรือ "หลัง")
  const [previewAnchorEl, setPreviewAnchorEl] = useState(null);
  const isPreviewMenuOpen = Boolean(previewAnchorEl);

  const sideStatus = approval.getActiveSideStatus() || "draft";
  const displayNumber = getDisplayNumber(inv, approval.depositMode);
  const sideLabel = depositSideLabel[approval.depositMode] || "-";

  const canApprove = approval.canUserApprove() && approval.canApproveActiveSide();
  const beforeApproved = inv?.status_before === "approved";
  const afterApproved = inv?.status_after === "approved";
  const canPreviewAny = beforeApproved || afterApproved;
  const isApproved = sideStatus === "approved";
  const canRevert = approval.canUserApprove() && isApproved;
  const sourceQuotationId = inv?.quotation_id || inv?.quotation?.id || null;

  const handlePreviewMenuOpen = (e) => {
    e.stopPropagation();
    setPreviewAnchorEl(e.currentTarget);
  };

  const handlePreviewMenuClose = () => setPreviewAnchorEl(null);

  const handlePreviewSelect = (mode) => {
    setPreviewAnchorEl(null);
    // Reuse download flow (เปิด InvoiceHeaderTypeDialog → fetch PDF → window.open)
    // kind="invoice" = ใบแจ้งหนี้ (ใช้ InvoicePdfMasterService — หัวกระดาษ "ใบแจ้งหนี้")
    downloads.triggerDownload({ kind: "invoice", mode, invoice: inv });
  };

  const handleApproveClick = async (e) => {
    e.stopPropagation();
    try {
      await approval.handleApprove();
      onActionSuccess?.();
    } catch {
      // error already logged in hook
    }
  };

  const handleRevertClick = (e) => {
    e.stopPropagation();
    reversal.handleRevertToDraft(approval.depositMode);
  };

  const handleReversalSubmit = async (reason) => {
    await reversal.handleReasonSubmit(reason);
    onActionSuccess?.();
  };

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
        onClick={() => onViewDetail?.(inv)}
      >
        <TableCell sx={{ ...bodyCellSx, textAlign: "center", color: "text.secondary" }}>
          {idx + 1}
        </TableCell>

        <TableCell sx={bodyCellSx}>
          <Stack spacing={0.3}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: "primary.main", fontSize: "0.85rem" }}
            >
              {displayNumber}
            </Typography>
            <Chip
              label={sideLabel}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: "0.65rem", alignSelf: "flex-start" }}
            />
          </Stack>
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
            {inv?.customer?.cus_company || inv?.customer_name || "-"}
          </Typography>
        </TableCell>

        <TableCell sx={bodyCellSx}>
          <Chip
            label={getCompanyName(inv?.company_id)}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24, borderRadius: 1 }}
          />
        </TableCell>

        <TableCell sx={{ ...bodyCellSx, textAlign: "center" }}>
          <Chip
            label={statusLabelMap[sideStatus] || sideStatus}
            size="small"
            color={chipColorMap[sideStatus] || "default"}
            variant={chipColorMap[sideStatus] === "default" ? "outlined" : "filled"}
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
            {formatTHB(inv?.total_amount)}
          </Typography>
        </TableCell>

        <TableCell sx={{ ...bodyCellSx, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
            {formatDateTH(inv?.created_at)}
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
            {formatUserDisplay(inv)}
          </Typography>
        </TableCell>

        <TableCell sx={{ ...bodyCellSx, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
          <Box sx={{ display: "inline-flex", gap: 0.25, alignItems: "center" }}>
            <Tooltip title="ดูรายละเอียด" arrow>
              <IconButton
                size="small"
                onClick={() => onViewDetail?.(inv)}
                sx={{ color: "primary.main" }}
              >
                <VisibilityIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="ดู PDF (เปิดแท็บใหม่)" arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={!canPreviewAny}
                  onClick={handlePreviewMenuOpen}
                  sx={{ color: canPreviewAny ? "info.main" : undefined }}
                >
                  <OpenInNewIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="ดาวน์โหลด PDF" arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={!isApproved || downloads.downloading}
                  onClick={(e) => downloads.openMenu(e, inv)}
                  sx={{ color: isApproved ? "success.main" : undefined }}
                >
                  {downloads.downloading && downloads.activeInvoice?.id === inv.id ? (
                    <CircularProgress size={16} />
                  ) : (
                    <DownloadIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            {canApprove && (
              <Tooltip title="อนุมัติ" arrow>
                <span>
                  <IconButton
                    size="small"
                    disabled={approval.isApproving}
                    onClick={handleApproveClick}
                    sx={{ color: "success.main" }}
                  >
                    {approval.isApproving ? (
                      <CircularProgress size={16} />
                    ) : (
                      <CheckCircleIcon sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {canRevert && (
              <Tooltip title="ย้อนสถานะเป็น Draft" arrow>
                <span>
                  <IconButton
                    size="small"
                    disabled={reversal.isReverting}
                    onClick={handleRevertClick}
                    sx={{ color: "warning.main" }}
                  >
                    {reversal.isReverting ? (
                      <CircularProgress size={16} />
                    ) : (
                      <UndoIcon sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {onGoToQuotation && sourceQuotationId && (
              <Tooltip title="ไปยังใบเสนอราคาต้นทาง" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoToQuotation(inv);
                  }}
                  sx={{ color: "secondary.main" }}
                >
                  <AssignmentIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>
      </TableRow>

      <StatusReversalDialog
        open={reversal.isDialogOpen}
        onClose={reversal.handleDialogClose}
        onSubmit={handleReversalSubmit}
        pendingRevertSide={reversal.pendingRevertSide}
        isLoading={reversal.isReverting}
      />

      <Menu
        anchorEl={downloads.anchorEl}
        open={Boolean(downloads.anchorEl) && downloads.activeInvoice?.id === inv.id}
        onClose={downloads.closeMenu}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {DOWNLOAD_MENU_ITEMS.map((item) => {
          if (item.divider) return <Divider key={item.key} sx={{ my: 0.5 }} />;
          const Icon = item.icon;
          return (
            <MenuItem
              key={`${item.kind}-${item.mode}`}
              onClick={() => downloads.triggerDownload({ kind: item.kind, mode: item.mode })}
              disabled={downloads.downloading}
            >
              <ListItemIcon>
                <Icon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
                {item.label}
              </ListItemText>
            </MenuItem>
          );
        })}
      </Menu>

      <Menu
        anchorEl={previewAnchorEl}
        open={isPreviewMenuOpen}
        onClose={handlePreviewMenuClose}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => handlePreviewSelect("before")} disabled={!beforeApproved}>
          <ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>ใบมัดจำก่อน</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePreviewSelect("after")} disabled={!afterApproved}>
          <ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>ใบมัดจำหลัง</ListItemText>
        </MenuItem>
      </Menu>

      <InvoiceHeaderTypeDialog
        open={downloads.dialogOpen}
        onClose={downloads.cancelDownload}
        onConfirm={downloads.confirmDownload}
        loading={downloads.downloading}
        documentLabel={downloads.dialogDocumentLabel}
      />
    </>
  );
};

export default InvoiceTableRow;
