import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Calculate as CalculateIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { Avatar, Box, Chip, Grid, Typography } from "@mui/material";

import {
  InfoCard,
  Section,
  SectionHeader,
  SecondaryButton,
  tokens,
} from "../../../../shared/styles/quotationFormStyles";
import { PRGroupCalcCard } from "../../shared/PRGroupCalcCard";
import { PRGroupSummaryCard } from "../../shared/PRGroupSummaryCard";

// Renders the PR-related sections of QuotationDetailDialog:
//   1. Read-only summary card (customer brief + work title + summary list)
//   2. Editable calc card list with Edit / Add Manual toggles
// Financial controls + calculation summary are passed in via `financialControlsNode`
// so the caller can compose them inside the same calc Section (preserving original UX).
const PRGroupsSection = ({
  customer,
  workName,
  quotationNumber,
  items,
  activeGroups,
  prAutofillMap,
  isEditing,
  canEdit,
  onToggleEdit,
  onEditCustomer,
  onAddNewGroup,
  groupHandlers,
  financialControlsNode,
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Section>
          <SectionHeader>
            <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
              <AssignmentIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                ข้อมูลจาก Pricing Request
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ดึงข้อมูลอัตโนมัติจาก PR
              </Typography>
            </Box>
          </SectionHeader>
          <Box sx={{ p: 2 }}>
            <InfoCard sx={{ p: 2, mb: 1.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {customer?.customer_type === "individual" ? "ชื่อผู้ติดต่อ" : "ชื่อบริษัท"}
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {customer?.customer_type === "individual"
                      ? `${customer?.cus_firstname || ""} ${customer?.cus_lastname || ""}`.trim() ||
                        customer?.cus_name ||
                        "-"
                      : customer?.cus_company || "-"}
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
              {(customer.contact_name ||
                customer.cus_email ||
                customer.cus_tax_id ||
                customer.cus_address) && (
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

            {(workName || quotationNumber) && (
              <InfoCard sx={{ p: 2, mb: 1.5 }}>
                <Grid container spacing={1}>
                  {quotationNumber && (
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">
                        เลขที่ใบเสนอราคา
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {quotationNumber}
                      </Typography>
                    </Grid>
                  )}
                  {workName && (
                    <Grid item xs={12} md={8}>
                      <Typography variant="caption" color="text.secondary">
                        ใบงานหลัก
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {workName}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </InfoCard>
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
                รายละเอียดงาน ({items.length})
              </Typography>
            </Box>

            {items.length === 0 ? (
              <InfoCard sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  ไม่พบข้อมูลงาน
                </Typography>
              </InfoCard>
            ) : (
              items.map((item, idx) => (
                <PRGroupSummaryCard
                  key={item.id}
                  group={item}
                  index={idx}
                  prAutofillData={prAutofillMap?.get(item.prId)}
                />
              ))
            )}
          </Box>
        </Section>
      </Grid>

      <Grid item xs={12}>
        <Section>
          <SectionHeader>
            <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
              <CalculateIcon fontSize="small" />
            </Avatar>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                การคำนวณราคา
              </Typography>
              {canEdit && (
                <>
                  {onToggleEdit && (
                    <SecondaryButton size="small" startIcon={<EditIcon />} onClick={onToggleEdit}>
                      {isEditing ? "ยกเลิกแก้ไข" : "แก้ไข"}
                    </SecondaryButton>
                  )}
                  {isEditing && onAddNewGroup && (
                    <SecondaryButton size="small" startIcon={<AddIcon />} onClick={onAddNewGroup}>
                      เพิ่มงานใหม่
                    </SecondaryButton>
                  )}
                </>
              )}
            </Box>
          </SectionHeader>
          <Box sx={{ p: 2 }} id="calc-section">
            {activeGroups.map((item, idx) => (
              <PRGroupCalcCard
                key={`calc-${item.id}`}
                group={item}
                index={idx}
                isEditing={isEditing}
                prAutofillData={prAutofillMap?.get(item.prId)}
                {...groupHandlers}
              />
            ))}
            {financialControlsNode}
          </Box>
        </Section>
      </Grid>
    </>
  );
};

export default PRGroupsSection;
