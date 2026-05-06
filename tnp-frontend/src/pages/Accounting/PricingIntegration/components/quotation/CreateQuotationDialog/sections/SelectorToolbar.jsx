import { CheckCircleOutline as CheckCircleIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo } from "react";

import { tokens } from "../../../../../shared/styles/tokens";

/**
 * Toolbar above the PR list (Phase 4 of CreateQuotationDialog redesign).
 *
 * Provides power-user select-all + counter + clear shortcut so the user does not
 * have to click each card when bulk-creating a quotation across many PRs.
 *
 * Select-all only acts on `availableIds` (already-quoted PRs are read-only and
 * excluded). Indeterminate when a partial subset is selected.
 */
const SelectorToolbar = ({
  availableIds = [],
  selectedIds = [],
  selectedTotal = 0,
  onSelectMany,
  onClearAll,
}) => {
  const selectedAvailable = useMemo(
    () => selectedIds.filter((id) => availableIds.includes(id)),
    [selectedIds, availableIds]
  );
  const allSelected = availableIds.length > 0 && selectedAvailable.length === availableIds.length;
  const someSelected = selectedAvailable.length > 0 && !allSelected;

  const handleSelectAllToggle = () => {
    if (allSelected) onClearAll?.();
    else onSelectMany?.(availableIds);
  };

  const disabled = availableIds.length === 0;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 1,
        py: 0.5,
        mb: 1,
        borderRadius: 1,
        bgcolor: selectedAvailable.length > 0 ? `${tokens.primary}08` : "transparent",
        flexWrap: "wrap",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Tooltip
          title={
            disabled
              ? "ไม่มีงานให้เลือก"
              : allSelected
                ? "ยกเลิกการเลือกทั้งหมด"
                : "เลือกทุกงานที่ยังไม่มีใบเสนอราคา"
          }
        >
          <FormControlLabel
            sx={{ m: 0 }}
            disabled={disabled}
            control={
              <Checkbox
                size="small"
                checked={allSelected}
                indeterminate={someSelected}
                onChange={handleSelectAllToggle}
              />
            }
            label={
              <Typography variant="caption" fontWeight={600}>
                เลือกทั้งหมด
              </Typography>
            }
          />
        </Tooltip>
        <Typography variant="caption" color="text.secondary">
          {selectedAvailable.length} / {availableIds.length} งาน
          {selectedTotal > 0 && ` · รวม ${selectedTotal} ชิ้น`}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        {selectedTotal > 0 && (
          <Chip
            icon={<CheckCircleIcon />}
            label={`รวม ${selectedTotal} ชิ้น`}
            color="success"
            variant="outlined"
            size="small"
            sx={{ display: { xs: "none", sm: "inline-flex" } }}
          />
        )}
        {selectedAvailable.length > 0 && (
          <Button
            size="small"
            onClick={onClearAll}
            sx={{ textTransform: "none", minWidth: 0, px: 1 }}
          >
            ล้างการเลือก
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default SelectorToolbar;
