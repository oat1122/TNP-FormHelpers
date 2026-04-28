import { Box, Chip, Grid, Typography } from "@mui/material";
import React from "react";

import { resolvePRGroupFields } from "./utils/prAutofillResolver";
import { InfoCard, tokens } from "../../../shared/styles/quotationFormStyles";

export const PRGroupSummaryCard = React.memo(function PRGroupSummaryCard({
  group,
  index,
  prAutofillData,
}) {
  const { name, pattern, fabric, color, size } = resolvePRGroupFields(group, prAutofillData);
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
