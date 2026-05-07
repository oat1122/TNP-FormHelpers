import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";

import { useQuotationDuplicateForm } from "./hooks/useQuotationDuplicateForm";
import { useQuotationDuplicateItems } from "./hooks/useQuotationDuplicateItems";
import { useQuotationDuplicateValidation } from "./hooks/useQuotationDuplicateValidation";
import { useQuotationFormSave } from "./hooks/useQuotationFormSave";
import CustomerSection from "./sections/CustomerSection";
import EvidenceSection from "./sections/EvidenceSection";
import ItemsCalculationSection from "./sections/ItemsCalculationSection";
import PaymentTermsSection from "./sections/PaymentTermsSection";
import DialogHeader from "./subcomponents/DialogHeader";
import EditModeTabs from "./subcomponents/EditModeTabs";
import ValidationBanner from "./subcomponents/ValidationBanner";
import CustomerEditDialog from "../../../PricingIntegration/components/CustomerEditDialog";
import { useCurrentUser } from "../../../shared/hooks/useCurrentUser";
import { useQuotationFinancials } from "../../../shared/hooks/useQuotationFinancials";
import { SecondaryButton, tokens } from "../../../shared/styles/quotationFormStyles";
import { useQuotationDialogFinancialsInit } from "../QuotationDetailDialog/hooks/useQuotationDialogFinancialsInit";

const EDIT_ROLES = ["admin", "account"];

const QuotationDuplicateDialog = ({
  open,
  onClose,
  initialData,
  onSaveSuccess,
  onSignatureUploaded,
  mode = "duplicate",
  quotationId = null,
}) => {
  const isEdit = mode === "edit";
  const { currentUser } = useCurrentUser();
  const canEditCustomer = EDIT_ROLES.includes(currentUser?.role);

  // Form state (customer + notes + payment + deposit + discount + vat + withholding)
  const { q, customer, editCustomerOpen, formState, setters } =
    useQuotationDuplicateForm(initialData);

  // Re-sync financials when source quotation / open state changes
  useQuotationDialogFinancialsInit({ quotation: q, open, setters });

  // Items + autofill + grouping (Phase 3 — bundled into one hook)
  const { prIdsAll, items, groups, groupHandlers, prAutofillMap, isAutofillLoading } =
    useQuotationDuplicateItems({ q, open });

  const financials = useQuotationFinancials({
    items: groups,
    pricingMode: formState.pricingMode,
    depositMode: formState.deposit.mode,
    depositPercentage: formState.deposit.percentage,
    depositAmountInput: formState.deposit.amountInput,
    specialDiscountType: formState.specialDiscount.type,
    specialDiscountValue: formState.specialDiscount.value,
    hasWithholdingTax: formState.withholding.enabled,
    withholdingTaxPercentage: formState.withholding.percentage,
    hasVat: formState.vat.enabled,
    vatPercentage: formState.vat.percentage,
  });

  // Phase 4: proactive validation — surfaces issues before save click
  const { issues, hasBlockingErrors, blockingReason } = useQuotationDuplicateValidation({
    groups,
    financials,
  });

  const saveFlow = useQuotationFormSave({
    mode,
    sourceQuotation: q,
    customer,
    formState,
    quotationId,
    onSuccess: () => {
      onSaveSuccess?.();
      onClose();
    },
  });

  const handleSave = useCallback(async () => {
    await saveFlow.handleSave(groups, financials);
  }, [saveFlow, groups, financials]);

  const isSaveDisabled = saveFlow.isSaving || hasBlockingErrors;
  const saveDisableReason = hasBlockingErrors ? blockingReason : "";

  // Tab state lifted here so the tab bar can sit OUTSIDE DialogContent
  // (immediately under DialogHeader, no padding gap), while the active panel
  // renders INSIDE DialogContent (scrollable area with padding).
  const [activeTab, setActiveTab] = useState("items");

  const panels = useMemo(
    () => ({
      customer: (
        <Grid container spacing={2}>
          <CustomerSection
            customer={customer}
            canEdit={canEditCustomer}
            onEditCustomer={() => setters.setEditCustomerOpen(true)}
          />
        </Grid>
      ),
      items: (
        <Grid container spacing={2}>
          <ItemsCalculationSection
            customer={customer}
            workName={q.work_name || q.workname || q.title || ""}
            items={items}
            groups={groups}
            prAutofillMap={prAutofillMap}
            canEdit={canEditCustomer}
            onEditCustomer={() => setters.setEditCustomerOpen(true)}
            onAddNewGroup={groupHandlers.onAddNewGroup}
            groupHandlers={groupHandlers}
            formState={formState}
            setters={setters}
            financials={financials}
            hideCustomerCard={true}
          />
        </Grid>
      ),
      payment: (
        <Grid container spacing={2}>
          <PaymentTermsSection
            quotation={q}
            formState={formState}
            financials={financials}
            setters={setters}
          />
        </Grid>
      ),
      evidence: (
        <Grid container spacing={2}>
          <EvidenceSection
            quotationId={quotationId || q?.id}
            signatureImages={Array.isArray(q?.signature_images) ? q.signature_images : []}
            sampleImages={Array.isArray(q?.sample_images) ? q.sample_images : []}
            currentUserRole={currentUser?.role}
            onUploaded={onSignatureUploaded}
          />
        </Grid>
      ),
    }),
    [
      customer,
      canEditCustomer,
      setters,
      q,
      items,
      groups,
      prAutofillMap,
      groupHandlers,
      formState,
      financials,
      quotationId,
      currentUser?.role,
      onSignatureUploaded,
    ]
  );

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogHeader
        mode={mode}
        sourceQuotation={q}
        customerName={customer?.cus_company || customer?.name}
        finalTotal={financials?.finalTotal}
        onClose={onClose}
      />
      {/* Tab bar — placed OUTSIDE DialogContent so it sits flush against
          DialogHeader with no padding gap (per user request "ย้ายให้ติดกัน") */}
      <EditModeTabs activeTab={activeTab} onChange={setActiveTab} showEvidence={isEdit} />
      <DialogContent dividers={false} sx={{ p: 2, bgcolor: tokens.bg }}>
        <Box>
          <ValidationBanner issues={issues} />
          {panels[activeTab]}
        </Box>
      </DialogContent>
      <DialogActions>
        {!isEdit && (
          <SecondaryButton disabled title="สามารถดู PDF ได้หลังจากสร้างใบเสนอราคาแล้ว">
            (ดู PDF หลังสร้าง)
          </SecondaryButton>
        )}
        <SecondaryButton onClick={onClose} disabled={saveFlow.isSaving}>
          ยกเลิก
        </SecondaryButton>
        {(() => {
          const savingLabel = isEdit ? "กำลังบันทึก…" : "กำลังสร้าง…";
          const saveLabel = isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้างใบเสนอราคา";
          const buttonText = saveFlow.isSaving ? savingLabel : saveLabel;
          if (isSaveDisabled && saveDisableReason) {
            return (
              <Tooltip title={saveDisableReason} arrow placement="top">
                <span>
                  <SecondaryButton onClick={handleSave} disabled>
                    {buttonText}
                  </SecondaryButton>
                </span>
              </Tooltip>
            );
          }
          return (
            <SecondaryButton onClick={handleSave} disabled={isSaveDisabled}>
              {buttonText}
            </SecondaryButton>
          );
        })()}
      </DialogActions>

      <CustomerEditDialog
        open={editCustomerOpen}
        onClose={() => setters.setEditCustomerOpen(false)}
        customer={customer}
        onUpdated={(c) => {
          setters.setCustomer(c);
          setters.setEditCustomerOpen(false);
        }}
      />
    </Dialog>
  );
};

export default QuotationDuplicateDialog;
