import { Add as AddIcon, Calculate as CalculateIcon } from "@mui/icons-material";
import { Avatar, Box, Typography } from "@mui/material";

import JobItemCard from "./JobItemCard";
import { tokens } from "../../../../../shared/styles/tokens";
import { Section, SectionHeader, SecondaryButton } from "../../../styles/quotationFormStyles";

const JobsSection = ({
  items,
  isEditing,
  validationErrors,
  jobEditor,
  financialControlsSlot,
  calculationSummarySlot,
}) => (
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
      <SecondaryButton startIcon={<AddIcon />} onClick={jobEditor.addManualJob} size="small">
        เพิ่มงานใหม่
      </SecondaryButton>
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
        />
      ))}

      {financialControlsSlot}
      {calculationSummarySlot}
    </Box>
  </Section>
);

export default JobsSection;
