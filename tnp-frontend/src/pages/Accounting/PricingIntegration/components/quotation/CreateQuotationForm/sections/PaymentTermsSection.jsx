import { Payment as PaymentIcon } from "@mui/icons-material";
import { Avatar, Box, Grid, TextField, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import PaymentTerms from "../../../../../shared/components/PaymentTerms";
import { sanitizeDecimal, sanitizeInt } from "../../../../../shared/inputSanitizers";
import { tokens } from "../../../../../shared/styles/tokens";
import { Section, SectionHeader } from "../../../styles/quotationFormStyles";

const PaymentTermsSection = ({ formData, financials, onUpdateField }) => {
  const isCredit =
    formData.paymentTermsType === "credit_30" || formData.paymentTermsType === "credit_60";

  return (
    <Section>
      <SectionHeader>
        <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
          <PaymentIcon fontSize="small" />
        </Avatar>
        <Typography variant="subtitle1" fontWeight={700}>
          เงื่อนไขการชำระเงิน
        </Typography>
      </SectionHeader>
      <Box sx={{ p: 2 }}>
        <PaymentTerms
          isEditing
          paymentTermsType={formData.paymentTermsType}
          paymentTermsCustom={formData.paymentTermsCustom}
          onChangePaymentTermsType={(v) => onUpdateField("paymentTermsType", v)}
          onChangePaymentTermsCustom={(v) => onUpdateField("paymentTermsCustom", v)}
          depositMode={formData.depositMode}
          onChangeDepositMode={(v) => onUpdateField("depositMode", v)}
          depositPercentage={formData.depositPct}
          depositAmountInput={formData.depositAmountInput}
          onChangeDepositPercentage={(v) => onUpdateField("depositPct", sanitizeInt(v))}
          onChangeDepositAmount={(v) => onUpdateField("depositAmountInput", sanitizeDecimal(v))}
          isCredit={isCredit}
          dueDateNode={
            isCredit ? (
              <Grid container spacing={2} sx={{ mt: 0 }}>
                <Grid item xs={6}>
                  <Typography>วันครบกำหนด</Typography>
                </Grid>
                <Grid item xs={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={formData.dueDate}
                      onChange={(newVal) => onUpdateField("dueDate", newVal)}
                      format="dd/MM/yyyy"
                      slotProps={{ textField: { size: "small", fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            ) : null
          }
          finalTotal={financials.finalTotal}
          depositAmount={financials.depositAmount}
          remainingAmount={financials.remainingAmount}
        />
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="หมายเหตุ"
            value={formData.notes}
            onChange={(e) => onUpdateField("notes", e.target.value)}
            placeholder="เช่น ราคานี้รวมค่าจัดส่งและติดตั้งแล้ว…"
          />
        </Box>
      </Box>
    </Section>
  );
};

export default PaymentTermsSection;
