import DescriptionIcon from "@mui/icons-material/Description";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

const buttonSx = {
  flex: 1,
  px: 1,
  py: 0.5,
  fontSize: "0.7rem",
  fontWeight: 500,
  borderRadius: 1.5,
  minHeight: 28,
  borderColor: "grey.300",
  color: "text.primary",
  bgcolor: "white",
  "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
};

const buttonFullSx = {
  ...buttonSx,
  borderColor: "secondary.300",
  color: "secondary.main",
  "&:hover": { borderColor: "secondary.main", bgcolor: "secondary.50" },
};

const HeaderTypeMenu = ({
  anchor,
  onClose,
  modeLabel,
  headerOptions,
  selectedHeaders,
  toggleHeader,
  onConfirm,
}) => (
  <Menu
    anchorEl={anchor}
    open={Boolean(anchor)}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
  >
    <Typography sx={{ px: 2, pt: 1, fontSize: ".8rem", fontWeight: 600 }}>
      เลือกประเภทหัวกระดาษ ({modeLabel})
    </Typography>
    <Divider />
    {headerOptions.map((opt) => (
      <MenuItem key={opt} dense onClick={() => toggleHeader(opt)}>
        <Checkbox size="small" checked={selectedHeaders.includes(opt)} />
        <ListItemText primaryTypographyProps={{ fontSize: ".8rem" }} primary={opt} />
      </MenuItem>
    ))}
    <Divider />
    <MenuItem
      disabled={selectedHeaders.length === 0}
      onClick={() => onConfirm(selectedHeaders)}
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
);

const modeLabelOf = (mode) => (mode === "before" ? "มัดจำก่อน" : "มัดจำหลัง");

const InvoiceCardDownloadGrid = ({
  enabled,
  downloads,
  headerOptions,
  selectedHeaders,
  toggleHeader,
}) => {
  if (!enabled) return null;

  return (
    <>
      <Box sx={{ width: "100%", mt: 1 }}>
        <Typography variant="caption" sx={{ mb: 1, display: "block", color: "text.secondary" }}>
          ดาวน์โหลด PDF
        </Typography>

        {/* Tax Invoice row */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 1, p: 1, bgcolor: "rgba(25, 118, 210, 0.08)", borderRadius: 1.5 }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={downloads.openTaxBefore}
            startIcon={<DescriptionIcon sx={{ fontSize: "0.9rem" }} />}
            sx={buttonSx}
            aria-label="ดาวน์โหลด ใบกำกับภาษี (ก่อน)"
          >
            ใบกำกับภาษี (ก่อน)
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={downloads.openTaxAfter}
            startIcon={<DescriptionIcon sx={{ fontSize: "0.9rem" }} />}
            sx={buttonSx}
            aria-label="ดาวน์โหลด ใบกำกับภาษี (หลัง)"
          >
            ใบกำกับภาษี (หลัง)
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={downloads.openTaxFull}
            startIcon={<DescriptionIcon sx={{ fontSize: "0.9rem" }} />}
            sx={buttonFullSx}
            aria-label="ดาวน์โหลด ใบกำกับภาษี (100%)"
          >
            ใบกำกับภาษี (100%)
          </Button>
        </Stack>

        {/* Receipt row */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ p: 1, bgcolor: "rgba(76, 175, 80, 0.08)", borderRadius: 1.5 }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={downloads.openReceiptBefore}
            startIcon={<DescriptionIcon sx={{ fontSize: "0.9rem" }} />}
            sx={buttonSx}
            aria-label="ดาวน์โหลด ใบเสร็จ (ก่อน)"
          >
            ใบเสร็จ (ก่อน)
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={downloads.openReceiptAfter}
            startIcon={<DescriptionIcon sx={{ fontSize: "0.9rem" }} />}
            sx={buttonSx}
            aria-label="ดาวน์โหลด ใบเสร็จ (หลัง)"
          >
            ใบเสร็จ (หลัง)
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={downloads.openReceiptFull}
            startIcon={<DescriptionIcon sx={{ fontSize: "0.9rem" }} />}
            sx={buttonFullSx}
            aria-label="ดาวน์โหลด ใบเสร็จ (100%)"
          >
            ใบเสร็จ (100%)
          </Button>
        </Stack>
      </Box>

      <HeaderTypeMenu
        anchor={downloads.taxAnchor}
        onClose={downloads.closeTax}
        modeLabel={modeLabelOf(downloads.taxMode)}
        headerOptions={headerOptions}
        selectedHeaders={selectedHeaders}
        toggleHeader={toggleHeader}
        onConfirm={downloads.confirmTax}
      />
      <HeaderTypeMenu
        anchor={downloads.taxFullAnchor}
        onClose={downloads.closeTaxFull}
        modeLabel="100%"
        headerOptions={headerOptions}
        selectedHeaders={selectedHeaders}
        toggleHeader={toggleHeader}
        onConfirm={downloads.confirmTaxFull}
      />
      <HeaderTypeMenu
        anchor={downloads.receiptAnchor}
        onClose={downloads.closeReceipt}
        modeLabel={modeLabelOf(downloads.receiptMode)}
        headerOptions={headerOptions}
        selectedHeaders={selectedHeaders}
        toggleHeader={toggleHeader}
        onConfirm={downloads.confirmReceipt}
      />
      <HeaderTypeMenu
        anchor={downloads.receiptFullAnchor}
        onClose={downloads.closeReceiptFull}
        modeLabel="100%"
        headerOptions={headerOptions}
        selectedHeaders={selectedHeaders}
        toggleHeader={toggleHeader}
        onConfirm={downloads.confirmReceiptFull}
      />
    </>
  );
};

export default InvoiceCardDownloadGrid;
