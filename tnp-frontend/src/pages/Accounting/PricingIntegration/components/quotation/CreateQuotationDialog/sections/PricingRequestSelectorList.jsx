import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  TaskAlt as TaskAltIcon,
} from "@mui/icons-material";
import { Box, Chip, Collapse, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import PricingRequestSelectableCard from "./PricingRequestSelectableCard";
import SelectorToolbar from "./SelectorToolbar";
import { tokens } from "../../../../../shared/styles/tokens";

/**
 * PR list with available / quoted split (Phase 5) + select-all toolbar (Phase 4).
 *
 * Available PRs render as full selectable cards (top, primary focus).
 * Already-quoted PRs hide in a collapsible section (default closed).
 */
const PricingRequestSelectorList = ({
  list,
  isLoading,
  selectedPricingItems,
  selectedTotal,
  onToggleSelect,
  onSelectMany,
  onClearAll,
}) => {
  const [quotedOpen, setQuotedOpen] = useState(false);

  const { availablePRs, quotedPRs, availableIds } = useMemo(() => {
    const available = [];
    const quoted = [];
    (list || []).forEach((item) => {
      if (item.is_quoted) quoted.push(item);
      else available.push(item);
    });
    return {
      availablePRs: available,
      quotedPRs: quoted,
      availableIds: available.map((it) => it.pr_id),
    };
  }, [list]);

  return (
    <Box>
      <SelectorToolbar
        availableIds={availableIds}
        selectedIds={selectedPricingItems}
        selectedTotal={selectedTotal}
        onSelectMany={onSelectMany}
        onClearAll={onClearAll}
      />

      {isLoading ? (
        <Box sx={{ py: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 1.5, mb: 1 }} />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            // Phase 6: responsive height — fill desktop viewport, gentle on mobile
            maxHeight: { xs: 280, sm: 360, md: "calc(100vh - 360px)" },
            overflowY: "auto",
            pr: 1,
          }}
        >
          {availablePRs.length === 0 ? (
            <Box
              sx={{
                py: 3,
                textAlign: "center",
                color: "text.secondary",
                border: `1px dashed ${tokens.border}`,
                borderRadius: 1.5,
              }}
            >
              <Typography variant="body2">ไม่มีงานที่ยังไม่ได้สร้างใบเสนอราคา</Typography>
            </Box>
          ) : (
            availablePRs.map((item, index) => (
              <PricingRequestSelectableCard
                key={item.pr_id}
                item={item}
                index={index}
                selected={selectedPricingItems.includes(item.pr_id)}
                onToggle={onToggleSelect}
              />
            ))
          )}

          {quotedPRs.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Box
                onClick={() => setQuotedOpen((v) => !v)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.25,
                  py: 0.75,
                  cursor: "pointer",
                  borderRadius: 1,
                  "&:hover": { bgcolor: `${tokens.primary}08` },
                }}
              >
                <TaskAltIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  มีใบเสนอราคาแล้ว ({quotedPRs.length})
                </Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton size="small" sx={{ p: 0.25 }}>
                  {quotedOpen ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </IconButton>
              </Box>
              <Collapse in={quotedOpen} timeout="auto" unmountOnExit>
                <Stack spacing={0.5} sx={{ pl: 4, py: 1 }}>
                  {quotedPRs.map((item) => (
                    <Box
                      key={item.pr_id}
                      sx={{ display: "flex", alignItems: "center", gap: 1, opacity: 0.7 }}
                    >
                      <Typography variant="caption" sx={{ flex: 1 }} noWrap>
                        {item.pr_work_name}
                        {item.pr_quantity ? ` · ${item.pr_quantity} ชิ้น` : ""}
                      </Typography>
                      <Chip
                        label="quoted"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ height: 18, fontSize: "0.65rem" }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Collapse>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PricingRequestSelectorList;
