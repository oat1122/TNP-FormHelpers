// QuotationDuplicateDialog.jsx - Dialog สำหรับทำสำเนาใบเสนอราคา
import {
  Assignment as AssignmentIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
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
import React from "react";

import { useQuotationDuplicateDialogLogic } from "./hooks/useQuotationDuplicateDialogLogic";
import { useGetBulkPricingRequestAutofillQuery } from "../../../../../features/Accounting/accountingApi";
import CustomerEditDialog from "../../../PricingIntegration/components/CustomerEditDialog";
import Calculation from "../../../shared/components/Calculation";
import PricingModeSelector from "../../../shared/components/financial/PricingModeSelector";
import SpecialDiscountField from "../../../shared/components/financial/SpecialDiscountField";
import WithholdingTaxField from "../../../shared/components/financial/WithholdingTaxField";
import PaymentTerms from "../../../shared/components/PaymentTerms";
import { PAYMENT_TERMS } from "../../../shared/constants/paymentTerms";
import { useQuotationFinancials } from "../../../shared/hooks/useQuotationFinancials";
import { sanitizeInt } from "../../../shared/inputSanitizers";
import {
  Section,
  SectionHeader,
  SecondaryButton,
  InfoCard,
  tokens,
} from "../../../shared/styles/quotationFormStyles";
import { useQuotationGroups } from "../shared/hooks/useQuotationGroups";
import { PRGroupCalcCard } from "../shared/PRGroupCalcCard";
import { PRGroupSummaryCard } from "../shared/PRGroupSummaryCard";
import { formatDateTH } from "../shared/utils/quotationFormatters";
import { getAllPrIdsFromQuotation, normalizeAndGroupItems } from "../shared/utils/quotationUtils";

// ✅ รับ onSaveSuccess เพิ่ม
const QuotationDuplicateDialog = ({ open, onClose, initialData, onSaveSuccess }) => {
  // Check user permissions first
  const userData = React.useMemo(() => JSON.parse(localStorage.getItem("userData") || "{}"), []);
  const canEditQuotation = ["admin", "account"].includes(userData?.role);

  // 1. Main logic hook for data, state, and save handlers (ใช้ initialData แทน quotationId)
  const dialogLogic = useQuotationDuplicateDialogLogic(initialData, open);
  const { q, isSaving, error, customer, setCustomer, editCustomerOpen } = dialogLogic;

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
  const { groups, setIsEditing: originalSetIsEditing, ...groupHandlers } = groupsLogic;

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
    ? dialogLogic.paymentTermsType === PAYMENT_TERMS.OTHER
      ? dialogLogic.paymentTermsCustom || ""
      : dialogLogic.paymentTermsType
    : q.payment_terms ||
      q.payment_method ||
      (q.credit_days === 30
        ? PAYMENT_TERMS.CREDIT_30
        : q.credit_days === 60
          ? PAYMENT_TERMS.CREDIT_60
          : PAYMENT_TERMS.CASH);

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
                          ? dialogLogic.paymentTermsType === PAYMENT_TERMS.CREDIT_30 ||
                            dialogLogic.paymentTermsType === PAYMENT_TERMS.CREDIT_60
                          : paymentMethod !== PAYMENT_TERMS.CASH
                      }
                      dueDateNode={
                        (
                          isEditing
                            ? dialogLogic.paymentTermsType === PAYMENT_TERMS.CREDIT_30 ||
                              dialogLogic.paymentTermsType === PAYMENT_TERMS.CREDIT_60
                            : paymentMethod !== PAYMENT_TERMS.CASH
                        ) ? (
                          <>
                            <Grid item xs={6}>
                              <Typography>วันครบกำหนด</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              {isEditing &&
                              (dialogLogic.paymentTermsType === PAYMENT_TERMS.CREDIT_30 ||
                                dialogLogic.paymentTermsType === PAYMENT_TERMS.CREDIT_60) ? (
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
    </>
  );
};

export default QuotationDuplicateDialog;
