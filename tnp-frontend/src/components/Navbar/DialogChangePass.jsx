import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid2 as Grid,
  styled,
  InputLabel,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { MdClose, MdVisibility, MdVisibilityOff } from "react-icons/md";

import { useResetPasswordMutation } from "../../features/UserManagement/userManagementApi";
import {
  open_dialog_ok_timer,
  open_dialog_error,
  open_dialog_loading,
} from "../../utils/import_lib";

const StyledLabel = styled(InputLabel)(({ theme }) => ({
  color: theme.vars.palette.grey.dark,
  fontFamily: "Kanit",
  marginLeft: 1,
  marginBottom: 8,
}));

const VerticalDivider = styled(Divider)(({ theme }) => ({
  marginInline: 0,
  marginBottom: 8,
  borderBottomWidth: 2,
  borderColor: theme.vars.palette.grey[500],
}));

function DialogChangePass(props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const user = JSON.parse(localStorage.getItem("userData"));

  const {
    register,
    getValues,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: "",
      password_comfirm: "",
    },
    mode: "onChange", // ตรวจสอบความถูกต้องขณะกรอก
  });

  const [resetPassword] = useResetPasswordMutation();

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowPasswordConfirm = () => setShowPasswordConfirm((show) => !show);

  const handleClose = () => {
    setShowPassword(false);
    setShowPasswordConfirm(false);
    props.closeDialog();
    reset();
  };

  const onSubmit = async (formData) => {
    try {
      open_dialog_loading();

      formData.user_uuid = user.user_uuid;
      formData.username = user.username;
      formData.is_reset = false;

      const res = await resetPassword(formData).unwrap();

      if (res.status === "success") {
        open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ");
        handleClose();
      } else {
        open_dialog_error(res.message);
      }
    } catch (error) {
      open_dialog_error(error.message, error);
      console.error(error);
    }
  };

  return (
    <Dialog open={props.openDialog} maxWidth="xs" disableEscapeKeyDown>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle sx={{ paddingBlock: 1 }}>
          <Box sx={{ justifySelf: "center" }}>เปลี่ยนรหัสผ่าน</Box>
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
        <DialogContent dividers sx={{ paddingBlock: { xs: 1 } }}>
          <Box>
            <Grid container sx={{ paddingBlock: 2, justifyContent: "center" }} spacing={{ xs: 3 }}>
              <Grid size={{ xs: 12 }}>
                <StyledLabel>
                  <label style={{ color: "red", marginRight: 2 }}>*</label>
                  รหัสผ่านใหม่
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
                  {...register("password", {
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
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
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
                  {...register("password_comfirm", {
                    required: "กรุณากรอกยืนยันรหัสผ่าน",
                    validate: (value) => value === getValues("password") || "รหัสผ่านไม่ตรงกัน",
                  })}
                  error={!!errors.password_comfirm}
                  helperText={errors.password_comfirm?.message}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center" }}>
          <Box sx={{ width: "100%" }}>
            <Grid size={12}>
              <VerticalDivider variant="middle" />
            </Grid>

            <Grid
              container
              sx={{
                paddingInline: 2,
                paddingBlock: 2,
              }}
              spacing={2}
            >
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="error"
                  sx={{
                    height: 40,
                  }}
                >
                  บันทึก
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
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

export default DialogChangePass;
