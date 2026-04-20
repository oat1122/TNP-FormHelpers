import { Business as BusinessIcon } from "@mui/icons-material";
import { Avatar, Box, Grid, Typography } from "@mui/material";

import { tokens } from "../../../../../shared/styles/tokens";
import { InfoCard } from "../../../styles/quotationFormStyles";

const CustomerInfoBanner = ({ customer }) => (
  <InfoCard sx={{ p: 2, mb: 2 }}>
    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
      <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
        <BusinessIcon fontSize="small" />
      </Avatar>
      <Box>
        <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
          ข้อมูลลูกค้า
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Customer Information
        </Typography>
      </Box>
    </Box>
    <Grid container spacing={1.5}>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" color="text.secondary">
          บริษัทลูกค้า
        </Typography>
        <Typography fontWeight={600}>{customer?.cus_company}</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" color="text.secondary">
          เลขประจำตัวผู้เสียภาษี
        </Typography>
        <Typography>{customer?.cus_tax_id}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="text.secondary">
          ที่อยู่
        </Typography>
        <Typography variant="body2">{customer?.cus_address}</Typography>
      </Grid>
    </Grid>
  </InfoCard>
);

export default CustomerInfoBanner;
