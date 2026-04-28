import { Business as BusinessIcon } from "@mui/icons-material";
import {
  Autocomplete,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";

import { tokens } from "../../../../../shared/styles/quotationFormStyles";
import { CONTACT_CHANNELS } from "../utils/customerCreateDefaults";

const sectionHeaderSx = {
  color: tokens.primary,
  mb: 1,
  mt: 2,
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const formLabelSx = { color: tokens.primary, fontSize: "0.875rem" };

const BusinessInfoSection = ({
  formData,
  errors,
  onChange,
  businessTypes,
  salesList,
  isAdmin,
  currentUser,
}) => {
  const selectedBusinessType =
    businessTypes.find((bt) => String(bt.bt_id) === String(formData.cus_bt_id)) || null;

  const selectedManager = (() => {
    const id = formData?.cus_manage_by?.user_id || "";
    if (!id) return null;
    return (
      salesList.find((u) => String(u.user_id) === String(id)) || {
        user_id: id,
        username: formData?.cus_manage_by?.username || "",
      }
    );
  })();

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={sectionHeaderSx}>
          <BusinessIcon /> ข้อมูลธุรกิจ
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl component="fieldset" size="small">
          <FormLabel component="legend" sx={formLabelSx}>
            ช่องทางการติดต่อ *
          </FormLabel>
          <RadioGroup
            row
            name="cus_channel"
            value={formData.cus_channel}
            onChange={(e) => onChange("cus_channel", e.target.value)}
          >
            {CONTACT_CHANNELS.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio size="small" />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
          {errors.cus_channel && (
            <Typography variant="caption" color="error">
              {errors.cus_channel}
            </Typography>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <Autocomplete
          size="small"
          options={businessTypes}
          getOptionLabel={(option) => option.bt_name || ""}
          isOptionEqualToValue={(option, value) => String(option.bt_id) === String(value.bt_id)}
          value={selectedBusinessType}
          onChange={(_event, newValue) =>
            onChange("cus_bt_id", newValue?.bt_id != null ? String(newValue.bt_id) : "")
          }
          renderInput={(params) => (
            <TextField {...params} label="ประเภทธุรกิจ" placeholder="เลือกประเภทธุรกิจ" />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl component="fieldset" size="small" fullWidth>
          <FormLabel component="legend" sx={formLabelSx}>
            ผู้ดูแลลูกค้า *
          </FormLabel>
          {isAdmin ? (
            <Autocomplete
              size="small"
              options={salesList}
              getOptionLabel={(option) => option.username || ""}
              isOptionEqualToValue={(option, value) =>
                String(option.user_id) === String(value.user_id)
              }
              value={selectedManager}
              onChange={(_event, newValue) =>
                onChange(
                  "cus_manage_by",
                  newValue
                    ? { user_id: String(newValue.user_id), username: newValue.username }
                    : { user_id: "", username: "" }
                )
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="เลือกผู้ดูแลลูกค้า"
                  placeholder="เลือกผู้ดูแล"
                  error={!!errors.cus_manage_by}
                  helperText={errors.cus_manage_by}
                />
              )}
            />
          ) : (
            <TextField
              fullWidth
              size="small"
              label="ผู้ดูแลลูกค้า"
              value={
                formData?.cus_manage_by?.username ||
                currentUser?.username ||
                currentUser?.user_nickname ||
                ""
              }
              disabled
            />
          )}
        </FormControl>
      </Grid>
    </>
  );
};

export default BusinessInfoSection;
