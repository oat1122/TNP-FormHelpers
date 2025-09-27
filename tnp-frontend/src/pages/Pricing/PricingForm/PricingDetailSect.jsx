import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Controller } from "react-hook-form";
import {
  Button,
  Divider,
  Grid2 as Grid,
  Typography,
  OutlinedInput,
  styled,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
} from "@mui/material";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers";
import { useGetAllProductCateQuery } from "../../../features/globalApi";
import { open_dialog_loading } from "../../../utils/import_lib";
import Swal from "sweetalert2";
import moment from "moment/moment";
import dayjs from "dayjs";
import { setInputList } from "../../../features/Pricing/pricingSlice";
import { onlyNums } from "../../../utils/inputFormatters";

const StyledOutlinedInput = styled(OutlinedInput)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.outlinedInput,
  height: 34,

  "& fieldset": {
    borderColor: theme.vars.palette.grey.outlinedInput,
  },

  "&.Mui-disabled": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.vars.palette.grey.outlinedInput,
    },

    "& .MuiOutlinedInput-input": {
      WebkitTextFillColor: theme.vars.palette.text.primary,
    },
  },
}));

const StyledLabel = styled(InputLabel)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.main,
  color: theme.vars.palette.grey.dark,
  borderRadius: theme.vars.shape.borderRadius,
  fontFamily: "Kanit",
  fontSize: 16,
  height: 34,
  alignContent: "center",
  textAlign: "center",
  maxHeight: 40,
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.outlinedInput,
  height: 34,

  "& fieldset": {
    borderColor: theme.vars.palette.grey.outlinedInput,
  },
}));

const StyledDatePicker = styled(DatePicker)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.outlinedInput,
  borderRadius: theme.vars.shape.borderRadius,
  height: 34,

  "& fieldset": {
    height: 40,
    borderColor: theme.vars.palette.grey.outlinedInput,
  },

  "& .MuiOutlinedInput-input": {
    height: 20,
  },
}));

const VerticalDivider = styled(Divider)(({ theme }) => ({
  marginInline: 0,
  marginBlock: 16,
  borderBottomWidth: 2,
  borderColor: theme.vars.palette.grey[500],
}));

function PricingDetailSect(props) {
  const dispatch = useDispatch();
  const inputList = useSelector((state) => state.pricing.inputList);
  const mode = useSelector((state) => state.pricing.mode);
  const [productCateList, setProductCateList] = useState([]);
  const { data, error, isLoading } = useGetAllProductCateQuery();
  const user = JSON.parse(localStorage.getItem("userData"));
  const saleOrAdmin = user.role === "sale" || user.role === "admin";

  const handleDateChange = (val_date) => {
    const value = val_date ? val_date.format("YYYY-MM-DD") : null;
    dispatch(setInputList({ ...inputList, pr_due_date: value }));
  };

  useEffect(() => {
    if (data) {
      setProductCateList(data);
    }

    if (isLoading) {
      open_dialog_loading();
    } else {
      Swal.close();
    }
  }, [data]);

  return (
    <>
      <Typography
        variant="h5"
        color="error"
        sx={{
          marginLeft: 1,
          marginBottom: 1,
          paddingBlock: 0.45,
        }}
      >
        รายละเอียดคำขอราคา
      </Typography>

      <Grid container spacing={0}>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel>
            <label style={{ color: "red", marginRight: 1 }}>*</label>
            ชื่องาน
          </StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            readOnly={mode === "view" || !saleOrAdmin}
            placeholder="ชื่องาน"
            {...props.register("pr_work_name", { required: true })}
          />
          <FormHelperText error>
            {props.errors.pr_work_name?.type === "required" && "กรุณากรอกชื่องาน"}
          </FormHelperText>
        </Grid>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel>
            <label style={{ color: "red", marginRight: 1 }}>*</label>
            ประเภท
          </StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1}>
          <Controller
            name="pr_mpc_id"
            control={props.control}
            rules={{ required: true }}
            render={({ field }) => (
              <StyledSelect
                {...field}
                fullWidth
                displayEmpty
                size="small"
                readOnly={mode === "view" || !saleOrAdmin}
                inputRef={field.ref}
              >
                <MenuItem disabled value="">
                  ประเภท
                </MenuItem>
                {productCateList &&
                  productCateList.map((item, index) => (
                    <MenuItem key={index} value={item.mpc_id}>
                      {item.mpc_name}
                    </MenuItem>
                  ))}
              </StyledSelect>
            )}
          />
          <FormHelperText error>
            {props.errors.pr_mpc_id?.type === "required" && "กรุณาเลือกประเภทสินค้า"}
          </FormHelperText>
        </Grid>
      </Grid>

      <Grid container>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel>แพทเทิร์น</StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            readOnly={mode === "view" || !saleOrAdmin}
            placeholder="แพทเทิร์น"
            {...props.register("pr_pattern")}
          />
        </Grid>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel>ชนิดผ้า</StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            readOnly={mode === "view" || !saleOrAdmin}
            placeholder="ชนิดผ้า"
            {...props.register("pr_fabric_type")}
          />
        </Grid>
      </Grid>

      <Grid container>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel>สี</StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            readOnly={mode === "view" || !saleOrAdmin}
            placeholder="สี"
            {...props.register("pr_color")}
          />
        </Grid>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel>ไซซ์</StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            readOnly={mode === "view" || !saleOrAdmin}
            placeholder="ไซซ์"
            {...props.register("pr_sizes")}
          />
        </Grid>
      </Grid>

      <Grid container>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel>
            <label style={{ color: "red", marginRight: 1 }}>*</label>
            จำนวน
          </StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1}>
          <Controller
            name="pr_quantity"
            control={props.control} // control จาก useForm()
            rules={{ required: true }}
            render={({ field }) => (
              <StyledOutlinedInput
                {...field}
                fullWidth
                size="small"
                readOnly={mode === "view" || !saleOrAdmin}
                placeholder="จำนวน"
                inputRef={field.ref}
                onChange={(e) => field.onChange(onlyNums(e.target.value))}
              />
            )}
          />
          <FormHelperText error>
            {props.errors.pr_quantity?.type === "required" && "กรุณากรอกจำนวน"}
          </FormHelperText>
        </Grid>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel>วันส่ง</StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Controller
              name="pr_due_date"
              control={props.control} // control จาก useForm()
              render={({ field }) => (
                <StyledDatePicker
                  {...field} // ผูกค่าจาก react-hook-form
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) =>
                    field.onChange(date ? date.startOf("day").format("YYYY-MM-DD") : "")
                  }
                  format="DD/MM/YYYY"
                  readOnly={mode === "view" || !saleOrAdmin}
                  sx={{
                    "& .Mui-readOnly": {
                      backgroundColor: "unset",
                    },
                  }}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <VerticalDivider variant="middle" />
      </Grid>

      <Grid container>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel sx={{ textTransform: "uppercase" }}>silk</StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, md: 10 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            readOnly={mode === "view" || !saleOrAdmin}
            placeholder="SILK"
            {...props.register("pr_silk")}
          />
        </Grid>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel sx={{ textTransform: "uppercase" }}>dft</StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, md: 10 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            readOnly={mode === "view" || !saleOrAdmin}
            placeholder="DFT"
            {...props.register("pr_dft")}
          />
        </Grid>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel>ปัก</StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, md: 10 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            readOnly={mode === "view" || !saleOrAdmin}
            placeholder="ปัก"
            {...props.register("pr_embroider")}
          />
        </Grid>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel sx={{ textTransform: "uppercase" }}>sub</StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, md: 10 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            readOnly={mode === "view" || !saleOrAdmin}
            placeholder="SUB"
            {...props.register("pr_sub")}
          />
        </Grid>
        <Grid
          size={{ xs: 4, md: 2 }}
          sx={{
            padding: 1,
            display: { xs: "none", md: "block" },
          }}
        >
          <StyledLabel>อื่นๆ</StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, md: 10 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            readOnly={mode === "view" || !saleOrAdmin}
            placeholder="อื่นๆ"
            {...props.register("pr_other_screen")}
          />
        </Grid>
      </Grid>
    </>
  );
}

export default PricingDetailSect;
