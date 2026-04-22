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

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={1.25}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          การดำเนินการ
        </Typography>

        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
          {NOTEBOOK_PRIMARY_ACTIONS.map((option) => {
            const Icon = PRIMARY_ACTION_ICONS[option.quickLabel];
            const selected = value === option.value;

            return (
              <Button
                key={option.value}
                size="small"
                variant={selected ? "contained" : "outlined"}
                onClick={() => onChange(option.value)}
                disabled={readOnly}
                startIcon={Icon ? <Icon /> : null}
                sx={{
                  borderRadius: 999,
                  px: 1.75,
                  textTransform: "none",
                  boxShadow: "none",
                }}
              >
                {getQuickActionLabel(option)}
              </Button>
            );
          })}

          <Button
            size="small"
            variant={isOtherSelected ? "contained" : "outlined"}
            color={isOtherSelected ? "secondary" : "inherit"}
            onClick={() => onChange(value && isOtherSelected ? value : secondaryDefault)}
            disabled={readOnly}
            startIcon={<MdMoreHoriz />}
            sx={{
              borderRadius: 999,
              px: 1.75,
              textTransform: "none",
              boxShadow: "none",
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
      </Stack>
    </Box>
  );
};

export default NotebookQuickActions;
