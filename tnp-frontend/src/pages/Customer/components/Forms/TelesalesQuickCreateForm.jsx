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
  IconButton,
  Divider,
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
} from "@mui/material";
import {
  MdSave,
  MdCancel,
  MdClose,
  MdAdd,
  MdPerson,
  MdBusiness,
  MdLocationOn,
  MdNote,
} from "react-icons/md";
import { Warning as WarningIcon, Info as InfoIcon } from "@mui/icons-material";

// Constants (relative path from Forms/)
import { QUICK_NOTE_TEMPLATES } from "../../constants/quickNoteTemplates";

// Common components (relative path from Forms/)
import { channelMap } from "../Common/UtilityComponents";

// Hooks (relative path from Forms/)
import { useTelesalesQuickForm } from "../../hooks";

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
    showLocationWarning,
    // Duplicate states
    duplicateDialogOpen,
    duplicateDialogData,
    companyWarning,
    isPhoneBlocked, //  NEW: For disabling save button
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
    handleCompanyBlur,
    handleCloseDuplicateDialog,
    handleSave,
    handleSaveAndNew,
    handleClose,
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

  // Section Header Component
  const SectionHeader = ({ icon, title }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, mt: 1 }}>
      {icon}
      <Typography variant="subtitle1" fontWeight={600} color="#9e0000" sx={{ fontFamily: "Kanit" }}>
        {title}
      </Typography>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="quick-form-title"
      PaperProps={{
        sx: {
          display: "flex",
          flexDirection: "column",
          width: { xs: "95vw", sm: "90vw", md: "80vw" },
          maxWidth: { xs: "95vw", sm: "90vw", md: "900px" },
          margin: { xs: "10px", sm: "20px" },
          height: { xs: "95vh", sm: "auto" },
          maxHeight: { xs: "95vh", sm: "90vh" },
        },
      }}
    >
      {/* Dialog Header - Matching DialogForm Style */}
      <DialogTitle
        id="quick-form-title"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#9e0000",
          color: "white",
          py: { xs: 1, sm: 2 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <span
          style={{
            fontFamily: "Kanit",
            fontWeight: 600,
            fontSize: "1.1rem",
            color: "white",
          }}
        >
          เพิ่มลูกค้าด่วน (Telesales)
        </span>
        <IconButton onClick={handleClose} sx={{ color: "white", p: { xs: 1, sm: 1.5 } }}>
          <MdClose size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ flex: 1, overflowY: "auto", p: { xs: 2, sm: 3 }, bgcolor: "#fafafa" }}
      >
        {/* ========== ข้อมูลหลัก (Required) ========== */}
        <SectionHeader icon={<MdPerson size={20} color="#9e0000" />} title="ข้อมูลหลัก" />
        <Grid container spacing={2}>
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
              error={!!fieldErrors.cus_tel_1 || isPhoneBlocked}
              helperText={
                fieldErrors.cus_tel_1 ||
                (isPhoneBlocked
                  ? `⚠️ เบอร์ซ้ำกับ ${duplicateDialogData?.cus_name} (แก้ไขเบอร์เพื่อบันทึกต่อ)`
                  : "เบอร์มือถือ 10 หลัก หรือเบอร์บริษัท (เช่น 02-xxx-xxxx)")
              }
              inputProps={{
                tabIndex: 4,
                maxLength: 20,
                "aria-required": true,
                "aria-label": "เบอร์โทรศัพท์",
              }}
            />
          </Grid>
        </Grid>

        {/* ========== ข้อมูลธุรกิจ ========== */}
        <Divider sx={{ my: 3 }} />
        <SectionHeader icon={<MdBusiness size={20} color="#9e0000" />} title="ข้อมูลธุรกิจ" />
        <Grid container spacing={2}>
          {/* Business Type */}
          <Grid item xs={12} sm={6}>
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
                  placeholder="ค้นหาและเลือกประเภทธุรกิจ..."
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

          {/* Channel */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="channel-label">ช่องทาง</InputLabel>
              <Select
                labelId="channel-label"
                label="ช่องทาง"
                value={formData.cus_channel}
                onChange={handleChange("cus_channel")}
                inputProps={{ tabIndex: 6, "aria-label": "ช่องทางการติดต่อ" }}
              >
                {Object.entries(channelMap).map(([value, label]) => (
                  <MenuItem key={value} value={parseInt(value)}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Company */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="บริษัท"
              value={formData.cus_company}
              onChange={handleChange("cus_company")}
              onBlur={handleCompanyBlur}
              placeholder="เช่น บริษัท ABC จำกัด"
              inputProps={{ tabIndex: 7, "aria-label": "บริษัท" }}
            />
          </Grid>

          {/* Company Warning Alert */}
          {companyWarning && (
            <Grid item xs={12}>
              <Alert
                severity="warning"
                onClose={() => setCompanyWarning(null)}
                icon={<WarningIcon />}
              >
                <Typography variant="body2">
                  <strong>พบชื่อบริษัทคล้ายกันในระบบ ({companyWarning.count} รายการ)</strong>
                </Typography>
                {companyWarning.examples.map((ex, idx) => (
                  <Typography key={idx} variant="caption" display="block" sx={{ mt: 0.5 }}>
                    • {ex.cus_company} ({ex.cus_name}) - ผู้ดูแล: {ex.sales_name}
                  </Typography>
                ))}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  คุณสามารถบันทึกต่อได้ (ระบบจะ Flag เป็น Possible Duplicate)
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
        {/* ========== ที่อยู่ (Optional) ========== */}
        <Divider sx={{ my: 3 }} />
        <SectionHeader
          icon={<MdLocationOn size={20} color="#9e0000" />}
          title="ที่อยู่ (ไม่บังคับ)"
        />

        {/* Location Warning */}
        {showLocationWarning && (
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>แนะนำ:</strong> กรุณากรอกข้อมูลที่อยู่ (จังหวัด/อำเภอ/ตำบล)
              เพื่อความสมบูรณ์ของข้อมูล
            </Typography>
          </Alert>
        )}

        <Grid container spacing={2}>
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
        </Grid>

        {/* ========== ข้อมูลเพิ่มเติม (Optional) ========== */}
        <Divider sx={{ my: 3 }} />
        <SectionHeader
          icon={<MdNote size={20} color="#9e0000" />}
          title="ข้อมูลเพิ่มเติม (ไม่บังคับ)"
        />
        <Grid container spacing={2}>
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
                  rows={2}
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

      {/* Action Buttons - Separated to opposite ends */}
      <DialogActions
        sx={{
          borderTop: "1px solid #e0e0e0",
          backgroundColor: "#fff",
          p: { xs: 1.5, sm: 2 },
          justifyContent: "space-between",
          flexDirection: { xs: "column-reverse", sm: "row" },
          gap: { xs: 1, sm: 1 },
        }}
      >
        <Button
          variant="outlined"
          color="error"
          onClick={handleClose}
          disabled={isLoading}
          startIcon={<MdCancel />}
          tabIndex={16}
          sx={{
            minWidth: { xs: "100%", sm: "120px" },
            fontFamily: "Kanit",
          }}
        >
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveAndNew}
          disabled={isLoading || isPhoneBlocked}
          startIcon={<MdSave />}
          endIcon={<MdAdd />}
          tabIndex={17}
          aria-label="บันทึกและเพิ่มลูกค้าใหม่ (Ctrl+Shift+S)"
          sx={{
            backgroundColor: isPhoneBlocked ? "#888" : "#9e0000",
            "&:hover": { backgroundColor: isPhoneBlocked ? "#888" : "#d32f2f" },
            minWidth: { xs: "100%", sm: "180px" },
            fontFamily: "Kanit",
            fontWeight: 600,
          }}
        >
          {isPhoneBlocked ? "เบอร์ซ้ำ" : "บันทึก & เพิ่มใหม่"}
        </Button>
      </DialogActions>

      {/* Duplicate Phone Dialog (Blocking) */}
      <MuiDialog open={duplicateDialogOpen} maxWidth="sm" fullWidth disableEscapeKeyDown>
        <MuiDialogTitle sx={{ bgcolor: "warning.light", color: "warning.contrastText" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon />
            <Typography variant="h6">พบเบอร์โทรนี้ในระบบแล้ว</Typography>
          </Box>
        </MuiDialogTitle>
        <MuiDialogContent sx={{ mt: 2 }}>
          {duplicateDialogData && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                เบอร์โทรนี้มีอยู่ในระบบแล้ว อาจเป็นลูกค้าคนเดียวกัน
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ชื่อลูกค้า
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {duplicateDialogData.cus_name}
                  </Typography>
                </Grid>

                {duplicateDialogData.cus_company && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      บริษัท
                    </Typography>
                    <Typography variant="body1">{duplicateDialogData.cus_company}</Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    เบอร์โทร
                  </Typography>
                  <Typography variant="body1">{duplicateDialogData.cus_tel_1}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ผู้ดูแลลูกค้า
                  </Typography>
                  <Typography variant="body1" color="primary.main" fontWeight="medium">
                    {duplicateDialogData.sales_fullname || duplicateDialogData.sales_name}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>คำแนะนำ:</strong> หากเป็นลูกค้าคนเดียวกัน ควรติดต่อ{" "}
                  <strong>{duplicateDialogData.sales_name}</strong> ก่อนดำเนินการ
                  <br />
                  หากยืนยันว่าเป็นคนละคน สามารถกดรับทราบและบันทึกต่อได้
                </Typography>
              </Box>
            </Box>
          )}
        </MuiDialogContent>
        <MuiDialogActions>
          <Button variant="contained" onClick={handleCloseDuplicateDialog} fullWidth size="large">
            รับทราบ (ดำเนินการต่อ)
          </Button>
        </MuiDialogActions>
      </MuiDialog>
    </Dialog>
  );
};

export default TelesalesQuickCreateForm;
