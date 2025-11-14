// QuotationDuplicateDialog.jsx - Dialog สำหรับทำสำเนาใบเสนอราคา
import React from "react";
import {
  Assignment as AssignmentIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Grid,
  Chip,
  TextField,
  Divider,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Import Hooks
import { useQuotationDuplicateDialogLogic } from "./hooks/useQuotationDuplicateDialogLogic";
import { useQuotationGroups } from "./hooks/useQuotationGroups";
import { useQuotationFinancials } from "./hooks/useQuotationFinancials";

// Import Subcomponents
import { PRGroupSummaryCard } from "./subcomponents/PRGroupSummaryCard";
import { PRGroupCalcCard } from "../shared/PRGroupCalcCard";

// Import utils
import {
  getAllPrIdsFromQuotation,
  normalizeAndGroupItems,
  computeTotals,
} from "./utils/quotationUtils";
import { formatTHB, formatDateTH } from "./utils/formatters";
import { sanitizeInt } from "./utils/sanitizers";

// Import existing shared components
import CustomerEditDialog from "../../../PricingIntegration/components/CustomerEditDialog";
import SpecialDiscountField from "../../../PricingIntegration/components/quotation/CreateQuotationForm/components/SpecialDiscountField";
import WithholdingTaxField from "../../../PricingIntegration/components/quotation/CreateQuotationForm/components/WithholdingTaxField";
import PricingModeSelector from "../../../PricingIntegration/components/quotation/CreateQuotationForm/components/PricingModeSelector";
import {
  Section,
  SectionHeader,
  SecondaryButton,
  InfoCard,
  tokens,
} from "../../../PricingIntegration/components/quotation/styles/quotationTheme";
import Calculation from "../../../shared/components/Calculation";
import ImageUploadGrid from "../../../shared/components/ImageUploadGrid";
import PaymentTerms from "../../../shared/components/PaymentTerms";
import { apiConfig } from "../../../../../api/apiConfig";
import { useGetBulkPricingRequestAutofillQuery } from "../../../../../features/Accounting/accountingApi";

// ✅ รับ onSaveSuccess เพิ่ม
const QuotationDuplicateDialog = ({ open, onClose, initialData, onSaveSuccess }) => {
  // Check user permissions first
  const userData = React.useMemo(() => JSON.parse(localStorage.getItem("userData") || "{}"), []);
  const canEditQuotation = ["admin", "account"].includes(userData?.role);
  const canUploadSignatures = false; // ไม่สามารถอัปโหลด signature ได้สำหรับใบใหม่
  const canUploadSampleImages = ["admin", "account", "sale"].includes(userData?.role);

  // 1. Main logic hook for data, state, and save handlers (ใช้ initialData แทน quotationId)
  const dialogLogic = useQuotationDuplicateDialogLogic(initialData, open);
  const {
    q,
    isLoading,
    isSaving,
    error,
    customer,
    setCustomer,
    editCustomerOpen,
    setEditCustomerOpen,
  } = dialogLogic;

  // Parse quotation items
  const prIdsAll = getAllPrIdsFromQuotation(q);
  const items = normalizeAndGroupItems(q, prIdsAll);

  // ***** Bulk Autofill Data Fetching *****
  // 1. ดึงข้อมูล Autofill ทั้งหมดในครั้งเดียว
  const { data: bulkAutofillData, isLoading: isAutofillLoading } =
    useGetBulkPricingRequestAutofillQuery(prIdsAll, {
      skip: !open || prIdsAll.length === 0,
    });

  // 2. แปลงข้อมูลที่ได้เป็น Map เพื่อให้ง่ายต่อการค้นหา
  const prAutofillMap = React.useMemo(() => {
    if (!bulkAutofillData?.data) return new Map();

    const map = new Map();
    (bulkAutofillData.data || []).forEach((item) => {
      // key ควรเป็น pr_id หรือ id ที่ตรงกับ group.prId
      const key = item.pr_id || item.id;
      if (key) {
        map.set(key, item);
      }
    });
    return map;
  }, [bulkAutofillData]);
  // ***** จบส่วน Bulk Autofill *****

  // 2. Hook for managing groups and editing state
  const groupsLogic = useQuotationGroups(items);
  const {
    groups,
    isEditing: _isEditing,
    setIsEditing: originalSetIsEditing,
    ...groupHandlers
  } = groupsLogic;

  // ✅ สำหรับ Duplicate Dialog: เริ่มต้นเป็นโหมดแก้ไขเสมอ
  const isEditing = true;
  const setIsEditing = React.useCallback(
    (value) => {
      // ไม่อนุญาตให้ออกจากโหมดแก้ไข
      if (!value) {
        return;
      }
      if (value && !canEditQuotation) {
        return; // Block entering edit mode if user doesn't have permission
      }
      originalSetIsEditing(value);
    },
    [canEditQuotation, originalSetIsEditing]
  );

  // 3. Hook for financial calculations
  const financials = useQuotationFinancials({
    items: isEditing ? groups : items,
    pricingMode: dialogLogic.pricingMode,
    depositMode: dialogLogic.depositMode,
    depositPercentage: dialogLogic.depositPct,
    depositAmountInput: dialogLogic.depositAmountInput,
    specialDiscountType: dialogLogic.specialDiscountType,
    specialDiscountValue: dialogLogic.specialDiscountValue,
    hasWithholdingTax: dialogLogic.hasWithholdingTax,
    withholdingTaxPercentage: dialogLogic.withholdingTaxPercentage,
    hasVat: dialogLogic.hasVat,
    vatPercentage: dialogLogic.vatPercentage,
  });

  // 4. Hook for handling images and PDF generation
  // ❌ Image Manager ไม่สามารถใช้ได้ในโหมด duplicate (ยังไม่มี quotationId)
  // const imageManager = useQuotationImageManager(quotationId, isEditing, () =>
  //   dialogLogic.handleSave(groups, financials)
  // );

  // Initialize sample image selection
  const signatureImages = []; // ไม่มี signature images ในโหมด duplicate
  const sampleImages = Array.isArray(q?.sample_images) ? q.sample_images : [];

  // React.useEffect(() => {
  //   imageManager.initializeSampleSelection(sampleImages);
  // }, [q?.id, JSON.stringify(sampleImages), imageManager.initializeSampleSelection]);

  // React.useEffect(() => {
  //   imageManager.updateSampleSelection(sampleImages);
  // }, [sampleImages, imageManager.updateSampleSelection]);

  // Main save handler with UI feedback
  // ✅ แก้ไข handleSave
  const handleSave = async () => {
    const success = await dialogLogic.handleSave(groups, financials);
    if (success) {
      setIsEditing(false);
      onSaveSuccess?.(); // ✅ เรียก onSaveSuccess เมื่อบันทึกสำเร็จ
      onClose(); // ✅ ปิด Dialog หลังจากสร้างสำเร็จ
    }
  };

  // ไม่มี isLoading สำหรับ duplicate เพราะข้อมูลมาจาก props
  if (prIdsAll.length > 0 && isAutofillLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box display="flex" alignItems="center" gap={1} p={2}>
            <CircularProgress size={22} />
            <Typography variant="body2">กำลังโหลดข้อมูล autofill…</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box p={2}>
            <Typography color="error">ไม่สามารถโหลดข้อมูลได้</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  const activeGroups = isEditing ? groups : items;
  const workName = q.work_name || q.workname || q.title || "";
  const quotationNumber = q.number || "";
  const paymentMethod = isEditing
    ? dialogLogic.paymentTermsType === "other"
      ? dialogLogic.paymentTermsCustom || ""
      : dialogLogic.paymentTermsType
    : q.payment_terms ||
      q.payment_method ||
      (q.credit_days === 30 ? "credit_30" : q.credit_days === 60 ? "credit_60" : "cash");

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          สร้างใบเสนอราคา (สำเนา)
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, bgcolor: tokens.bg }}>
          <Box>
            <Grid container spacing={2}>
              {/* === PR Info Section === */}
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
                    {/* Customer brief card */}
                    <InfoCard sx={{ p: 2, mb: 1.5 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {customer?.customer_type === "individual"
                              ? "ชื่อผู้ติดต่อ"
                              : "ชื่อบริษัท"}
                          </Typography>
                          <Typography variant="body1" fontWeight={700}>
                            {customer?.customer_type === "individual"
                              ? `${customer?.cus_firstname || ""} ${customer?.cus_lastname || ""}`.trim() ||
                                customer?.cus_name ||
                                "-"
                              : customer?.cus_company || "-"}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          {customer.cus_tel_1 ? (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={customer.cus_tel_1}
                              sx={{
                                borderColor: tokens.primary,
                                color: tokens.primary,
                                fontWeight: 700,
                              }}
                            />
                          ) : null}
                          {canEditQuotation && (
                            <SecondaryButton
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => dialogLogic.setEditCustomerOpen(true)}
                            >
                              แก้ไขลูกค้า
                            </SecondaryButton>
                          )}
                        </Box>
                      </Box>
                      {(customer.contact_name ||
                        customer.cus_email ||
                        customer.cus_tax_id ||
                        customer.cus_address) && (
                        <Grid container spacing={1}>
                          {customer.contact_name && (
                            <Grid item xs={12} md={4}>
                              <Typography variant="caption" color="text.secondary">
                                ผู้ติดต่อ
                              </Typography>
                              <Typography variant="body2">
                                {customer.contact_name}{" "}
                                {customer.contact_nickname ? `(${customer.contact_nickname})` : ""}
                              </Typography>
                            </Grid>
                          )}
                          {customer.cus_email && (
                            <Grid item xs={12} md={4}>
                              <Typography variant="caption" color="text.secondary">
                                อีเมล
                              </Typography>
                              <Typography variant="body2">{customer.cus_email}</Typography>
                            </Grid>
                          )}
                          {customer.cus_tax_id && (
                            <Grid item xs={12} md={4}>
                              <Typography variant="caption" color="text.secondary">
                                เลขประจำตัวผู้เสียภาษี
                              </Typography>
                              <Typography variant="body2">{customer.cus_tax_id}</Typography>
                            </Grid>
                          )}
                          {customer.cus_address && (
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">
                                ที่อยู่
                              </Typography>
                              <Typography variant="body2">{customer.cus_address}</Typography>
                            </Grid>
                          )}
                        </Grid>
                      )}
                    </InfoCard>

                    {/* Main work summary */}
                    {(workName || quotationNumber) && (
                      <InfoCard sx={{ p: 2, mb: 1.5 }}>
                        <Grid container spacing={1}>
                          {quotationNumber && (
                            <Grid item xs={12} md={4}>
                              <Typography variant="caption" color="text.secondary">
                                เลขที่ใบเสนอราคา
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {quotationNumber}
                              </Typography>
                            </Grid>
                          )}
                          {workName && (
                            <Grid item xs={12} md={8}>
                              <Typography variant="caption" color="text.secondary">
                                ใบงานหลัก
                              </Typography>
                              <Typography variant="body1" fontWeight={700}>
                                {workName}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </InfoCard>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
                        รายละเอียดงาน ({items.length})
                      </Typography>
                    </Box>

                    {items.length === 0 ? (
                      <InfoCard sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          ไม่พบข้อมูลงาน
                        </Typography>
                      </InfoCard>
                    ) : (
                      items.map((item, idx) => (
                        <PRGroupSummaryCard
                          key={item.id}
                          group={item}
                          index={idx}
                          prAutofillData={prAutofillMap.get(item.prId)}
                        />
                      ))
                    )}
                  </Box>
                </Section>
              </Grid>

              {/* === Calculation Section === */}
              <Grid item xs={12}>
                <Section>
                  <SectionHeader>
                    <Avatar
                      sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                    >
                      <CalculateIcon fontSize="small" />
                    </Avatar>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        การคำนวณราคา
                      </Typography>
                      {canEditQuotation && (
                        <SecondaryButton
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            const el = document.getElementById("calc-section");
                            const y = el ? el.scrollTop : null;
                            setIsEditing((v) => !v);
                            // restore scroll shortly after DOM updates
                            setTimeout(() => {
                              const el2 = document.getElementById("calc-section");
                              if (el2 != null && y != null) el2.scrollTop = y;
                            }, 0);
                          }}
                        >
                          {isEditing ? "ยกเลิกแก้ไข" : "แก้ไข"}
                        </SecondaryButton>
                      )}
                    </Box>
                  </SectionHeader>
                  <Box sx={{ p: 2 }} id="calc-section">
                    {activeGroups.map((item, idx) => (
                      <PRGroupCalcCard
                        key={`calc-${item.id}`}
                        group={item}
                        index={idx}
                        isEditing={isEditing}
                        prAutofillData={prAutofillMap.get(item.prId)}
                        {...groupHandlers}
                      />
                    ))}

                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={6}>
                        <SpecialDiscountField
                          discountType={dialogLogic.specialDiscountType}
                          discountValue={dialogLogic.specialDiscountValue}
                          totalAmount={financials.subtotal}
                          discountAmount={financials.specialDiscountAmount}
                          onDiscountTypeChange={(t) => {
                            if (!isEditing) return;
                            dialogLogic.setSpecialDiscountType(t);
                          }}
                          onDiscountValueChange={(v) => {
                            if (!isEditing) return;
                            dialogLogic.setSpecialDiscountValue(v);
                          }}
                          disabled={!isEditing}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <WithholdingTaxField
                          hasWithholdingTax={dialogLogic.hasWithholdingTax}
                          taxPercentage={dialogLogic.withholdingTaxPercentage}
                          taxAmount={financials.withholdingTaxAmount}
                          subtotalAmount={financials.subtotal}
                          onToggleWithholdingTax={(en) =>
                            isEditing && dialogLogic.setHasWithholdingTax(en)
                          }
                          onTaxPercentageChange={(p) =>
                            isEditing && dialogLogic.setWithholdingTaxPercentage(p)
                          }
                          disabled={!isEditing}
                        />
                      </Grid>

                      {/* Pricing Mode Selector */}
                      {isEditing && (
                        <Grid item xs={12}>
                          <PricingModeSelector
                            pricingMode={dialogLogic.pricingMode}
                            onPricingModeChange={dialogLogic.setPricingMode}
                            disabled={!isEditing}
                          />
                        </Grid>
                      )}
                    </Grid>

                    <Calculation
                      subtotal={financials.subtotal}
                      discountAmount={financials.specialDiscountAmount}
                      discountedBase={financials.discountedSubtotal}
                      netSubtotal={financials.netSubtotal}
                      pricingMode={financials.pricingMode}
                      vat={financials.vat}
                      totalAfterVat={financials.total}
                      withholdingAmount={financials.withholdingTaxAmount}
                      finalTotal={financials.finalTotal}
                    />
                  </Box>
                </Section>
              </Grid>

              {/* === Payment Terms Section === */}
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
                      isEditing={isEditing}
                      paymentTermsType={dialogLogic.paymentTermsType}
                      paymentTermsCustom={dialogLogic.paymentTermsCustom}
                      onChangePaymentTermsType={(v) =>
                        isEditing && dialogLogic.setPaymentTermsType(v)
                      }
                      onChangePaymentTermsCustom={(v) =>
                        isEditing && dialogLogic.setPaymentTermsCustom(v)
                      }
                      depositMode={dialogLogic.depositMode}
                      onChangeDepositMode={(v) => isEditing && dialogLogic.setDepositMode(v)}
                      depositPercentage={dialogLogic.depositPct}
                      depositAmountInput={dialogLogic.depositAmountInput}
                      onChangeDepositPercentage={(v) =>
                        isEditing && dialogLogic.setDepositPct(sanitizeInt(v))
                      }
                      onChangeDepositAmount={(v) =>
                        isEditing && dialogLogic.setDepositAmountInput(v)
                      }
                      isCredit={
                        isEditing
                          ? dialogLogic.paymentTermsType === "credit_30" ||
                            dialogLogic.paymentTermsType === "credit_60"
                          : paymentMethod !== "cash"
                      }
                      dueDateNode={
                        (
                          isEditing
                            ? dialogLogic.paymentTermsType === "credit_30" ||
                              dialogLogic.paymentTermsType === "credit_60"
                            : paymentMethod !== "cash"
                        ) ? (
                          <>
                            <Grid item xs={6}>
                              <Typography>วันครบกำหนด</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              {isEditing &&
                              (dialogLogic.paymentTermsType === "credit_30" ||
                                dialogLogic.paymentTermsType === "credit_60") ? (
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                  <DatePicker
                                    value={dialogLogic.selectedDueDate}
                                    onChange={(newVal) => dialogLogic.setSelectedDueDate(newVal)}
                                    slotProps={{ textField: { size: "small", fullWidth: true } }}
                                  />
                                </LocalizationProvider>
                              ) : (
                                <Typography textAlign="right" fontWeight={700}>
                                  {formatDateTH(q?.due_date)}
                                </Typography>
                              )}
                            </Grid>
                          </>
                        ) : null
                      }
                      finalTotal={financials.finalTotal}
                      depositAmount={financials.depositAmount}
                      remainingAmount={financials.remainingAmount}
                    />
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="หมายเหตุ"
                        value={isEditing ? (dialogLogic.quotationNotes ?? "") : (q?.notes ?? "")}
                        disabled={!isEditing}
                        onChange={(e) => dialogLogic.setQuotationNotes(e.target.value)}
                      />
                    </Box>
                  </Box>
                </Section>
              </Grid>
            </Grid>

            {/* ❌ Sample Images Section - ซ่อนในโหมด Duplicate เพราะยังไม่มี quotationId */}
            {false && (
              <Section>
                <SectionHeader>
                  <Avatar
                    sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                  >
                    <AddIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      รูปภาพตัวอย่าง
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ไฟล์จะถูกแทรกลงใน PDF ใบเสนอราคา
                    </Typography>
                  </Box>
                </SectionHeader>
                <Box sx={{ p: 2 }}>
                  <ImageUploadGrid
                    title="รูปภาพตัวอย่าง"
                    images={sampleImages}
                    disabled={imageManager.isUploadingSamples || !canUploadSampleImages}
                    onUpload={imageManager.handleUploadSamples}
                    helperText="รองรับ JPG/PNG สูงสุด 5MB ต่อไฟล์"
                  />
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      เลือกรูปแสดงบน PDF (เลือกได้ 1 รูป)
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                      {(sampleImages || []).map((img) => {
                        const value = img.filename || "";
                        const src = img.url || "";
                        const checked =
                          imageManager.selectedSampleForPdfLocal !== null
                            ? imageManager.selectedSampleForPdfLocal === value
                            : !!img.selected_for_pdf;
                        return (
                          <label
                            key={value || src}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              border: checked ? `2px solid ${tokens.primary}` : "1px solid #ddd",
                              padding: 6,
                              borderRadius: 6,
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <input
                              type="radio"
                              name="selectedSampleForPdf"
                              checked={checked}
                              disabled={!canUploadSampleImages}
                              onClick={(e) => {
                                // Allow deselect by clicking the selected radio again
                                if (checked && canUploadSampleImages) {
                                  e.preventDefault();
                                  imageManager.setSelectedSampleForPdfLocal("");
                                  imageManager.scheduleSyncSelectedForPdf("");
                                }
                              }}
                              onChange={() => {
                                if (!canUploadSampleImages) return;
                                // Optimistic local update for instant feedback
                                imageManager.setSelectedSampleForPdfLocal(value);
                                imageManager.scheduleSyncSelectedForPdf(value);
                              }}
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
            )}

            {/* ❌ Signature Images Section - ซ่อนในโหมด Duplicate */}
            {false && q?.status === "approved" && (
              <Grid item xs={12}>
                <Section>
                  <SectionHeader>
                    <Avatar
                      sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                    >
                      S
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        หลักฐานการเซ็น / Signed Evidence
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ไฟล์รูปภาพที่ยืนยันการเซ็นใบเสนอราคา
                      </Typography>
                    </Box>
                  </SectionHeader>
                  <Box sx={{ p: 2 }}>
                    {signatureImages.length === 0 && (
                      <InfoCard sx={{ p: 2, textAlign: "center", mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          ยังไม่มีรูปหลักฐานการเซ็น
                        </Typography>
                      </InfoCard>
                    )}
                    {signatureImages.length > 0 && (
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        {signatureImages.map((img, idx) => {
                          const apiBase = apiConfig.baseUrl || "";
                          // Derive origin root (strip /api/... if present)
                          const origin = (() => {
                            try {
                              if (!apiBase) return "";
                              const u = new URL(apiBase);
                              return u.origin; // http://localhost:8000
                            } catch {
                              return apiBase.replace(/\/api\b.*$/, "");
                            }
                          })();
                          const normalize = (u) => {
                            if (!u) return "";
                            if (/^https?:/i.test(u)) return u; // absolute
                            if (u.startsWith("//")) return window.location.protocol + u; // protocol-relative
                            if (u.startsWith("/")) return origin + u; // backend relative root
                            // maybe "storage/..." without leading slash
                            if (u.startsWith("storage/")) return origin + "/" + u;
                            return u; // fallback
                          };
                          let urlCandidate = img?.url || "";
                          if (!urlCandidate && img?.path) {
                            urlCandidate = "storage/" + img.path.replace(/^public\//, "");
                          }
                          const finalUrl = normalize(urlCandidate);
                          return (
                            <Grid item key={idx} xs={6} md={3}>
                              <Box
                                sx={{
                                  border: "1px solid " + tokens.border,
                                  borderRadius: 1,
                                  p: 1,
                                  bgcolor: "#fff",
                                  cursor: "pointer",
                                  position: "relative",
                                }}
                                onClick={() =>
                                  imageManager.setPreviewImage({
                                    url: finalUrl,
                                    filename: img.original_filename || img.filename,
                                    idx,
                                  })
                                }
                              >
                                <Box
                                  sx={{
                                    position: "relative",
                                    pb: "70%",
                                    overflow: "hidden",
                                    borderRadius: 1,
                                    mb: 1,
                                    background: "#fafafa",
                                  }}
                                >
                                  <img
                                    src={finalUrl}
                                    alt={img.filename}
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "contain",
                                    }}
                                  />
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{ display: "block", wordBreak: "break-all" }}
                                >
                                  {img.original_filename || img.filename}
                                </Typography>
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}
                    {canUploadSignatures && (
                      <Box>
                        <SecondaryButton
                          component="label"
                          disabled={imageManager.isUploadingSignatures}
                        >
                          {imageManager.isUploadingSignatures
                            ? "กำลังอัปโหลด…"
                            : "อัปโหลดรูปหลักฐานการเซ็น"}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={imageManager.handleUploadSignatures}
                          />
                        </SecondaryButton>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          รองรับ JPG / PNG สูงสุด 5MB ต่อไฟล์
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Section>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {isEditing ? (
            <>
              <SecondaryButton disabled={true} title="สามารถดู PDF ได้หลังจากสร้างใบเสนอราคาแล้ว">
                (ดู PDF หลังสร้าง)
              </SecondaryButton>
              <SecondaryButton onClick={onClose} disabled={isSaving}>
                ยกเลิก
              </SecondaryButton>
              <SecondaryButton onClick={handleSave} disabled={isSaving}>
                {isSaving ? "กำลังสร้าง…" : "สร้างใบเสนอราคา"}
              </SecondaryButton>
            </>
          ) : (
            <>
              <SecondaryButton onClick={onClose}>ปิด</SecondaryButton>
            </>
          )}
        </DialogActions>

        {/* Customer Edit Dialog */}
        <CustomerEditDialog
          open={editCustomerOpen}
          onClose={() => dialogLogic.setEditCustomerOpen(false)}
          customer={customer}
          onUpdated={(c) => {
            setCustomer(c);
            dialogLogic.setEditCustomerOpen(false);
          }}
        />
      </Dialog>

      {/* ❌ Backend PDF Viewer Dialog - ซ่อนในโหมด Duplicate */}
      {false && (
        <Dialog open={false} onClose={() => {}} maxWidth="lg" fullWidth>
          <DialogTitle>ดูตัวอย่าง PDF</DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            <Box display="flex" alignItems="center" gap={1} p={2}>
              <CircularProgress size={22} />
              <Typography variant="body2">กำลังโหลดตัวอย่าง PDF…</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <SecondaryButton onClick={() => {}}>ปิด</SecondaryButton>
          </DialogActions>
        </Dialog>
      )}

      {/* ❌ Signature Image Preview Dialog - ซ่อนในโหมด Duplicate */}
      {false && (
        <Dialog open={false} onClose={() => {}} maxWidth="md" fullWidth>
          <DialogTitle>ภาพตัวอย่าง</DialogTitle>
          <DialogContent dividers sx={{ bgcolor: "#000" }}>
            <Box sx={{ position: "relative", width: "100%", textAlign: "center" }}>
              <img src="" alt="" style={{ maxWidth: "100%", height: "auto" }} />
            </Box>
          </DialogContent>
          <DialogActions>
            <SecondaryButton onClick={() => {}}>ปิด</SecondaryButton>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default QuotationDuplicateDialog;
