import { Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { MdAlternateEmail, MdMoreHoriz, MdPhoneInTalk, MdToday } from "react-icons/md";

import {
  NOTEBOOK_ACTION_OPTIONS,
  NOTEBOOK_PRIMARY_ACTIONS,
  getNotebookActionOption,
} from "../utils/notebookDialogConfig";

const PRIMARY_ACTION_ICONS = {
  Call: MdPhoneInTalk,
  Email: MdAlternateEmail,
  Meeting: MdToday,
};

const PRIMARY_ACTION_LABELS = {
  Call: "โทร",
  Email: "อีเมล",
  Meeting: "เข้าพบ",
};

const secondaryDefault =
  NOTEBOOK_ACTION_OPTIONS.find((option) => option.kind === "secondary")?.value || "";

const getQuickActionLabel = (option) =>
  PRIMARY_ACTION_LABELS[option?.quickLabel] || option?.label || "";

const NotebookQuickActions = ({ value, onChange, readOnly = false }) => {
  const currentOption = getNotebookActionOption(value);
  const isOtherSelected = Boolean(currentOption && currentOption.kind !== "primary");
  const currentSelectionLabel = currentOption
    ? currentOption.kind === "primary"
      ? getQuickActionLabel(currentOption)
      : currentOption.label
    : "ยังไม่ได้ระบุการดำเนินการ";

  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.25 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            การติดตามครั้งถัดไป
          </Typography>
          <Typography variant="body2" color="text.secondary">
            เลือกวิธีติดตามก่อน แล้วค่อยบันทึกรายละเอียดขณะที่ข้อมูลยังสดใหม่
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
          {NOTEBOOK_PRIMARY_ACTIONS.map((option) => {
            const Icon = PRIMARY_ACTION_ICONS[option.quickLabel];
            const selected = value === option.value;

            return (
              <Button
                key={option.value}
                variant={selected ? "contained" : "outlined"}
                onClick={() => onChange(option.value)}
                disabled={readOnly}
                startIcon={Icon ? <Icon /> : null}
                sx={{
                  borderRadius: 999,
                  px: 2,
                  justifyContent: "flex-start",
                  textTransform: "none",
                  minHeight: 44,
                  boxShadow: selected ? 2 : 0,
                }}
              >
                {getQuickActionLabel(option)}
              </Button>
            );
          })}

          <Button
            variant={isOtherSelected ? "contained" : "outlined"}
            color={isOtherSelected ? "secondary" : "inherit"}
            onClick={() => onChange(value && isOtherSelected ? value : secondaryDefault)}
            disabled={readOnly}
            startIcon={<MdMoreHoriz />}
            sx={{
              borderRadius: 999,
              px: 2,
              justifyContent: "flex-start",
              textTransform: "none",
              minHeight: 44,
            }}
          >
            อื่น ๆ
          </Button>
        </Stack>

        {isOtherSelected && (
          <TextField
            select
            size="small"
            label="การดำเนินการอื่น"
            value={value || secondaryDefault}
            onChange={(event) => onChange(event.target.value)}
            disabled={readOnly}
            sx={{ maxWidth: { xs: "100%", sm: 320 } }}
          >
            {NOTEBOOK_ACTION_OPTIONS.filter((option) => option.kind !== "primary").map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}

        <Typography variant="caption" color="text.secondary">
          รายการที่เลือก: {currentSelectionLabel}
        </Typography>
      </Stack>
    </Box>
  );
};

export default NotebookQuickActions;
