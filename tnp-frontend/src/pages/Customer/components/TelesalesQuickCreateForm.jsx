import React, { useRef, useEffect } from "react";
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
import {
  Save as SaveIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

import { QUICK_NOTE_TEMPLATES } from "../constants/quickNoteTemplates";
import { channelMap } from "./UtilityComponents";
import { useTelesalesQuickForm } from "../hooks/useTelesalesQuickForm";

/**
 * TelesalesQuickCreateForm - Fast customer entry form for telesales
 *
 * 🎯 Features:
 * - 15+ fields including location (province, district, subdistrict)
 * - Quick notes templates
 * - Duplicate phone check
 * - Keyboard shortcuts (Ctrl+S, Ctrl+Shift+S)
 * - Auto-fill zip code from subdistrict
 * - Optional location fields with warning
 * - Optimistic UI for fast data entry
 *
 * ⚠️ Important: ไม่ใช้ Redux state ร่วมกับฟอร์มปกติเพื่อป้องกันการทับซ้อน
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onClose - Callback when dialog closes
 */
const TelesalesQuickCreateForm = ({ open, onClose }) => {
  // Refs
  const nameFieldRef = useRef(null);

  // Custom hook for all business logic (แยกจากฟอร์มปกติ)
  const {
    // Form state
    formData,
    fieldErrors,
    duplicateWarning,
    showLocationWarning,
    // Location data
    provinces,
    districts,
    subdistricts,
    isLoadingDistricts,
    isLoadingSubdistricts,
    // Business types
    businessTypesList,
    businessTypesIsFetching,
    // Loading state
    isLoading,
    // Handlers
    handleChange,
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
    handlePhoneBlur,
    handleSave,
    handleSaveAndNew,
    handleClose,
    setDuplicateWarning,
  } = useTelesalesQuickForm({ open, onClose, nameFieldRef });

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
  }, [open, handleSave, handleSaveAndNew]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="quick-form-title"
    >
      <DialogTitle id="quick-form-title">
        <Box display="flex" alignItems="center" gap={1}>
          เพิ่มลูกค้าด่วน (Telesales Quick Form)
          <Chip label="15+ ช่อง" size="small" color="success" />
        </Box>
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

          {/* ========== ที่อยู่ (Optional with Warning) ========== */}

          {/* Location Warning */}
          {showLocationWarning && (
            <Grid item xs={12}>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="body2">
                  <strong>แนะนำ:</strong> กรุณากรอกข้อมูลที่อยู่ (จังหวัด/อำเภอ/ตำบล)
                  เพื่อความสมบูรณ์ของข้อมูล
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Province */}
          <Grid item xs={12} sm={4}>
            <Autocomplete
              fullWidth
              options={provinces}
              getOptionLabel={(option) => option.pro_name_th || ""}
              value={provinces.find((p) => p.pro_id === formData.cus_pro_id) || null}
              onChange={handleProvinceChange}
              isOptionEqualToValue={(option, value) => option.pro_id === value.pro_id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="จังหวัด"
                  placeholder="เลือกจังหวัด"
                  helperText="ไม่บังคับ แต่แนะนำให้กรอก"
                  inputProps={{
                    ...params.inputProps,
                    tabIndex: 8,
                    "aria-label": "จังหวัด",
                  }}
                />
              )}
            />
          </Grid>

          {/* District */}
          <Grid item xs={12} sm={4}>
            <Autocomplete
              fullWidth
              options={districts}
              loading={isLoadingDistricts}
              disabled={!formData.cus_pro_id}
              getOptionLabel={(option) => option.dis_name || ""}
              value={districts.find((d) => d.dis_id === formData.cus_dis_id) || null}
              onChange={handleDistrictChange}
              isOptionEqualToValue={(option, value) => option.dis_id === value.dis_id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="อำเภอ/เขต"
                  placeholder={formData.cus_pro_id ? "เลือกอำเภอ/เขต" : "เลือกจังหวัดก่อน"}
                  inputProps={{
                    ...params.inputProps,
                    tabIndex: 9,
                    "aria-label": "อำเภอหรือเขต",
                  }}
                />
              )}
            />
          </Grid>

          {/* Subdistrict */}
          <Grid item xs={12} sm={4}>
            <Autocomplete
              fullWidth
              options={subdistricts}
              loading={isLoadingSubdistricts}
              disabled={!formData.cus_dis_id}
              getOptionLabel={(option) => option.sub_name || ""}
              value={subdistricts.find((s) => s.sub_id === formData.cus_sub_id) || null}
              onChange={handleSubdistrictChange}
              isOptionEqualToValue={(option, value) => option.sub_id === value.sub_id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="ตำบล/แขวง"
                  placeholder={formData.cus_dis_id ? "เลือกตำบล/แขวง" : "เลือกอำเภอก่อน"}
                  inputProps={{
                    ...params.inputProps,
                    tabIndex: 10,
                    "aria-label": "ตำบลหรือแขวง",
                  }}
                />
              )}
            />
          </Grid>

          {/* Address Detail */}
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="รายละเอียดที่อยู่"
              multiline
              rows={2}
              value={formData.cus_address}
              onChange={handleChange("cus_address")}
              placeholder="เลขที่ ซอย ถนน"
              inputProps={{ tabIndex: 11, "aria-label": "รายละเอียดที่อยู่" }}
            />
          </Grid>

          {/* Zip Code - Auto-fill from subdistrict but allow override */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="รหัสไปรษณีย์"
              value={formData.cus_zip_code}
              onChange={handleChange("cus_zip_code")}
              placeholder="10110"
              helperText={formData.cus_sub_id ? "เติมอัตโนมัติจากตำบล" : ""}
              inputProps={{
                tabIndex: 12,
                maxLength: 5,
                pattern: "[0-9]{5}",
                "aria-label": "รหัสไปรษณีย์",
              }}
            />
          </Grid>

          {/* ========== ข้อมูลเพิ่มเติม (Optional) ========== */}

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
                    tabIndex: 13,
                    "aria-label": "หมายเหตุ",
                  }}
                />
              )}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={formData.cus_email}
              onChange={handleChange("cus_email")}
              placeholder="example@email.com"
              inputProps={{ tabIndex: 14, "aria-label": "อีเมล" }}
            />
          </Grid>

          {/* Tax ID */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="เลขประจำตัวผู้เสียภาษี"
              value={formData.cus_tax_id}
              onChange={handleChange("cus_tax_id")}
              helperText="13 หลัก (ไม่บังคับ)"
              placeholder="1234567890123"
              inputProps={{
                tabIndex: 15,
                maxLength: 13,
                pattern: "[0-9]{13}",
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
        <Button onClick={handleClose} disabled={isLoading} tabIndex={16}>
          ยกเลิก
        </Button>
        <Button
          variant="outlined"
          onClick={handleSave}
          disabled={isLoading}
          startIcon={<SaveIcon />}
          tabIndex={17}
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
          tabIndex={18}
          aria-label="บันทึกและเพิ่มลูกค้าใหม่ (Ctrl+Shift+S)"
        >
          บันทึก & เพิ่มใหม่
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TelesalesQuickCreateForm;
