import { Grid, Stack, Typography } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import PaymentTerms from "../../../../shared/components/PaymentTerms";
import { sanitizeInt } from "../../../../shared/inputSanitizers";

const CREDIT_TYPES = new Set(["credit_30", "credit_60"]);

/**
 * Deposit + payment terms section.
 *
 * Wraps shared PaymentTerms component (handles both deposit % / amount mode +
 * payment_terms_type selector). Due-date picker injected as `dueDateNode` —
 * shown only for credit terms.
 */
const DepositSection = ({ formState, setters, financials }) => {
  const { payment, deposit, dueDate } = formState;
  const {
    setPaymentTermsType,
    setPaymentTermsCustom,
    setDepositMode,
    setDepositPct,
    setDepositAmountInput,
    setSelectedDueDate,
  } = setters;

  const isCredit = CREDIT_TYPES.has(payment.type);

  return (
    <Stack spacing={3}>
      <PaymentTerms
        isEditing={true}
        paymentTermsType={payment.type}
        paymentTermsCustom={payment.custom}
        onChangePaymentTermsType={setPaymentTermsType}
        onChangePaymentTermsCustom={setPaymentTermsCustom}
        depositMode={deposit.mode}
        onChangeDepositMode={setDepositMode}
        depositPercentage={deposit.percentage}
        depositAmountInput={deposit.amountInput}
        onChangeDepositPercentage={(v) => setDepositPct(sanitizeInt(v))}
        onChangeDepositAmount={setDepositAmountInput}
        isCredit={isCredit}
        dueDateNode={
          isCredit ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="body1">วันครบกำหนด</Typography>
              </Grid>
              <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={dueDate}
                    onChange={(newVal) => setSelectedDueDate(newVal)}
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
    </Stack>
  );
};

export default DepositSection;
