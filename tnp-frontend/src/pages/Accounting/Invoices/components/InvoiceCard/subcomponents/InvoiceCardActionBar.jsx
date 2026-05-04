import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import UndoIcon from "@mui/icons-material/Undo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";

const sideLabel = (mode) => (mode === "before" ? "ก่อน" : "หลัง");
const sideLabelLong = (mode) => (mode === "before" ? "มัดจำก่อน" : "มัดจำหลัง");

const InvoiceCardActionBar = ({
  depositMode,
  canUserApprove,
  canApproveActiveSide,
  isApproving,
  activeSideStatus,
  onApprove,
  onRevertToDraft,
  isReverting,
  // PDF preview
  onPreviewPDF,
  onPreview,
  // Single download menu (pdfHook)
  onDownloadPDF,
  downloadAnchorEl,
  onDownloadClick,
  onCloseMenu,
  extendedHeaderOptions,
  selectedHeaders,
  toggleHeader,
  onConfirmDownload,
  // Right side
  onView,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 1,
    }}
  >
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      {canUserApprove && canApproveActiveSide && (
        <Tooltip title={`อนุมัติ (${sideLabel(depositMode)})`}>
          <span>
            <IconButton
              size="medium"
              color="success"
              onClick={onApprove}
              disabled={isApproving}
              aria-label={`อนุมัติใบแจ้งหนี้ฝั่ง ${sideLabelLong(depositMode)}`}
            >
              {isApproving ? <CircularProgress size={24} /> : <CheckCircleIcon />}
            </IconButton>
          </span>
        </Tooltip>
      )}

      {canUserApprove && activeSideStatus === "approved" && (
        <Tooltip title={`ย้อนสถานะเป็น Draft (${sideLabel(depositMode)})`}>
          <span>
            <IconButton
              size="medium"
              color="warning"
              onClick={onRevertToDraft}
              disabled={isReverting}
              aria-label={`ย้อนสถานะใบแจ้งหนี้ฝั่ง ${sideLabelLong(depositMode)} กลับเป็น draft`}
            >
              <UndoIcon />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {onPreviewPDF && (
        <Tooltip title={`ดูตัวอย่าง PDF (${sideLabel(depositMode)})`}>
          <IconButton
            size="medium"
            color="info"
            onClick={onPreview}
            aria-label={`ดูตัวอย่าง PDF โหมด ${sideLabelLong(depositMode)}`}
          >
            <PictureAsPdfIcon />
          </IconButton>
        </Tooltip>
      )}

      {onDownloadPDF && (
        <>
          <Tooltip title={`ดาวน์โหลด ใบแจ้งหนี้ (${sideLabel(depositMode)})`}>
            <IconButton
              size="medium"
              color="primary"
              onClick={onDownloadClick}
              aria-label={`ดาวน์โหลด ใบแจ้งหนี้ โหมด ${sideLabelLong(depositMode)}`}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={downloadAnchorEl}
            open={Boolean(downloadAnchorEl)}
            onClose={onCloseMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <Typography sx={{ px: 2, pt: 1, fontSize: ".8rem", fontWeight: 600 }}>
              เลือกประเภทหัวกระดาษ ({sideLabelLong(depositMode)})
            </Typography>
            <Divider />
            {extendedHeaderOptions.map((opt) => (
              <MenuItem key={opt} dense onClick={() => toggleHeader(opt)}>
                <Checkbox size="small" checked={selectedHeaders.includes(opt)} />
                <ListItemText primaryTypographyProps={{ fontSize: ".8rem" }} primary={opt} />
              </MenuItem>
            ))}
            <Divider />
            <MenuItem
              disabled={selectedHeaders.length === 0}
              onClick={() => onConfirmDownload(depositMode)}
              sx={{ justifyContent: "center" }}
            >
              <Typography
                color={selectedHeaders.length ? "primary.main" : "text.disabled"}
                fontSize=".8rem"
                fontWeight={600}
              >
                ดาวน์โหลด {selectedHeaders.length > 1 ? "(.zip)" : "(PDF)"}
              </Typography>
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>

    {onView && (
      <Tooltip title="ดูรายละเอียด">
        <IconButton
          size="medium"
          color="primary"
          onClick={onView}
          aria-label="ดูรายละเอียดใบแจ้งหนี้"
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
    )}
  </Box>
);

export default InvoiceCardActionBar;
