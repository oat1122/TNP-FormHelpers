import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import { MdClose } from "react-icons/md";

const NotebookSummaryBar = ({ title, modeLabel, statusMeta, extraChips = [], onClose }) => (
  <Box
    sx={{
      px: { xs: 2, md: 2.5 },
      py: { xs: 1.5, md: 1.75 },
      borderRadius: 1.5,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 0.6,
            color: "text.secondary",
            fontWeight: 600,
          }}
        >
          {modeLabel}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mt: 0.25, flexWrap: "wrap", rowGap: 0.5 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              lineHeight: 1.2,
              mr: 0.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </Typography>
          {statusMeta ? (
            <Chip
              size="small"
              color={statusMeta.color || "default"}
              variant="filled"
              label={statusMeta.label}
            />
          ) : null}
          {extraChips.map((chip) => (
            <Chip
              key={`${chip.label}-${chip.color || "default"}`}
              size="small"
              color={chip.color || "default"}
              variant={chip.variant || "outlined"}
              label={chip.label}
            />
          ))}
        </Stack>
      </Box>

      <IconButton
        onClick={onClose}
        aria-label="Close notebook dialog"
        size="small"
        sx={{ border: "1px solid", borderColor: "divider" }}
      >
        <MdClose />
      </IconButton>
    </Stack>
  </Box>
);

export default NotebookSummaryBar;
