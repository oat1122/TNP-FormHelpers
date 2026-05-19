import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";
import { useCallback, useMemo } from "react";

import { useQuotationDialogFinancialsInit } from "./hooks/useQuotationDialogFinancialsInit";
import { useQuotationDialogLogic } from "./hooks/useQuotationDialogLogic";
import { useQuotationDialogSave } from "./hooks/useQuotationDialogSave";
import { useQuotationEditPermission } from "./hooks/useQuotationEditPermission";
import { useQuotationImageManager } from "./hooks/useQuotationImageManager";
import ActionBar from "./sections/ActionBar";
import FinancialControlsSection from "./sections/FinancialControlsSection";
import PaymentTermsSection from "./sections/PaymentTermsSection";
import PRGroupsSection from "./sections/PRGroupsSection";
import SampleImagesSection from "./sections/SampleImagesSection";
import SyncDialogs from "./sections/SyncDialogs";
import { useGetBulkPricingRequestAutofillQuery } from "../../../../../features/Accounting/accountingApi";
import CustomerEditDialog from "../../../PricingIntegration/components/CustomerEditDialog";
import { useQuotationFinancials } from "../../../shared/hooks/useQuotationFinancials";
import { tokens } from "../../../shared/styles/quotationFormStyles";
import { useQuotationGroups } from "../shared/hooks/useQuotationGroups";
import { getAllPrIdsFromQuotation, normalizeAndGroupItems } from "../shared/utils/quotationUtils";

const LoadingShell = ({ open, onClose, label }) => (
  <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
    <DialogContent>
      <Box display="flex" alignItems="center" gap={1} p={2}>
        <CircularProgress size={22} />
        <Typography variant="body2">{label}</Typography>
      </Box>
    </DialogContent>
  </Dialog>
);

const ErrorShell = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
    <DialogContent>
      <Box p={2}>
        <Typography color="error">ไม่สามารถโหลดข้อมูลได้</Typography>
      </Box>
    </DialogContent>
  </Dialog>
);

const QuotationDetailDialog = ({ open, onClose, quotationId, onSaveSuccess }) => {
  const { q, isLoading, error, customer, editCustomerOpen, formState, setters } =
    useQuotationDialogLogic(quotationId, open);

  const permission = useQuotationEditPermission(quotationId, open);

  useQuotationDialogFinancialsInit({ quotation: q, open, setters });

  const prIdsAll = getAllPrIdsFromQuotation(q);
  const items = normalizeAndGroupItems(q, prIdsAll);

  const { data: bulkAutofillData, isLoading: isAutofillLoading } =
    useGetBulkPricingRequestAutofillQuery(prIdsAll, {
      skip: !open || prIdsAll.length === 0,
    });

  const prAutofillMap = useMemo(() => {
    const map = new Map();
    (bulkAutofillData?.data || []).forEach((item) => {
      const key = item.pr_id || item.id;
      if (key) map.set(key, item);
    });
    return map;
  }, [bulkAutofillData]);

  const groupsLogic = useQuotationGroups(items);
  const { groups, isEditing, setIsEditing: originalSetIsEditing, ...groupHandlers } = groupsLogic;

  const setIsEditing = useCallback(
    (value) => {
      if (value && !permission.canEdit) return;
      originalSetIsEditing(value);
    },
    [permission.canEdit, originalSetIsEditing]
  );

  const financials = useQuotationFinancials({
    items: isEditing ? groups : items,
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

  const saveFlow = useQuotationDialogSave({
    quotationId,
    formState,
    onSuccess: () => {
      setIsEditing(false);
      onSaveSuccess?.();
    },
  });

  const handleSave = useCallback(async () => {
    const result = await saveFlow.handleSave(groups, financials);
    if (result?.permissionDenied) {
      permission.setPermissionError({
        open: true,
        message: result.message || "คุณไม่มีสิทธิ์แก้ไขใบเสนอราคานี้",
        invoices: result.invoices || [],
      });
    }
  }, [saveFlow, groups, financials, permission]);

  const sampleImages = useMemo(
    () => (Array.isArray(q?.sample_images) ? q.sample_images : []),
    [q?.sample_images]
  );
  const signatureImages = useMemo(
    () => (Array.isArray(q?.signature_images) ? q.signature_images : []),
    [q?.signature_images]
  );

  const imageManager = useQuotationImageManager({
    quotationId,
    quotationKey: q?.id,
    sampleImages,
    isEditing,
    handleSave: () => saveFlow.handleSave(groups, financials),
  });

  const handleToggleEditCalc = useCallback(() => {
    const el = document.getElementById("calc-section");
    const y = el ? el.scrollTop : null;
    setIsEditing(!isEditing);
    setTimeout(() => {
      const el2 = document.getElementById("calc-section");
      if (el2 != null && y != null) el2.scrollTop = y;
    }, 0);
  }, [isEditing, setIsEditing]);

  if (isLoading || (prIdsAll.length > 0 && isAutofillLoading)) {
    return (
      <LoadingShell
        open={open}
        onClose={onClose}
        label={isLoading ? "กำลังโหลดรายละเอียดใบเสนอราคา…" : "กำลังโหลดข้อมูล autofill…"}
      />
    );
  }

  if (error) return <ErrorShell open={open} onClose={onClose} />;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          รายละเอียดใบเสนอราคา
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, bgcolor: tokens.bg }}>
          <Box>
            <Grid container spacing={2}>
              <PRGroupsSection
                customer={customer}
                workName={q.work_name || q.workname || q.title || ""}
                quotationNumber={q.number || ""}
                items={items}
                activeGroups={isEditing ? groups : items}
                prAutofillMap={prAutofillMap}
                isEditing={isEditing}
                canEdit={permission.canEdit}
                onToggleEdit={handleToggleEditCalc}
                onEditCustomer={() => setters.setEditCustomerOpen(true)}
                onAddNewGroup={groupHandlers.onAddNewGroup}
                groupHandlers={groupHandlers}
                financialControlsNode={
                  <FinancialControlsSection
                    isEditing={isEditing}
                    financials={financials}
                    formState={formState}
                    setters={setters}
                  />
                }
              />

              <PaymentTermsSection
                isEditing={isEditing}
                quotation={q}
                formState={formState}
                financials={financials}
                setters={setters}
              />
            </Grid>

            <SampleImagesSection
              status={q?.status}
              sampleImages={sampleImages}
              signatureImages={signatureImages}
              imageManager={imageManager}
              canUploadSampleImages={permission.canUploadSampleImages}
              canUploadSignatures={permission.canUploadSignatures}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <ActionBar
            isEditing={isEditing}
            isSaving={saveFlow.isSaving}
            onCancelEdit={() => setIsEditing(false)}
            onSave={handleSave}
            onClose={onClose}
          />
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

      <SyncDialogs
        syncConfirmOpen={saveFlow.syncConfirmOpen}
        pendingSaveData={saveFlow.pendingSaveData}
        onCloseSyncConfirm={saveFlow.closeSyncConfirm}
        onConfirmSync={saveFlow.confirmSyncAndRetry}
        quotationId={quotationId}
        syncJobId={saveFlow.syncJobId}
        onCloseSyncProgress={saveFlow.closeSyncProgress}
        showPdfViewer={imageManager.showPdfViewer}
        pdfUrl={imageManager.pdfUrl}
        onClosePdfViewer={() => imageManager.setShowPdfViewer(false)}
        previewImage={imageManager.previewImage}
        onClosePreviewImage={() => imageManager.setPreviewImage(null)}
        permissionError={permission.permissionError}
        quotationNumber={q?.number}
        userRole={permission.role}
        onClosePermissionError={permission.clearPermissionError}
      />
    </>
  );
};

export default QuotationDetailDialog;
