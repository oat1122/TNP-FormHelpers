import AddIcon from "@mui/icons-material/Add";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";

const InvoicesControlsBar = ({
  viewMode,
  onViewModeChange,
  showOnlyMine = false,
  onShowOnlyMineChange,
  signatureOnly = false,
  onSignatureOnlyChange,
  canManageInvoices,
  onOpenCompanyDialog,
  onCreateInvoice,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 2,
        p: 1.5,
        bgcolor: "background.paper",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h6" fontWeight={600} sx={{ fontSize: "1rem" }}>
          รายการใบแจ้งหนี้
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={showOnlyMine}
              onChange={(e) => onShowOnlyMineChange?.(e.target.checked)}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              แสดงเฉพาะฉัน
            </Typography>
          }
          sx={{ m: 0 }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={signatureOnly}
              onChange={(e) => onSignatureOnlyChange?.(e.target.checked)}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              แสดงเฉพาะใบที่มีหลักฐานการเซ็น
            </Typography>
          }
          sx={{ m: 0 }}
        />

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, v) => v && onViewModeChange(v)}
          size="small"
          sx={{ height: 32 }}
        >
          <ToggleButton value="table" sx={{ px: 1.5 }}>
            <Tooltip title="มุมมองตาราง">
              <ViewListIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="card" sx={{ px: 1.5 }}>
            <Tooltip title="มุมมองการ์ด">
              <ViewModuleIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {canManageInvoices && (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button variant="outlined" size="small" onClick={onOpenCompanyDialog} sx={{ height: 32 }}>
            จัดการบริษัท
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={onCreateInvoice}
            sx={{ height: 32 }}
          >
            สร้างใบแจ้งหนี้
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default InvoicesControlsBar;
