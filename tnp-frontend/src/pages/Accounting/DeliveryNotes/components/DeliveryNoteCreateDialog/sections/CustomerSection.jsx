import { Business as BusinessIcon } from "@mui/icons-material";
import {
  Box,
  Chip,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";

import { InfoCard } from "../../../../PricingIntegration/components/styles/quotationFormStyles";
import DialogSectionHeader from "../subcomponents/DialogSectionHeader";

/**
 * Section ข้อมูลลูกค้า — radio "แหล่งข้อมูล" + กล่องสรุป + กลุ่ม TextField
 * (โหมด "delivery" เท่านั้น).
 * เดิม inline ~170 บรรทัดใน DeliveryNoteCreateDialog.jsx.
 */
const CustomerSection = ({
  customerDataSource,
  onCustomerDataSourceChange,
  customer,
  formState,
  onFieldChange,
}) => {
  const displayCompany =
    customerDataSource === "master"
      ? customer.cus_company || formState.customer_company || "-"
      : formState.customer_company || "-";
  const displayTaxId =
    customerDataSource === "master" ? customer.cus_tax_id : formState.customer_tax_id;
  const displayPhone =
    customerDataSource === "master" ? customer.cus_tel_1 || "-" : formState.customer_tel_1 || "-";
  const displayAddress =
    customerDataSource === "master"
      ? customer.cus_address || "-"
      : formState.customer_address || "-";

  return (
    <DialogSectionHeader
      icon={BusinessIcon}
      title="ข้อมูลลูกค้า"
      subtitle="ข้อมูลผู้ติดต่อและบริษัท"
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            เลือกแหล่งข้อมูลลูกค้า
          </Typography>
          <RadioGroup value={customerDataSource} onChange={onCustomerDataSourceChange} row>
            <FormControlLabel
              value="master"
              control={<Radio />}
              label="ใช้ข้อมูลจากฐานข้อมูลลูกค้า (master_customers)"
            />
            <FormControlLabel
              value="delivery"
              control={<Radio />}
              label="แก้ไขข้อมูลเฉพาะใบส่งของนี้"
            />
          </RadioGroup>
          {customerDataSource === "master" && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              ข้อมูลจะถูกดึงมาจากฐานข้อมูลลูกค้าหลัก
            </Typography>
          )}
          {customerDataSource === "delivery" && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              ข้อมูลจะถูกบันทึกเฉพาะในใบส่งของนี้เท่านั้น
            </Typography>
          )}
        </Box>

        <InfoCard sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                ชื่อบริษัท
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {displayCompany}
              </Typography>
            </Box>
            {displayTaxId && (
              <Box>
                <Chip size="small" variant="outlined" label={displayTaxId} />
              </Box>
            )}
          </Box>
          <Grid container spacing={1}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                ผู้ติดต่อ
              </Typography>
              <Typography variant="body2">{customer.contact_name || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                เบอร์โทร
              </Typography>
              <Typography variant="body2">{displayPhone}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                ที่อยู่
              </Typography>
              <Typography variant="body2">{displayAddress}</Typography>
            </Grid>
          </Grid>
        </InfoCard>

        {customerDataSource === "delivery" && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="ชื่อบริษัท"
                value={formState.customer_company}
                onChange={onFieldChange("customer_company")}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="เลขประจำตัวผู้เสียภาษี"
                value={formState.customer_tax_id}
                onChange={onFieldChange("customer_tax_id")}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="เบอร์โทร"
                value={formState.customer_tel_1}
                onChange={onFieldChange("customer_tel_1")}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="ที่อยู่ลูกค้า"
                value={formState.customer_address}
                onChange={onFieldChange("customer_address")}
                fullWidth
                multiline
                minRows={2}
                size="small"
              />
            </Grid>
          </Grid>
        )}
      </Box>
    </DialogSectionHeader>
  );
};

export default CustomerSection;
