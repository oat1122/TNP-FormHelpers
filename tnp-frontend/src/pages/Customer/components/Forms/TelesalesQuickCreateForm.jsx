import React, { useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  TextField,
  Grid,
  Alert,
  Box,
  Typography,
  Autocomplete,
  Divider,
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Button,
} from "@mui/material";
import { MdPerson, MdBusiness, MdNote } from "react-icons/md";
import { Warning as WarningIcon, Info as InfoIcon } from "@mui/icons-material";

// Constants
import { QUICK_NOTE_TEMPLATES } from "../../constants/quickNoteTemplates";

// Shared UI Primitives
import { SectionHeader } from "./ui/SectionHeader";
import { StyledTextField, FORM_THEME } from "./ui/FormFields";

// Layout Components
import { DialogHeader, DialogActionsBar } from "./layout";

// Section Components
import { ContactPersonSection, ContactChannelsSection, AddressSection } from "./sections";

// Hooks
import { useTelesalesQuickForm } from "../../hooks";

/**
 * TelesalesQuickCreateForm - Fast customer entry form for telesales
 *
 * Refactored to use shared section components where applicable.
 * Some sections remain inline due to unique features (quick note templates, etc.)
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onClose - Callback when dialog closes
 */
const TelesalesQuickCreateForm = ({ open, onClose }) => {
  const nameFieldRef = useRef(null);

  const {
    formData,
    fieldErrors,
    showLocationWarning,
    duplicateDialogOpen,
    duplicateDialogData,
    companyWarning,
    isPhoneBlocked,
    provinces,
    districts,
    subdistricts,
    isLoadingDistricts,
    isLoadingSubdistricts,
    businessTypesList,
    businessTypesIsFetching,
    isLoading,
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
      if (e.ctrlKey && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        handleSaveAndNew();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleSave, handleSaveAndNew]);

  // Create adapter for section components (formData -> inputList pattern)
  const inputListAdapter = formData;
  const handleInputChangeAdapter = (e) => {
    const { name, value } = e.target;
    handleChange(name)(value);
  };

  // Wrapped handlers for location that work with section's onChange signature
  const handleProvinceChangeAdapter = (event, newValue) => {
    handleProvinceChange(event, newValue);
  };

  const handleDistrictChangeAdapter = (event, newValue) => {
    handleDistrictChange(event, newValue);
  };

  const handleSubdistrictChangeAdapter = (event, newValue) => {
    handleSubdistrictChange(event, newValue);
  };

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
      {/* Dialog Header */}
      <DialogHeader mode="create" title="เพิ่มลูกค้าด่วน (Telesales)" onClose={handleClose} />

      <DialogContent
        dividers
        sx={{ flex: 1, overflowY: "auto", p: { xs: 2, sm: 3 }, bgcolor: "#fafafa" }}
      >
        {/* ========== SECTION 1: ข้อมูลหลัก (Required) ========== */}
        <SectionHeader
          icon={<MdPerson size={20} color={FORM_THEME.PRIMARY_RED} />}
          title="ข้อมูลหลัก"
        />

        {/* Using ContactPersonSection for name fields */}
        <ContactPersonSection
          inputList={inputListAdapter}
          errors={fieldErrors}
          handleInputChange={handleInputChangeAdapter}
          mode="create"
          showHeader={false}
          nameFieldRef={nameFieldRef}
        />

        {/* Phone field using ContactChannelsSection */}
        <Box sx={{ mt: 2 }}>
          <ContactChannelsSection
            inputList={inputListAdapter}
            errors={fieldErrors}
            handleInputChange={handleInputChangeAdapter}
            mode="create"
            showHeader={false}
            showEmail={false}
            showChannel={false}
            onPhoneBlur={handlePhoneBlur}
            isPhoneBlocked={isPhoneBlocked}
            customPhoneHelperText={
              isPhoneBlocked
                ? `⚠️ เบอร์ซ้ำกับ ${duplicateDialogData?.cus_name} (แก้ไขเบอร์เพื่อบันทึกต่อ)`
                : "เบอร์มือถือ 10 หลัก หรือเบอร์บริษัท"
            }
          />
        </Box>

        {/* ========== SECTION 2: ข้อมูลธุรกิจ ========== */}
        <Divider sx={{ my: 3 }} />
        <SectionHeader
          icon={<MdBusiness size={20} color={FORM_THEME.PRIMARY_RED} />}
          title="ข้อมูลธุรกิจ"
        />

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
                  sx={{
                    "& .MuiInputBase-input": { fontFamily: "Kanit" },
                    "& .MuiInputLabel-root": { fontFamily: "Kanit" },
                  }}
                />
              )}
            />
          </Grid>

          {/* Channel - kept inline due to unique channelMap usage */}
          <Grid item xs={12} sm={6}>
            <StyledTextField
              mode="create"
              name="cus_channel"
              label="ช่องทาง"
              value="1"
              disabled
              helperText="Telesales (Auto)"
            />
          </Grid>

          {/* Company */}
          <Grid item xs={12}>
            <StyledTextField
              mode="create"
              name="cus_company"
              label="บริษัท"
              value={formData.cus_company || ""}
              onChange={(e) => handleChange("cus_company")(e.target.value)}
              onBlur={handleCompanyBlur}
              placeholder="เช่น บริษัท ABC จำกัด"
            />
          </Grid>

          {/* Company Warning Alert */}
          {companyWarning && (
            <Grid item xs={12}>
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="body2">
                  <strong>พบชื่อบริษัทคล้ายกันในระบบ ({companyWarning.count} รายการ)</strong>
                </Typography>
                {companyWarning.examples.map((ex, idx) => (
                  <Typography key={idx} variant="caption" display="block" sx={{ mt: 0.5 }}>
                    • {ex.cus_company} ({ex.cus_name}) - ผู้ดูแล: {ex.sales_name}
                  </Typography>
                ))}
              </Alert>
            </Grid>
          )}
        </Grid>

        {/* ========== SECTION 3: ที่อยู่ (Using AddressSection) ========== */}
        <Divider sx={{ my: 3 }} />

        {/* Location Warning */}
        {showLocationWarning && (
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>แนะนำ:</strong> กรุณากรอกข้อมูลที่อยู่เพื่อความสมบูรณ์ของข้อมูล
            </Typography>
          </Alert>
        )}

        <AddressSection
          inputList={{
            cus_address_detail: formData.cus_address,
            cus_pro_id: formData.cus_pro_id,
            cus_dis_id: formData.cus_dis_id,
            cus_sub_id: formData.cus_sub_id,
            cus_zip_code: formData.cus_zip_code,
          }}
          errors={fieldErrors}
          handleInputChange={(e) => {
            const { name, value } = e.target;
            // Map cus_address_detail back to cus_address for this form
            if (name === "cus_address_detail") {
              handleChange("cus_address")(value);
            } else {
              handleChange(name)(value);
            }
          }}
          handleProvinceChange={handleProvinceChangeAdapter}
          handleDistrictChange={handleDistrictChangeAdapter}
          handleSubdistrictChange={handleSubdistrictChangeAdapter}
          isLoadingDistricts={isLoadingDistricts}
          isLoadingSubdistricts={isLoadingSubdistricts}
          mode="create"
          provincesList={provinces}
          districtList={districts}
          subDistrictList={subdistricts}
          optional={true}
        />

        {/* ========== SECTION 4: ข้อมูลเพิ่มเติม ========== */}
        <Divider sx={{ my: 3 }} />
        <SectionHeader
          icon={<MdNote size={20} color={FORM_THEME.PRIMARY_RED} />}
          title="ข้อมูลเพิ่มเติม (ไม่บังคับ)"
        />

        <Grid container spacing={2}>
          {/* Note with Quick Templates - unique to Telesales */}
          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={QUICK_NOTE_TEMPLATES}
              value={formData.cd_note || ""}
              onChange={(e, newValue) => handleChange("cd_note")(newValue || "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="หมายเหตุ"
                  multiline
                  rows={2}
                  helperText="เลือก Template หรือพิมพ์เอง"
                  sx={{
                    "& .MuiInputBase-input": { fontFamily: "Kanit" },
                    "& .MuiInputLabel-root": { fontFamily: "Kanit" },
                  }}
                />
              )}
            />
          </Grid>

          {/* Email & Tax ID - kept inline with StyledTextField for Grid layout flexibility
              (ContactChannelsSection places Email next to Phone, but here we want Email next to Tax ID) */}
          <Grid item xs={12} sm={6}>
            <StyledTextField
              mode="create"
              name="cus_email"
              label="Email"
              type="email"
              value={formData.cus_email || ""}
              onChange={(e) => handleChange("cus_email")(e.target.value)}
              placeholder="example@email.com"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              mode="create"
              name="cus_tax_id"
              label="เลขประจำตัวผู้เสียภาษี"
              value={formData.cus_tax_id || ""}
              onChange={(e) => handleChange("cus_tax_id")(e.target.value)}
              helperText="13 หลัก (ไม่บังคับ)"
              placeholder="1234567890123"
              inputProps={{ maxLength: 13 }}
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

      {/* Action Buttons */}
      <DialogActionsBar
        mode="create"
        onClose={handleClose}
        onSave={handleSaveAndNew}
        saveLoading={isLoading}
        saveDisabled={isPhoneBlocked}
        showSaveAndNew={true}
      />

      {/* Duplicate Phone Dialog */}
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
