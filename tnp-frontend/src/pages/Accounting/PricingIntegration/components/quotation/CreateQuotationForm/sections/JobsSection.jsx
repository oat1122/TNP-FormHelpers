import {
  Add as AddIcon,
  Calculate as CalculateIcon,
  UnfoldLess as UnfoldLessIcon,
  UnfoldMore as UnfoldMoreIcon,
} from "@mui/icons-material";
import { Avatar, Box, Stack, Tooltip, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

import JobItemCard from "./JobItemCard";
import { tokens } from "../../../../../shared/styles/tokens";
import { Section, SectionHeader, SecondaryButton } from "../../../styles/quotationFormStyles";

/**
 * Jobs section with per-item collapse (Phase 2 of create-quotation-redesign).
 *
 * Default: only the first item starts expanded. Newly added manual jobs auto-expand.
 * Items with validation errors are force-expanded inside JobItemCard.
 */
const JobsSection = ({
  items,
  isEditing,
  validationErrors,
  jobEditor,
  financialControlsSlot,
  calculationSummarySlot,
}) => {
  const [expandedIds, setExpandedIds] = useState(() => new Set(items[0] ? [items[0].id] : []));
  const prevIdsRef = useRef(items.map((i) => i.id));

  // Auto-expand newly appended items (manual job add) so the user lands on a usable card
  useEffect(() => {
    const prev = new Set(prevIdsRef.current);
    const newIds = items.map((i) => i.id).filter((id) => !prev.has(id));
    if (newIds.length > 0) {
      setExpandedIds((curr) => {
        const next = new Set(curr);
        newIds.forEach((id) => next.add(id));
        return next;
      });
    }
    prevIdsRef.current = items.map((i) => i.id);
  }, [items]);

  const toggleExpand = useCallback((id) => {
    setExpandedIds((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allExpanded = items.length > 0 && items.every((i) => expandedIds.has(i.id));
  const handleToggleAll = useCallback(() => {
    setExpandedIds(allExpanded ? new Set() : new Set(items.map((i) => i.id)));
  }, [allExpanded, items]);

  return (
    <Section>
      <SectionHeader>
        <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
          <CalculateIcon fontSize="small" />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            การคำนวณราคา
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {items.length > 1 && (
            <Tooltip title={allExpanded ? "ย่อทั้งหมด" : "ขยายทั้งหมด"}>
              <SecondaryButton
                size="small"
                startIcon={allExpanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                onClick={handleToggleAll}
              >
                {allExpanded ? "ย่อทั้งหมด" : "ขยายทั้งหมด"}
              </SecondaryButton>
            </Tooltip>
          )}
          <SecondaryButton startIcon={<AddIcon />} onClick={jobEditor.addManualJob} size="small">
            เพิ่มงานใหม่
          </SecondaryButton>
        </Stack>
      </SectionHeader>

      <Box sx={{ p: 2 }} id="calc-section">
        {items.map((item, idx) => (
          <JobItemCard
            key={`calc-${item.id}`}
            item={item}
            index={idx}
            isEditing={isEditing}
            validationErrors={validationErrors[item.id]}
            onSetItem={jobEditor.setItem}
            onRemoveJob={jobEditor.removeJob}
            onAddSizeRow={jobEditor.addSizeRow}
            onUpdateSizeRow={jobEditor.updateSizeRow}
            onRemoveSizeRow={jobEditor.removeSizeRow}
            expanded={expandedIds.has(item.id)}
            onToggleExpand={toggleExpand}
          />
        ))}

        {financialControlsSlot}
        {calculationSummarySlot}
      </Box>
    </Section>
  );
};

export default JobsSection;
