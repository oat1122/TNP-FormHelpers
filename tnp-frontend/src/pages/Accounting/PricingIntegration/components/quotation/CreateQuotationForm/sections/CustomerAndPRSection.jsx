import { Assignment as AssignmentIcon } from "@mui/icons-material";
import { Avatar, Box, Chip, Grid, Typography } from "@mui/material";

import { tokens } from "../../../../../shared/styles/tokens";
import CustomerEditCard from "../../../CustomerEditCard";
import PricingRequestNotesButton from "../../../PricingRequestNotesButton";
import { InfoCard, Section, SectionHeader } from "../../../styles/quotationFormStyles";

const PRItemCard = ({ item, index, prQty }) => {
  const rows = Array.isArray(item.sizeRows) ? item.sizeRows : [];
  const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const hasPrQty = prQty > 0;
  const qtyMatches = hasPrQty ? totalQty === prQty : true;

  return (
    <InfoCard sx={{ p: 2, mb: 1.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
            งานที่ {index + 1}: {item.name}
          </Typography>
          {item.pricingRequestId && (
            <PricingRequestNotesButton
              pricingRequestId={item.pricingRequestId}
              workName={item.name}
              variant="icon"
              size="small"
            />
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={`${totalQty} ${item.unit || "ชิ้น"}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }}
          />
          {hasPrQty && (
            <Chip
              label={`PR: ${prQty} ${item.unit || "ชิ้น"}`}
              size="small"
              color={qtyMatches ? "success" : "error"}
              variant={qtyMatches ? "outlined" : "filled"}
            />
          )}
        </Box>
      </Box>

      <Grid container spacing={1}>
        {item.pattern && <PRAttributeField label="แพทเทิร์น" value={item.pattern} />}
        {item.fabricType && <PRAttributeField label="ประเภทผ้า" value={item.fabricType} />}
        {item.color && <PRAttributeField label="สี" value={item.color} />}
        {item.size && <PRAttributeField label="ขนาด" value={item.size} />}
      </Grid>

      {item.notes && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            bgcolor: tokens.bg,
            borderRadius: 1,
            borderLeft: `3px solid ${tokens.primary}`,
          }}
        >
          <Typography variant="caption" color={tokens.primary} fontWeight={700}>
            หมายเหตุจาก PR
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.notes}
          </Typography>
        </Box>
      )}
    </InfoCard>
  );
};

const PRAttributeField = ({ label, value }) => (
  <Grid item xs={6} md={3}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500}>
      {value}
    </Typography>
  </Grid>
);

const CustomerAndPRSection = ({ customer, prItems, onCustomerUpdate, prQtyOf }) => (
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
      <CustomerEditCard customer={customer} onUpdate={onCustomerUpdate} />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
          รายละเอียดงาน ({prItems.length} จาก PR)
        </Typography>
      </Box>

      {prItems.length === 0 ? (
        <InfoCard sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            ไม่พบข้อมูลงานจาก PR
          </Typography>
        </InfoCard>
      ) : (
        prItems.map((item, idx) => (
          <PRItemCard key={item.id} item={item} index={idx} prQty={prQtyOf(item)} />
        ))
      )}
    </Box>
  </Section>
);

export default CustomerAndPRSection;
