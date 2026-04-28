import { Payment as PaymentIcon } from "@mui/icons-material";
import { Avatar, Box, Grid, TextField, Typography } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import PaymentTerms from "../../../../shared/components/PaymentTerms";
import { PAYMENT_TERMS } from "../../../../shared/constants/paymentTerms";
import { sanitizeInt } from "../../../../shared/inputSanitizers";
import { Section, SectionHeader, tokens } from "../../../../shared/styles/quotationFormStyles";
import { formatDateTH } from "../../shared/utils/quotationFormatters";

const isCreditTerm = (type) => type === PAYMENT_TERMS.CREDIT_30 || type === PAYMENT_TERMS.CREDIT_60;

const resolveSavedPaymentMethod = (q) =>
  q?.payment_terms ||
  q?.payment_method ||
  (q?.credit_days === 30
    ? PAYMENT_TERMS.CREDIT_30
    : q?.credit_days === 60
      ? PAYMENT_TERMS.CREDIT_60
      : PAYMENT_TERMS.CASH);

const PaymentTermsSection = ({ isEditing, quotation, formState, financials, setters }) => {
  const editingIsCredit = isCreditTerm(formState.payment.type);
  const savedPaymentMethod = resolveSavedPaymentMethod(quotation);
  const showDueDateBlock = isEditing ? editingIsCredit : savedPaymentMethod !== PAYMENT_TERMS.CASH;

  const dueDateNode = showDueDateBlock ? (
    <>
      <Grid item xs={6}>
        <Typography>วันครบกำหนด</Typography>
      </Grid>
      <Grid item xs={6}>
        {isEditing && editingIsCredit ? (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              value={formState.dueDate}
              onChange={(newVal) => setters.setSelectedDueDate(newVal)}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </LocalizationProvider>
        ) : (
          <Typography textAlign="right" fontWeight={700}>
            {formatDateTH(quotation?.due_date)}
          </Typography>
        )}
      </Grid>
    </>
  ) : null;

  return (
    <Grid item xs={12}>
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
            isEditing={isEditing}
            paymentTermsType={formState.payment.type}
            paymentTermsCustom={formState.payment.custom}
            onChangePaymentTermsType={(v) => isEditing && setters.setPaymentTermsType(v)}
            onChangePaymentTermsCustom={(v) => isEditing && setters.setPaymentTermsCustom(v)}
            depositMode={formState.deposit.mode}
            onChangeDepositMode={(v) => isEditing && setters.setDepositMode(v)}
            depositPercentage={formState.deposit.percentage}
            depositAmountInput={formState.deposit.amountInput}
            onChangeDepositPercentage={(v) => isEditing && setters.setDepositPct(sanitizeInt(v))}
            onChangeDepositAmount={(v) => isEditing && setters.setDepositAmountInput(v)}
            isCredit={isEditing ? editingIsCredit : savedPaymentMethod !== PAYMENT_TERMS.CASH}
            dueDateNode={dueDateNode}
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
              value={isEditing ? (formState.notes ?? "") : (quotation?.notes ?? "")}
              disabled={!isEditing}
              onChange={(e) => setters.setQuotationNotes(e.target.value)}
            />
          </Box>
        </Box>
      </Section>
    </Grid>
  );
};

export default PaymentTermsSection;
