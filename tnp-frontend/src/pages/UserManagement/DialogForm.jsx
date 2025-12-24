import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid2 as Grid,
  styled,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  TextField,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Divider,
  FormHelperText,
  Autocomplete,
  Chip,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import { MdClose, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";

import { resetInputList } from "../../features/Customer/customerSlice";
import {
  useAddUserMutation,
  useUpdateUserMutation,
  useGetAllSubRolesQuery,
} from "../../features/UserManagement/userManagementApi";
import {
  open_dialog_ok_timer,
  open_dialog_error,
  open_dialog_loading,
} from "../../utils/import_lib";
import { onlyNums } from "../../utils/inputFormatters";

const StyledLabel = styled(InputLabel)(({ theme }) => ({
  color: theme.vars.palette.grey.dark,
  fontFamily: "Kanit",
  marginLeft: 1,
  marginBottom: 8,
}));

const StyledFormLabel = styled(FormLabel)(({ theme }) => ({
  color: theme.vars.palette.grey.dark,
  fontFamily: "Kanit",
  marginLeft: 1,
}));

const VerticalDivider = styled(Divider)(({ theme }) => ({
  marginInline: 0,
  marginBottom: 8,
  borderBottomWidth: 2,
  borderColor: theme.vars.palette.grey[500],
}));

function DialogForm(props) {
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("userData"));
  const mode = useSelector((state) => state.userManagement.mode);
  const [addUser] = useAddUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const formRef = useRef(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Fetch Sub Roles for dropdown
  const { data: subRolesData } = useGetAllSubRolesQuery({ all: "true", active_only: "true" });
  const subRolesList = subRolesData?.data || [];

  const titleMap = {
    create: "เพิ่ม",
    edit: "แก้ไข",
    view: "ดู",
  };

  const roleList = ["admin", "manager", "account", "production", "graphic", "sale", "technician"];

  const renderPasswordSection = () => {
    let content;

    if (mode === "create") {
      content = (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StyledLabel>
              <label style={{ color: "red", marginRight: 2 }}>*</label>
              รหัสผ่าน
            </StyledLabel>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="รหัสผ่าน"
              type={showPassword ? "text" : "password"}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "hide the password" : "display the password"}
                        onClick={handleClickShowPassword}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseUp={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              {...props.register("password", {
                required: "กรุณากรอกรหัสผ่าน",
                pattern: {
                  value: /^(?=.*?[a-zA-Z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
                  message:
                    "รหัสผ่านต้องมีอักษรภาษาอังกฤษ (a-z), ตัวเลข (0-9), และอักขระพิเศษ (#?!@$%^&*-)",
                },
                minLength: {
                  value: 8,
                  message: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร",
                },
              })}
              error={!!props.errors.password}
              helperText={props.errors.password?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StyledLabel>
              <label style={{ color: "red", marginRight: 2 }}>*</label>
              ยืนยันรหัสผ่าน
            </StyledLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="ยืนยันรหัสผ่าน"
              type={showPasswordConfirm ? "text" : "password"}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPasswordConfirm ? "hide the password" : "display the password"
                        }
                        onClick={handleClickShowPasswordConfirm}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseUp={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showPasswordConfirm ? <MdVisibilityOff /> : <MdVisibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              {...props.register("password_comfirm", {
                required: "กรุณากรอกยืนยันรหัสผ่าน",
                validate: (value) => value === props.getValues("password") || "รหัสผ่านไม่ตรงกัน",
              })}
              error={!!props.errors.password_comfirm}
              helperText={props.errors.password_comfirm?.message}
            />
          </Grid>
        </>
      );
    }

    return content;
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowPasswordConfirm = () => setShowPasswordConfirm((show) => !show);

  const handleClose = () => {
    setShowPassword(false);
    setShowPasswordConfirm(false);
    props.handleCloseDialog();
  };

  const onSubmit = async (formData) => {
    // e.preventDefault();
    // console.log("submit before: ", formData);
    // return;
    setSaveLoading(true);

    let res;

    try {
      open_dialog_loading();

      if (mode === "create") {
        res = await addUser(formData).unwrap();
      } else {
        res = await updateUser(formData).unwrap();
      }

      if (res.status === "success") {
        handleClose();
        open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ").then((result) => {
          setSaveLoading(false);
          dispatch(resetInputList());
        });
      } else {
        setSaveLoading(false);
        open_dialog_error(res.message);
      }
    } catch (error) {
      setSaveLoading(false);
      open_dialog_error(error.message, error);
      console.error(error);
    }
  };

  useEffect(() => {
    if (mode === "create") {
      props.setValue("user_created_by", user.user_uuid);
    }
    props.setValue("user_updated_by", user.user_uuid);
  }, [mode]);

  return (
    <Dialog open={props.openDialog} fullWidth maxWidth="md" disableEscapeKeyDown>
      <form ref={formRef} onSubmit={props.handleSubmit(onSubmit)} noValidate>
        <DialogTitle sx={{ paddingBlock: 1 }}>
          <Box sx={{ maxWidth: 800, justifySelf: "center" }}>{titleMap[mode] + `ข้อมูลผู้ใช้`}</Box>
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 10,
            color: theme.vars.palette.grey.title,
          })}
        >
          <MdClose />
        </IconButton>
        <DialogContent dividers sx={{ paddingBottom: 0 }}>
          <Box>
            <Grid
              container
              sx={{ paddingBlock: 2, justifyContent: "center" }}
              spacing={{ xs: 3, md: 5 }}
            >
              <Grid size={{ xs: 12, sm: 6 }}>
                <StyledLabel>ชื่อ</StyledLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="ชื่อ"
                  {...props.register("user_firstname")}
                  disabled={mode === "view"}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StyledLabel>นามสกุล</StyledLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="นามสกุล"
                  {...props.register("user_lastname")}
                  disabled={mode === "view"}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StyledLabel>
                  <label style={{ color: "red", marginRight: 2 }}>*</label>
                  ชื่อเล่น
                </StyledLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="ชื่อเล่น"
                  {...props.register("user_nickname", { required: "กรุณากรอกชื่อเล่น" })}
                  disabled={mode === "view"}
                  error={!!props.errors.user_nickname}
                  helperText={props.errors.user_nickname?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="user_phone"
                  control={props.control} // control จาก useForm()
                  render={({ field }) => (
                    <>
                      <StyledLabel>เบอร์โทรศัพท์</StyledLabel>
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        placeholder="เบอร์โทรศัพท์"
                        disabled={mode === "view"}
                        onChange={(e) => field.onChange(onlyNums(e.target.value))}
                      />
                    </>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StyledLabel>รหัสพนักงาน</StyledLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="รหัสพนักงาน"
                  {...props.register("user_emp_no")}
                  disabled={mode === "view"}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StyledLabel>ตำแหน่ง</StyledLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="ตำแหน่ง"
                  {...props.register("user_position")}
                  disabled={mode === "view"}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StyledLabel>
                  <label style={{ color: "red", marginRight: 2 }}>*</label>
                  ชื่อผู้ใช้
                </StyledLabel>
                <TextField
                  fullWidth
                  required
                  size="small"
                  placeholder="ชื่อผู้ใช้"
                  {...props.register("username", { required: "กรุณากรอกชื่อผู้ใช้" })}
                  disabled={mode === "view"}
                  error={!!props.errors.username}
                  helperText={props.errors.username?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="role"
                  control={props.control}
                  defaultValue=""
                  rules={{ required: "กรุณาเลือกสิทธิ์ผู้ใช้งาน" }}
                  render={({ field }) => (
                    <>
                      <StyledLabel>
                        <label style={{ color: "red", marginRight: 2 }}>*</label>
                        สิทธิ์ผู้ใช้งาน
                      </StyledLabel>
                      <FormControl
                        fullWidth
                        required
                        size="small"
                        sx={{ textTransform: "capitalize" }}
                        error={!!props.errors.role}
                      >
                        <Select
                          {...field}
                          displayEmpty
                          disabled={mode === "view"}
                          labelId="select-user-role"
                          id="select-user-role"
                          renderValue={(selected) => {
                            if (!selected) {
                              return <span style={{ color: "#a9a9a9" }}>สิทธิ์ผู้ใช้งาน</span>;
                            }
                            return selected;
                          }}
                        >
                          {roleList &&
                            roleList.map((item, index) => (
                              <MenuItem
                                key={index}
                                value={item}
                                sx={{ textTransform: "capitalize" }}
                              >
                                {item}
                              </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>{props.errors.role?.message}</FormHelperText>
                      </FormControl>
                    </>
                  )}
                />
              </Grid>

              {/* Sub Roles Multi-Select */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="sub_role_ids"
                  control={props.control}
                  defaultValue={[]}
                  render={({ field }) => (
                    <>
                      <StyledLabel>Sub Roles</StyledLabel>
                      <Autocomplete
                        multiple
                        size="small"
                        disabled={mode === "view"}
                        options={subRolesList}
                        getOptionLabel={(option) => option.msr_name || ""}
                        value={subRolesList.filter((sr) => (field.value || []).includes(sr.msr_id))}
                        onChange={(event, newValue) => {
                          field.onChange(newValue.map((v) => v.msr_id));
                        }}
                        isOptionEqualToValue={(option, value) => option.msr_id === value.msr_id}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => {
                            const { key, ...tagProps } = getTagProps({ index });
                            return (
                              <Chip key={key} label={option.msr_name} size="small" {...tagProps} />
                            );
                          })
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={field.value?.length ? "" : "เลือก Sub Roles"}
                          />
                        )}
                      />
                    </>
                  )}
                />
              </Grid>

              {/* Render password section */}
              {renderPasswordSection()}

              <Grid size={12}>
                <Controller
                  name="user_is_enable"
                  control={props.control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <FormControl fullWidth disabled={mode === "view"}>
                      <StyledFormLabel id="demo-radio-buttons-group-label">
                        <label style={{ color: "red", marginRight: 2 }}>*</label>
                        สถานะการใช้งาน
                      </StyledFormLabel>
                      <RadioGroup
                        {...field}
                        row
                        aria-labelledby="demo-radio-buttons-group-label"
                        defaultValue={true}
                      >
                        <FormControlLabel value={true} control={<Radio />} label="ใช้งาน" />
                        <FormControlLabel value={false} control={<Radio />} label="ไม่ใช้งาน" />
                      </RadioGroup>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Box sx={{ width: "100%" }}>
            <Grid size={{ xs: 12 }} sx={{ display: { xs: "block" } }}>
              <VerticalDivider variant="middle" />
            </Grid>

            <Grid
              container
              sx={{
                paddingInline: { xs: 2, md: 0, lg: 2 },
                paddingBlock: 2,
                justifyContent: "end",
              }}
              spacing={2}
            >
              {mode !== "view" && (
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    color="error"
                    disabled={saveLoading}
                    sx={{
                      height: 40,
                    }}
                  >
                    บันทึก
                  </Button>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  disabled={saveLoading}
                  onClick={handleClose}
                  sx={{
                    height: 40,
                  }}
                >
                  ยกเลิก
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default DialogForm;
