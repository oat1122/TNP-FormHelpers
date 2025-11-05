import React, { useState, useCallback, useEffect, useMemo } from "react";
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
import { useDispatch } from "react-redux";
import {
  useCreateStandaloneQuotationMutation,
  useGetCompaniesQuery,
} from "../../../../../features/Accounting/accountingApi";
import { addNotification } from "../../../../../features/Accounting/accountingSlice";

// Import new/modified components
import CustomerSelector from "./CustomerSelector";
import QuotationJobManager from "./QuotationJobManager"; // <-- New component
import FinancialSummaryPanel from "./FinancialSummaryPanel";

// Updated steps
const steps = ["ข้อมูลลูกค้า", "ข้อมูลใบเสนอราคา", "การคำนวณทางการเงิน(สรุปรวม)"];

const emptyFormData = {
  company_id: "",
  customer_id: "",
  payment_terms: "",
  due_date: "",
  notes: "",
  document_header_type: "ต้นฉบับ",
  jobs: [], // <-- Changed from 'items' to 'jobs'
  // Customer fields for Step 1
  customer_company: "",
  customer_phone: "",
  customer_type: "individual",
  contact_firstname: "",
  contact_lastname: "",
  contact_nickname: "",
  contact_position: "",
  contact_phone_alt: "",
  customer_email: "",
  customer_tax_id: "",
  customer_channel: "1",
  customer_business_type_id: "",
  customer_sales_user_id: "",
  customer_address: "",
  customer_province_id: "",
  customer_district_id: "",
  customer_subdistrict_id: "",
  customer_zip_code: "",
};

/**
 * QuotationStandaloneCreateDialog
 * Refactored with 3-step flow and job-based item management.
 */
const QuotationStandaloneCreateDialog = ({ open, onClose, onSuccess, companyId }) => {
  const dispatch = useDispatch();
  const [createQuotation, { isLoading, error }] = useCreateStandaloneQuotationMutation();

  // Fetch companies list
  const { data: companiesData, isLoading: isLoadingCompanies } = useGetCompaniesQuery();
  const companies = useMemo(() => companiesData?.data || [], [companiesData]);

  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(emptyFormData);

  // State for the full selected customer object
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Update company_id when prop changes
  useEffect(() => {
    if (companyId) {
      setFormData((prev) => ({ ...prev, company_id: companyId }));
    }
  }, [companyId]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setErrors({});
      setFormData({
        ...emptyFormData,
        company_id: companyId || "",
        jobs: [], // Ensure jobs are reset
      });
      setSelectedCustomer(null);
      setFinancials({
        special_discount_percentage: 0,
        special_discount_amount: 0,
        has_vat: true,
        vat_percentage: 7,
        has_withholding_tax: false,
        withholding_tax_percentage: 0,
        deposit_mode: "percentage",
        deposit_percentage: 0,
        deposit_amount: 0,
      });
    }
  }, [open, companyId]);

  // Effect to populate form when a customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      setFormData((prev) => ({
        ...prev,
        customer_id: selectedCustomer.cus_id,
        customer_company: selectedCustomer.cus_company || "",
        customer_phone: selectedCustomer.cus_tel_1 || "",
        customer_type: selectedCustomer.customer_type || "individual",
        contact_firstname: selectedCustomer.cus_firstname || "",
        contact_lastname: selectedCustomer.cus_lastname || "",
        contact_nickname: selectedCustomer.cus_name || "",
        contact_position: selectedCustomer.cus_depart || "",
        contact_phone_alt: selectedCustomer.cus_tel_2 || "",
        customer_email: selectedCustomer.cus_email || "",
        customer_tax_id: selectedCustomer.cus_tax_id || "",
        customer_channel: selectedCustomer.cus_channel || "1",
        customer_address: selectedCustomer.cus_address || "",
        customer_zip_code: selectedCustomer.cus_zip_code || "",
        // Note: other fields like business_type_id, sales_user_id, province, etc.
        // would also be populated here if they exist on the customer object.
      }));
    } else {
      // Clear fields if customer is deselected
      setFormData((prev) => ({
        ...prev,
        customer_id: "",
        customer_company: "",
        customer_phone: "",
        customer_type: "individual",
        contact_firstname: "",
        contact_lastname: "",
        contact_nickname: "",
        contact_position: "",
        contact_phone_alt: "",
        customer_email: "",
        customer_tax_id: "",
        customer_channel: "1",
        customer_address: "",
        customer_zip_code: "",
      }));
    }
  }, [selectedCustomer]);

  const [financials, setFinancials] = useState({
    special_discount_percentage: 0,
    special_discount_amount: 0,
    has_vat: true,
    vat_percentage: 7,
    has_withholding_tax: false,
    withholding_tax_percentage: 0,
    deposit_mode: "percentage",
    deposit_percentage: 0,
    deposit_amount: 0,
  });

  const handleChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleJobsChange = useCallback((jobs) => {
    setFormData((prev) => ({ ...prev, jobs }));
  }, []);

  const handleFinancialsChange = useCallback((newFinancials) => {
    setFinancials(newFinancials);
  }, []);

  // Flatten jobs into items for FinancialSummaryPanel
  const financialPanelItems = useMemo(() => {
    return formData.jobs.flatMap((job) =>
      job.sizeRows.map((row) => ({
        unit_price: row.unit_price || 0,
        quantity: row.quantity || 0,
        discount_amount: 0, // Standalone form doesn't have item-level discount
      }))
    );
  }, [formData.jobs]);

  // Validation
  const validateStep = useCallback(
    (step) => {
      const newErrors = {};

      if (step === 0) {
        if (!formData.company_id) newErrors.company_id = "กรุณาเลือกบริษัท";
        if (!formData.customer_id) newErrors.customer_id = "กรุณาเลือกลูกค้า";
        if (!formData.customer_company.trim()) newErrors.customer_company = "กรุณากรอกชื่อบริษัท";
        if (!formData.customer_phone.trim()) newErrors.customer_phone = "กรุณากรอกเบอร์โทรศัพท์";
      }

      if (step === 1) {
        if (formData.jobs.length === 0) {
          newErrors.jobs = "กรุณาเพิ่มงานอย่างน้อย 1 งาน";
        } else {
          formData.jobs.forEach((job, jobIndex) => {
            if (!job.work_name.trim()) {
              newErrors[`jobs.${jobIndex}.work_name`] = "กรุณากรอกชื่องาน";
            }
            if (job.sizeRows.length === 0) {
              newErrors[`jobs.${jobIndex}.sizeRows`] = "กรุณาเพิ่มอย่างน้อย 1 ขนาด";
            } else {
              job.sizeRows.forEach((row, rowIndex) => {
                if (!row.unit_price || row.unit_price <= 0) {
                  newErrors[`jobs.${jobIndex}.rows.${rowIndex}.unit_price`] = "กรุณากรอกราคา";
                }
                if (!row.quantity || row.quantity <= 0) {
                  newErrors[`jobs.${jobIndex}.rows.${rowIndex}.quantity`] = "กรุณากรอกจำนวน";
                }
              });
            }
          });
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    try {
      // Flatten jobs back to items for the API
      const itemsPayload = formData.jobs.flatMap((job, jobIndex) =>
        job.sizeRows.map((row, rowIndex) => ({
          item_name: job.work_name,
          item_description: "", // Can be added to job model if needed
          pattern: job.pattern,
          fabric_type: job.fabric_type,
          color: job.color,
          size: row.size,
          unit_price: row.unit_price,
          quantity: row.quantity,
          unit: job.unit,
          discount_percentage: 0,
          discount_amount: 0,
          notes: row.notes,
          sequence_order: jobIndex * 100 + rowIndex + 1, // Start from 1, not 0
        }))
      );

      const payload = {
        company_id: formData.company_id,
        customer_id: formData.customer_id,
        work_name: formData.jobs.map((j) => j.work_name).join(", "), // Main work_name from first job
        payment_terms: formData.payment_terms,
        due_date: formData.due_date,
        notes: formData.notes,
        document_header_type: formData.document_header_type,
        items: itemsPayload,
        ...financials,
        // Pass customer details if API supports override
        customer_details: {
          cus_company: formData.customer_company,
          cus_tel_1: formData.customer_phone,
          customer_type: formData.customer_type,
          cus_firstname: formData.contact_firstname,
          cus_lastname: formData.contact_lastname,
          cus_name: formData.contact_nickname,
          cus_depart: formData.contact_position,
          cus_tel_2: formData.contact_phone_alt,
          cus_email: formData.customer_email,
          cus_tax_id: formData.customer_tax_id,
          cus_address: formData.customer_address,
          cus_zip_code: formData.customer_zip_code,
        },
      };

      const result = await createQuotation(payload).unwrap();

      dispatch(
        addNotification({
          type: "success",
          message: `สร้างใบเสนอราคา ${result.data.number} สำเร็จ`,
        })
      );

      if (onSuccess) {
        onSuccess(result.data);
      }

      onClose();
    } catch (err) {
      console.error("Failed to create quotation:", err);
      dispatch(
        addNotification({
          type: "error",
          message: err?.data?.message || "เกิดข้อผิดพลาดในการสร้างใบเสนอราคา",
        })
      );
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // ข้อมูลลูกค้า
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Company Selector */}
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
              value={selectedCustomer} // <-- Pass object
              onChange={setSelectedCustomer} // <-- Receive object
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
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="นามสกุล"
                  value={formData.contact_lastname}
                  onChange={(e) => handleChange("contact_lastname", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="ชื่อเล่น"
                  value={formData.contact_nickname}
                  onChange={(e) => handleChange("contact_nickname", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="ตำแหน่ง/แผนก"
                  value={formData.contact_position}
                  onChange={(e) => handleChange("contact_position", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="เบอร์โทรสำรอง"
                  value={formData.contact_phone_alt}
                  onChange={(e) => handleChange("contact_phone_alt", e.target.value)}
                  fullWidth
                  size="small"
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
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1: // ข้อมูลใบเสนอราคา
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                label="เงื่อนไขการชำระเงิน"
                value={formData.payment_terms}
                onChange={(e) => handleChange("payment_terms", e.target.value)}
                fullWidth
                placeholder="เช่น เครดิต 30 วัน"
                size="small"
              />
              <TextField
                label="วันครบกำหนด"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>

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

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">รายการงาน</Typography>
            {errors.jobs && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.jobs}
              </Alert>
            )}
            <QuotationJobManager jobs={formData.jobs} onChange={handleJobsChange} errors={errors} />
          </Box>
        );

      case 2: // การคำนวณทางการเงิน(สรุปรวม)
        return (
          <Box>
            <FinancialSummaryPanel
              items={financialPanelItems} // <-- Pass flattened items
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error?.data?.message || "เกิดข้อผิดพลาด"}
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
