import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckIcon,
} from "@mui/icons-material";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import { tokens } from "../../../../../shared/styles/tokens";

/**
 * Compact selectable PR card (Phase 3 of CreateQuotationDialog redesign).
 *
 * Visual changes vs previous version:
 *   - Padding: p:2 → p:1.25 (~30% less vertical)
 *   - Title: subtitle1 → body1 (smaller, fewer lines)
 *   - Empty fields ("-") hidden — only shows fields with values
 *   - Selected: 2px primary border + soft primary tint (replaces opacity-only feedback)
 *   - is_quoted: more subtle (opacity 0.6 + warning chip inline) — section-level grouping
 *     handled in Phase 5
 */
const PricingRequestSelectableCard = ({ item, index, selected, onToggle }) => {
  const handleCardClick = () => {
    if (!item.is_quoted) onToggle(item.pr_id);
  };

  const fields = [
    { key: "pattern", label: "ลาย/แบบ", value: item.pr_pattern },
    { key: "fabric", label: "วัสดุ", value: item.pr_fabric_type },
    {
      key: "qty",
      label: "จำนวน",
      value: item.pr_quantity ? `${item.pr_quantity} ชิ้น` : null,
      strong: true,
    },
    {
      key: "due",
      label: "กำหนดส่ง",
      value: item.pr_due_date ? new Date(item.pr_due_date).toLocaleDateString("th-TH") : null,
    },
  ].filter((f) => f.value);

  const isDisabled = item.is_quoted;

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 0.75,
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
        opacity: isDisabled ? 0.6 : 1,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? tokens.primary : undefined,
        bgcolor: selected ? `${tokens.primary}0d` : undefined, // ~5% tint
        "&:hover": isDisabled
          ? {}
          : {
              borderColor: tokens.primary,
              bgcolor: selected ? `${tokens.primary}14` : `${tokens.primary}08`,
            },
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          {/* Selection icon */}
          <Box sx={{ color: selected ? tokens.primary : "text.disabled", display: "flex" }}>
            {selected ? <CheckCircleIcon fontSize="small" /> : <UncheckIcon fontSize="small" />}
          </Box>

          {/* Index + name */}
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              minWidth: 18,
              textAlign: "center",
            }}
          >
            {index + 1}
          </Typography>
          <Typography
            variant="body1"
            fontWeight={selected ? 700 : 600}
            color={selected ? tokens.primary : "inherit"}
            noWrap
            sx={{ flex: 1, minWidth: 0 }}
            title={item.pr_work_name}
          >
            {item.pr_work_name}
          </Typography>

          {/* Quoted chip */}
          {isDisabled && (
            <Chip label="มีใบเสนอราคาแล้ว" color="warning" size="small" sx={{ height: 22 }} />
          )}
        </Stack>

        {/* Field row — only non-empty values */}
        {fields.length > 0 && (
          <Stack
            direction="row"
            spacing={2}
            sx={{ mt: 0.75, pl: 4, flexWrap: "wrap", rowGap: 0.5 }}
          >
            {fields.map((f) => (
              <Box key={f.key} sx={{ display: "flex", gap: 0.75, alignItems: "baseline" }}>
                <Typography variant="caption" color="text.secondary">
                  {f.label}:
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={f.strong ? 700 : 500}
                  color={f.strong ? tokens.primary : "inherit"}
                >
                  {f.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingRequestSelectableCard;
