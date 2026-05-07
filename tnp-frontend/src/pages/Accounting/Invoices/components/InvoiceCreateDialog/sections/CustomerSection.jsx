import { PersonOutline as PersonIcon } from "@mui/icons-material";
import { Avatar, Box, Button, Grid, TextField, Typography } from "@mui/material";

import { Section, SectionHeader, tokens } from "../../../../shared/styles/quotationFormStyles";

const HEADER_TYPES = ["ต้นฉบับ", "สำเนา", "อื่นๆ"];

/**
 * Invoice-specific CustomerSection (Phase 3 of redesign).
 *
 * Differs from Quotation's CustomerSection:
 *   - Read-only customer display (no edit modal — invoice inherits from quotation)
 *   - Billing address override toggle + custom input
 *   - Document header type selector (ต้นฉบับ / สำเนา / อื่นๆ)
 *
 * Styling primitives reused from `shared/styles/quotationFormStyles`.
 */
const CustomerSection = ({
  customer,
  isEditingAddress,
  customAddress,
  onToggleEditAddress,
  onChangeAddress,
  documentHeaderType,
  customHeaderType,
  onChangeHeaderType,
  onChangeCustomHeaderType,
}) => {
  if (!customer) return null;

  return (
    <Section>
      <SectionHeader>
        <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
          <PersonIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            ข้อมูลลูกค้า
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ตรวจสอบที่อยู่และหัวกระดาษก่อนสร้างใบแจ้งหนี้
          </Typography>
        </Box>
      </SectionHeader>

      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                ชื่อลูกค้า/บริษัท
              </Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {customer?.cus_company || "-"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {customer?.cus_firstname || ""} {customer?.cus_lastname || ""}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  ที่อยู่สำหรับออกบิล
                </Typography>
                <Button
                  size="small"
                  variant={isEditingAddress ? "contained" : "outlined"}
                  onClick={() => onToggleEditAddress(!isEditingAddress)}
                  sx={{ fontSize: "0.75rem", py: 0.5, px: 1 }}
                >
                  {isEditingAddress ? "ใช้ที่อยู่เดิม" : "เปลี่ยนที่อยู่"}
                </Button>
              </Box>
              {isEditingAddress ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  value={customAddress}
                  onChange={(e) => onChangeAddress(e.target.value)}
                  placeholder="กรอกที่อยู่ใหม่สำหรับออกใบแจ้งหนี้"
                  sx={{ mt: 1 }}
                />
              ) : (
                <Typography variant="body2" fontWeight={500}>
                  {customer?.cus_address || "-"}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                เลขประจำตัวผู้เสียภาษี
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {customer?.cus_tax_id || "-"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                เบอร์โทรศัพท์
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {customer?.cus_tel_1 || "-"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                หัวกระดาษ
              </Typography>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                {HEADER_TYPES.map((type) => (
                  <Button
                    key={type}
                    size="small"
                    variant={documentHeaderType === type ? "contained" : "outlined"}
                    onClick={() => onChangeHeaderType(type)}
                    sx={{ fontSize: "0.75rem", py: 0.5, px: 1.5, minWidth: "auto" }}
                  >
                    {type}
                  </Button>
                ))}
              </Box>
              {documentHeaderType === "อื่นๆ" && (
                <TextField
                  fullWidth
                  size="small"
                  value={customHeaderType}
                  onChange={(e) => onChangeCustomHeaderType(e.target.value)}
                  placeholder="ระบุประเภทหัวกระดาษ"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Section>
  );
};

export default CustomerSection;
