import { Avatar, Box, Typography } from "@mui/material";

import {
  Section,
  SectionHeader,
  tokens,
} from "../../../../PricingIntegration/components/styles/quotationFormStyles";

/**
 * Section wrapper สำหรับ DeliveryNoteCreateDialog — icon + title + subtitle + children.
 * เหมือนของ EditDialog แต่แยกไฟล์เพราะกฎ "อย่า abstract ก่อน duplicate" และ
 * 2 dialog อยู่คน sub-tree กัน — ป้องกัน coupling.
 */
const DialogSectionHeader = ({ icon: Icon, title, subtitle, children }) => (
  <Section>
    <SectionHeader>
      <Avatar
        sx={{
          bgcolor: tokens.primary,
          width: 32,
          height: 32,
          "& .MuiSvgIcon-root": { fontSize: "1rem" },
        }}
      >
        <Icon />
      </Avatar>
      <Box>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </SectionHeader>
    {children}
  </Section>
);

export default DialogSectionHeader;
