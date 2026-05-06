import { Payment as PaymentIcon } from "@mui/icons-material";
import { Avatar, Box, Grid, TextField, Typography } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import {
  Section,
  SectionHeader,
  tokens,
} from "../../../../PricingIntegration/components/styles/quotationFormStyles";
import { PaymentTerms } from "../../../../shared/components";
import { formatDateTH } from "../../../utils/format";

/**
 * Section 3: เงื่อนไขการชำระเงิน — Payment terms + deposit + due date + notes
 *
 * Extracted from InvoiceDetailDialog.jsx during Phase 1d of redesign refactor.
 * Zero behavior change.
 */
const PaymentTermsSection = ({
  isEditing,
  formData,
  handleFieldChange,
  calculation,
  notes,
  setNotes,
  invoice,
}) => {
  const isCredit = formData.payment_terms === "credit_30" || formData.payment_terms === "credit_60";

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
            paymentTermsType={formData.payment_terms || "cash"}
            paymentTermsCustom={formData.payment_method || ""}
            onChangePaymentTermsType={(v) => isEditing && handleFieldChange("payment_terms", v)}
            onChangePaymentTermsCustom={(v) => isEditing && handleFieldChange("payment_method", v)}
            depositMode={formData.deposit_mode}
            onChangeDepositMode={(v) => isEditing && handleFieldChange("deposit_mode", v)}
            depositPercentage={formData.deposit_percentage}
            depositAmountInput={formData.deposit_amount}
            onChangeDepositPercentage={(v) =>
              isEditing &&
              handleFieldChange("deposit_percentage", Math.max(0, Math.min(100, Number(v) || 0)))
            }
            onChangeDepositAmount={(v) =>
              isEditing && handleFieldChange("deposit_amount", Math.max(0, Number(v) || 0))
            }
            isCredit={isCredit}
            dueDateNode={
              isCredit ? (
                <>
                  <Grid item xs={6}>
                    <Typography>วันครบกำหนด</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    {isEditing ? (
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          value={formData.due_date ? new Date(formData.due_date) : null}
                          onChange={(newVal) =>
                            handleFieldChange(
                              "due_date",
                              newVal ? newVal.toISOString().split("T")[0] : null
                            )
                          }
                          slotProps={{ textField: { size: "small", fullWidth: true } }}
                        />
                      </LocalizationProvider>
                    ) : (
                      <Typography textAlign="right" fontWeight={700}>
                        {formatDateTH(invoice?.due_date)}
                      </Typography>
                    )}
                  </Grid>
                </>
              ) : null
            }
            finalTotal={calculation.finalTotalAmount}
            depositAmount={calculation.depositAmount}
            remainingAmount={calculation.remainingAmount}
          />

          {/* Notes Field */}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="หมายเหตุ"
              value={notes}
              disabled={!isEditing}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Box>
        </Box>
      </Section>
    </Grid>
  );
};

export default PaymentTermsSection;
