import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

const PRESETS = ["ต้นฉบับ", "สำเนา"];
const CUSTOM = "__custom__";

/**
 * Picker dialog ก่อนดาวน์โหลด PDF จาก Invoice table view
 * - 2 preset: "ต้นฉบับ" / "สำเนา"
 * - "อื่นๆ" → custom text input (เช่น "สำเนา-ลูกค้า")
 *
 * Single download (ไม่ส่ง zip) — ส่ง `document_header_type` เดี่ยวให้ BE
 * (ดู useInvoiceTableDownloads.confirmDownload)
 */
const InvoiceHeaderTypeDialog = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  documentLabel = "PDF",
}) => {
  const [selection, setSelection] = useState(PRESETS[0]);
  const [customText, setCustomText] = useState("");

  // Reset เมื่อ dialog เปิดใหม่
  useEffect(() => {
    if (open) {
      setSelection(PRESETS[0]);
      setCustomText("");
    }
  }, [open]);

  const isCustom = selection === CUSTOM;
  const customTrimmed = customText.trim();
  const canSubmit = !loading && (isCustom ? customTrimmed.length > 0 : true);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const headerType = isCustom ? customTrimmed : selection;
    onConfirm(headerType);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="invoice-header-type-dialog-title"
    >
      <DialogTitle id="invoice-header-type-dialog-title" sx={{ pr: 6 }}>
        เลือกหัวกระดาษ
        <IconButton
          aria-label="ปิด"
          onClick={onClose}
          disabled={loading}
          sx={{ position: "absolute", right: 8, top: 8, color: "grey.500" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          เลือกประเภทหัวกระดาษก่อนดาวน์โหลด {documentLabel}
        </Typography>

        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            name="invoice-header-type"
          >
            {PRESETS.map((preset) => (
              <FormControlLabel
                key={preset}
                value={preset}
                control={<Radio />}
                label={preset}
                disabled={loading}
              />
            ))}
            <FormControlLabel
              value={CUSTOM}
              control={<Radio />}
              label="อื่นๆ (กรอกเอง)"
              disabled={loading}
            />
          </RadioGroup>
        </FormControl>

        {isCustom && (
          <Box sx={{ mt: 1, pl: 4 }}>
            <TextField
              autoFocus
              fullWidth
              size="small"
              placeholder="เช่น สำเนา-ลูกค้า"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              disabled={loading}
              inputProps={{ maxLength: 50 }}
              helperText={
                customTrimmed.length === 0
                  ? "กรุณาระบุชื่อหัวกระดาษ"
                  : `${customTrimmed.length}/50 ตัวอักษร`
              }
              error={customText !== "" && customTrimmed.length === 0}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? "กำลังสร้าง PDF..." : "ดาวน์โหลด"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceHeaderTypeDialog;
