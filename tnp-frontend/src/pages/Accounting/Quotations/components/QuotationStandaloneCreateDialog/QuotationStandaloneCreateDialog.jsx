import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Typography,
  Divider,
  Grid,
  InputAdornment,
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
} from "@mui/icons-material";

// ⭐️ นำเข้า Hook หลัก
import { useQuotationStandaloneForm } from "./hooks/useQuotationStandaloneForm";

// Import new/modified components
import CustomerSelector from "./CustomerSelector";
import QuotationJobManager from "./QuotationJobManager";
import FinancialSummaryPanel from "./FinancialSummaryPanel";

const steps = ["ข้อมูลลูกค้า", "ข้อมูลใบเสนอราคา", "การคำนวณทางการเงิน(สรุปรวม)"];

/**
 * QuotationStandaloneCreateDialog (Dumb UI)
 * ทำหน้าที่เพียงแสดงผล UI และรับ props จาก useQuotationStandaloneForm
 */
const QuotationStandaloneCreateDialog = ({ open, onClose, onSuccess, companyId }) => {
  // เรียกใช้ Hook เพื่อดึง State และ Handlers
  const {
    activeStep,
    errors,
    apiError,
    formData,
    financials,
    selectedCustomer,
    companies,
    financialPanelItems,
    isLoading,
    isLoadingCompanies,
    handleNext,
    handleBack,
    handleSubmit,
    handleChange,
    handleJobsChange,
    handleFinancialsChange,
    setSelectedCustomer,
  } = useQuotationStandaloneForm({ open, onClose, onSuccess, companyId });

  // Logic การ render ถูกย้ายมานี่ แต่ใช้ State จาก Hook
  const renderStepContent = (step) => {
    switch (step) {
      case 0: // ข้อมูลลูกค้า
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="เลือกบริษัท"
              value={formData.company_id}
              onChange={(e) => handleChange("company_id", e.target.value)}
              required
              error={!!errors.company_id}
              helperText={errors.company_id}
              fullWidth
              select
              size="small"
              disabled={isLoadingCompanies}
              SelectProps={{ native: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon />
                  </InputAdornment>
                ),
              }}
            >
              <option value="">-- กรุณาเลือกบริษัท --</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.short_code})
                </option>
              ))}
            </TextField>

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon /> ข้อมูลลูกค้า
            </Typography>

            <CustomerSelector
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              error={!!errors.customer_id}
              helperText={errors.customer_id}
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="ชื่อบริษัท"
                  value={formData.customer_company}
                  onChange={(e) => handleChange("customer_company", e.target.value)}
                  required
                  error={!!errors.customer_company}
                  helperText={errors.customer_company}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: !!selectedCustomer,
                    sx: selectedCustomer ? { backgroundColor: "#f5f5f5" } : {},
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="เบอร์โทรศัพท์"
                  value={formData.customer_phone}
                  onChange={(e) => handleChange("customer_phone", e.target.value)}
                  required
                  error={!!errors.customer_phone}
                  helperText={errors.customer_phone}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: !!selectedCustomer,
                    sx: selectedCustomer ? { backgroundColor: "#f5f5f5" } : {},
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon /> ข้อมูลผู้ติดต่อ
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="ชื่อ"
                  value={formData.contact_firstname}
                  onChange={(e) => handleChange("contact_firstname", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: !!selectedCustomer,
                    sx: selectedCustomer ? { backgroundColor: "#f5f5f5" } : {},
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="นามสกุล"
                  value={formData.contact_lastname}
                  onChange={(e) => handleChange("contact_lastname", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: !!selectedCustomer,
                    sx: selectedCustomer ? { backgroundColor: "#f5f5f5" } : {},
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="ชื่อเล่น"
                  value={formData.contact_nickname}
                  onChange={(e) => handleChange("contact_nickname", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: !!selectedCustomer,
                    sx: selectedCustomer ? { backgroundColor: "#f5f5f5" } : {},
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="ตำแหน่ง/แผนก"
                  value={formData.contact_position}
                  onChange={(e) => handleChange("contact_position", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: !!selectedCustomer,
                    sx: selectedCustomer ? { backgroundColor: "#f5f5f5" } : {},
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="เบอร์โทรสำรอง"
                  value={formData.contact_phone_alt}
                  onChange={(e) => handleChange("contact_phone_alt", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: !!selectedCustomer,
                    sx: selectedCustomer ? { backgroundColor: "#f5f5f5" } : {},
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="อีเมล"
                  value={formData.customer_email}
                  onChange={(e) => handleChange("customer_email", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: !!selectedCustomer,
                    sx: selectedCustomer ? { backgroundColor: "#f5f5f5" } : {},
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="เลขประจำตัวผู้เสียภาษี"
                  value={formData.customer_tax_id}
                  onChange={(e) => handleChange("customer_tax_id", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: !!selectedCustomer,
                    sx: selectedCustomer ? { backgroundColor: "#f5f5f5" } : {},
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOnIcon /> ข้อมูลที่อยู่
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="ที่อยู่"
                  value={formData.customer_address}
                  onChange={(e) => handleChange("customer_address", e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  InputProps={{
                    readOnly: !!selectedCustomer,
                    sx: selectedCustomer ? { backgroundColor: "#f5f5f5" } : {},
                  }}
                />
              </Grid>
              {/* Add Province, District, Sub-district, Zipcode fields here if needed */}
              <Grid item xs={12} md={3}>
                <TextField
                  label="รหัสไปรษณีย์"
                  value={formData.customer_zip_code}
                  onChange={(e) => handleChange("customer_zip_code", e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: !!selectedCustomer,
                    sx: selectedCustomer ? { backgroundColor: "#f5f5f5" } : {},
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1: // ข้อมูลใบเสนอราคา
        const isCredit =
          formData.payment_terms === "credit_30" || formData.payment_terms === "credit_60";

        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">รายการงาน</Typography>
            {errors.jobs && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.jobs}
              </Alert>
            )}
            <QuotationJobManager jobs={formData.jobs} onChange={handleJobsChange} errors={errors} />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                label="เงื่อนไขการชำระเงิน"
                value={formData.payment_terms}
                onChange={(e) => handleChange("payment_terms", e.target.value)}
                fullWidth
                size="small"
                select
                SelectProps={{ native: true }}
              >
                <option value="credit_30">เครดิต 30 วัน</option>
                <option value="credit_60">เครดิต 60 วัน</option>
                <option value="cash">เงินสด</option>
                <option value="other">อื่นๆ (กำหนดเอง)</option>
              </TextField>

              {isCredit && (
                <TextField
                  label="วันครบกำหนด"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleChange("due_date", e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            </Box>

            {formData.payment_terms === "other" && (
              <TextField
                label="เงื่อนไขการชำระเงิน (กำหนดเอง)"
                value={formData.payment_terms_custom}
                onChange={(e) => handleChange("payment_terms_custom", e.target.value)}
                fullWidth
                placeholder="เช่น จ่าย 50% ก่อนเริ่มงาน, ส่วนที่เหลือ 30 วัน"
                size="small"
                required
              />
            )}

            <TextField
              label="ประเภทหัวกระดาษ"
              value={formData.document_header_type}
              onChange={(e) => handleChange("document_header_type", e.target.value)}
              fullWidth
              select
              SelectProps={{ native: true }}
              size="small"
            >
              <option value="ต้นฉบับ">ต้นฉบับ</option>
              <option value="สำเนา">สำเนา</option>
            </TextField>

            <TextField
              label="หมายเหตุ"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="หมายเหตุเพิ่มเติม..."
              size="small"
            />
          </Box>
        );

      case 2: // การคำนวณทางการเงิน(สรุปรวม)
        return (
          <Box>
            <FinancialSummaryPanel
              items={financialPanelItems}
              financials={financials}
              onChange={handleFinancialsChange}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "90vh" },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6">สร้างใบเสนอราคา (Standalone)</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {apiError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {apiError?.data?.message || "เกิดข้อผิดพลาด"}
          </Alert>
        )}

        <Box sx={{ minHeight: 400 }}>{renderStepContent(activeStep)}</Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Button onClick={onClose} disabled={isLoading}>
          ยกเลิก
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={isLoading}>
              ย้อนกลับ
            </Button>
          )}

          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              ถัดไป
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {isLoading ? "กำลังบันทึก..." : "สร้างใบเสนอราคา"}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default QuotationStandaloneCreateDialog;
