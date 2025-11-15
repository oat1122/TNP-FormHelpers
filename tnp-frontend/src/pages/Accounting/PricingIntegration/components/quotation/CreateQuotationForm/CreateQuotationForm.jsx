import {
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
} from "@mui/icons-material";
import {
  Box,
  Container,
  Grid,
  TextField,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  Alert,
} from "@mui/material";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// THEME & SHARED UI
import SpecialDiscountField from "./components/SpecialDiscountField";
import WithholdingTaxField from "./components/WithholdingTaxField";
import PricingModeSelector from "./components/PricingModeSelector";
import { useUploadQuotationSampleImagesTempMutation } from "../../../../../../features/Accounting/accountingApi";
import Calculation from "../../../../shared/components/Calculation";
import ImageUploadGrid from "../../../../shared/components/ImageUploadGrid";
import PaymentTerms from "../../../../shared/components/PaymentTerms";
import { useQuotationFinancials } from "../../../../shared/hooks/useQuotationFinancials";
import {
  sanitizeInt,
  sanitizeDecimal,
  createIntegerInputHandler,
  createDecimalInputHandler,
} from "../../../../shared/inputSanitizers";
import CustomerEditCard from "../../CustomerEditCard";
import PricingRequestNotesButton from "../../PricingRequestNotesButton";

import {
  Section,
  SectionHeader,
  PrimaryButton,
  SecondaryButton,
  InfoCard,
  tokens,
} from "../styles/quotationTheme";

// NEW COMPONENTS

// UTILS
import { formatTHB } from "../utils/currency";
import { formatDateTH } from "../utils/date";

// Default notes text
const DEFAULT_NOTES = `**ไม่สามารถหักภาษี ณ ที่จ่ายได้ เนื่องจากเป็นการซื้อมาขายไป**
มัดจำ50%ก่อนเริ่มงาน ชำระ50%ส่วนหลังก่อนส่งสินค้า`;

/**
 * CreateQuotationForm — restyled to match QuotationDetailDialog
 * - ใช้โครงแบบ Section, SectionHeader, InfoCard เดียวกัน
 * - ส่วนคำนวณราคา (Calculation) เพิ่มปุ่ม "แก้ไข/ยกเลิกแก้ไข" และกล่องแยกไซซ์เหมือน Dialog
 * - เงื่อนไขการชำระเงินปรับเป็น select + ตัวเลือก "อื่นๆ (กำหนดเอง)" แบบเดียวกับ Dialog
 * - เติมช่องโน้ตรายบรรทัดในตารางไซซ์ และแสดง PR qty เปรียบเทียบด้วย Chip
 */

const PRNameResolver = ({ prId, currentName, onResolved }) => null;

const CreateQuotationForm = ({
  selectedPricingRequests = [],
  onBack,
  onSave,
  onSubmit,
  readOnly = false,
}) => {
  // ======== STATE ========
  const [formData, setFormData] = useState({
    customer: {},
    pricingRequests: selectedPricingRequests,
    items: [],
    notes: DEFAULT_NOTES,
    // terms (UI-facing)
    paymentTermsType: "credit_30", // 'cash' | 'credit_30' | 'credit_60' | 'other'
    paymentTermsCustom: "",
    depositMode: "percentage", // 'percentage' | 'amount'
    depositPct: 50, // when percentage mode
    depositAmountInput: "", // raw input when amount mode
    dueDate: null,
    // New fields for special discount and withholding tax
    specialDiscountType: "percentage", // 'percentage' | 'amount'
    specialDiscountValue: 0,
    hasWithholdingTax: false,
    withholdingTaxPercentage: 0,
    // NEW: VAT and pricing mode fields
    hasVat: true,
    vatPercentage: 7,
    pricingMode: "net", // 'net' | 'vat_included'
    sampleImages: [], // [{ path, url, filename, original_filename }]
    selectedSampleForPdf: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [isCalcEditing, setIsCalcEditing] = useState(!readOnly);
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadSamplesTemp, { isLoading: isUploadingSamples }] =
    useUploadQuotationSampleImagesTempMutation();

  // ======== INIT FROM PR ========
  useEffect(() => {
    if (!selectedPricingRequests?.length) return;
    const customer = selectedPricingRequests[0]?.customer || {};
    const items = selectedPricingRequests.map((pr, idx) => ({
      id: pr.pr_id || pr.id || `temp_${idx}`,
      pricingRequestId: pr.pr_id,
      isFromPR: true,
      name: pr.pr_work_name || pr.work_name || "ไม่ระบุชื่องาน",
      pattern: pr.pr_pattern || pr.pattern || "",
      fabricType: pr.pr_fabric_type || pr.fabric_type || pr.material || "",
      color: pr.pr_color || pr.color || "",
      size: pr.pr_sizes || pr.sizes || pr.size || "",
      unit: "ชิ้น",
      quantity: parseInt(pr.pr_quantity || pr.quantity || 1, 10),
      unitPrice: pr.pr_unit_price ? Number(pr.pr_unit_price) : 0,
      notes: pr.pr_notes || pr.notes || "",
      originalData: pr,
      sizeRows: [
        {
          uuid: `${pr.pr_id || pr.id || idx}-size-1`,
          size: pr.pr_sizes || "S-XL",
          quantity: parseInt(pr.pr_quantity || 1, 10),
          unitPrice: pr.pr_unit_price ? Number(pr.pr_unit_price) : 0,
          notes: "",
        },
      ],
    }));
    const dd = new Date();
    dd.setDate(dd.getDate() + 30);
    setFormData((prev) => ({
      ...prev,
      customer,
      items,
      dueDate: dd,
      paymentTermsType: "credit_30",
      depositPct: 50,
    }));
  }, [selectedPricingRequests]);

  // ======== CALC ========
  const financials = useQuotationFinancials({
    items: formData.items,
    pricingMode: formData.pricingMode, // NEW
    depositMode: formData.depositMode,
    depositPercentage: formData.depositPct,
    depositAmountInput: formData.depositAmountInput,
    specialDiscountType: formData.specialDiscountType,
    specialDiscountValue: formData.specialDiscountValue,
    hasWithholdingTax: formData.hasWithholdingTax,
    withholdingTaxPercentage: formData.withholdingTaxPercentage,
    hasVat: formData.hasVat, // NEW
    vatPercentage: formData.vatPercentage, // NEW
  });
  const {
    subtotal,
    specialDiscountAmount,
    discountedSubtotal,
    netSubtotal, // NEW: Extracted net amount
    vat,
    total,
    withholdingTaxAmount,
    finalTotal,
    depositAmount,
    remainingAmount,
  } = financials;
  const warnings = {}; // placeholder (old hook provided warnings)

  // ======== HELPERS ========
  const prQtyOf = useCallback((it) => {
    const q = Number(it?.originalData?.pr_quantity ?? it?.originalData?.quantity ?? 0);
    return isNaN(q) ? 0 : q;
  }, []);

  // ======== ADD/REMOVE JOB FUNCTIONS ========
  const addManualJob = useCallback(() => {
    const newJob = {
      id: `manual_${Date.now()}`,
      isFromPR: false,
      isManual: true,
      name: "",
      pattern: "",
      fabricType: "",
      color: "",
      size: "",
      unit: "ชิ้น",
      quantity: 0,
      unitPrice: 0,
      notes: "",
      sizeRows: [
        {
          uuid: `manual_${Date.now()}_row_1`,
          size: "",
          quantity: "",
          unitPrice: "",
          notes: "",
        },
      ],
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newJob],
    }));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[newJob.id];
      return newErrors;
    });
  }, []);

  const removeJob = useCallback((itemId) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
    }));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[itemId];
      return newErrors;
    });
  }, []);

  // ======== VALIDATION ========
  const validateManualJob = useCallback((item) => {
    const errors = [];

    if (!item.name || item.name.trim() === "") {
      errors.push("กรุณากรอกชื่องาน");
    }

    const hasValidRows = item.sizeRows && item.sizeRows.length > 0;
    if (!hasValidRows) {
      errors.push("กรุณาเพิ่มอย่างน้อย 1 รายการขนาด");
    } else {
      const allRowsEmpty = item.sizeRows.every(
        (row) =>
          (!row.quantity || row.quantity === "" || row.quantity === 0) &&
          (!row.unitPrice || row.unitPrice === "" || row.unitPrice === 0)
      );
      if (allRowsEmpty) {
        errors.push("กรุณากรอกจำนวนและราคาอย่างน้อย 1 รายการ");
      }
    }

    return errors;
  }, []);

  const validateAllManualJobs = useCallback(() => {
    const errors = {};
    let hasErrors = false;

    formData.items.forEach((item) => {
      if (!item.isFromPR) {
        const itemErrors = validateManualJob(item);
        if (itemErrors.length > 0) {
          errors[item.id] = itemErrors;
          hasErrors = true;
        }
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  }, [formData.items, validateManualJob]);

  const setItem = (itemId, patch) =>
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              ...patch,
              // recompute total from sizeRows if provided
              total: Array.isArray(patch.sizeRows ?? i.sizeRows)
                ? (patch.sizeRows ?? i.sizeRows).reduce(
                    (s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0),
                    0
                  )
                : ((patch.unitPrice ?? i.unitPrice) || 0) * ((patch.quantity ?? i.quantity) || 0),
            }
          : i
      ),
    }));

  const addSizeRow = (itemId) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) => {
        if (i.id !== itemId) return i;
        const newRow = {
          uuid: `${itemId}-size-${(i.sizeRows?.length || 0) + 1}`,
          size: "",
          quantity: "",
          unitPrice: String(i.unitPrice || ""),
          notes: "",
        };
        const sizeRows = [...(i.sizeRows || []), newRow];
        const total = sizeRows.reduce((s, r) => {
          const q =
            typeof r.quantity === "string"
              ? parseFloat(r.quantity || "0")
              : Number(r.quantity || 0);
          const p =
            typeof r.unitPrice === "string"
              ? parseFloat(r.unitPrice || "0")
              : Number(r.unitPrice || 0);
          return s + (isNaN(q) || isNaN(p) ? 0 : q * p);
        }, 0);
        const quantity = sizeRows.reduce((s, r) => {
          const q =
            typeof r.quantity === "string"
              ? parseFloat(r.quantity || "0")
              : Number(r.quantity || 0);
          return s + (isNaN(q) ? 0 : q);
        }, 0);
        return { ...i, sizeRows, total, quantity };
      }),
    }));
  };

  const updateSizeRow = (itemId, rowUuid, patch) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) => {
        if (i.id !== itemId) return i;
        const sizeRows = (i.sizeRows || []).map((r) =>
          r.uuid === rowUuid ? { ...r, ...patch } : r
        );
        const total = sizeRows.reduce((s, r) => {
          const q =
            typeof r.quantity === "string"
              ? parseFloat(r.quantity || "0")
              : Number(r.quantity || 0);
          const p =
            typeof r.unitPrice === "string"
              ? parseFloat(r.unitPrice || "0")
              : Number(r.unitPrice || 0);
          return s + (isNaN(q) || isNaN(p) ? 0 : q * p);
        }, 0);
        const quantity = sizeRows.reduce((s, r) => {
          const q =
            typeof r.quantity === "string"
              ? parseFloat(r.quantity || "0")
              : Number(r.quantity || 0);
          return s + (isNaN(q) ? 0 : q);
        }, 0);
        return { ...i, sizeRows, total, quantity };
      }),
    }));
  };

  const removeSizeRow = (itemId, rowUuid) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) => {
        if (i.id !== itemId) return i;
        const sizeRows = (i.sizeRows || []).filter((r) => r.uuid !== rowUuid);
        const total = sizeRows.reduce((s, r) => {
          const q =
            typeof r.quantity === "string"
              ? parseFloat(r.quantity || "0")
              : Number(r.quantity || 0);
          const p =
            typeof r.unitPrice === "string"
              ? parseFloat(r.unitPrice || "0")
              : Number(r.unitPrice || 0);
          return s + (isNaN(q) || isNaN(p) ? 0 : q * p);
        }, 0);
        const quantity = sizeRows.reduce((s, r) => {
          const q =
            typeof r.quantity === "string"
              ? parseFloat(r.quantity || "0")
              : Number(r.quantity || 0);
          return s + (isNaN(q) ? 0 : q);
        }, 0);
        return { ...i, sizeRows, total, quantity };
      }),
    }));
  };

  // compute view-model for calc section depending on edit toggle (here form always editable, but we mimic dialog UX)
  const activeItems = useMemo(() => formData.items, [formData.items]);

  const handleSubmit = async (action) => {
    if (!validateAllManualJobs()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        subtotal,
        // New order: discount applied to subtotal before VAT
        vat,
        total, // discountedSubtotal + vat
        // Special discount fields
        specialDiscountType: formData.specialDiscountType,
        specialDiscountValue: formData.specialDiscountValue,
        specialDiscountAmount,
        netAfterDiscount: discountedSubtotal, // rename compatibility (net after discount before VAT)
        // Withholding tax fields
        hasWithholdingTax: formData.hasWithholdingTax,
        withholdingTaxPercentage: formData.withholdingTaxPercentage,
        withholdingTaxAmount,
        // NEW: VAT and pricing mode fields
        hasVat: formData.hasVat,
        vatPercentage: formData.vatPercentage,
        pricingMode: formData.pricingMode,
        netSubtotal, // Actual net amount (extracted if VAT-included)
        // Final calculations
        finalTotal,
        depositAmount,
        remainingAmount,
        due_date: formData.dueDate ? formData.dueDate.toISOString().split("T")[0] : null,
        // Attach sample images and flag the one to show on PDF
        sample_images: (formData.sampleImages || []).map((img) => ({
          ...img,
          selected_for_pdf: img.filename && img.filename === formData.selectedSampleForPdf,
        })),
        // normalize terms for caller
        paymentMethod:
          formData.paymentTermsType === "other"
            ? formData.paymentTermsCustom
            : formData.paymentTermsType,
        depositMode: formData.depositMode,
        depositPercentage: String(
          formData.depositMode === "percentage"
            ? (formData.depositPct ?? 0)
            : financials.depositPercentage != null
              ? Number(financials.depositPercentage).toFixed(4)
              : 0
        ),
        depositAmountInput: formData.depositAmountInput,
        action,
      };
      if (action === "draft") await onSave?.(payload);
      else await onSubmit?.(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCredit =
    formData.paymentTermsType === "credit_30" || formData.paymentTermsType === "credit_60";

  return (
    <Box sx={{ bgcolor: tokens.bg, minHeight: "100vh", py: 3 }}>
      <Container maxWidth="lg">
        {/* Resolve missing work_name if needed (same as original) */}
        {activeItems.map((it) => (
          <PRNameResolver
            key={`resolver-${it.id}`}
            prId={it.pricingRequestId || it.pr_id}
            currentName={it.name}
            onResolved={(name) => {
              if (!name) return;
              setFormData((prev) => ({
                ...prev,
                items: prev.items.map((x) => (x.id === it.id ? { ...x, name } : x)),
              }));
            }}
          />
        ))}

        {/* HEADER */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Tooltip title="ย้อนกลับ">
              <IconButton
                onClick={onBack}
                size="small"
                sx={{ color: tokens.primary, border: `1px solid ${tokens.primary}` }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box>
              <Typography variant="h5" fontWeight={700} color={tokens.primary}>
                สร้างใบเสนอราคา
              </Typography>
              <Typography variant="body2" color="text.secondary">
                จาก {activeItems.filter((i) => i.isFromPR).length} งาน PR +{" "}
                {activeItems.filter((i) => !i.isFromPR).length} งานเพิ่มเติม •{" "}
                {formData.customer?.cus_company || "กำลังโหลด…"}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* SECTION: PR INFO + CUSTOMER */}
          <Grid item xs={12}>
            <Section>
              <SectionHeader>
                <Avatar
                  sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                >
                  <AssignmentIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    ข้อมูลจาก Pricing Request
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ดึงข้อมูลอัตโนมัติจาก PR
                  </Typography>
                </Box>
              </SectionHeader>

              <Box sx={{ p: 2 }}>
                <CustomerEditCard
                  customer={formData.customer}
                  onUpdate={(c) => setFormData((prev) => ({ ...prev, customer: c }))}
                />

                {/* งานสรุป */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
                    รายละเอียดงาน ({activeItems.filter((i) => i.isFromPR).length} จาก PR)
                  </Typography>
                </Box>

                {activeItems.filter((i) => i.isFromPR).length === 0 ? (
                  <InfoCard sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      ไม่พบข้อมูลงานจาก PR
                    </Typography>
                  </InfoCard>
                ) : (
                  activeItems
                    .filter((i) => i.isFromPR)
                    .map((item, idx) => {
                      const rows = Array.isArray(item.sizeRows) ? item.sizeRows : [];
                      const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
                      const prQty = prQtyOf(item);
                      const hasPrQty = prQty > 0;
                      const qtyMatches = hasPrQty ? totalQty === prQty : true;
                      return (
                        <InfoCard key={item.id} sx={{ p: 2, mb: 1.5 }}>
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            mb={1}
                          >
                            <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
                              งานที่ {idx + 1}: {item.name}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                label={`${totalQty} ${item.unit || "ชิ้น"}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: tokens.primary,
                                  color: tokens.primary,
                                  fontWeight: 700,
                                }}
                              />
                              {hasPrQty && (
                                <Chip
                                  label={`PR: ${prQty} ${item.unit || "ชิ้น"}`}
                                  size="small"
                                  color={qtyMatches ? "success" : "error"}
                                  variant={qtyMatches ? "outlined" : "filled"}
                                />
                              )}
                            </Box>
                          </Box>

                          <Grid container spacing={1}>
                            {item.pattern && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  แพทเทิร์น
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {item.pattern}
                                </Typography>
                              </Grid>
                            )}
                            {item.fabricType && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  ประเภทผ้า
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {item.fabricType}
                                </Typography>
                              </Grid>
                            )}
                            {item.color && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  สี
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {item.color}
                                </Typography>
                              </Grid>
                            )}
                            {item.size && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  ขนาด
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {item.size}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>

                          {item.notes && (
                            <Box
                              sx={{
                                mt: 1.5,
                                p: 1.5,
                                bgcolor: tokens.bg,
                                borderRadius: 1,
                                borderLeft: `3px solid ${tokens.primary}`,
                              }}
                            >
                              <Typography variant="caption" color={tokens.primary} fontWeight={700}>
                                หมายเหตุจาก PR
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.notes}
                              </Typography>
                            </Box>
                          )}
                        </InfoCard>
                      );
                    })
                )}
              </Box>
            </Section>
          </Grid>

          {/* SECTION: CALCULATION */}
          <Grid item xs={12}>
            <Section>
              <SectionHeader>
                <Avatar
                  sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                >
                  <CalculateIcon fontSize="small" />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    การคำนวณราคา
                  </Typography>
                </Box>
                <SecondaryButton startIcon={<AddIcon />} onClick={addManualJob} size="small">
                  เพิ่มงานใหม่
                </SecondaryButton>
              </SectionHeader>

              <Box sx={{ p: 2 }} id="calc-section">
                {activeItems.map((item, idx) => {
                  const rows = Array.isArray(item.sizeRows) ? item.sizeRows : [];
                  const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
                  const itemTotal = rows.reduce(
                    (s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0),
                    0
                  );
                  const knownUnits = ["ชิ้น", "ตัว", "ชุด", "กล่อง", "แพ็ค"];
                  const unitSelectValue = knownUnits.includes(item.unit) ? item.unit : "อื่นๆ";
                  const isManual = !item.isFromPR;
                  const itemErrors = validationErrors[item.id] || [];

                  return (
                    <InfoCard
                      key={`calc-${item.id}`}
                      sx={{
                        p: 2,
                        mb: 1.5,
                        border: isManual ? `2px dashed ${tokens.primary}` : undefined,
                        bgcolor: isManual ? `${tokens.primary}08` : undefined,
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={1.5}
                      >
                        <Box display="flex" alignItems="center" gap={1.5}>
                          {isManual && (
                            <Chip
                              label="งานใหม่"
                              size="small"
                              color="secondary"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
                            งานที่ {idx + 1}
                          </Typography>
                          {isManual ? (
                            <TextField
                              size="small"
                              placeholder="กรอกชื่องาน *"
                              value={item.name}
                              onChange={(e) => setItem(item.id, { name: e.target.value })}
                              error={itemErrors.some((e) => e.includes("ชื่องาน"))}
                              sx={{ minWidth: 200 }}
                            />
                          ) : (
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {item.name}
                              </Typography>
                              {item.pricingRequestId && (
                                <PricingRequestNotesButton
                                  pricingRequestId={item.pricingRequestId}
                                  workName={item.name}
                                  variant="icon"
                                  size="small"
                                />
                              )}
                            </>
                          )}
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={`${totalQty} ${item.unit || "ชิ้น"}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: tokens.primary,
                              color: tokens.primary,
                              fontWeight: 700,
                            }}
                          />
                          {isManual && (
                            <Tooltip title="ลบงานนี้">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeJob(item.id)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      {itemErrors.length > 0 && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {itemErrors.map((err, i) => (
                            <div key={i}>• {err}</div>
                          ))}
                        </Alert>
                      )}

                      <Grid container spacing={1.5}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="แพทเทิร์น"
                            value={item.pattern}
                            disabled={!isCalcEditing}
                            onChange={(e) => setItem(item.id, { pattern: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="ประเภทผ้า"
                            value={item.fabricType}
                            disabled={!isCalcEditing}
                            onChange={(e) => setItem(item.id, { fabricType: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="สี"
                            value={item.color}
                            disabled={!isCalcEditing}
                            onChange={(e) => setItem(item.id, { color: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="ขนาด (สรุป)"
                            value={item.size}
                            disabled={!isCalcEditing}
                            onChange={(e) => setItem(item.id, { size: e.target.value })}
                          />
                        </Grid>
                        {/* Unit editor */}
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            select
                            SelectProps={{ native: true }}
                            label="หน่วย"
                            value={unitSelectValue}
                            disabled={!isCalcEditing}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "อื่นๆ") {
                                // switch to custom mode; keep current custom value in item.unit
                                setItem(item.id, {
                                  unit:
                                    item.unit && !knownUnits.includes(item.unit) ? item.unit : "",
                                });
                              } else {
                                setItem(item.id, { unit: val });
                              }
                            }}
                          >
                            <option value="ชิ้น">ชิ้น</option>
                            <option value="ตัว">ตัว</option>
                            <option value="ชุด">ชุด</option>
                            <option value="กล่อง">กล่อง</option>
                            <option value="แพ็ค">แพ็ค</option>
                            <option value="อื่นๆ">อื่นๆ</option>
                          </TextField>
                        </Grid>
                        {unitSelectValue === "อื่นๆ" && (
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="หน่วย (กำหนดเอง)"
                              placeholder="พิมพ์หน่วย เช่น โหล, ตร.ม., แผ่น"
                              value={item.unit || ""}
                              disabled={!isCalcEditing}
                              onChange={(e) => setItem(item.id, { unit: e.target.value })}
                            />
                          </Grid>
                        )}

                        {/* Size rows editor */}
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              p: 1.5,
                              border: `1px dashed ${tokens.border}`,
                              borderRadius: 1,
                              bgcolor: tokens.bg,
                            }}
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              mb={1}
                            >
                              <Typography variant="subtitle2" fontWeight={700}>
                                แยกตามขนาด
                              </Typography>
                              {isCalcEditing && (
                                <SecondaryButton
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => addSizeRow(item.id)}
                                >
                                  เพิ่มแถว
                                </SecondaryButton>
                              )}
                            </Box>

                            {/* header */}
                            <Grid container spacing={1} sx={{ px: 0.5, pb: 0.5 }}>
                              <Grid item xs={12} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  ขนาด
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  จำนวน
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  ราคาต่อหน่วย
                                </Typography>
                              </Grid>
                              <Grid item xs={10} md={2}>
                                <Typography variant="caption" color="text.secondary">
                                  ยอดรวม
                                </Typography>
                              </Grid>
                              <Grid item xs={2} md={1}></Grid>
                            </Grid>

                            {rows.length === 0 ? (
                              <Box sx={{ p: 1, color: "text.secondary" }}>
                                <Typography variant="body2">
                                  ไม่มีรายละเอียดรายการสำหรับงานนี้
                                </Typography>
                              </Box>
                            ) : (
                              <Grid container spacing={1}>
                                {rows.map((row) => (
                                  <React.Fragment key={row.uuid}>
                                    <Grid item xs={12} md={3}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="ขนาด"
                                        value={row.size || ""}
                                        disabled={!isCalcEditing}
                                        onChange={(e) =>
                                          updateSizeRow(item.id, row.uuid, { size: e.target.value })
                                        }
                                      />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="จำนวน"
                                        type="text"
                                        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                                        value={String(row.quantity ?? "")}
                                        disabled={!isCalcEditing}
                                        onChange={createIntegerInputHandler((value) =>
                                          updateSizeRow(item.id, row.uuid, {
                                            quantity: value,
                                          })
                                        )}
                                      />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="ราคาต่อหน่วย"
                                        type="text"
                                        inputProps={{ inputMode: "decimal" }}
                                        value={String(row.unitPrice ?? "")}
                                        disabled={!isCalcEditing}
                                        onChange={createDecimalInputHandler((value) =>
                                          updateSizeRow(item.id, row.uuid, {
                                            unitPrice: value,
                                          })
                                        )}
                                      />
                                    </Grid>
                                    <Grid item xs={10} md={2}>
                                      <Box
                                        sx={{
                                          p: 1,
                                          bgcolor: "#fff",
                                          border: `1px solid ${tokens.border}`,
                                          borderRadius: 1,
                                          textAlign: "center",
                                        }}
                                      >
                                        <Typography variant="subtitle2" fontWeight={800}>
                                          {(() => {
                                            const q =
                                              typeof row.quantity === "string"
                                                ? parseFloat(row.quantity || "0")
                                                : Number(row.quantity || 0);
                                            const p =
                                              typeof row.unitPrice === "string"
                                                ? parseFloat(row.unitPrice || "0")
                                                : Number(row.unitPrice || 0);
                                            const sum = isNaN(q) || isNaN(p) ? 0 : q * p;
                                            return formatTHB(sum);
                                          })()}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={2} md={1}>
                                      {isCalcEditing && (
                                        <SecondaryButton
                                          size="small"
                                          color="error"
                                          onClick={() => removeSizeRow(item.id, row.uuid)}
                                        >
                                          <DeleteOutlineIcon fontSize="small" />
                                        </SecondaryButton>
                                      )}
                                    </Grid>

                                    {/* line note */}
                                    <Grid item xs={12}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="หมายเหตุ (บรรทัดนี้)"
                                        multiline
                                        minRows={1}
                                        value={row.notes || ""}
                                        disabled={!isCalcEditing}
                                        onChange={(e) =>
                                          updateSizeRow(item.id, row.uuid, {
                                            notes: e.target.value,
                                          })
                                        }
                                      />
                                    </Grid>
                                  </React.Fragment>
                                ))}

                                {!!warnings?.[item.id] && (
                                  <Grid item xs={12}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color:
                                          warnings[item.id].type === "error"
                                            ? "error.main"
                                            : "warning.main",
                                      }}
                                    >
                                      {warnings[item.id].message}
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            )}
                          </Box>
                        </Grid>

                        <Grid item xs={6} md={4}>
                          <Box
                            sx={{
                              p: 1.5,
                              border: `1px solid ${tokens.border}`,
                              borderRadius: 1.5,
                              textAlign: "center",
                              bgcolor: tokens.bg,
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              ยอดรวม
                            </Typography>
                            <Typography variant="h6" fontWeight={800}>
                              {formatTHB(itemTotal)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </InfoCard>
                  );
                })}

                <Divider sx={{ my: 2 }} />

                {/* Special Discount & Withholding Tax Controls */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <SpecialDiscountField
                      discountType={formData.specialDiscountType}
                      discountValue={formData.specialDiscountValue}
                      totalAmount={total}
                      discountAmount={specialDiscountAmount}
                      onDiscountTypeChange={(type) =>
                        setFormData((p) => ({ ...p, specialDiscountType: type }))
                      }
                      onDiscountValueChange={(value) =>
                        setFormData((p) => ({ ...p, specialDiscountValue: value }))
                      }
                      disabled={!isCalcEditing}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <WithholdingTaxField
                      hasWithholdingTax={formData.hasWithholdingTax}
                      taxPercentage={formData.withholdingTaxPercentage}
                      taxAmount={withholdingTaxAmount}
                      subtotalAmount={subtotal}
                      onToggleWithholdingTax={(enabled) =>
                        setFormData((p) => ({ ...p, hasWithholdingTax: enabled }))
                      }
                      onTaxPercentageChange={(percentage) =>
                        setFormData((p) => ({ ...p, withholdingTaxPercentage: percentage }))
                      }
                      disabled={!isCalcEditing}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <PricingModeSelector
                      pricingMode={formData.pricingMode}
                      onPricingModeChange={(mode) =>
                        setFormData((p) => ({ ...p, pricingMode: mode }))
                      }
                      disabled={!isCalcEditing}
                    />
                  </Grid>
                </Grid>

                {/* Calculation Summary */}
                <Calculation
                  subtotal={subtotal}
                  discountAmount={specialDiscountAmount}
                  discountedBase={discountedSubtotal}
                  vat={vat}
                  totalAfterVat={total}
                  withholdingAmount={withholdingTaxAmount}
                  finalTotal={finalTotal}
                  pricingMode={formData.pricingMode}
                  netSubtotal={netSubtotal}
                  hasVat={formData.hasVat}
                  vatPercentage={formData.vatPercentage}
                />
              </Box>
            </Section>
          </Grid>

          {/* SECTION: PAYMENT TERMS */}
          <Grid item xs={12}>
            <Section>
              <SectionHeader>
                <Avatar
                  sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                >
                  <PaymentIcon fontSize="small" />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>
                  เงื่อนไขการชำระเงิน
                </Typography>
              </SectionHeader>
              <Box sx={{ p: 2 }}>
                <PaymentTerms
                  isEditing
                  paymentTermsType={formData.paymentTermsType}
                  paymentTermsCustom={formData.paymentTermsCustom}
                  onChangePaymentTermsType={(v) =>
                    setFormData((p) => ({ ...p, paymentTermsType: v }))
                  }
                  onChangePaymentTermsCustom={(v) =>
                    setFormData((p) => ({ ...p, paymentTermsCustom: v }))
                  }
                  depositMode={formData.depositMode}
                  onChangeDepositMode={(v) => setFormData((p) => ({ ...p, depositMode: v }))}
                  depositPercentage={formData.depositPct}
                  depositAmountInput={formData.depositAmountInput}
                  onChangeDepositPercentage={(v) =>
                    setFormData((p) => ({ ...p, depositPct: sanitizeInt(v) }))
                  }
                  onChangeDepositAmount={(v) =>
                    setFormData((p) => ({ ...p, depositAmountInput: sanitizeDecimal(v) }))
                  }
                  isCredit={isCredit}
                  dueDateNode={
                    isCredit ? (
                      <Grid container spacing={2} sx={{ mt: 0 }}>
                        <Grid item xs={6}>
                          <Typography>วันครบกำหนด</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                              value={formData.dueDate}
                              onChange={(newVal) => setFormData((p) => ({ ...p, dueDate: newVal }))}
                              format="dd/MM/yyyy"
                              slotProps={{ textField: { size: "small", fullWidth: true } }}
                            />
                          </LocalizationProvider>
                        </Grid>
                      </Grid>
                    ) : null
                  }
                  finalTotal={finalTotal}
                  depositAmount={depositAmount}
                  remainingAmount={remainingAmount}
                />
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="หมายเหตุ"
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="เช่น ราคานี้รวมค่าจัดส่งและติดตั้งแล้ว…"
                  />
                </Box>
              </Box>
            </Section>
          </Grid>

          {/* SECTION: SAMPLE IMAGES */}
          <Grid item xs={12}>
            <Section>
              <SectionHeader>
                <Avatar
                  sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                >
                  <AddIcon fontSize="small" />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>
                  รูปภาพตัวอย่าง
                </Typography>
              </SectionHeader>
              <Box sx={{ p: 2 }}>
                <ImageUploadGrid
                  title="รูปภาพตัวอย่าง"
                  images={formData.sampleImages}
                  disabled={isUploadingSamples}
                  onUpload={async (files) => {
                    const res = await uploadSamplesTemp({ files }).unwrap();
                    const list = res?.data?.sample_images || res?.sample_images || [];
                    setFormData((p) => {
                      const updated = [...(p.sampleImages || []), ...list];
                      const currentSel = p.selectedSampleForPdf;
                      const nextSel =
                        currentSel && updated.some((it) => it.filename === currentSel)
                          ? currentSel
                          : updated[0]?.filename || "";
                      return { ...p, sampleImages: updated, selectedSampleForPdf: nextSel };
                    });
                  }}
                  helperText="รองรับ JPG/PNG สูงสุด 5MB ต่อไฟล์"
                />
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    เลือกรูปแสดงบน PDF (เลือกได้ 1 รูป)
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {(formData.sampleImages || []).map((img) => {
                      const value = img.filename || "";
                      const src = img.url || "";
                      return (
                        <label
                          key={value || src}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            border:
                              (formData.selectedSampleForPdf || "") === value
                                ? `2px solid ${tokens.primary}`
                                : "1px solid #ddd",
                            padding: 6,
                            borderRadius: 6,
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          <input
                            type="radio"
                            name="selectedSample"
                            checked={(formData.selectedSampleForPdf || "") === value}
                            onClick={(e) => {
                              // Allow deselect by clicking the selected radio again
                              if ((formData.selectedSampleForPdf || "") === value) {
                                e.preventDefault();
                                setFormData((p) => ({ ...p, selectedSampleForPdf: "" }));
                              }
                            }}
                            onChange={() =>
                              setFormData((p) => ({ ...p, selectedSampleForPdf: value }))
                            }
                            style={{ margin: 0 }}
                          />
                          {src ? (
                            <img
                              src={src}
                              alt="sample"
                              style={{
                                width: 72,
                                height: 72,
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          ) : null}
                        </label>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Section>
          </Grid>
        </Grid>
        {/* FOOTER ACTIONS */}
        <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", gap: 1 }}>
          <SecondaryButton onClick={onBack} startIcon={<ArrowBackIcon />}>
            ยกเลิก
          </SecondaryButton>
          <Box display="flex" gap={1}>
            {/* <SecondaryButton
              startIcon={<VisibilityIcon />}
              onClick={() => setShowPreview(true)}
              disabled={finalTotal === 0}
            >
              ดูตัวอย่าง
            </SecondaryButton> */}
            <PrimaryButton
              onClick={() => handleSubmit("review")}
              disabled={isSubmitting || finalTotal === 0}
            >
              {isSubmitting ? "กำลังส่ง…" : "ส่งตรวจสอบ"}
            </PrimaryButton>
          </Box>
        </Box>

        {/* PREVIEW DIALOG */}
        {showPreview && (
          <QuotationPreview
            formData={{ ...formData, subtotal, vat, total, depositAmount, remainingAmount }}
            quotationNumber="QT-2025-XXX"
            showActions
          />
        )}
      </Container>
    </Box>
  );
};

export default CreateQuotationForm;
