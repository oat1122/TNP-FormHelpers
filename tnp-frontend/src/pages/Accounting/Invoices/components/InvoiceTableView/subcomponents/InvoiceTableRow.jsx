import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SyncIcon from "@mui/icons-material/Sync";
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
import { useDeliveryNotePDFDownload } from "../hooks/useDeliveryNotePDFDownload";
import { useInvoiceTableDownloads } from "../hooks/useInvoiceTableDownloads";
import { chipColorMap, statusLabelMap } from "../utils/tableLookups";
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

const formatSyncTimestamp = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
};

const EDITABLE_INVOICE_STATUSES = ["draft", "rejected", "pending_review"];

const InvoiceTableRow = ({
  inv,
  idx,
  getCompanyName,
  onViewDetail,
  onEdit,
  onGoToQuotation,
  onActionSuccess,
}) => {
  const approval = useInvoiceApproval(inv);
  const reversal = useInvoiceStatusReversal(inv);
  const downloads = useInvoiceTableDownloads();
  const dnDownloads = useDeliveryNotePDFDownload();

  // Preview-mode picker menu (เปิดแท็บใหม่ดู PDF "ก่อน" หรือ "หลัง")
  const [previewAnchorEl, setPreviewAnchorEl] = useState(null);
  const isPreviewMenuOpen = Boolean(previewAnchorEl);

  // Delivery-note picker menu (ดาวน์โหลด PDF ใบส่งของ — มี >1 ใบให้เลือก)
  const [dnAnchorEl, setDnAnchorEl] = useState(null);
  const isDnMenuOpen = Boolean(dnAnchorEl);

  const deliveryNotes = Array.isArray(inv?.delivery_notes) ? inv.delivery_notes : [];
  const hasDeliveryNote = deliveryNotes.length > 0;
  const isSingleDeliveryNote = deliveryNotes.length === 1;

  // Evidence-files presence (either side, or legacy array shape) — once any
  // evidence is uploaded the delivery-note button is unlocked even when no
  // DeliveryNote record exists, because BE can render the PDF ad-hoc from
  // invoice data.
  const evidenceFiles = inv?.evidence_files;
  const hasEvidence = (() => {
    if (!evidenceFiles) return false;
    if (Array.isArray(evidenceFiles)) return evidenceFiles.length > 0;
    if (typeof evidenceFiles === "object") {
      return Object.values(evidenceFiles).some((val) =>
        Array.isArray(val) ? val.length > 0 : Boolean(val)
      );
    }
    if (typeof evidenceFiles === "string") {
      try {
        const parsed = JSON.parse(evidenceFiles);
        if (Array.isArray(parsed)) return parsed.length > 0;
        if (parsed && typeof parsed === "object") {
          return Object.values(parsed).some((val) =>
            Array.isArray(val) ? val.length > 0 : Boolean(val)
          );
        }
      } catch {
        return evidenceFiles.length > 0;
      }
    }
    return false;
  })();

  const canDownloadDeliveryNote = hasDeliveryNote || hasEvidence;

  const handleDnButtonClick = (e) => {
    e.stopPropagation();
    if (!canDownloadDeliveryNote) return;
    // Prefer formal DN records when they exist
    if (hasDeliveryNote) {
      if (isSingleDeliveryNote) {
        dnDownloads.downloadDeliveryNote(deliveryNotes[0]);
        return;
      }
      setDnAnchorEl(e.currentTarget);
      return;
    }
    // No DN record yet but invoice has evidence → ad-hoc PDF from invoice data
    dnDownloads.downloadFromInvoice(inv);
  };

  const handleDnMenuClose = () => setDnAnchorEl(null);

  const handleDnMenuSelect = (deliveryNote) => {
    setDnAnchorEl(null);
    dnDownloads.downloadDeliveryNote(deliveryNote);
  };

  const sideStatus = approval.getActiveSideStatus() || "draft";
  const displayNumber = getDisplayNumber(inv, approval.depositMode);
  const lastSyncedLabel = formatSyncTimestamp(inv?.last_synced_at);

  const canApprove = approval.canUserApprove() && approval.canApproveActiveSide();
  const beforeApproved = inv?.status_before === "approved";
  const afterApproved = inv?.status_after === "approved";
  const canPreviewAny = beforeApproved || afterApproved;
  const isApproved = sideStatus === "approved";
  const canRevert = approval.canUserApprove() && isApproved;
  const sourceQuotationId = inv?.quotation_id || inv?.quotation?.id || null;
  const canEditInvoice =
    Boolean(onEdit) && EDITABLE_INVOICE_STATUSES.includes(String(sideStatus).toLowerCase());

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
            {lastSyncedLabel && (
              <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                <Tooltip title={`ซิงค์ข้อมูลจากใบเสนอราคาล่าสุดเมื่อ ${lastSyncedLabel}`} arrow>
                  <Chip
                    icon={<SyncIcon sx={{ fontSize: "0.8rem" }} />}
                    label="ซิงค์แล้ว"
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ height: 18, fontSize: "0.65rem" }}
                    aria-label={`ซิงค์ข้อมูลกับใบเสนอราคาล่าสุดเมื่อ ${lastSyncedLabel}`}
                  />
                </Tooltip>
              </Stack>
            )}
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

            {onEdit && (
              <Tooltip
                title={canEditInvoice ? "แก้ไข" : "ไม่สามารถแก้ไขได้ — ย้อนสถานะเป็น Draft ก่อน"}
                arrow
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={!canEditInvoice}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(inv);
                    }}
                    sx={{ color: canEditInvoice ? "warning.main" : undefined }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </span>
              </Tooltip>
            )}

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
                  disabled={!canPreviewAny || downloads.downloading}
                  onClick={(e) => downloads.openMenu(e, inv)}
                  sx={{ color: canPreviewAny ? "success.main" : undefined }}
                >
                  {downloads.downloading && downloads.activeInvoice?.id === inv.id ? (
                    <CircularProgress size={16} />
                  ) : (
                    <DownloadIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip
              title={(() => {
                if (!canDownloadDeliveryNote) return "ยังไม่มีใบส่งของ — อัปโหลดหลักฐานก่อน";
                if (hasDeliveryNote) {
                  if (isSingleDeliveryNote)
                    return `ดาวน์โหลด PDF ใบส่งของ (${deliveryNotes[0]?.number || "-"})`;
                  return `เลือกใบส่งของ (${deliveryNotes.length} ใบ)`;
                }
                return "ดาวน์โหลด PDF ใบส่งของ (สร้างจากใบแจ้งหนี้)";
              })()}
              arrow
            >
              <span>
                <IconButton
                  size="small"
                  disabled={!canDownloadDeliveryNote || dnDownloads.downloading}
                  onClick={handleDnButtonClick}
                  sx={{ color: canDownloadDeliveryNote ? "secondary.main" : undefined }}
                >
                  {dnDownloads.downloading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <LocalShippingIcon sx={{ fontSize: 18 }} />
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
        <MenuItem onClick={() => handlePreviewSelect("before")}>
          <ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>ใบมัดจำก่อน</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePreviewSelect("after")}>
          <ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>ใบมัดจำหลัง</ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={dnAnchorEl}
        open={isDnMenuOpen}
        onClose={handleDnMenuClose}
        slotProps={{ paper: { sx: { minWidth: 240 } } }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {deliveryNotes.map((dn) => {
          const isThisDownloading = dnDownloads.downloadingId === dn.id;
          return (
            <MenuItem
              key={dn.id}
              onClick={() => handleDnMenuSelect(dn)}
              disabled={isThisDownloading}
            >
              <ListItemIcon>
                {isThisDownloading ? (
                  <CircularProgress size={16} />
                ) : (
                  <LocalShippingIcon sx={{ fontSize: 18 }} />
                )}
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontSize: "0.85rem" }}
                secondaryTypographyProps={{ fontSize: "0.7rem" }}
                primary={dn.number || dn.id}
                secondary={dn.status || ""}
              />
            </MenuItem>
          );
        })}
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
