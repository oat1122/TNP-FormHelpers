import { Edit as EditIcon, PersonOutline as PersonIcon } from "@mui/icons-material";
import { Avatar, Box, Chip, Grid, Typography } from "@mui/material";

import {
  InfoCard,
  Section,
  SectionHeader,
  SecondaryButton,
  tokens,
} from "../../../../shared/styles/quotationFormStyles";

/**
 * Customer info section for QuotationDuplicateDialog (Tab-Phase 2 of redesign).
 *
 * Standalone customer card extracted from PRGroupsSection so it can live in
 * its own tab. Visual mirrors PRGroupsSection's customer block 1:1 — when
 * `hideCustomerCard={true}` is passed to PRGroupsSection in the items tab,
 * this component takes over the customer display in its own tab.
 *
 * Read-only display + "แก้ไขลูกค้า" button that opens the CustomerEditDialog
 * modal (handled by parent via `onEditCustomer` callback).
 */
const CustomerSection = ({ customer, canEdit, onEditCustomer }) => {
  if (!customer) return null;

  const isIndividual = customer?.customer_type === "individual";
  const displayName = isIndividual
    ? `${customer?.cus_firstname || ""} ${customer?.cus_lastname || ""}`.trim() ||
      customer?.cus_name ||
      "-"
    : customer?.cus_company || "-";

  const hasMeta =
    customer.contact_name || customer.cus_email || customer.cus_tax_id || customer.cus_address;

  return (
    <Grid item xs={12}>
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
              ตรวจสอบหรือแก้ไขข้อมูลลูกค้า
            </Typography>
          </Box>
        </SectionHeader>
        <Box sx={{ p: 2 }}>
          <InfoCard sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {isIndividual ? "ชื่อผู้ติดต่อ" : "ชื่อบริษัท"}
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {displayName}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {customer.cus_tel_1 ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={customer.cus_tel_1}
                    sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }}
                  />
                ) : null}
                {canEdit && (
                  <SecondaryButton size="small" startIcon={<EditIcon />} onClick={onEditCustomer}>
                    แก้ไขลูกค้า
                  </SecondaryButton>
                )}
              </Box>
            </Box>

            {hasMeta && (
              <Grid container spacing={1}>
                {customer.contact_name && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">
                      ผู้ติดต่อ
                    </Typography>
                    <Typography variant="body2">
                      {customer.contact_name}{" "}
                      {customer.contact_nickname ? `(${customer.contact_nickname})` : ""}
                    </Typography>
                  </Grid>
                )}
                {customer.cus_email && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">
                      อีเมล
                    </Typography>
                    <Typography variant="body2">{customer.cus_email}</Typography>
                  </Grid>
                )}
                {customer.cus_tax_id && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">
                      เลขประจำตัวผู้เสียภาษี
                    </Typography>
                    <Typography variant="body2">{customer.cus_tax_id}</Typography>
                  </Grid>
                )}
                {customer.cus_address && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      ที่อยู่
                    </Typography>
                    <Typography variant="body2">{customer.cus_address}</Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </InfoCard>
        </Box>
      </Section>
    </Grid>
  );
};

export default CustomerSection;
