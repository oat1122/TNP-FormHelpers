import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import { MdAssignment, MdClose, MdSupervisorAccount } from "react-icons/md";

const NotebookSummaryBar = ({
  title,
  modeLabel,
  statusMeta,
  actionLabel,
  salesOwnerLabel,
  sourceMeta,
  extraChips = [],
  onClose,
}) => (
  <Box
    sx={{
      p: { xs: 2, md: 2.5 },
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      background:
        "linear-gradient(135deg, rgba(211,47,47,0.08) 0%, rgba(255,255,255,0.96) 46%, rgba(25,118,210,0.05) 100%)",
      boxShadow: "0 14px 32px rgba(15, 23, 42, 0.08)",
    }}
  >
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ textTransform: "uppercase", letterSpacing: 1, color: "text.secondary" }}
          >
            {modeLabel}
          </Typography>
          <Typography
            variant="h5"
            sx={{ mt: 0.5, fontWeight: 700, color: "text.primary", lineHeight: 1.15 }}
          >
            {title}
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          aria-label="Close notebook dialog"
          sx={{ bgcolor: "rgba(255,255,255,0.72)", border: "1px solid", borderColor: "divider" }}
        >
          <MdClose />
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
        <Chip
          color={statusMeta?.color || "default"}
          variant={statusMeta ? "filled" : "outlined"}
          label={statusMeta?.label || "Status not set"}
        />
        <Chip
          color={actionLabel === "Next action not set" ? "default" : "primary"}
          variant={actionLabel === "Next action not set" ? "outlined" : "filled"}
          icon={<MdAssignment />}
          label={actionLabel}
        />
        <Chip
          color="default"
          variant="outlined"
          icon={<MdSupervisorAccount />}
          label={salesOwnerLabel || "Sales owner not set"}
        />
        <Chip color={sourceMeta.color} variant="outlined" label={sourceMeta.label} />
        {extraChips.map((chip) => (
          <Chip
            key={`${chip.label}-${chip.color || "default"}`}
            color={chip.color || "default"}
            variant={chip.variant || "outlined"}
            label={chip.label}
          />
        ))}
      </Stack>
    </Stack>
  </Box>
);

export default NotebookSummaryBar;
