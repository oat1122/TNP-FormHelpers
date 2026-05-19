import { Dialog, DialogActions, DialogContent } from "@mui/material";
import { useEffect, useState } from "react";

import { tokens } from "../../../PricingIntegration/components/styles/quotationFormStyles";
import { useCurrentUser } from "../../../shared/hooks/useCurrentUser";
import { useInvoiceCalculation } from "../calculation/useInvoiceCalculation";
import { useInvoiceValidation } from "../calculation/useInvoiceValidation";
import { useInvoiceApproval } from "../hooks/useInvoiceApproval";
import { useInvoiceSideEditState } from "../hooks/useInvoiceSideEditState";
import { useInvoiceSideValidation } from "../hooks/useInvoiceSideValidation";
import { useActiveSideTab } from "./hooks/useActiveSideTab";
import { useCustomerSourceToggle } from "./hooks/useCustomerSourceToggle";
import { useEditableInvoiceItems } from "./hooks/useEditableInvoiceItems";
import { useInvoiceCloseFlow } from "./hooks/useInvoiceCloseFlow";
import { useInvoiceDetailQueries } from "./hooks/useInvoiceDetailQueries";
import { useInvoiceFormData } from "./hooks/useInvoiceFormData";
import { useInvoicePdfPreview } from "./hooks/useInvoicePdfPreview";
import { useInvoiceSave } from "./hooks/useInvoiceSave";
import { useSyncSideAmounts } from "./hooks/useSyncSideAmounts";
import DialogHeader from "./subcomponents/DialogHeader";
import InvoiceDetailBody from "./subcomponents/InvoiceDetailBody";
import InvoiceDialogActions from "./subcomponents/InvoiceDialogActions";
import InvoiceSideModals from "./subcomponents/InvoiceSideModals";
import { buildCalculationInput } from "./utils/buildCalculationInput";
import { buildCalculationResetValues } from "./utils/buildCalculationResetValues";
import { buildEditModeTabsProps } from "./utils/buildEditModeTabsProps";
import { normalizeCustomer, normalizeItems } from "./utils/invoiceDetailNormalizers";

const EDIT_INVOICE_ROLES = ["admin", "account"];

/**
 * InvoiceDetailDialog — composition shell.
 *
 * Responsibilities:
 *  - fetch invoice + companies + current user
 *  - orchestrate hooks (form data, items, calc, validation, side-edit, pdf, save, close)
 *  - compose layout: DialogHeader + InvoiceDetailBody + Actions + side modals
 *
 * รายละเอียดทั้งหมดอยู่ใน hooks/, sections/, subcomponents/, utils/.
 */
const InvoiceDetailDialog = ({ open, onClose, invoiceId, initialEditMode = false }) => {
  // initialEditMode=false (จาก eye button) = view-only — ซ่อนปุ่ม "แก้ไข"
  const lockedReadOnly = !initialEditMode;

  const {
    invoice,
    isLoading,
    error,
    updateInvoice,
    isSaving,
    generateInvoicePDF,
    isGeneratingPdf,
    companies,
    loadingCompanies,
  } = useInvoiceDetailQueries({ open, invoiceId });

  const { currentUser, isAdmin } = useCurrentUser();
  const canEditInvoice =
    isAdmin || EDIT_INVOICE_ROLES.includes(String(currentUser?.role || "").toLowerCase());

  const [isEditing, setIsEditing] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  // In-app PDF viewer (เก็บไว้เผื่อ restore — ตอนนี้เปิดแท็บใหม่จริงผ่าน useInvoicePdfPreview)
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const customer = normalizeCustomer(invoice);
  const items = normalizeItems(invoice);

  const {
    formData,
    setFormData,
    notes,
    setNotes,
    customerDataSource,
    setCustomerDataSource,
    discountTypeState,
    setDiscountTypeState,
    handleFieldChange,
    markCustomerSourceManuallySet,
    clearCustomerSourceManualFlag,
  } = useInvoiceFormData(invoice);

  const {
    editableItems,
    handleAddSizeRow,
    handleChangeSizeRow,
    handleRemoveSizeRow,
    handleDeleteItem,
    handleChangeItem,
    resetItems,
  } = useEditableInvoiceItems(invoice);

  const { depositMode } = useInvoiceApproval(invoice);
  const sideEdit = useInvoiceSideEditState(invoice);
  const { activeSideTab, setActiveSideTab } = useActiveSideTab(depositMode);

  const sideValidation = useInvoiceSideValidation({
    invoice,
    beforeFormData: sideEdit.beforeFormData,
    afterFormData: sideEdit.afterFormData,
  });

  const calculation = useInvoiceCalculation(
    buildCalculationInput({
      isEditing,
      editableItems,
      invoice,
      formData,
      discountTypeState,
    })
  );

  const validation = useInvoiceValidation({
    items: isEditing ? editableItems : invoice?.items || [],
    originalInvoice: invoice,
    formData,
  });

  useSyncSideAmounts(calculation, sideEdit.syncDerivedAmounts);

  const { unsavedDialogOpen, setUnsavedDialogOpen, handleDialogClose, handleDiscardUnsaved } =
    useInvoiceCloseFlow({ isEditing, sideEdit, setIsEditing, onClose });

  const { executeSave, handleSave } = useInvoiceSave({
    invoice,
    formData,
    notes,
    isEditing,
    editableItems,
    calculation,
    customerDataSource,
    sideEdit,
    sideValidation,
    updateInvoice,
    setIsEditing,
    setSaveConfirmOpen,
    clearCustomerSourceManualFlag,
    setCustomerDataSource,
  });

  const { handlePreviewPdf } = useInvoicePdfPreview({
    invoice,
    invoiceId,
    formData,
    generateInvoicePDF,
  });

  const { handleCustomerDataSourceChange } = useCustomerSourceToggle({
    setFormData,
    setCustomerDataSource,
    markCustomerSourceManuallySet,
    customer,
  });

  // enter edit mode from initialEditMode (role-gated)
  useEffect(() => {
    if (open) setIsEditing(Boolean(initialEditMode) && canEditInvoice);
  }, [open, initialEditMode, canEditInvoice]);

  const handleResetCalculation = () => {
    resetItems();
    setFormData((prev) => ({ ...prev, ...buildCalculationResetValues(invoice) }));
  };

  const editModeTabsProps = buildEditModeTabsProps({
    mode: { initialEditMode, isEditing, canEditInvoice, lockedReadOnly, setIsEditing },
    data: {
      customer,
      customerDataSource,
      formData,
      invoice,
      depositMode,
      editableItems,
      items,
      calculation,
      validation,
      notes,
      companies,
      loadingCompanies,
      discountTypeState,
      currentUser,
    },
    handlers: {
      handleFieldChange,
      handleCustomerDataSourceChange,
      handleAddSizeRow,
      handleChangeSizeRow,
      handleRemoveSizeRow,
      handleDeleteItem,
      handleChangeItem,
      setDiscountTypeState,
      setNotes,
    },
    sideState: { sideEdit, sideValidation, activeSideTab, setActiveSideTab },
  });

  return (
    <>
      <Dialog open={open} onClose={handleDialogClose} maxWidth="lg" fullWidth>
        <DialogHeader
          invoice={invoice}
          isEditing={isEditing}
          depositMode={depositMode}
          onClose={handleDialogClose}
        />
        <DialogContent dividers sx={{ p: 2, bgcolor: tokens.bg }}>
          <InvoiceDetailBody
            isLoading={isLoading}
            error={error}
            validation={validation}
            editModeTabsProps={editModeTabsProps}
          />
        </DialogContent>
        <DialogActions>
          <InvoiceDialogActions
            isEditing={isEditing}
            isSaving={isSaving}
            isGeneratingPdf={isGeneratingPdf}
            invoice={invoice}
            validation={validation}
            lockedReadOnly={lockedReadOnly}
            canEditInvoice={canEditInvoice}
            onPreviewPdf={handlePreviewPdf}
            onResetCalculation={handleResetCalculation}
            onCancelEdit={() => setIsEditing(false)}
            onSave={handleSave}
            onEnterEdit={() => canEditInvoice && setIsEditing(true)}
            onClose={handleDialogClose}
          />
        </DialogActions>
      </Dialog>

      <InvoiceSideModals
        pdfViewer={{ open: showPdfViewer, onClose: () => setShowPdfViewer(false), pdfUrl: "" }}
        unsaved={{
          open: unsavedDialogOpen,
          dirtyFieldLabels: sideEdit.dirtyFieldLabels,
          onCancel: () => setUnsavedDialogOpen(false),
          onDiscard: handleDiscardUnsaved,
        }}
        saveConfirm={{
          open: saveConfirmOpen,
          warnings: sideValidation.warnings,
          loading: isSaving,
          onCancel: () => setSaveConfirmOpen(false),
          onConfirm: executeSave,
        }}
      />
    </>
  );
};

export default InvoiceDetailDialog;
