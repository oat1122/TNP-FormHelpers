import { Business as BusinessIcon } from "@mui/icons-material";
import {
  Autocomplete,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";

import { tokens } from "../../../../shared/styles/tokens";
import { StyledTextField, sectionTitleSx } from "../styles/customerEditStyles";

const formLabelSx = { color: tokens.primary, fontSize: "0.875rem" };

const CustomerBusinessFields = ({
  editData,
  errors,
  onChange,
  businessTypes,
  salesList,
  isAdmin,
  currentUser,
}) => (
  <>
    <Grid item xs={12}>
      <Typography variant="subtitle2" sx={{ ...sectionTitleSx, mt: 2 }}>
        <BusinessIcon /> ข้อมูลธุรกิจ
      </Typography>
    </Grid>

    <Grid item xs={12} md={6}>
      <FormControl component="fieldset" size="small">
        <FormLabel component="legend" sx={formLabelSx}>
          ช่องทางการติดต่อ
        </FormLabel>
        <RadioGroup
          row
          name="cus_channel"
          value={editData.cus_channel}
          onChange={(e) => onChange("cus_channel", e.target.value)}
        >
          <FormControlLabel value="1" control={<Radio size="small" />} label="Sales" />
          <FormControlLabel value="2" control={<Radio size="small" />} label="Online" />
          <FormControlLabel value="3" control={<Radio size="small" />} label="Office" />
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
        getOptionKey={(option) => `business-type-${option.bt_id || Math.random()}`}
        isOptionEqualToValue={(option, value) => String(option.bt_id) === String(value.bt_id)}
        value={businessTypes.find((bt) => String(bt.bt_id) === String(editData.cus_bt_id)) || null}
        onChange={(_event, newValue) => {
          onChange("cus_bt_id", newValue?.bt_id != null ? String(newValue.bt_id) : "");
        }}
        renderInput={(params) => (
          <StyledTextField {...params} label="ประเภทธุรกิจ" placeholder="เลือกประเภทธุรกิจ" />
        )}
      />
    </Grid>

    <Grid item xs={12} md={6}>
      <FormControl component="fieldset" size="small" fullWidth>
        <FormLabel component="legend" sx={formLabelSx}>
          ผู้ดูแลลูกค้า
        </FormLabel>
        {isAdmin ? (
          <Autocomplete
            size="small"
            options={salesList}
            getOptionLabel={(option) => option.username || ""}
            isOptionEqualToValue={(option, value) =>
              String(option.user_id) === String(value.user_id)
            }
            value={(() => {
              const id = editData?.cus_manage_by?.user_id || "";
              if (!id) return null;
              const found = salesList.find((u) => String(u.user_id) === String(id));
              if (found) return found;
              return {
                user_id: id,
                username: editData?.cus_manage_by?.username || "กำลังโหลด...",
              };
            })()}
            onChange={(_event, newValue) => {
              onChange(
                "cus_manage_by",
                newValue
                  ? { user_id: String(newValue.user_id), username: newValue.username }
                  : { user_id: "", username: "" }
              );
            }}
            renderInput={(params) => (
              <StyledTextField
                {...params}
                label="เลือกผู้ดูแลลูกค้า"
                placeholder="เลือกผู้ดูแล"
                error={!!errors.cus_manage_by}
                helperText={errors.cus_manage_by}
              />
            )}
          />
        ) : (
          <StyledTextField
            fullWidth
            size="small"
            label="ผู้ดูแลลูกค้า"
            value={
              editData?.cus_manage_by?.username ||
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

export default CustomerBusinessFields;
