import { Avatar, Box, Typography } from "@mui/material";

import {
  Section,
  SectionHeader,
  tokens,
} from "../../../../PricingIntegration/components/styles/quotationFormStyles";

/**
 * Shell ของ section ใน DeliveryNoteEditDialog — มี icon avatar + title + subtitle
 * แล้วล้อม children. ลดการซ้ำของ <Section><SectionHeader>...</SectionHeader></Section>
 * ที่ section ต่างๆ ต้องเขียนเอง (เดิม 4 ครั้งในไฟล์เดียว).
 */
const DialogSectionHeader = ({ icon: Icon, title, subtitle, children }) => (
  <Section>
    <SectionHeader>
      <Avatar sx={{ bgcolor: tokens.primary, width: 32, height: 32 }}>
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
