import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import {
  MdAssignment,
  MdBusiness,
  MdDonutLarge,
  MdEdit,
  MdEditDocument,
  MdEmail,
  MdNextPlan,
  MdNote,
  MdPerson,
  MdPhone,
  MdSave,
  MdSupervisorAccount,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import * as yup from "yup";

import {
  useAddNotebookMutation,
  useUpdateNotebookMutation,
} from "../../../features/Notebook/notebookApi";
import {
  resetForm,
  setDialogOpen,
  setInputData,
  updateInputData,
} from "../../../features/Notebook/notebookSlice";
import { useGetAllUserQuery } from "../../../features/UserManagement/userManagementApi";
import { useSnackbar } from "../../AllocationHub/hooks";

// Validation Schema
const validationSchema = yup.object().shape({
  nb_customer_name: yup.string().required("กรุณาระบุชื่อลูกค้า"),
  nb_email: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v))
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  nb_contact_number: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  nb_date: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  nb_time: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  nb_manage_by: yup
    .mixed()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

const StyledDialogTitle = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  padding: theme.spacing(2, 3),
  fontSize: "1.25rem",
  fontWeight: 600,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: "0.9rem",
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1.5),
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledPaper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  // border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(1),
  boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
  "&:hover": {
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
  },
  transition: "box-shadow 0.3s ease",
}));

const NotebookDialog = () => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useSnackbar();
  const currentUser = JSON.parse(localStorage.getItem("userData") || "{}");
  const isAdmin = currentUser.role === "admin";
  const theme = useTheme();

  const { dialogOpen, inputData, selectedNotebook, dialogMode } = useSelector(
    (state) => state.notebook
  );
  const [errors, setErrors] = useState({});

  const [addNotebook, { isLoading: isAdding }] = useAddNotebookMutation();
  const [updateNotebook, { isLoading: isUpdating }] = useUpdateNotebookMutation();

  // Fetch sales list for admin
  const { data: userData } = useGetAllUserQuery(
    { per_page: 1000 },
    {
      skip: !isAdmin && dialogMode !== "view",
    }
  );
  const salesList = userData?.data || [];

  const handleClose = () => {
    dispatch(setDialogOpen(false));
    setErrors({});
    // dispatch(resetForm());
    setTimeout(() => dispatch(resetForm()), 150);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    dispatch(updateInputData({ [name]: type === "checkbox" ? checked : value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleOnlineToggle = (val) => {
    dispatch(updateInputData({ nb_is_online: val }));
  };

  const handleSubmit = async () => {
    try {
      setErrors({});
      // Validate Data
      const validatedData = validationSchema.validateSync(inputData, {
        abortEarly: false,
      });

      // Prepare submit data
      let submitData = { ...validatedData };

      if (!isAdmin && dialogMode === "create") {
        submitData.nb_manage_by = currentUser.user_id;
      }

      if (dialogMode === "create") {
        await addNotebook(submitData).unwrap();
        showSuccess("บันทึกข้อมูลสำเร็จ");
      } else {
        await updateNotebook({
          id: selectedNotebook.id,
          ...submitData,
        }).unwrap();
        showSuccess("อัปเดตข้อมูลสำเร็จ");
      }
      handleClose();
    } catch (error) {
      if (error.name === "ValidationError") {
        const newErrors = {};
        error.inner.forEach((err) => {
          newErrors[err.path] = err.message;
        });
        setErrors(newErrors);
      } else {
        showError("เกิดข้อผิดพลาด: " + (error?.data?.message || "ไม่สามารถบันทึกได้"));
      }
    }
  };

  useEffect(() => {
    if (selectedNotebook && dialogMode === "edit") {
      dispatch(
        setInputData({
          nb_date: selectedNotebook.nb_date,
          nb_time: selectedNotebook.nb_time,
          nb_customer_name: selectedNotebook.nb_customer_name,
          nb_is_online: selectedNotebook.nb_is_online,
          nb_additional_info: selectedNotebook.nb_additional_info,
          nb_contact_number: selectedNotebook.nb_contact_number,
          nb_email: selectedNotebook.nb_email,
          nb_contact_person: selectedNotebook.nb_contact_person,
          nb_action: selectedNotebook.nb_action,
          nb_status: selectedNotebook.nb_status,
          nb_remarks: selectedNotebook.nb_remarks,
          nb_manage_by: selectedNotebook.nb_manage_by,
        })
      );
    } else if (dialogMode === "create" && !isAdmin) {
      // Set default manage_by for non-admin
      dispatch(updateInputData({ nb_manage_by: currentUser.user_id }));
    }
  }, [selectedNotebook, dialogMode, dispatch, isAdmin, currentUser.user_id]);

  return (
    <Dialog
      open={dialogOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <StyledDialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {dialogMode === "create" ? <MdEditDocument size={24} /> : <MdEdit size={24} />}
          {dialogMode === "create" ? "จดบันทึกใหม่" : "แก้ไขบันทึก"}
        </Box>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#FAFAFA" }}>
        <Grid container spacing={3}>
          {/* 1. Header Section: Date, Time, Online, Manage By */}
          <Grid item xs={12}>
            <StyledPaper>
              <Grid container spacing={3} alignItems="center">
                {/* Sale Rep Info */}
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isAdmin ? "transparent" : "primary.light",
                      color: isAdmin ? "inherit" : "primary.dark",
                      border: isAdmin ? "none" : "1px dashed",
                      borderColor: "primary.main",
                    }}
                  >
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: "white",
                        borderRadius: "50%",
                        boxShadow: 1,
                        display: "flex",
                      }}
                    >
                      <MdSupervisorAccount size={20} color={theme.palette.primary.main} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        ผู้ดูแล (Sales Rep)
                      </Typography>
                      {isAdmin ? (
                        <FormControl fullWidth size="small" variant="standard">
                          <Select
                            disableUnderline
                            name="nb_manage_by"
                            value={inputData.nb_manage_by || ""}
                            onChange={handleChange}
                            sx={{ fontWeight: 600, fontSize: "1rem" }}
                            displayEmpty
                          >
                            <MenuItem value="" disabled>
                              <em>เลือกเซลล์</em>
                            </MenuItem>
                            {salesList.map((user) => (
                              <MenuItem key={user.user_id} value={user.user_id}>
                                {user.username || user.user_nickname || `User ${user.user_id}`}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="subtitle1" fontWeight={600}>
                          {currentUser.username || "คุณ"}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    justifyContent="flex-end"
                    alignItems="center"
                  >
                    <TextField
                      type="date"
                      label="วันที่"
                      name="nb_date"
                      value={inputData.nb_date || ""}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      sx={{ minWidth: 150 }}
                      error={!!errors.nb_date}
                      helperText={errors.nb_date}
                    />
                    <TextField
                      type="time"
                      label="เวลา"
                      name="nb_time"
                      value={inputData.nb_time || ""}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      sx={{ minWidth: 120 }}
                      error={!!errors.nb_time}
                      helperText={errors.nb_time}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        bgcolor: "grey.200",
                        borderRadius: 10,
                        p: 0.25,
                      }}
                    >
                      <Button
                        size="small"
                        variant={inputData.nb_is_online ? "contained" : "text"}
                        color="success"
                        sx={{
                          borderRadius: 10,
                          px: 1,
                          py: 0.25,
                          minWidth: 0,
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap",
                          boxShadow: inputData.nb_is_online ? 2 : 0,
                          backgroundColor: inputData.nb_is_online ? "success.main" : "transparent",
                          color: inputData.nb_is_online ? "white" : "text.secondary",
                          "&:hover": {
                            backgroundColor: inputData.nb_is_online ? "success.dark" : "grey.300",
                          },
                        }}
                        onClick={() => handleOnlineToggle(true)}
                      >
                        Online
                      </Button>
                      <Button
                        size="small"
                        variant={!inputData.nb_is_online ? "contained" : "text"}
                        color="warning"
                        sx={{
                          borderRadius: 10,
                          px: 1,
                          py: 0.25,
                          minWidth: 0,
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap",
                          boxShadow: !inputData.nb_is_online ? 2 : 0,
                          backgroundColor: !inputData.nb_is_online ? "warning.main" : "transparent",
                          color: !inputData.nb_is_online ? "white" : "text.secondary",
                          "&:hover": {
                            backgroundColor: !inputData.nb_is_online ? "warning.dark" : "grey.300",
                          },
                        }}
                        onClick={() => handleOnlineToggle(false)}
                      >
                        On-site
                      </Button>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </StyledPaper>
          </Grid>

          {/* 2. Customer Information */}
          <Grid item xs={12}>
            <SectionTitle>
              <MdBusiness style={{ fontSize: "1.1rem" }} />
              ข้อมูลลูกค้า
            </SectionTitle>
            <StyledPaper>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ชื่อลูกค้า / บริษัท"
                    name="nb_customer_name"
                    value={inputData.nb_customer_name || ""}
                    onChange={handleChange}
                    placeholder="ระบุชื่อลูกค้า หรือบริษัท"
                    error={!!errors.nb_customer_name}
                    helperText={errors.nb_customer_name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdBusiness color={theme.palette.action.active} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ชื่อผู้ติดต่อ (Contact Person)"
                    name="nb_contact_person"
                    value={inputData.nb_contact_person || ""}
                    onChange={handleChange}
                    error={!!errors.nb_contact_person}
                    helperText={errors.nb_contact_person}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdPerson color={theme.palette.action.active} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="เบอร์ติดต่อ"
                    name="nb_contact_number"
                    value={inputData.nb_contact_number || ""}
                    onChange={handleChange}
                    error={!!errors.nb_contact_number}
                    helperText={errors.nb_contact_number}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdPhone color={theme.palette.action.active} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="E-mail"
                    name="nb_email"
                    value={inputData.nb_email || ""}
                    onChange={handleChange}
                    error={!!errors.nb_email}
                    helperText={errors.nb_email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdEmail color={theme.palette.action.active} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </StyledPaper>
          </Grid>

          {/* 3. Status & Tracking */}
          <Grid item xs={12}>
            <SectionTitle>
              <MdAssignment style={{ fontSize: "1.1rem" }} />
              สถานะและการติดตาม
            </SectionTitle>
            <StyledPaper sx={{ borderLeft: `6px solid ${theme.palette.info.main}` }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="สถานะปัจจุบัน"
                    name="nb_status"
                    value={inputData.nb_status || ""}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdDonutLarge color={theme.palette.info.main} />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="พิจารณา">พิจารณา</MenuItem>
                    <MenuItem value="ได้งาน">ได้งาน</MenuItem>
                    <MenuItem value="หลุด">หลุด</MenuItem>
                    <MenuItem value="ไม่ได้งาน">ไม่ได้งาน</MenuItem>
                    <MenuItem value="ยังไม่แผนทำ">ยังไม่แผนทำ</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="สิ่งที่ต้องทำถัดไป (Next Action)"
                    name="nb_action"
                    value={inputData.nb_action || ""}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdNextPlan color={theme.palette.warning.main} />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="โทร">โทร</MenuItem>
                    <MenuItem value="ส่งเมล/Company Profile">ส่งเมล/Company Profile</MenuItem>
                    <MenuItem value="ลูกค้ามาพบ">ลูกค้ามาพบ</MenuItem>
                    <MenuItem value="ส่งงานมา">ส่งงานมา</MenuItem>
                    <MenuItem value="ได้เข้าพบ">ได้เข้าพบ</MenuItem>
                  </TextField>
                </Grid>

                {/* 4. Details & Remarks */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="รายละเอียด / ข้อมูลเพิ่มเติม"
                    name="nb_additional_info"
                    value={inputData.nb_additional_info || ""}
                    onChange={handleChange}
                    placeholder="บันทึกรายละเอียดการพูดคุย หรือสิ่งที่ลูกค้าต้องการ..."
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={1}
                    label="หมายเหตุ (Internal Note)"
                    name="nb_remarks"
                    value={inputData.nb_remarks || ""}
                    onChange={handleChange}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdNote color={theme.palette.text.secondary} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </StyledPaper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: "#FAFAFA", borderTop: "1px solid #eee" }}>
        <Button onClick={handleClose} color="inherit" size="large" sx={{ mr: 2 }}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={<MdSave />}
          disabled={isAdding || isUpdating}
          size="large"
          sx={{
            px: 4,
            borderRadius: 8,
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          {isAdding || isUpdating ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotebookDialog;
