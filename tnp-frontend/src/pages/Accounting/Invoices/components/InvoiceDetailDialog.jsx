import {
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Chip,
  TextField,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControlLabel,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React, { useState, useRef } from "react";

import InvoiceSummaryCard from "./calculation/InvoiceSummaryCard";
import InvoiceWarningsBanner from "./calculation/InvoiceWarningsBanner";
import { useInvoiceCalculation } from "./calculation/useInvoiceCalculation";
import { useInvoiceValidation } from "./calculation/useInvoiceValidation";
import { useInvoiceApproval } from "./hooks/useInvoiceApproval";
import { getDisplayInvoiceNumber } from "./utils/invoiceLogic";
import {
  useGetInvoiceQuery,
  useUpdateInvoiceMutation,
  useGenerateInvoicePDFMutation,
} from "../../../../features/Accounting/accountingApi";
import PricingModeSelector from "../../PricingIntegration/components/quotation/CreateQuotationForm/components/PricingModeSelector";
import SpecialDiscountField from "../../PricingIntegration/components/quotation/CreateQuotationForm/components/SpecialDiscountField";
import WithholdingTaxField from "../../PricingIntegration/components/quotation/CreateQuotationForm/components/WithholdingTaxField";
import {
  Section,
  SectionHeader,
  SecondaryButton,
  InfoCard,
  tokens,
} from "../../PricingIntegration/components/styles/quotationFormStyles";
import { PRGroupSummaryCard } from "../../Quotations/components/shared/PRGroupSummaryCard";
import { Calculation, PaymentTerms } from "../../shared/components";
import { showSuccess, showError, showLoading, dismissToast } from "../../utils/accountingToast";
import { formatDateTH } from "../utils/format";

// Format invoice type labels
const typeLabels = {
  full_amount: "เต็มจำนวน",
  remaining: "ยอดคงเหลือ (หลังหักมัดจำ)",
  deposit: "มัดจำ",
  partial: "เรียกเก็บบางส่วน",
};

// Status colors
const statusColors = {
  draft: "default",
  pending: "warning",
  pending_review: "warning",
  approved: "success",
  rejected: "error",
  sent: "info",
  partial_paid: "warning",
  fully_paid: "success",
  overdue: "error",
};

// Local helpers

// Normalize customer data from master_customers relationship
const normalizeCustomer = (invoice) => {
  if (!invoice) return {};

  // Use customer relationship data from master_customers table
  const customer = invoice.customer;
  if (!customer) return {};

  return {
    customer_type: customer.cus_company ? "company" : "individual",
    cus_name: customer.cus_name,
    cus_firstname: customer.cus_firstname,
    cus_lastname: customer.cus_lastname,
    cus_company: customer.cus_company,
    cus_tel_1: customer.cus_tel_1,
    cus_tel_2: customer.cus_tel_2,
    cus_email: customer.cus_email,
    cus_tax_id: customer.cus_tax_id,
    cus_address: customer.cus_address,
    cus_zip_code: customer.cus_zip_code,
    cus_depart: customer.cus_depart,
    contact_name:
      customer.cus_firstname && customer.cus_lastname
        ? `${customer.cus_firstname} ${customer.cus_lastname}`.trim()
        : customer.cus_name,
    contact_nickname: customer.cus_name,
  };
};

// Normalize items for display
const normalizeItems = (invoice) => {
  if (!invoice?.items) return [];

  // Group items by common properties to create work groups
  const groups = new Map();

  invoice.items.forEach((item, index) => {
    const groupKey = `${item.item_name}-${item.pattern}-${item.fabric_type}-${item.color}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        id: `group-${index}`,
        name: item.item_name,
        pattern: item.pattern,
        fabric_type: item.fabric_type,
        fabricType: item.fabric_type, // Also provide camelCase for frontend consistency
        color: item.color,
        size: item.size, // Summary size from first item
        unit: item.unit || "ชิ้น",
        sizeRows: [], // Array for detailed size breakdown
        items: [],
      });
    }

    const group = groups.get(groupKey);

    // Add to items array for reference
    group.items.push({
      ...item,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: (item.quantity || 0) * (item.unit_price || 0),
    });

    // Create size row from item data
    if (item.size && item.quantity > 0) {
      group.sizeRows.push({
        size: item.size,
        quantity: item.quantity || 0,
        unitPrice: item.unit_price || 0,
        notes: item.notes || "",
      });
    }
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    quantity: group.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    total: group.items.reduce((sum, item) => sum + (item.total || 0), 0),
    // If no detailed size rows, create summary from group data
    sizeRows: group.sizeRows.length > 0 ? group.sizeRows : [],
  }));
};

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

  const handleSave = async () => {
    try {
      const loadingId = showLoading("กำลังบันทึกใบแจ้งหนี้…");
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

      await updateInvoice(updateData).unwrap();
      // If switching to master, reset manual flag so effect can auto-sync on refetch
      if (customerDataSource === "master") {
        customerSourceManuallySet.current = false;
        setCustomerDataSource("master");
      }
      setIsEditing(false);
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
          <Button variant="text" onClick={onClose} aria-label="ปิดหน้าต่าง">
            ปิด
          </Button>
        </>
      )}
    </Box>
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
                {/* === Section 1: ข้อมูลใบแจ้งหนี้และลูกค้า === */}
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
                          ข้อมูลใบแจ้งหนี้และลูกค้า
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {isEditing ? "แก้ไขข้อมูลลูกค้า" : "ดึงข้อมูลจาก Invoice และ Customer"}
                        </Typography>
                      </Box>
                    </SectionHeader>
                    <Box sx={{ p: 2 }}>
                      {/* === Customer Info Card (Read Only) OR (Edit Form) === */}
                      {isEditing ? (
                        /* === โค้ด HTML ที่ 2 (Edit Form) === */
                        <Box>
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              เลือกแหล่งข้อมูลลูกค้า
                            </Typography>
                            <RadioGroup
                              value={customerDataSource}
                              onChange={handleCustomerDataSourceChange}
                              row
                            >
                              <FormControlLabel
                                value="master"
                                control={<Radio />}
                                label="ใช้ข้อมูลจากฐานข้อมูลลูกค้า (master_customers)"
                              />
                              <FormControlLabel
                                value="invoice"
                                control={<Radio />}
                                label="แก้ไขข้อมูลเฉพาะใบแจ้งหนี้นี้ (invoices)"
                              />
                            </RadioGroup>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 1 }}
                            >
                              {customerDataSource === "master"
                                ? "ข้อมูลจะถูกดึงมาจากฐานข้อมูลลูกค้าหลัก"
                                : "ข้อมูลจะถูกบันทึกเฉพาะในใบแจ้งหนี้นี้เท่านั้น"}
                            </Typography>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="ชื่อบริษัท"
                                value={
                                  customerDataSource === "master"
                                    ? customer.cus_company || ""
                                    : formData.customer_company
                                }
                                onChange={(e) =>
                                  customerDataSource === "invoice" &&
                                  handleFieldChange("customer_company", e.target.value)
                                }
                                size="small"
                                disabled={customerDataSource === "master"}
                                helperText={
                                  customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="เลขประจำตัวผู้เสียภาษี"
                                value={
                                  customerDataSource === "master"
                                    ? customer.cus_tax_id || ""
                                    : formData.customer_tax_id
                                }
                                onChange={(e) =>
                                  customerDataSource === "invoice" &&
                                  handleFieldChange("customer_tax_id", e.target.value)
                                }
                                size="small"
                                disabled={customerDataSource === "master"}
                                helperText={
                                  customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="ชื่อ (ผู้ติดต่อ)"
                                value={
                                  customerDataSource === "master"
                                    ? customer.cus_firstname || ""
                                    : formData.customer_firstname
                                }
                                onChange={(e) =>
                                  customerDataSource === "invoice" &&
                                  handleFieldChange("customer_firstname", e.target.value)
                                }
                                size="small"
                                disabled={customerDataSource === "master"}
                                helperText={
                                  customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="นามสกุล (ผู้ติดต่อ)"
                                value={
                                  customerDataSource === "master"
                                    ? customer.cus_lastname || ""
                                    : formData.customer_lastname
                                }
                                onChange={(e) =>
                                  customerDataSource === "invoice" &&
                                  handleFieldChange("customer_lastname", e.target.value)
                                }
                                size="small"
                                disabled={customerDataSource === "master"}
                                helperText={
                                  customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""
                                }
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="ที่อยู่"
                                value={
                                  customerDataSource === "master"
                                    ? customer.cus_address || ""
                                    : formData.customer_address
                                }
                                onChange={(e) =>
                                  customerDataSource === "invoice" &&
                                  handleFieldChange("customer_address", e.target.value)
                                }
                                multiline
                                rows={2}
                                size="small"
                                disabled={customerDataSource === "master"}
                                helperText={
                                  customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                label="รหัสไปรษณีย์"
                                value={
                                  customerDataSource === "master"
                                    ? customer.cus_zip_code || ""
                                    : formData.customer_zip_code
                                }
                                onChange={(e) =>
                                  customerDataSource === "invoice" &&
                                  handleFieldChange("customer_zip_code", e.target.value)
                                }
                                size="small"
                                disabled={customerDataSource === "master"}
                                helperText={
                                  customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                label="เบอร์โทรศัพท์"
                                value={
                                  customerDataSource === "master"
                                    ? customer.cus_tel_1 || ""
                                    : formData.customer_tel_1
                                }
                                onChange={(e) =>
                                  customerDataSource === "invoice" &&
                                  handleFieldChange("customer_tel_1", e.target.value)
                                }
                                size="small"
                                disabled={customerDataSource === "master"}
                                helperText={
                                  customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""
                                }
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                label="อีเมล์"
                                value={
                                  customerDataSource === "master"
                                    ? customer.cus_email || ""
                                    : formData.customer_email
                                }
                                onChange={(e) =>
                                  customerDataSource === "invoice" &&
                                  handleFieldChange("customer_email", e.target.value)
                                }
                                size="small"
                                disabled={customerDataSource === "master"}
                                helperText={
                                  customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""
                                }
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      ) : (
                        /* === โค้ด HTML ที่ 1 (Read Only) === */
                        <InfoCard sx={{ p: 2, mb: 1.5 }}>
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            mb={1}
                          >
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {customer?.customer_type === "individual"
                                  ? "ชื่อผู้ติดต่อ"
                                  : "ชื่อบริษัท"}
                              </Typography>
                              <Typography variant="body1" fontWeight={700}>
                                {customerDataSource === "master"
                                  ? customer?.customer_type === "individual"
                                    ? `${customer?.cus_firstname || ""} ${customer?.cus_lastname || ""}`.trim() ||
                                      customer?.cus_name ||
                                      "-"
                                    : customer?.cus_company || "-"
                                  : formData.customer_company ||
                                    `${formData.customer_firstname || ""} ${formData.customer_lastname || ""}`.trim() ||
                                    "-"}
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
                                    {customer.contact_nickname
                                      ? `(${customer.contact_nickname})`
                                      : ""}
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
                      )}

                      {/* Invoice Info Card */}
                      <InfoCard sx={{ p: 2, mb: 1.5 }}>
                        <Grid container spacing={1}>
                          <Grid item xs={12} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              เลขที่ใบแจ้งหนี้
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {getDisplayInvoiceNumber(invoice, depositMode) || "-"}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              ประเภท
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {typeLabels[invoice.type] || invoice.type || "-"}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              สถานะ
                            </Typography>
                            <Chip
                              label={invoice.status || "draft"}
                              color={statusColors[invoice.status] || "default"}
                              size="small"
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              วันที่ออกใบแจ้งหนี้
                            </Typography>
                            <Typography variant="body2">
                              {formatDateTH(invoice.invoice_date)}
                            </Typography>
                          </Grid>
                          {invoice.quotation_number && (
                            <Grid item xs={12} md={6}>
                              <Typography variant="caption" color="text.secondary">
                                เลขที่ใบเสนอราคา
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {invoice.quotation_number}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </InfoCard>

                      {/* Work Summary (Read-only) (แสดงเมื่อ isEditing=false) */}
                      {!isEditing && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
                            รายละเอียดงาน ({editableItems.length})
                          </Typography>
                          {editableItems.length === 0 ? (
                            <InfoCard sx={{ p: 3, mt: 1.5 }}>
                              <Typography variant="body2" color="text.secondary" textAlign="center">
                                ไม่พบรายการงาน
                              </Typography>
                            </InfoCard>
                          ) : (
                            editableItems.map((item, idx) => (
                              <PRGroupSummaryCard key={item.id || idx} group={item} index={idx} />
                            ))
                          )}
                        </Box>
                      )}
                    </Box>
                  </Section>
                </Grid>

                {/* Enhanced Validation Warnings */}
                {(validation.hasWarnings || !validation.isValid) && (
                  <Grid item xs={12}>
                    <InvoiceWarningsBanner
                      validation={validation}
                      collapsible={validation.warnings.length > 1}
                    />
                  </Grid>
                )}

                {/* === Section 2: การคำนวณราคา === */}
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
                        {!validation.isReadOnly && (
                          <SecondaryButton
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              const el = document.getElementById("calc-section");
                              const y = el ? el.scrollTop : null;
                              setIsEditing((v) => !v);
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
                      {/* 1. รายการ Item (ที่แก้ไขได้) */}
                      {(isEditing ? editableItems : items).map((item, idx) => (
                        <InvoiceSummaryCard
                          key={`calc-${item.id || idx}`}
                          item={item}
                          index={idx}
                          isEditing={isEditing && !validation.isReadOnly}
                          onAddRow={handleAddSizeRow}
                          onChangeRow={handleChangeSizeRow}
                          onRemoveRow={handleRemoveSizeRow}
                          onDeleteItem={handleDeleteItem}
                          onChangeItem={handleChangeItem}
                        />
                      ))}

                      <Divider sx={{ my: 2 }} />

                      {/* Pricing Mode Selector */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12}>
                          <PricingModeSelector
                            pricingMode={formData.pricing_mode}
                            onPricingModeChange={(mode) => {
                              if (!isEditing) return;
                              handleFieldChange("pricing_mode", mode);
                            }}
                            disabled={!isEditing || formData.status !== "draft"}
                          />
                        </Grid>
                      </Grid>

                      {/* 2. เพิ่ม Discount และ Tax Fields */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
                          <SpecialDiscountField
                            discountType={discountTypeState}
                            discountValue={
                              discountTypeState === "percentage"
                                ? formData.special_discount_percentage
                                : formData.special_discount_amount
                            }
                            totalAmount={calculation.subtotal}
                            discountAmount={calculation.discountUsed}
                            onDiscountTypeChange={(type) => {
                              if (!isEditing) return;
                              setDiscountTypeState(type);
                              // เคลียร์ค่าของช่องที่ไม่ได้เลือก
                              if (type === "percentage") {
                                handleFieldChange("special_discount_amount", 0);
                              } else {
                                handleFieldChange("special_discount_percentage", 0);
                              }
                            }}
                            onDiscountValueChange={(value) => {
                              if (!isEditing) return;
                              const numValue = Math.max(0, Number(value) || 0);
                              // ใช้ discountTypeState ในการตัดสินใจ
                              if (discountTypeState === "percentage") {
                                handleFieldChange("special_discount_percentage", numValue);
                              } else {
                                handleFieldChange("special_discount_amount", numValue);
                              }
                            }}
                            disabled={!isEditing}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <WithholdingTaxField
                            hasWithholdingTax={formData.has_withholding_tax}
                            taxPercentage={formData.withholding_tax_percentage}
                            taxAmount={calculation.withholdingTaxAmount}
                            subtotalAmount={calculation.effectiveSubtotal}
                            onToggleWithholdingTax={(en) =>
                              isEditing && handleFieldChange("has_withholding_tax", en)
                            }
                            onTaxPercentageChange={(p) =>
                              isEditing &&
                              handleFieldChange(
                                "withholding_tax_percentage",
                                Math.max(0, Number(p) || 0)
                              )
                            }
                            disabled={!isEditing}
                          />
                        </Grid>
                      </Grid>

                      {/* 3. เพิ่ม Calculation Summary */}
                      <Calculation
                        subtotal={calculation.subtotal}
                        discountAmount={calculation.discountUsed}
                        discountedBase={calculation.effectiveSubtotal}
                        vat={calculation.vatAmount}
                        totalAfterVat={calculation.totalAmount}
                        withholdingAmount={calculation.withholdingTaxAmount}
                        finalTotal={calculation.finalTotalAmount}
                        vatPercentage={formData.vat_percentage}
                        hasVat={formData.has_vat}
                      />
                    </Box>
                  </Section>
                </Grid>

                {/* === Section 3: เงื่อนไขการชำระเงิน === */}
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
                        paymentTermsType={formData.payment_terms || "cash"}
                        paymentTermsCustom={formData.payment_method || ""}
                        onChangePaymentTermsType={(v) =>
                          isEditing && handleFieldChange("payment_terms", v)
                        }
                        onChangePaymentTermsCustom={(v) =>
                          isEditing && handleFieldChange("payment_method", v)
                        }
                        depositMode={formData.deposit_mode}
                        onChangeDepositMode={(v) =>
                          isEditing && handleFieldChange("deposit_mode", v)
                        }
                        depositPercentage={formData.deposit_percentage}
                        depositAmountInput={formData.deposit_amount}
                        onChangeDepositPercentage={(v) =>
                          isEditing &&
                          handleFieldChange(
                            "deposit_percentage",
                            Math.max(0, Math.min(100, Number(v) || 0))
                          )
                        }
                        onChangeDepositAmount={(v) =>
                          isEditing &&
                          handleFieldChange("deposit_amount", Math.max(0, Number(v) || 0))
                        }
                        isCredit={
                          formData.payment_terms === "credit_30" ||
                          formData.payment_terms === "credit_60"
                        }
                        dueDateNode={
                          formData.payment_terms === "credit_30" ||
                          formData.payment_terms === "credit_60" ? (
                            <>
                              <Grid item xs={6}>
                                <Typography>วันครบกำหนด</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                {isEditing ? (
                                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                      value={formData.due_date ? new Date(formData.due_date) : null}
                                      onChange={(newVal) =>
                                        handleFieldChange(
                                          "due_date",
                                          newVal ? newVal.toISOString().split("T")[0] : null
                                        )
                                      }
                                      slotProps={{ textField: { size: "small", fullWidth: true } }}
                                    />
                                  </LocalizationProvider>
                                ) : (
                                  <Typography textAlign="right" fontWeight={700}>
                                    {formatDateTH(invoice?.due_date)}
                                  </Typography>
                                )}
                              </Grid>
                            </>
                          ) : null
                        }
                        finalTotal={calculation.finalTotalAmount}
                        depositAmount={calculation.depositAmount}
                        remainingAmount={calculation.remainingAmount}
                      />

                      {/* Notes Field */}
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="หมายเหตุ"
                          value={notes}
                          disabled={!isEditing}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </Box>
                    </Box>
                  </Section>
                </Grid>
              </Grid>
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
    </>
  );
};

export default InvoiceDetailDialog;
