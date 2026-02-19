import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  InputAdornment,
  TextField,
} from "@mui/material";
import { MdCurrencyExchange } from "react-icons/md";
import NumericTextField from "../NumericTextField";
import { PRIMARY_RED, CURRENCIES } from "../../utils";

/**
 * PricingCard - Card section for currency, base price, THB price, exchange rate
 */
const PricingCard = ({
  form,
  setForm,
  handleChange,
  isView,
  handleConvertCurrency,
  convertingCurrency,
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 2 }}>
          ราคาและสกุลเงิน
        </Typography>
        <Grid container spacing={2} alignItems="center">
          {/* Currency */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily: "Kanit" }}>สกุลเงิน</InputLabel>
              <Select
                value={form.sp_currency}
                label="สกุลเงิน"
                onChange={handleChange("sp_currency")}
                disabled={isView}
                sx={{ fontFamily: "Kanit" }}
              >
                {CURRENCIES.map((c) => (
                  <MenuItem key={c.code} value={c.code} sx={{ fontFamily: "Kanit" }}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Base Price */}
          <Grid item xs={12} sm={3}>
            <NumericTextField
              fullWidth
              size="small"
              label="ราคาพื้นฐาน *"
              value={form.sp_base_price}
              onChange={(val) => setForm((prev) => ({ ...prev, sp_base_price: val }))}
              disabled={isView}
              InputProps={{
                endAdornment: <InputAdornment position="end">{form.sp_currency}</InputAdornment>,
                style: { fontFamily: "Kanit" },
              }}
              InputLabelProps={{ style: { fontFamily: "Kanit" } }}
            />
          </Grid>
          {/* Convert Button */}
          <Grid item xs={12} sm={2}>
            {!isView && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={
                  convertingCurrency ? <CircularProgress size={16} /> : <MdCurrencyExchange />
                }
                onClick={() => handleConvertCurrency(form.sp_currency, form.sp_base_price, setForm)}
                disabled={convertingCurrency}
                sx={{
                  fontFamily: "Kanit",
                  borderColor: PRIMARY_RED,
                  color: PRIMARY_RED,
                  fontSize: 12,
                  height: 40,
                }}
              >
                แปลงเป็นบาท
              </Button>
            )}
          </Grid>
          {/* THB Price */}
          <Grid item xs={12} sm={2}>
            <NumericTextField
              fullWidth
              size="small"
              label="ราคา (บาท)"
              value={form.sp_price_thb}
              onChange={(val) => setForm((prev) => ({ ...prev, sp_price_thb: val }))}
              disabled={isView}
              InputProps={{ style: { fontFamily: "Kanit" } }}
              InputLabelProps={{ style: { fontFamily: "Kanit" } }}
            />
          </Grid>
          {/* Exchange Rate */}
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              size="small"
              label="อัตราแลกเปลี่ยน"
              value={form.sp_exchange_rate}
              disabled
              InputProps={{ style: { fontFamily: "Kanit" } }}
              InputLabelProps={{ style: { fontFamily: "Kanit" } }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PricingCard;
