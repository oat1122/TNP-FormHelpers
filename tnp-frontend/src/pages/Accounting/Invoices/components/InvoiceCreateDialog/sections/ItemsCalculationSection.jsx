import { Box, Chip, Divider, Grid, Paper, Stack, TextField, Typography } from "@mui/material";

import PricingModeSelector from "../../../../PricingIntegration/components/quotation/CreateQuotationForm/components/PricingModeSelector";
import SpecialDiscountField from "../../../../PricingIntegration/components/quotation/CreateQuotationForm/components/SpecialDiscountField";
import VatField from "../../../../PricingIntegration/components/quotation/CreateQuotationForm/components/VatField";
import WithholdingTaxField from "../../../../PricingIntegration/components/quotation/CreateQuotationForm/components/WithholdingTaxField";
import { formatTHB } from "../../../../Quotations/utils/format";
import Calculation from "../../../../shared/components/Calculation";
import { tokens } from "../../../../shared/styles/tokens";

const UNIT_OPTIONS = ["ชิ้น", "ตัว", "ชุด", "กล่อง", "แพ็ค", "อื่นๆ"];

/**
 * Items + financial controls + calculation summary section.
 *
 * Renders editable size rows per group, then VAT/Discount/Withholding fields,
 * then a sticky-ish calculation summary card. PricingMode is locked (inherited
 * from source quotation — invoice should not change pricing semantics).
 */
const ItemsCalculationSection = ({
  groups,
  onChangeRow,
  onChangeGroup,
  formState,
  setters,
  financials,
}) => {
  const { specialDiscount, withholding, vat: vatState, pricingMode } = formState;
  const {
    setSpecialDiscountType,
    setSpecialDiscountValue,
    setHasWithholdingTax,
    setWithholdingTaxPercentage,
    setHasVat,
    setVatPercentage,
    setPricingMode,
  } = setters;

  const {
    subtotal,
    specialDiscountAmount: discountAmountComputed,
    discountedSubtotal: netAfterDiscount,
    vat,
    total,
    withholdingTaxAmount: withholdingTaxAmountComputed,
    finalTotal: finalNetAmountComputed,
  } = financials;

  return (
    <Stack spacing={3}>
      {groups.map((g, gi) => {
        const totalQty = (g.sizeRows || []).reduce((s, r) => s + Number(r.quantity || 0), 0);
        const itemTotal = (g.sizeRows || []).reduce(
          (s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0),
          0
        );
        const unit = g.unit || "ชิ้น";

        return (
          <Paper key={g.id} elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderLight}` }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="subtitle1" fontWeight={700} color="primary">
                  งานที่ {gi + 1}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {g.name || "-"}
                </Typography>
              </Box>
              <Chip label={`${totalQty} ${unit}`} size="small" variant="outlined" />
            </Box>

            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="แพทเทิร์น"
                  value={g.pattern || ""}
                  onChange={(e) => onChangeGroup(g.id, "pattern", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="ประเภทผ้า"
                  value={g.fabricType || ""}
                  onChange={(e) => onChangeGroup(g.id, "fabricType", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="สี"
                  value={g.color || ""}
                  onChange={(e) => onChangeGroup(g.id, "color", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="ขนาด (สรุป)"
                  value={g.size || ""}
                  onChange={(e) => onChangeGroup(g.id, "size", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  SelectProps={{ native: true }}
                  label="หน่วย"
                  value={unit}
                  onChange={(e) => onChangeGroup(g.id, "unit", e.target.value)}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                แยกตามขนาด
              </Typography>

              <Grid container spacing={1} sx={{ px: 0.5, pb: 0.5 }}>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    ขนาด
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    จำนวน
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    ราคาต่อหน่วย
                  </Typography>
                </Grid>
                <Grid item xs={10} md={2}>
                  <Typography variant="caption" color="text.secondary">
                    ยอดรวม
                  </Typography>
                </Grid>
                <Grid item xs={2} md={1}></Grid>
              </Grid>

              <Stack
                spacing={1.5}
                divider={
                  <Divider flexItem sx={{ borderColor: "primary.main", borderBottomWidth: 1 }} />
                }
              >
                {(g.sizeRows || []).map((row) => {
                  const qv =
                    typeof row.quantity === "string"
                      ? parseFloat(row.quantity || "0")
                      : Number(row.quantity || 0);
                  const pv =
                    typeof row.unitPrice === "string"
                      ? parseFloat(row.unitPrice || "0")
                      : Number(row.unitPrice || 0);
                  const rowTotal = isNaN(qv) || isNaN(pv) ? 0 : qv * pv;
                  return (
                    <Box
                      key={row.uuid}
                      sx={{
                        p: 1.5,
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1.5,
                      }}
                    >
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            inputProps={{ inputMode: "text" }}
                            label="ขนาด"
                            value={row.size || ""}
                            onChange={(e) => onChangeRow(g.id, row.uuid, "size", e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            type="text"
                            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                            label="จำนวน"
                            value={row.quantity ?? ""}
                            onChange={(e) =>
                              onChangeRow(g.id, row.uuid, "quantity", e.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            type="text"
                            inputProps={{ inputMode: "decimal" }}
                            label="ราคาต่อหน่วย"
                            value={row.unitPrice ?? ""}
                            onChange={(e) =>
                              onChangeRow(g.id, row.uuid, "unitPrice", e.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={10} md={2}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              textAlign: "right",
                              fontFamily: "'Tabular Nums', monospace",
                              fontVariantNumeric: "tabular-nums",
                              color: rowTotal > 0 ? "primary.main" : "text.secondary",
                            }}
                          >
                            {formatTHB(rowTotal)}
                          </Typography>
                        </Grid>
                        <Grid item xs={2} md={1}></Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="หมายเหตุ (บรรทัดนี้)"
                            multiline
                            minRows={1}
                            value={row.notes || ""}
                            onChange={(e) => onChangeRow(g.id, row.uuid, "notes", e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={6} md={4}>
                <Box
                  sx={{
                    p: 1.5,
                    border: "1px solid #e0e0e0",
                    borderRadius: 1.5,
                    textAlign: "center",
                    bgcolor: "#fafafa",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    ยอดรวม
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatTHB(itemTotal)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        );
      })}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <PricingModeSelector
            pricingMode={pricingMode}
            onPricingModeChange={setPricingMode}
            disabled={true}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <VatField
            hasVat={vatState.enabled}
            vatPercentage={vatState.percentage}
            vatAmount={vat}
            subtotalAmount={netAfterDiscount}
            onToggleVat={setHasVat}
            onVatPercentageChange={setVatPercentage}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SpecialDiscountField
            discountType={specialDiscount.type}
            discountValue={specialDiscount.value}
            totalAmount={subtotal}
            discountAmount={discountAmountComputed}
            onDiscountTypeChange={setSpecialDiscountType}
            onDiscountValueChange={setSpecialDiscountValue}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <WithholdingTaxField
            hasWithholdingTax={withholding.enabled}
            taxPercentage={withholding.percentage}
            taxAmount={withholdingTaxAmountComputed}
            subtotalAmount={subtotal}
            onToggleWithholdingTax={setHasWithholdingTax}
            onTaxPercentageChange={setWithholdingTaxPercentage}
          />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 3, bgcolor: "primary.50" }}>
        <Calculation
          subtotal={subtotal}
          discountAmount={discountAmountComputed}
          discountedBase={netAfterDiscount}
          vat={vat}
          totalAfterVat={total}
          withholdingAmount={withholdingTaxAmountComputed}
          finalTotal={finalNetAmountComputed}
          vatPercentage={vatState.percentage}
          hasVat={vatState.enabled}
        />
      </Paper>
    </Stack>
  );
};

export default ItemsCalculationSection;
