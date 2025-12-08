import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Alert,
  Box,
  Typography,
  Autocomplete,
} from "@mui/material";
import { Save as SaveIcon, Add as AddIcon, Warning as WarningIcon } from "@mui/icons-material";

import { QUICK_NOTE_TEMPLATES } from "../constants/quickNoteTemplates";
import { channelMap } from "./UtilityComponents";
import {
  useAddCustomerMutation,
  useGetAllCustomerQuery,
} from "../../../features/Customer/customerApi";
import { useGetAllBusinessTypesQuery } from "../../../features/globalApi";

/**
 * TelesalesQuickCreateForm - Fast customer entry form for telesales with accessibility
 * Features: 12 fields, quick notes, duplicate check, keyboard shortcuts, optimistic UI
 */
const TelesalesQuickCreateForm = ({ open, onClose }) => {
  const user = JSON.parse(localStorage.getItem("userData"));

  // Initial form state
  const initialFormData = {
    cus_name: "",
    cus_firstname: "",
    cus_lastname: "",
    cus_tel_1: "",
    cus_company: "",
    cus_bt_id: "",
    cus_channel: 1,
    cd_note: "",
    cus_email: "",
    cus_address: "",
    cus_tax_id: "",
  };

  // State management
  const [formData, setFormData] = useState(initialFormData);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Refs
  const nameFieldRef = useRef(null);

  // API hooks
  const [addCustomer, { isLoading }] = useAddCustomerMutation();
  const { data: businessTypesData, isFetching: businessTypesIsFetching } =
    useGetAllBusinessTypesQuery();

  const businessTypesList = businessTypesData || [];

  // For duplicate check - using query with skip and refetch
  const { refetch: checkDuplicate } = useGetAllCustomerQuery(
    {
      search: formData.cus_tel_1,
      page: 0,
      per_page: 5,
    },
    {
      skip: true, // Don't auto-fetch
    }
  );

  // Auto-focus on first field when dialog opens
  useEffect(() => {
    if (open && nameFieldRef.current) {
      setTimeout(() => {
        nameFieldRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handler = (e) => {
      // Ctrl+S: Save
      if (e.ctrlKey && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+Shift+S: Save & Create Another
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        handleSaveAndNew();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, formData]);

  // Handle input changes
  const handleChange = (field) => (e) => {
    const value = e.target?.value !== undefined ? e.target.value : e;
    setFormData({ ...formData, [field]: value });

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: null });
    }
  };

  // Handle phone blur - check for duplicates
  const handlePhoneBlur = async () => {
    const phone = formData.cus_tel_1.trim();

    // Validate phone format
    if (phone && phone.match(/^0\d{9}$/)) {
      try {
        const result = await checkDuplicate();
        if (result.data?.data?.length > 0) {
          setDuplicateWarning(result.data.data[0]);
        } else {
          setDuplicateWarning(null);
        }
      } catch (error) {
        console.error("Failed to check duplicate", error);
      }
    } else if (phone) {
      setFieldErrors({
        ...fieldErrors,
        cus_tel_1: "รูปแบบเบอร์โทรไม่ถูกต้อง (ต้องเป็น 0812345678)",
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.cus_name.trim()) {
      errors.cus_name = "กรุณากรอกชื่อเล่น";
    }

    if (!formData.cus_firstname.trim()) {
      errors.cus_firstname = "กรุณากรอกชื่อจริง";
    }

    if (!formData.cus_lastname.trim()) {
      errors.cus_lastname = "กรุณากรอกนามสกุล";
    }

    if (!formData.cus_tel_1.trim()) {
      errors.cus_tel_1 = "กรุณากรอกเบอร์โทร";
    } else if (!formData.cus_tel_1.match(/^0\d{9}$/)) {
      errors.cus_tel_1 = "รูปแบบเบอร์โทรไม่ถูกต้อง (10 หลัก)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await addCustomer({
        ...formData,
        source: "telesales",
        allocation_status: "pool",
        cus_created_by: user.user_id,
        cus_manage_by: null,
        is_possible_duplicate: !!duplicateWarning,
      }).unwrap();

      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to add customer", error);
      setFieldErrors({ submit: error.data?.message || "เกิดข้อผิดพลาดในการบันทึก" });
    }
  };

  // Handle save and create another
  const handleSaveAndNew = async () => {
    if (!validateForm()) return;

    try {
      await addCustomer({
        ...formData,
        source: "telesales",
        allocation_status: "pool",
        cus_created_by: user.user_id,
        cus_manage_by: null,
        is_possible_duplicate: !!duplicateWarning,
      }).unwrap();

      // Optimistic reset - <100ms target
      setTimeout(() => {
        resetForm();
        nameFieldRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error("Failed to add customer", error);
      setFieldErrors({ submit: error.data?.message || "เกิดข้อผิดพลาดในการบันทึก" });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setDuplicateWarning(null);
    setFieldErrors({});
  };

  // Handle dialog close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="quick-form-title"
    >
      <DialogTitle id="quick-form-title">
        เพิ่มลูกค้าด่วน (Telesales Quick Form) <Chip label="12 ช่อง" size="small" color="success" />
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Name - Required */}
          <Grid item xs={12}>
            <TextField
              inputRef={nameFieldRef}
              required
              fullWidth
              label="ชื่อเล่น"
              value={formData.cus_name}
              onChange={handleChange("cus_name")}
              error={!!fieldErrors.cus_name}
              helperText={fieldErrors.cus_name}
              placeholder="เช่น ABC, บริษัท ABC"
              inputProps={{
                tabIndex: 1,
                "aria-required": true,
                "aria-label": "ชื่อเล่น",
              }}
            />
          </Grid>

          {/* Firstname - Required */}
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="ชื่อจริง"
              value={formData.cus_firstname}
              onChange={handleChange("cus_firstname")}
              error={!!fieldErrors.cus_firstname}
              helperText={fieldErrors.cus_firstname}
              placeholder="เช่น สมชาย"
              inputProps={{
                tabIndex: 2,
                "aria-required": true,
                "aria-label": "ชื่อจริง",
              }}
            />
          </Grid>

          {/* Lastname - Required */}
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="นามสกุล"
              value={formData.cus_lastname}
              onChange={handleChange("cus_lastname")}
              error={!!fieldErrors.cus_lastname}
              helperText={fieldErrors.cus_lastname}
              placeholder="เช่น ใจดี"
              inputProps={{
                tabIndex: 3,
                "aria-required": true,
                "aria-label": "นามสกุล",
              }}
            />
          </Grid>

          {/* Phone - Required */}
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="เบอร์โทร"
              value={formData.cus_tel_1}
              onChange={handleChange("cus_tel_1")}
              onBlur={handlePhoneBlur}
              error={!!fieldErrors.cus_tel_1}
              helperText={fieldErrors.cus_tel_1 || "รูปแบบ: 0812345678 (10 หลัก)"}
              inputProps={{
                tabIndex: 4,
                pattern: "0[0-9]{9}",
                maxLength: 10,
                "aria-required": true,
                "aria-label": "เบอร์โทรศัพท์",
                "aria-describedby": duplicateWarning ? "duplicate-warning" : undefined,
              }}
            />
          </Grid>

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <Grid item xs={12}>
              <Alert
                severity="warning"
                onClose={() => setDuplicateWarning(null)}
                id="duplicate-warning"
                role="alert"
                icon={<WarningIcon />}
              >
                พบเบอร์โทรนี้ในระบบแล้ว: <strong>{duplicateWarning.cus_name}</strong>
                <br />
                <Typography variant="caption">
                  คุณสามารถบันทึกต่อได้ (ระบบจะ Flag เป็น Possible Duplicate)
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Business Type */}
          <Grid item xs={12}>
            <Autocomplete
              fullWidth
              loading={businessTypesIsFetching}
              options={businessTypesList}
              getOptionLabel={(option) => option.bt_name || ""}
              value={businessTypesList.find((type) => type.bt_id === formData.cus_bt_id) || null}
              onChange={(event, newValue) => {
                handleChange("cus_bt_id")(newValue ? newValue.bt_id : "");
              }}
              isOptionEqualToValue={(option, value) => option.bt_id === value.bt_id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="ประเภทธุรกิจ"
                  placeholder="ค้นหาและเลือกปราะเภทธุรกิจ..."
                  error={!!fieldErrors.cus_bt_id}
                  helperText={fieldErrors.cus_bt_id}
                  inputProps={{
                    ...params.inputProps,
                    tabIndex: 5,
                    "aria-label": "ประเภทธุรกิจ",
                  }}
                />
              )}
            />
          </Grid>

          {/* Company */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="บริษัท"
              value={formData.cus_company}
              onChange={handleChange("cus_company")}
              placeholder="เช่น บริษัท ABC จำกัด"
              inputProps={{ tabIndex: 6, "aria-label": "บริษัท" }}
            />
          </Grid>

          {/* Channel */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="channel-label">ช่องทาง</InputLabel>
              <Select
                labelId="channel-label"
                label="ช่องทาง"
                value={formData.cus_channel}
                onChange={handleChange("cus_channel")}
                inputProps={{ tabIndex: 7, "aria-label": "ช่องทางการติดต่อ" }}
              >
                {Object.entries(channelMap).map(([value, label]) => (
                  <MenuItem key={value} value={parseInt(value)}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Note with Quick Templates */}
          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={QUICK_NOTE_TEMPLATES}
              value={formData.cd_note}
              onChange={(e, newValue) => handleChange("cd_note")(newValue || "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="หมายเหตุ"
                  multiline
                  rows={3}
                  helperText="เลือก Template หรือพิมพ์เอง"
                  inputProps={{
                    ...params.inputProps,
                    tabIndex: 8,
                    "aria-label": "หมายเหตุ",
                  }}
                />
              )}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={formData.cus_email}
              onChange={handleChange("cus_email")}
              inputProps={{ tabIndex: 9, "aria-label": "อีเมล" }}
            />
          </Grid>

          {/* Address */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="ที่อยู่"
              multiline
              rows={2}
              value={formData.cus_address}
              onChange={handleChange("cus_address")}
              inputProps={{ tabIndex: 10, "aria-label": "ที่อยู่" }}
            />
          </Grid>

          {/* Tax ID */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="เลขประจำตัวผู้เสียภาษี"
              value={formData.cus_tax_id}
              onChange={handleChange("cus_tax_id")}
              helperText="13 หลัก (ไม่บังคับ)"
              inputProps={{
                tabIndex: 11,
                maxLength: 13,
                "aria-label": "เลขประจำตัวผู้เสียภาษี",
              }}
            />
          </Grid>

          {/* Submit Error */}
          {fieldErrors.submit && (
            <Grid item xs={12}>
              <Alert severity="error">{fieldErrors.submit}</Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          ยกเลิก
        </Button>
        <Button
          variant="outlined"
          onClick={handleSave}
          disabled={isLoading}
          startIcon={<SaveIcon />}
          tabIndex={12}
          aria-label="บันทึกลูกค้า (Ctrl+S)"
        >
          บันทึก
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveAndNew}
          disabled={isLoading}
          startIcon={<SaveIcon />}
          endIcon={<AddIcon />}
          tabIndex={13}
          aria-label="บันทึกและเพิ่มลูกค้าใหม่ (Ctrl+Shift+S)"
        >
          บันทึก & เพิ่มใหม่
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TelesalesQuickCreateForm;
