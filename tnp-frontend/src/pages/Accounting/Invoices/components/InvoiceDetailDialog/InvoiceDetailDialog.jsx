import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";
import React, { useState, useRef } from "react";

import {
  useGetInvoiceQuery,
  useUpdateInvoiceMutation,
  useGenerateInvoicePDFMutation,
} from "../../../../../features/Accounting/accountingApi";
import { tokens } from "../../../PricingIntegration/components/styles/quotationFormStyles";
import { showSuccess, showError, showLoading, dismissToast } from "../../../utils/accountingToast";
import InvoiceWarningsBanner from "../calculation/InvoiceWarningsBanner";
import { useInvoiceCalculation } from "../calculation/useInvoiceCalculation";
import { useInvoiceValidation } from "../calculation/useInvoiceValidation";
import { useInvoiceApproval } from "../hooks/useInvoiceApproval";
import { useInvoiceSideEditState } from "../hooks/useInvoiceSideEditState";
import { useInvoiceSideValidation } from "../hooks/useInvoiceSideValidation";
import InvoiceSaveConfirmDialog from "../subcomponents/InvoiceSaveConfirmDialog";
import InvoiceSideTabs from "../subcomponents/InvoiceSideTabs";
import UnsavedChangesDialog from "../subcomponents/UnsavedChangesDialog";
import CalculationSection from "./sections/CalculationSection";
import CustomerSection from "./sections/CustomerSection";
import PaymentTermsSection from "./sections/PaymentTermsSection";
import { normalizeCustomer, normalizeItems } from "./utils/invoiceDetailNormalizers";

const InvoiceDetailDialog = ({ open, onClose, invoiceId }) => {
  const { data, isLoading, error } = useGetInvoiceQuery(invoiceId, { skip: !open || !invoiceId });
  const [updateInvoice, { isLoading: isSaving }] = useUpdateInvoiceMutation();
  const [generateInvoicePDF, { isLoading: isGeneratingPdf }] = useGenerateInvoicePDFMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl] = useState("");
  const [customerDataSource, setCustomerDataSource] = useState("master"); // 'master' or 'invoice'
  const customerSourceManuallySet = useRef(false);
  const prevInvoiceIdRef = useRef(null);

  // New state for the enhanced calculation section
  const [editableItems, setEditableItems] = useState([]);
  const [discountTypeState, setDiscountTypeState] = useState("percentage"); // 👈 เพิ่ม State

  // Form fields for editing
  const [formData, setFormData] = useState({
    type: "",
    status: "",
    customer_company: "",
    customer_tax_id: "",
    customer_address: "",
    customer_zip_code: "",
    customer_tel_1: "",
    customer_email: "",
    customer_firstname: "",
    customer_lastname: "",
    special_discount_percentage: 0,
    special_discount_amount: 0,
    has_vat: true,
    vat_percentage: 7.0,
    pricing_mode: "net",
    has_withholding_tax: false,
    withholding_tax_percentage: 0,
    withholding_tax_base: "subtotal", // 'subtotal' | 'total_after_vat'
    deposit_percentage: 0,
    deposit_amount: 0,
    deposit_mode: "percentage",
    deposit_display_order: "before", // 'before' | 'after'
    due_date: "",
    payment_method: "",
    payment_terms: "",
    document_header_type: "ต้นฉบับ",
  });

  // Get invoice data
  const invoice = React.useMemo(() => data?.data || data || {}, [data]);
  const customer = normalizeCustomer(invoice);
  const items = normalizeItems(invoice);

  // Use invoice approval hook for deposit mode
  const { depositMode } = useInvoiceApproval(invoice);

  // Per-side edit state (มัดจำก่อน / มัดจำหลัง) — Phase 2 of invoice-side-edit
  const sideEdit = useInvoiceSideEditState(invoice);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);

  // Phase 3: tab UI + soft-validation warnings
  // Default tab follows the deposit_display_order (matches what the user sees in DepositCard)
  const [activeSideTab, setActiveSideTab] = useState(depositMode || "before");
  React.useEffect(() => {
    setActiveSideTab(depositMode || "before");
  }, [depositMode]);
  const sideValidation = useInvoiceSideValidation({
    invoice,
    beforeFormData: sideEdit.beforeFormData,
    afterFormData: sideEdit.afterFormData,
  });

  // Phase 4: save confirm modal (shown when warnings exist at save time)
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  // Intercept dialog close: if there are unsaved per-side edits, prompt user first
  const handleDialogClose = React.useCallback(() => {
    if (isEditing && sideEdit.dirtyAny) {
      setUnsavedDialogOpen(true);
      return;
    }
    onClose?.();
  }, [isEditing, sideEdit.dirtyAny, onClose]);

  const handleDiscardUnsaved = React.useCallback(() => {
    sideEdit.resetAll();
    setUnsavedDialogOpen(false);
    setIsEditing(false);
    onClose?.();
  }, [sideEdit, onClose]);

  // Update notes when invoice changes
  React.useEffect(() => {
    if (invoice?.notes) {
      setNotes(invoice.notes);
    }
  }, [invoice?.notes]);

  // Update form data when invoice changes
  React.useEffect(() => {
    if (invoice && Object.keys(invoice).length > 0) {
      // Normalize due_date to yyyy-MM-dd for date input
      const normalizeDate = (d) => {
        if (!d) return "";
        if (typeof d === "string") {
          if (d.length >= 10) return d.substring(0, 10); // trims ISO 2025-09-27T...
        }
        try {
          return new Date(d).toISOString().substring(0, 10);
        } catch {
          return "";
        }
      };

      const newInvoiceId = invoice.id;
      const invoiceChanged = prevInvoiceIdRef.current !== newInvoiceId;

      // Initialize discount type state from invoice data
      const initialDiscountType =
        (invoice.special_discount_percentage || 0) > 0
          ? "percentage"
          : (invoice.special_discount_amount || 0) > 0
            ? "amount"
            : "percentage"; // Default
      setDiscountTypeState(initialDiscountType);

      setFormData({
        type: invoice.type || "full_amount",
        status: invoice.status || "draft",
        customer_company: invoice.customer_company || "",
        customer_tax_id: invoice.customer_tax_id || "",
        customer_address: invoice.customer_address || "",
        customer_zip_code: invoice.customer_zip_code || "",
        customer_tel_1: invoice.customer_tel_1 || "",
        customer_email: invoice.customer_email || "",
        customer_firstname: invoice.customer_firstname || "",
        customer_lastname: invoice.customer_lastname || "",
        special_discount_percentage: invoice.special_discount_percentage || 0,
        special_discount_amount: invoice.special_discount_amount || 0,
        has_vat: invoice.has_vat !== undefined ? invoice.has_vat : true,
        vat_percentage: invoice.vat_percentage || 7.0,
        pricing_mode: invoice.pricing_mode || "net",
        has_withholding_tax: invoice.has_withholding_tax || false,
        withholding_tax_percentage: invoice.withholding_tax_percentage || 0,
        deposit_percentage: invoice.deposit_percentage || 0,
        deposit_amount: invoice.deposit_amount || 0,
        deposit_mode: invoice.deposit_mode || "percentage",
        due_date: normalizeDate(invoice.due_date),
        payment_method: invoice.payment_method || "",
        payment_terms: invoice.payment_terms || "",
        document_header_type: invoice.document_header_type || "ต้นฉบับ",
      });

      // Only auto-set data source when invoice just loaded / changed and user hasn't manually toggled
      if (invoiceChanged || !customerSourceManuallySet.current) {
        // Prefer explicit field on record if exists (normalize legacy values), otherwise infer by overrides
        const explicitSource = invoice.customer_data_source;
        const normalized = explicitSource === "master_customer" ? "master" : explicitSource;
        if (normalized === "master" || normalized === "invoice") {
          setCustomerDataSource(normalized);
        } else {
          const hasCustomerOverride =
            invoice.customer_company ||
            invoice.customer_tax_id ||
            invoice.customer_address ||
            invoice.customer_firstname ||
            invoice.customer_lastname;
          setCustomerDataSource(hasCustomerOverride ? "invoice" : "master");
        }
      }
      prevInvoiceIdRef.current = newInvoiceId;
    }
  }, [invoice]);

  // Initialize editable items from invoice items
  React.useEffect(() => {
    if (invoice?.items && invoice.items.length > 0) {
      const processedItems = normalizeItems(invoice).map((item) => ({
        ...item,
        // Preserve Backend fields for update
        quotation_item_id: item.items?.[0]?.quotation_item_id || null,
        pricing_request_id: item.items?.[0]?.pricing_request_id || null,
        item_description: item.items?.[0]?.item_description || null,
        discount_percentage: item.items?.[0]?.discount_percentage || 0,
        discount_amount: item.items?.[0]?.discount_amount || 0,
        status: item.items?.[0]?.status || "draft",
        originalQuantity: item.quantity,
      }));
      setEditableItems(processedItems);
    }
  }, [invoice]);

  // Use Invoice calculation hook
  const calculation = useInvoiceCalculation({
    items: isEditing ? editableItems : invoice?.items || [],
    pricingMode: formData.pricing_mode,
    specialDiscountType: discountTypeState, // 👈 ใช้ State แทน
    specialDiscountValue:
      discountTypeState === "percentage" // 👈 ใช้ State แทน
        ? formData.special_discount_percentage
        : formData.special_discount_amount,
    hasVat: formData.has_vat,
    vatPercentage: formData.vat_percentage,
    hasWithholdingTax: formData.has_withholding_tax,
    withholdingTaxPercentage: formData.withholding_tax_percentage,
    withholdingTaxBase: formData.withholding_tax_base,
    depositMode: formData.deposit_mode,
    depositPercentage: formData.deposit_percentage,
    depositAmountInput: formData.deposit_amount,
    depositDisplayOrder: formData.deposit_display_order,
  });

  // Use Invoice validation hook
  const validation = useInvoiceValidation({
    items: isEditing ? editableItems : invoice?.items || [],
    originalInvoice: invoice,
    formData,
  });

  // Phase 4: build the update payload — pure function for clarity + reuse from confirm flow
  const buildUpdatePayload = () => {
    const updateData = {
      id: invoice.id,
      notes: notes || "",
      ...formData,
      // Include updated items if edited
      items: isEditing ? editableItems : undefined,
      // Persist computed numbers from new calculation
      subtotal: calculation.subtotal,
      special_discount_amount: calculation.discountUsed,
      special_discount_percentage: formData.special_discount_percentage,
      vat_amount: calculation.vatAmount,
      tax_amount: calculation.vatAmount, // backward compatibility field if backend uses tax_amount
      withholding_tax_amount: calculation.withholdingTaxAmount,
      total_amount: calculation.totalAmount,
      final_total_amount: calculation.finalTotalAmount,
      deposit_amount: calculation.depositAmount,
      deposit_amount_before_vat: calculation.depositAmountBeforeVat,
      deposit_percentage: calculation.depositPercentage,
      // Persist selected customer data source
      customer_data_source: customerDataSource,
      // Phase 2-4: per-side override fields (มัดจำก่อน / มัดจำหลัง)
      ...sideEdit.getSidePayload(),
    };

    // If using master customer data, explicitly clear invoice override fields in DB
    // so subsequent refetch shows master values.
    if (customerDataSource === "master") {
      updateData.customer_company = null;
      updateData.customer_tax_id = null;
      updateData.customer_address = null;
      updateData.customer_zip_code = null;
      updateData.customer_tel_1 = null;
      updateData.customer_email = null;
      updateData.customer_firstname = null;
      updateData.customer_lastname = null;
    }

    return updateData;
  };

  // Phase 4: actual mutation call — extracted so confirm modal can reuse
  const executeSave = async () => {
    const updateData = buildUpdatePayload();
    try {
      const loadingId = showLoading("กำลังบันทึกใบแจ้งหนี้…");
      await updateInvoice(updateData).unwrap();
      // If switching to master, reset manual flag so effect can auto-sync on refetch
      if (customerDataSource === "master") {
        customerSourceManuallySet.current = false;
        setCustomerDataSource("master");
      }
      // Per-side dirty flags — clear after successful save (Phase 2)
      sideEdit.resetAll();
      setIsEditing(false);
      setSaveConfirmOpen(false);
      dismissToast(loadingId);
      showSuccess("บันทึกใบแจ้งหนี้เรียบร้อย");
    } catch (e) {
      console.error("Failed to update invoice:", e);
      let errorMessage = "บันทึกใบแจ้งหนี้ไม่สำเร็จ";

      if (e?.data?.message) {
        errorMessage = e.data.message;
      } else if (e?.message) {
        errorMessage = e.message;
        // แปลข้อผิดพลาดเป็นภาษาไทย
        if (errorMessage.includes("cannot be updated in current status")) {
          errorMessage = `ไม่สามารถแก้ไขใบแจ้งหนี้ได้ในสถานะปัจจุบัน (${invoice?.status || "unknown"})`;
        }
      }

      showError(errorMessage);
    }
  };

  // Phase 4: entry point — gate by side-validation warnings
  // Has warning → open confirm modal; user must acknowledge before save
  // No warning → save directly
  const handleSave = () => {
    if (sideValidation.hasAnyWarning) {
      setSaveConfirmOpen(true);
      return;
    }
    return executeSave();
  };

  // Force view mode every time dialog is opened
  React.useEffect(() => {
    if (open) {
      setIsEditing(false);
    }
  }, [open]);

  const enterEditMode = () => {
    // Keep current selection; do not force reset to 'master'
    setIsEditing(true);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomerDataSourceChange = (event, value) => {
    // Use the value argument provided by MUI RadioGroup to avoid cases where event.target
    // is not the input element (e.g., clicking label/span), which can make target.value undefined.
    const newSource = value;
    if (!newSource) return;
    customerSourceManuallySet.current = true;
    setCustomerDataSource(newSource);
    if (newSource === "master") {
      // Do nothing to formData; invoice override values are preserved invisibly
      return;
    }
    if (newSource === "invoice" && customer) {
      // Autofill invoice override fields from master (only overwrite if empty to preserve existing manual edits)
      setFormData((prev) => ({
        ...prev,
        customer_company: prev.customer_company || customer.cus_company || "",
        customer_tax_id: prev.customer_tax_id || customer.cus_tax_id || "",
        customer_address: prev.customer_address || customer.cus_address || "",
        customer_zip_code: prev.customer_zip_code || customer.cus_zip_code || "",
        customer_tel_1: prev.customer_tel_1 || customer.cus_tel_1 || "",
        customer_email: prev.customer_email || customer.cus_email || "",
        customer_firstname: prev.customer_firstname || customer.cus_firstname || "",
        customer_lastname: prev.customer_lastname || customer.cus_lastname || "",
      }));
    }
  };

  const handlePreviewPdf = async () => {
    // Use loaded invoice id or fallback to prop invoiceId
    const id = invoice?.id || invoiceId;
    if (!id) {
      showError("ไม่พบรหัสใบแจ้งหนี้ (invoice id)");
      return;
    }

    try {
      const loadingId = showLoading("กำลังสร้าง PDF ใบแจ้งหนี้…");
      // Pass object per accountingApi.generateInvoicePDF definition
      const res = await generateInvoicePDF({
        id,
        // send current header type if available (array expected for multi header feature)
        headerTypes: formData?.document_header_type ? [formData.document_header_type] : undefined,
        preview: true, // hint backend this is a preview (safe to ignore if not used)
      }).unwrap();

      const url = res?.pdf_url || res?.url;

      // ย้าย dismissToast มาก่อนเปิดแท็บใหม่
      dismissToast(loadingId);

      if (url) {
        // เปิดในแท็บใหม่โดยตรง
        window.open(url, "_blank");
        showSuccess("สร้าง PDF สำเร็จ");
        // ไม่ต้อง set state เพื่อเปิด Modal อีกต่อไป
        // setPdfUrl(url);
        // setShowPdfViewer(true);
      } else {
        showError("ไม่ได้รับลิงก์ PDF จากเซิร์ฟเวอร์");
      }
    } catch (e) {
      showError(e?.data?.message || e?.message || "ไม่สามารถสร้าง PDF ได้");
    }
  };

  // Enhanced calculation handlers

  const handleAddSizeRow = (itemIndex, newRow = { size: "", quantity: 0, unitPrice: 0 }) => {
    setEditableItems((prev) =>
      prev.map((item, idx) => {
        if (idx === itemIndex) {
          const sizeRows = Array.isArray(item.sizeRows) ? [...item.sizeRows] : [];
          sizeRows.push(newRow);
          return { ...item, sizeRows };
        }
        return item;
      })
    );
  };

  const handleChangeSizeRow = (itemIndex, rowIndex, field, value) => {
    setEditableItems((prev) =>
      prev.map((item, idx) => {
        if (idx === itemIndex && Array.isArray(item.sizeRows)) {
          const sizeRows = [...item.sizeRows];
          if (sizeRows[rowIndex]) {
            sizeRows[rowIndex] = { ...sizeRows[rowIndex], [field]: value };
          }
          return { ...item, sizeRows };
        }
        return item;
      })
    );
  };

  const handleRemoveSizeRow = (itemIndex, rowIndex) => {
    setEditableItems((prev) =>
      prev.map((item, idx) => {
        if (idx === itemIndex && Array.isArray(item.sizeRows)) {
          const sizeRows = [...item.sizeRows];
          sizeRows.splice(rowIndex, 1);
          return { ...item, sizeRows };
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (itemIndex) => {
    setEditableItems((prev) => prev.filter((_, idx) => idx !== itemIndex));
  };

  const handleChangeItem = (itemIndex, field, value) => {
    setEditableItems((prev) =>
      prev.map((item, idx) => {
        if (idx === itemIndex) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleResetCalculation = () => {
    // Reset to original data from server
    if (invoice?.items) {
      const processedItems = invoice.items.map((item) => ({
        ...item,
        sizeRows: item.size_details || [],
        originalQuantity: item.quantity,
      }));
      setEditableItems(processedItems);
    }

    // Reset form data to original invoice values
    setFormData((prev) => ({
      ...prev,
      special_discount_percentage: Number(invoice.special_discount_percentage || 0),
      special_discount_amount: Number(invoice.special_discount_amount || 0),
      has_vat: Boolean(invoice.has_vat ?? true),
      vat_percentage: Number(invoice.vat_percentage || 7.0),
      has_withholding_tax: Boolean(invoice.has_withholding_tax),
      withholding_tax_percentage: Number(invoice.withholding_tax_percentage || 0),
      withholding_tax_base: invoice.withholding_tax_base || "subtotal",
      deposit_percentage: Number(invoice.deposit_percentage || 0),
      deposit_amount: Number(invoice.deposit_amount || 0),
      deposit_mode: invoice.deposit_mode || "percentage",
      deposit_display_order: invoice.deposit_display_order || "before",
    }));
  };

  const actions = (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", alignItems: "center" }}>
      {isEditing ? (
        <>
          <SecondaryButton
            onClick={handlePreviewPdf}
            disabled={isGeneratingPdf || !invoice?.id || !validation.isValid}
            aria-label="ดูตัวอย่าง PDF"
          >
            {isGeneratingPdf ? "กำลังสร้าง…" : "ดูตัวอย่าง PDF"}
          </SecondaryButton>
          <Button
            variant="outlined"
            onClick={handleResetCalculation}
            disabled={isSaving}
            sx={{ borderColor: tokens.primary, color: tokens.primary }}
            aria-label="รีเซ็ตการคำนวณ"
          >
            รีเซ็ต
          </Button>
          <Button
            variant="text"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
            aria-label="ยกเลิกการแก้ไข"
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || !validation.isValid}
            sx={{
              bgcolor: tokens.primary,
              "&:hover": { bgcolor: "#7A0E0E" },
              "&:disabled": { bgcolor: "grey.300" },
            }}
            aria-label="บันทึกการเปลี่ยนแปลง"
          >
            {isSaving ? "กำลังบันทึก…" : "บันทึก"}
          </Button>
        </>
      ) : (
        <>
          <SecondaryButton
            onClick={handlePreviewPdf}
            disabled={isGeneratingPdf || !invoice?.id}
            aria-label="ดูตัวอย่าง PDF"
          >
            {isGeneratingPdf ? "กำลังสร้าง…" : "ดูตัวอย่าง PDF"}
          </SecondaryButton>
          <Button
            variant="contained"
            onClick={enterEditMode}
            disabled={validation.isReadOnly}
            sx={{
              bgcolor: tokens.primary,
              "&:hover": { bgcolor: "#7A0E0E" },
              "&:disabled": { bgcolor: "grey.300" },
            }}
            aria-label={
              validation.isReadOnly ? "ไม่สามารถแก้ไขได้ในสถานะปัจจุบัน" : "แก้ไขใบแจ้งหนี้"
            }
          >
            แก้ไข
          </Button>
          <Button variant="text" onClick={handleDialogClose} aria-label="ปิดหน้าต่าง">
            ปิด
          </Button>
        </>
      )}
    </Box>
  );

  return (
    <>
      <Dialog open={open} onClose={handleDialogClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          รายละเอียดใบแจ้งหนี้
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, bgcolor: tokens.bg }}>
          {isLoading ? (
            <Box display="flex" alignItems="center" gap={1} p={2}>
              <CircularProgress size={22} />
              <Typography variant="body2">กำลังโหลดรายละเอียด…</Typography>
            </Box>
          ) : error ? (
            <Box p={2}>
              <Typography color="error">ไม่สามารถโหลดข้อมูลได้</Typography>
            </Box>
          ) : (
            <Box>
              <Grid container spacing={2}>
                <CustomerSection
                  isEditing={isEditing}
                  customerDataSource={customerDataSource}
                  handleCustomerDataSourceChange={handleCustomerDataSourceChange}
                  customer={customer}
                  formData={formData}
                  invoice={invoice}
                  depositMode={depositMode}
                  editableItems={editableItems}
                  handleFieldChange={handleFieldChange}
                />

                {/* Enhanced Validation Warnings */}
                {(validation.hasWarnings || !validation.isValid) && (
                  <Grid item xs={12}>
                    <InvoiceWarningsBanner
                      validation={validation}
                      collapsible={validation.warnings.length > 1}
                    />
                  </Grid>
                )}

                <CalculationSection
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  validation={validation}
                  items={items}
                  editableItems={editableItems}
                  handleAddSizeRow={handleAddSizeRow}
                  handleChangeSizeRow={handleChangeSizeRow}
                  handleRemoveSizeRow={handleRemoveSizeRow}
                  handleDeleteItem={handleDeleteItem}
                  handleChangeItem={handleChangeItem}
                  formData={formData}
                  handleFieldChange={handleFieldChange}
                  calculation={calculation}
                  discountTypeState={discountTypeState}
                  setDiscountTypeState={setDiscountTypeState}
                />

                <PaymentTermsSection
                  isEditing={isEditing}
                  formData={formData}
                  handleFieldChange={handleFieldChange}
                  calculation={calculation}
                  notes={notes}
                  setNotes={setNotes}
                  invoice={invoice}
                />
              </Grid>

              {/* Per-side edit (มัดจำก่อน / มัดจำหลัง) — Phase 3 of invoice-side-edit */}
              {isEditing && (
                <Box sx={{ mt: 3 }}>
                  <InvoiceSideTabs
                    invoice={invoice}
                    beforeFormData={sideEdit.beforeFormData}
                    afterFormData={sideEdit.afterFormData}
                    setBeforeField={sideEdit.setBeforeField}
                    setAfterField={sideEdit.setAfterField}
                    dirtyBefore={sideEdit.dirtyBefore}
                    dirtyAfter={sideEdit.dirtyAfter}
                    warnings={sideValidation.warnings}
                    activeTab={activeSideTab}
                    onTabChange={setActiveSideTab}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>{actions}</DialogActions>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={showPdfViewer} onClose={() => setShowPdfViewer(false)} maxWidth="lg" fullWidth>
        <DialogTitle>ดูตัวอย่าง PDF ใบแจ้งหนี้</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {pdfUrl ? (
            <iframe
              title="invoice-pdf"
              src={pdfUrl}
              style={{ width: "100%", height: "80vh", border: 0 }}
            />
          ) : (
            <Box display="flex" alignItems="center" gap={1} p={2}>
              <CircularProgress size={22} />
              <Typography variant="body2">กำลังโหลดตัวอย่าง PDF…</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {pdfUrl && (
            <SecondaryButton onClick={() => window.open(pdfUrl, "_blank")}>
              เปิดในแท็บใหม่
            </SecondaryButton>
          )}
          <SecondaryButton onClick={() => setShowPdfViewer(false)}>ปิด</SecondaryButton>
        </DialogActions>
      </Dialog>

      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        dirtyFieldLabels={sideEdit.dirtyFieldLabels}
        onCancel={() => setUnsavedDialogOpen(false)}
        onDiscard={handleDiscardUnsaved}
      />

      <InvoiceSaveConfirmDialog
        open={saveConfirmOpen}
        warnings={sideValidation.warnings}
        loading={isSaving}
        onCancel={() => setSaveConfirmOpen(false)}
        onConfirm={executeSave}
      />
    </>
  );
};

export default InvoiceDetailDialog;
