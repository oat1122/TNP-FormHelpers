// 📁shared/PRGroupSummaryCard.jsx
import { Box, Typography, Grid, Chip } from "@mui/material";
import React from "react";

const InfoCard = ({ children, sx, ...props }) => (
  <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, ...sx }} {...props}>
    {children}
  </Box>
);

const tokens = {
  primary: "#1976d2",
  border: "#e0e0e0",
};

export const PRGroupSummaryCard = React.memo(function PRGroupSummaryCard({
  group,
  index,
  prAutofillData,
}) {
  const pr = prAutofillData || {};
  const name =
    group.name && group.name !== "-" ? group.name : pr.pr_work_name || pr.work_name || "-";
  const pattern = group.pattern || pr.pr_pattern || "";
  const fabric = group.fabricType || pr.pr_fabric_type || "";
  const color = group.color || pr.pr_color || "";
  const size = group.size || pr.pr_sizes || "";
  const totalQty = (group.sizeRows || []).reduce((s, r) => s + Number(r.quantity || 0), 0);
  const unit = group.unit || "ชิ้น";

  return (
    <InfoCard sx={{ p: 2, mb: 1.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
          งานที่ {index + 1}: {name}
        </Typography>
        <Chip
          label={`${totalQty} ${unit}`}
          size="small"
          variant="outlined"
          sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }}
        />
      </Box>
      <Grid container spacing={1}>
        {pattern && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              แพทเทิร์น
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {pattern}
            </Typography>
          </Grid>
        )}
        {fabric && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              ประเภทผ้า
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {fabric}
            </Typography>
          </Grid>
        )}
        {color && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              สี
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {color}
            </Typography>
          </Grid>
        )}
        {size && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              ขนาด
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {size}
            </Typography>
          </Grid>
        )}
      </Grid>
    </InfoCard>
  );
});
