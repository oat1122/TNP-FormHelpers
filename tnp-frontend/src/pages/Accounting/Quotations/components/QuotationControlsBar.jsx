import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import {
  Box,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Typography,
} from "@mui/material";

import { useCurrentUser } from "../../shared/hooks/useCurrentUser";

const MANAGEMENT_ROLES = ["admin", "account"];

const QuotationControlsBar = ({
  showOnlyMine,
  onShowOnlyMineChange,
  signatureOnly,
  onSignatureOnlyChange,
  viewMode,
  onViewModeChange,
  onOpenCompanyDialog,
  onOpenStandaloneCreate,
}) => {
  const { currentUser } = useCurrentUser();
  const canManageCompanies = MANAGEMENT_ROLES.includes(currentUser?.role);

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
      <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showOnlyMine}
              onChange={(e) => onShowOnlyMineChange(e.target.checked)}
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
              onChange={(e) => onSignatureOnlyChange(e.target.checked)}
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

      {canManageCompanies && (
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button variant="outlined" size="small" onClick={onOpenCompanyDialog} sx={{ height: 32 }}>
            จัดการบริษัท
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={onOpenStandaloneCreate}
            sx={{ height: 32 }}
          >
            + สร้างใบเสนอราคา
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default QuotationControlsBar;
