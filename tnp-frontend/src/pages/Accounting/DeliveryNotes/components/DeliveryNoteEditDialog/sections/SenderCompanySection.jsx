import { Business as BusinessIcon } from "@mui/icons-material";
import { Box, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";

import { tokens } from "../../../../PricingIntegration/components/styles/quotationFormStyles";
import DialogSectionHeader from "../subcomponents/DialogSectionHeader";

/**
 * Section เลือกบริษัทผู้ส่ง + แสดงรายละเอียดของ company ที่เลือก.
 * เดิม inline ใน DeliveryNoteEditDialog.jsx.
 */
const SenderCompanySection = ({
  formState,
  onFieldChange,
  companies,
  companiesLoading,
  canEdit,
}) => {
  const selectedCompany = companies.find((c) => c.id === formState.sender_company_id);

  return (
    <DialogSectionHeader
      icon={BusinessIcon}
      title="ข้อมูลบริษัทและผู้ส่ง"
      subtitle="ข้อมูลบริษัทผู้ส่งและการจัดการ"
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, pb: 2, borderBottom: `1px solid ${tokens.border}` }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            ข้อมูลผู้ส่ง
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="บริษัทผู้ส่ง"
                value={formState.sender_company_id}
                onChange={onFieldChange("sender_company_id")}
                fullWidth
                size="small"
                disabled={companiesLoading || !canEdit}
                helperText="เลือกบริษัทที่ทำการส่งของ"
              >
                <MenuItem value="">
                  <em>- ไม่ระบุ -</em>
                </MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {company.short_code || company.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {company.name}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {selectedCompany && (
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedCompany.legal_name || selectedCompany.name}
                    </Typography>
                    {selectedCompany.tax_id && (
                      <Typography variant="caption" color="text.secondary">
                        เลขประจำตัวผู้เสียภาษี: {selectedCompany.tax_id}
                      </Typography>
                    )}
                    {selectedCompany.address && (
                      <Typography variant="caption" color="text.secondary">
                        {selectedCompany.address}
                      </Typography>
                    )}
                    {selectedCompany.phone && (
                      <Typography variant="caption" color="text.secondary">
                        โทร: {selectedCompany.phone}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
    </DialogSectionHeader>
  );
};

export default SenderCompanySection;
