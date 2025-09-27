import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Chip,
  TextField,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  RadioGroup,
  Radio,
  Stack,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import {
  useGetInvoiceQuery,
  useUpdateInvoiceMutation,
  useGenerateInvoicePDFMutation,
} from "../../../../features/Accounting/accountingApi";
import {
  DetailDialog,
  CustomerSection,
  WorkItemsSection,
  ActionsSection,
  FinancialSummarySection,
  Calculation,
  PaymentTerms,
} from "../../shared/components";
import { useInvoiceApproval } from "./hooks/useInvoiceApproval";
import {
  Section,
  SectionHeader,
  SecondaryButton,
  InfoCard,
  tokens,
} from "../../PricingIntegration/components/quotation/styles/quotationTheme";
import { formatTHB, formatDateTH } from "../utils/format";
import { showSuccess, showError, showLoading, dismissToast } from "../../utils/accountingToast";
import { useInvoiceCalculation } from "./calculation/useInvoiceCalculation";
import { useInvoiceValidation } from "./calculation/useInvoiceValidation";
import InvoiceFinancialCalcBox from "./calculation/InvoiceFinancialCalcBox";
import InvoiceSummaryCard from "./calculation/InvoiceSummaryCard";
import InvoiceWarningsBanner from "./calculation/InvoiceWarningsBanner";
import { getDisplayInvoiceNumber } from "./utils/invoiceLogic";

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
const toMoney = (n) => formatTHB(n || 0);
const sanitizeZipDup = (text) => {
  if (!text) return "";
  // collapse duplicated 5-digit zip e.g., "10240 10240" -> "10240"
  return String(text).replace(/(\b\d{5}\b)\s+\1/g, "$1");
};

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
  const [pdfUrl, setPdfUrl] = useState("");
  const [customerDataSource, setCustomerDataSource] = useState("master"); // 'master' or 'invoice'
  const customerSourceManuallySet = useRef(false);
  const prevInvoiceIdRef = useRef(null);

  // New state for the enhanced calculation section
  const [expandedItems, setExpandedItems] = useState({});
  const [editableItems, setEditableItems] = useState([]);

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
  const invoice = data?.data || data || {};
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
  }, [invoice?.items]);

  // Calculate special discount type
  const specialDiscountType =
    formData.special_discount_percentage > 0
      ? "percentage"
      : formData.special_discount_amount > 0
        ? "amount"
        : "percentage";

  // Use Invoice calculation hook
  const calculation = useInvoiceCalculation({
    items: isEditing ? editableItems : invoice?.items || [],
    specialDiscountType,
    specialDiscountValue:
      specialDiscountType === "percentage"
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

  // Derived summary numbers for dialog summary bar and sections
  const subtotal = calculation.subtotal || Number(invoice.subtotal || 0);
  const vat = calculation.vatAmount || Number(invoice.vat_amount || invoice.tax_amount || 0);
  const total = calculation.finalTotalAmount ?? (Number(invoice.final_total_amount || 0) || 0);
  const paid = Number(invoice.paid_amount || 0);
  const deposit = Number(invoice.deposit_amount || 0);
  const remaining = Math.max((total || 0) - paid - deposit, 0);
  const due = invoice?.due_date ? new Date(invoice.due_date) : null;
  const isOverdue = !!(due && remaining > 0 && due < new Date());

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
        special_discount_percentage:
          specialDiscountType === "percentage" ? formData.special_discount_percentage : 0,
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
      if (url) {
        setPdfUrl(url);
        setShowPdfViewer(true);
        showSuccess("สร้าง PDF สำเร็จ");
      } else {
        showError("ไม่ได้รับลิงก์ PDF จากเซิร์ฟเวอร์");
      }
      dismissToast(loadingId);
    } catch (e) {
      showError(e?.data?.message || e?.message || "ไม่สามารถสร้าง PDF ได้");
    }
  };

  // Enhanced calculation handlers
  const handleToggleItemExpanded = (itemIndex) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemIndex]: !prev[itemIndex],
    }));
  };

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
      <DetailDialog
        open={open}
        onClose={onClose}
        title="รายละเอียดใบแจ้งหนี้"
        isLoading={isLoading}
        error={error}
        actions={actions}
      >
        <Box>
          {/* Sticky Financial Summary Bar */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              bgcolor: "background.paper",
              borderBottom: 1,
              borderColor: "divider",
              p: 1.5,
              mb: 2,
            }}
          >
            <Grid container spacing={1} alignItems="center">
              {[
                ["ยอดก่อนภาษี", subtotal],
                ["VAT", vat],
                ["รวมทั้งสิ้น", total, "primary.main", 700],
                ["ชำระแล้ว", paid],
                [
                  "คงเหลือ",
                  remaining,
                  remaining > 0 ? (isOverdue ? "error.main" : "warning.main") : "success.main",
                  700,
                ],
              ].map(([label, val, color, fw]) => (
                <Grid item key={label} xs="auto">
                  <Stack spacing={0.25}>
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: fw || 500, color: color || "text.primary" }}
                    >
                      {toMoney(val)}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
              <Box sx={{ flexGrow: 1 }} />
              <Chip
                size="small"
                color={remaining > 0 ? (isOverdue ? "error" : "warning") : "success"}
                label={remaining > 0 ? (isOverdue ? "เกินกำหนด" : "ยังไม่ได้ชำระ") : "ชำระครบ"}
                aria-label="สถานะการชำระเงิน"
              />
            </Grid>
          </Box>
          <Grid container spacing={2}>
            {/* Invoice Status & Info */}
            <Grid item xs={12}>
              <Section>
                <SectionHeader>
                  <Avatar
                    sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                  >
                    <ReceiptIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      ข้อมูลใบแจ้งหนี้
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      สถานะและรายละเอียด
                    </Typography>
                  </Box>
                </SectionHeader>
                <Box sx={{ p: 2 }}>
                  <InfoCard sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          เลขที่ใบแจ้งหนี้
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          {getDisplayInvoiceNumber(invoice, depositMode) || "-"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          ประเภท
                        </Typography>
                        {isEditing ? (
                          <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                            <Select
                              value={formData.type}
                              onChange={(e) => handleFieldChange("type", e.target.value)}
                            >
                              <MenuItem value="full_amount">เต็มจำนวน</MenuItem>
                              <MenuItem value="remaining">ยอดคงเหลือ (หลังหักมัดจำ)</MenuItem>
                              <MenuItem value="deposit">มัดจำ</MenuItem>
                              <MenuItem value="partial">เรียกเก็บบางส่วน</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography variant="body1" fontWeight={700}>
                            {typeLabels[invoice.type] || invoice.type || "-"}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          สถานะ
                        </Typography>
                        {isEditing ? (
                          <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                            <Select
                              value={formData.status}
                              onChange={(e) => handleFieldChange("status", e.target.value)}
                            >
                              <MenuItem value="draft">ร่าง</MenuItem>
                              <MenuItem value="pending">รอดำเนินการ</MenuItem>
                              <MenuItem value="approved">อนุมัติแล้ว</MenuItem>
                              <MenuItem value="sent">ส่งแล้ว</MenuItem>
                              <MenuItem value="partial_paid">ชำระบางส่วน</MenuItem>
                              <MenuItem value="fully_paid">ชำระครบแล้ว</MenuItem>
                              <MenuItem value="overdue">เกินกำหนด</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Box>
                            <Chip
                              label={invoice.status || "draft"}
                              color={statusColors[invoice.status] || "default"}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          วันที่ออกใบแจ้งหนี้
                        </Typography>
                        <Typography variant="body1">
                          {formatDateTH(invoice.invoice_date)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          วันครบกำหนด
                        </Typography>
                        {isEditing ? (
                          <TextField
                            type="date"
                            size="small"
                            fullWidth
                            value={formData.due_date}
                            onChange={(e) => handleFieldChange("due_date", e.target.value)}
                            sx={{ mt: 0.5 }}
                          />
                        ) : (
                          <Typography variant="body1" color={isOverdue ? "error.main" : "inherit"}>
                            {formatDateTH(invoice.due_date)}
                          </Typography>
                        )}
                      </Grid>
                      {invoice.quotation_number && (
                        <Grid item xs={12} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            เลขที่ใบเสนอราคา
                          </Typography>
                          <Typography variant="body1">{invoice.quotation_number}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </InfoCard>
                </Box>
              </Section>
            </Grid>

            {/* Customer Section */}
            <Grid item xs={12}>
              {isEditing ? (
                <Section>
                  <SectionHeader>
                    <Avatar
                      sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                    >
                      <BusinessIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        ข้อมูลลูกค้า
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        แก้ไขข้อมูลลูกค้า
                      </Typography>
                    </Box>
                  </SectionHeader>
                  <Box sx={{ p: 2 }}>
                    {/* Radio buttons for data source selection */}
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
                      {customerDataSource === "master" && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 1 }}
                        >
                          ข้อมูลจะถูกดึงมาจากฐานข้อมูลลูกค้าหลัก
                          การเปลี่ยนแปลงจะส่งผลต่อลูกค้ารายนี้ทั้งหมด
                        </Typography>
                      )}
                      {customerDataSource === "invoice" && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 1 }}
                        >
                          ข้อมูลจะถูกบันทึกเฉพาะในใบแจ้งหนี้นี้เท่านั้น ไม่ส่งผลต่อข้อมูลลูกค้าหลัก
                        </Typography>
                      )}
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
                          label="ชื่อ"
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
                          label="นามสกุล"
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
                </Section>
              ) : (
                <CustomerSection
                  customer={
                    customerDataSource === "invoice"
                      ? {
                          // Build a synthetic customer object using invoice override fields
                          customer_type: invoice.customer_company ? "company" : "individual",
                          cus_company: invoice.customer_company || customer.cus_company,
                          cus_tax_id: invoice.customer_tax_id || customer.cus_tax_id,
                          cus_address: invoice.customer_address || customer.cus_address,
                          cus_zip_code: invoice.customer_zip_code || customer.cus_zip_code,
                          cus_tel_1: invoice.customer_tel_1 || customer.cus_tel_1,
                          cus_tel_2: customer.cus_tel_2,
                          cus_email: invoice.customer_email || customer.cus_email,
                          cus_firstname: invoice.customer_firstname || customer.cus_firstname,
                          cus_lastname: invoice.customer_lastname || customer.cus_lastname,
                          contact_name:
                            (invoice.customer_firstname || customer.cus_firstname || "") +
                            " " +
                            (invoice.customer_lastname || customer.cus_lastname || ""),
                          contact_nickname: customer.contact_nickname,
                          cus_depart: customer.cus_depart,
                        }
                      : customer
                  }
                  quotationNumber={invoice.number}
                  workName={invoice.work_name}
                  showEditButton={false}
                />
              )}
            </Grid>

            {/* Work Items */}
            <Grid item xs={12}>
              <WorkItemsSection
                items={items}
                title="รายการสินค้า/บริการ"
                icon={<BusinessIcon fontSize="small" />}
              >
                {items.map((item, idx) => (
                  <InfoCard key={item.id} sx={{ p: 2, mb: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography
                        variant="subtitle1"
                        noWrap
                        title={item.name}
                        fontWeight={700}
                        color={tokens.primary}
                      >
                        รายการที่ {idx + 1}: {item.name}
                      </Typography>
                      <Chip size="small" label={`${item.quantity} ${item.unit}`} />
                    </Stack>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      {item.pattern && (
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            แพทเทิร์น
                          </Typography>
                          <Typography variant="body2">{item.pattern}</Typography>
                        </Grid>
                      )}
                      {item.fabric_type && (
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            ประเภทผ้า
                          </Typography>
                          <Typography variant="body2">{item.fabric_type}</Typography>
                        </Grid>
                      )}
                      {item.color && (
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            สี
                          </Typography>
                          <Typography variant="body2">{item.color}</Typography>
                        </Grid>
                      )}
                      <Grid item xs={6} md={3} sx={{ ml: "auto", textAlign: "right" }}>
                        <Typography variant="caption" color="text.secondary">
                          ยอดรวม
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {toMoney(item.total)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </InfoCard>
                ))}
              </WorkItemsSection>
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

            {/* Enhanced Work Items with Summary Cards */}
            <Grid item xs={12}>
              <Section>
                <SectionHeader>
                  <Avatar
                    sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                  >
                    <ReceiptIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      รายการงาน ({(isEditing ? editableItems : items).length})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      รายละเอียดงานและการคำนวณ
                    </Typography>
                  </Box>
                </SectionHeader>
                <Box sx={{ p: 2 }}>
                  {(isEditing ? editableItems : items).length === 0 ? (
                    <InfoCard sx={{ p: 3, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        ไม่พบรายการงาน
                      </Typography>
                    </InfoCard>
                  ) : (
                    (isEditing ? editableItems : items).map((item, idx) => (
                      <InvoiceSummaryCard
                        key={`${item.id || idx}-${isEditing ? "edit" : "view"}`}
                        item={item}
                        index={idx}
                        isEditing={isEditing && !validation.isReadOnly}
                        onAddRow={handleAddSizeRow}
                        onChangeRow={handleChangeSizeRow}
                        onRemoveRow={handleRemoveSizeRow}
                        onDeleteItem={handleDeleteItem}
                        onChangeItem={handleChangeItem}
                        expanded={expandedItems[idx] || false}
                        onToggleExpanded={handleToggleItemExpanded}
                      />
                    ))
                  )}
                </Box>
              </Section>
            </Grid>

            {/* Enhanced Financial Calculation */}
            <Grid item xs={12}>
              <Section>
                <SectionHeader>
                  <Avatar
                    sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                  >
                    <CalculateIcon fontSize="small" />
                  </Avatar>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        การคำนวณทางการเงิน
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isEditing ? "แก้ไขข้อมูลการคำนวณ" : "สรุปการคำนวณตามใบแจ้งหนี้"}
                      </Typography>
                    </Box>
                    {isEditing && !validation.isReadOnly && (
                      <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleResetCalculation}
                          sx={{ borderColor: tokens.primary, color: tokens.primary }}
                        >
                          รีเซ็ต
                        </Button>
                      </Box>
                    )}
                  </Box>
                </SectionHeader>
                <Box sx={{ p: 0 }}>
                  <InvoiceFinancialCalcBox
                    isEditing={isEditing && !validation.isReadOnly}
                    // Special discount
                    specialDiscountType={specialDiscountType}
                    specialDiscountValue={
                      specialDiscountType === "percentage"
                        ? formData.special_discount_percentage
                        : formData.special_discount_amount
                    }
                    onSpecialDiscountTypeChange={(type) => {
                      if (type === "percentage") {
                        handleFieldChange("special_discount_amount", 0);
                      } else {
                        handleFieldChange("special_discount_percentage", 0);
                      }
                    }}
                    onSpecialDiscountValueChange={(value) => {
                      const numValue = Math.max(0, Number(value) || 0);
                      if (specialDiscountType === "percentage") {
                        handleFieldChange("special_discount_percentage", numValue);
                      } else {
                        handleFieldChange("special_discount_amount", numValue);
                      }
                    }}
                    // VAT
                    hasVat={formData.has_vat}
                    vatPercentage={formData.vat_percentage}
                    onHasVatChange={(checked) => handleFieldChange("has_vat", checked)}
                    onVatPercentageChange={(value) =>
                      handleFieldChange("vat_percentage", Math.max(0, Number(value) || 0))
                    }
                    // Withholding tax
                    hasWithholdingTax={formData.has_withholding_tax}
                    withholdingTaxPercentage={formData.withholding_tax_percentage}
                    withholdingTaxBase={formData.withholding_tax_base}
                    onHasWithholdingTaxChange={(checked) =>
                      handleFieldChange("has_withholding_tax", checked)
                    }
                    onWithholdingTaxPercentageChange={(value) =>
                      handleFieldChange(
                        "withholding_tax_percentage",
                        Math.max(0, Number(value) || 0)
                      )
                    }
                    onWithholdingTaxBaseChange={(base) =>
                      handleFieldChange("withholding_tax_base", base)
                    }
                    // Deposit
                    depositMode={formData.deposit_mode}
                    depositPercentage={formData.deposit_percentage}
                    depositAmountInput={formData.deposit_amount}
                    depositDisplayOrder={formData.deposit_display_order}
                    onDepositModeChange={(mode) => handleFieldChange("deposit_mode", mode)}
                    onDepositPercentageChange={(value) =>
                      handleFieldChange(
                        "deposit_percentage",
                        Math.max(0, Math.min(100, Number(value) || 0))
                      )
                    }
                    onDepositAmountInputChange={(value) =>
                      handleFieldChange("deposit_amount", Math.max(0, Number(value) || 0))
                    }
                    onDepositDisplayOrderChange={(order) =>
                      handleFieldChange("deposit_display_order", order)
                    }
                    // Calculated values
                    calculation={calculation}
                  />
                </Box>
              </Section>
            </Grid>

            {/* Payment Information */}
            {(invoice.payment_terms || invoice.deposit_amount || isEditing) && (
              <Grid item xs={12}>
                <Section>
                  <SectionHeader>
                    <Avatar
                      sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                    >
                      <PaymentIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        ข้อมูลการชำระเงิน
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        เงื่อนไขการชำระและมัดจำ
                      </Typography>
                    </Box>
                  </SectionHeader>
                  <Box sx={{ p: 2 }}>
                    {isEditing ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>เงื่อนไขการชำระ</InputLabel>
                            <Select
                              value={formData.payment_terms}
                              onChange={(e) => handleFieldChange("payment_terms", e.target.value)}
                              label="เงื่อนไขการชำระ"
                            >
                              <MenuItem value="">ไม่ระบุ</MenuItem>
                              <MenuItem value="cash">เงินสด</MenuItem>
                              <MenuItem value="credit_30">เครดิต 30 วัน</MenuItem>
                              <MenuItem value="credit_60">เครดิต 60 วัน</MenuItem>
                              <MenuItem value="credit_90">เครดิต 90 วัน</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="วิธีการชำระเงิน"
                            value={formData.payment_method}
                            onChange={(e) => handleFieldChange("payment_method", e.target.value)}
                            size="small"
                            placeholder="เช่น โอนเงิน, เงินสด, เช็ค"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>ประเภทหัวกระดาษ</InputLabel>
                            <Select
                              value={formData.document_header_type}
                              onChange={(e) =>
                                handleFieldChange("document_header_type", e.target.value)
                              }
                              label="ประเภทหัวกระดาษ"
                            >
                              <MenuItem value="ต้นฉบับ">ต้นฉบับ</MenuItem>
                              <MenuItem value="สำเนา">สำเนา</MenuItem>
                              <MenuItem value="กำหนดเอง">กำหนดเอง</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    ) : (
                      <Grid container spacing={2}>
                        {invoice.payment_terms && (
                          <Grid item xs={12} md={6}>
                            <InfoCard sx={{ p: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                เงื่อนไขการชำระ
                              </Typography>
                              <Typography variant="body1" fontWeight={700}>
                                {invoice.payment_terms === "cash"
                                  ? "เงินสด"
                                  : invoice.payment_terms === "credit_30"
                                    ? "เครดิต 30 วัน"
                                    : invoice.payment_terms === "credit_60"
                                      ? "เครดิต 60 วัน"
                                      : invoice.payment_terms}
                              </Typography>
                            </InfoCard>
                          </Grid>
                        )}
                        {invoice.deposit_amount && (
                          <Grid item xs={12} md={6}>
                            <InfoCard sx={{ p: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                เงินมัดจำ
                              </Typography>
                              <Typography variant="body1" fontWeight={700}>
                                {formatTHB(invoice.deposit_amount)}
                                {invoice.deposit_percentage && ` (${invoice.deposit_percentage}%)`}
                              </Typography>
                            </InfoCard>
                          </Grid>
                        )}
                      </Grid>
                    )}
                  </Box>
                </Section>
              </Grid>
            )}

            {/* Notes */}
            <Grid item xs={12}>
              <Section>
                <SectionHeader>
                  <Avatar
                    sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                  >
                    📝
                  </Avatar>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      หมายเหตุ
                    </Typography>
                    {!isEditing && (
                      <SecondaryButton size="small" onClick={enterEditMode}>
                        แก้ไข
                      </SecondaryButton>
                    )}
                  </Box>
                </SectionHeader>
                <Box sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="หมายเหตุ"
                    value={isEditing ? notes : invoice.notes || ""}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="เพิ่มหมายเหตุสำหรับใบแจ้งหนี้นี้..."
                    variant={isEditing ? "outlined" : "filled"}
                    InputProps={{ readOnly: !isEditing }}
                  />
                </Box>
              </Section>
            </Grid>
          </Grid>
        </Box>
      </DetailDialog>

      {/* PDF Viewer Dialog */}
      <DetailDialog
        open={showPdfViewer}
        onClose={() => setShowPdfViewer(false)}
        title="ดูตัวอย่าง PDF ใบแจ้งหนี้"
        maxWidth="lg"
        actions={
          <>
            {pdfUrl && (
              <SecondaryButton onClick={() => window.open(pdfUrl, "_blank")}>
                เปิดในแท็บใหม่
              </SecondaryButton>
            )}
            <SecondaryButton onClick={() => setShowPdfViewer(false)}>ปิด</SecondaryButton>
          </>
        }
      >
        {pdfUrl ? (
          <iframe
            title="invoice-pdf"
            src={pdfUrl}
            style={{ width: "100%", height: "80vh", border: 0 }}
          />
        ) : (
          <Box display="flex" alignItems="center" gap={1} p={2}>
            <Typography variant="body2">ไม่พบไฟล์ PDF</Typography>
          </Box>
        )}
      </DetailDialog>
    </>
  );
};

export default InvoiceDetailDialog;
