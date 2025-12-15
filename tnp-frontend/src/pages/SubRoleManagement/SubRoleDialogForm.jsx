import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import {
  useAddSubRoleMutation,
  useUpdateSubRoleMutation,
} from "../../features/UserManagement/userManagementApi";
import { setMode } from "../../features/SubRoleManagement/subRoleManagementSlice";
import {
  open_dialog_ok_timer,
  open_dialog_loading,
  open_dialog_error,
} from "../../utils/import_lib";

function SubRoleDialogForm({
  openDialog,
  handleCloseDialog,
  register,
  setValue,
  getValues,
  handleSubmit,
  control,
  errors,
  watch,
}) {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.subRoleManagement?.mode || "");
  const [addSubRole] = useAddSubRoleMutation();
  const [updateSubRole] = useUpdateSubRoleMutation();

  const onSubmit = async (data) => {
    open_dialog_loading();

    try {
      let res;

      if (mode === "create") {
        res = await addSubRole({
          msr_code: data.msr_code?.toUpperCase(),
          msr_name: data.msr_name,
          msr_description: data.msr_description,
          msr_is_active: data.msr_is_active,
          msr_sort: parseInt(data.msr_sort) || 0,
        }).unwrap();
      } else if (mode === "edit") {
        res = await updateSubRole({
          msr_id: data.msr_id,
          msr_code: data.msr_code?.toUpperCase(),
          msr_name: data.msr_name,
          msr_description: data.msr_description,
          msr_is_active: data.msr_is_active,
          msr_sort: parseInt(data.msr_sort) || 0,
        }).unwrap();
      }

      if (res?.status === "success") {
        open_dialog_ok_timer(
          mode === "create" ? "สร้าง Sub Role สำเร็จ" : "อัพเดท Sub Role สำเร็จ"
        );
        handleCloseDialog();
      } else {
        open_dialog_error(res?.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      open_dialog_error(error?.data?.message || error.message);
      console.error(error);
    }
  };

  const isViewMode = mode === "view";

  const getDialogTitle = () => {
    switch (mode) {
      case "create":
        return "สร้าง Sub Role ใหม่";
      case "edit":
        return "แก้ไข Sub Role";
      case "view":
        return "รายละเอียด Sub Role";
      default:
        return "Sub Role";
    }
  };

  return (
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ fontWeight: "bold", fontSize: 18 }}>{getDialogTitle()}</DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* msr_code */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  label="รหัส Sub Role *"
                  placeholder="เช่น HEAD_ONLINE"
                  size="small"
                  disabled={isViewMode}
                  {...register("msr_code", { required: "กรุณากรอกรหัส Sub Role" })}
                  error={!!errors.msr_code}
                  helperText={errors.msr_code?.message}
                  inputProps={{ style: { textTransform: "uppercase" } }}
                />
              </FormControl>
            </Grid>

            {/* msr_name */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  label="ชื่อ Sub Role *"
                  placeholder="เช่น หัวหน้าฝ่ายออนไลน์"
                  size="small"
                  disabled={isViewMode}
                  {...register("msr_name", { required: "กรุณากรอกชื่อ Sub Role" })}
                  error={!!errors.msr_name}
                  helperText={errors.msr_name?.message}
                />
              </FormControl>
            </Grid>

            {/* msr_description */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <TextField
                  label="รายละเอียด"
                  placeholder="รายละเอียดเพิ่มเติม"
                  size="small"
                  multiline
                  rows={3}
                  disabled={isViewMode}
                  {...register("msr_description")}
                />
              </FormControl>
            </Grid>

            {/* msr_sort */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  label="ลำดับการแสดงผล"
                  type="number"
                  size="small"
                  disabled={isViewMode}
                  {...register("msr_sort")}
                  inputProps={{ min: 0 }}
                />
              </FormControl>
            </Grid>

            {/* msr_is_active */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Switch
                      checked={watch("msr_is_active") ?? true}
                      onChange={(e) => setValue("msr_is_active", e.target.checked)}
                      disabled={isViewMode}
                    />
                  }
                  label="เปิดใช้งาน"
                />
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ padding: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined" color="inherit">
            {isViewMode ? "ปิด" : "ยกเลิก"}
          </Button>
          {!isViewMode && (
            <Button type="submit" variant="contained" color="primary">
              {mode === "create" ? "สร้าง" : "บันทึก"}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default SubRoleDialogForm;
