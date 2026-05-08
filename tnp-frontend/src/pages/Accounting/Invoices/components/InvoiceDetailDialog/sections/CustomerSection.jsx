import { Assignment as AssignmentIcon, Business as BusinessIcon } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  InfoCard,
  Section,
  SectionHeader,
  tokens,
} from "../../../../PricingIntegration/components/styles/quotationFormStyles";
import { PRGroupSummaryCard } from "../../../../Quotations/components/shared/PRGroupSummaryCard";
import { formatDateTH } from "../../../utils/format";
import { getDisplayInvoiceNumber } from "../../utils/invoiceLogic";
import { statusColors, typeLabels } from "../utils/invoiceDetailNormalizers";

/**
 * Section 1: ข้อมูลใบแจ้งหนี้และลูกค้า — Customer info + Invoice header + Work summary
 *
 * Phase 1b: extracted from InvoiceDetailDialog.jsx (zero behavior change).
 * Phase 2:  view mode redesigned to compact single-card layout (read-mode only).
 */

/** Compact key-value display: label · value (smaller, inline) */
const KeyValueLine = ({ label, value, fullWidth = false }) => (
  <Grid item xs={12} md={fullWidth ? 12 : 6} lg={fullWidth ? 12 : 4}>
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: 80, fontSize: "0.72rem" }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
        {value || "-"}
      </Typography>
    </Box>
  </Grid>
);

/**
 * Compact read-only view: combines customer + invoice info into a single dense card.
 * Replaces 2 separate InfoCards in pre-Phase 2 layout (~30% less visual space).
 *
 * Exported (Phase 3) so EditModeTabs can render it in the "ภาพรวม" tab as context.
 */
export const CompactReadOnlyView = ({
  customer,
  customerDataSource,
  formData,
  invoice,
  depositMode,
}) => {
  const customerName =
    customerDataSource === "master"
      ? customer?.customer_type === "individual"
        ? `${customer?.cus_firstname || ""} ${customer?.cus_lastname || ""}`.trim() ||
          customer?.cus_name ||
          "-"
        : customer?.cus_company || "-"
      : formData.customer_company ||
        `${formData.customer_firstname || ""} ${formData.customer_lastname || ""}`.trim() ||
        "-";

  return (
    <InfoCard sx={{ p: 1.5 }}>
      {/* Header row: invoice number + status chip + customer name */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          pb: 1,
          mb: 1,
          borderBottom: `1px solid ${tokens.borderLight}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
          <Typography
            variant="body1"
            sx={{ fontWeight: 700, color: tokens.primary, fontFamily: "monospace" }}
          >
            {getDisplayInvoiceNumber(invoice, depositMode) || "-"}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {typeLabels[invoice.type] || invoice.type || "-"}
          </Typography>
          <Chip
            label={invoice.status || "draft"}
            color={statusColors[invoice.status] || "default"}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: "0.7rem" }}
          />
        </Box>
        {customer.cus_tel_1 && (
          <Chip
            size="small"
            variant="outlined"
            label={customer.cus_tel_1}
            sx={{
              borderColor: tokens.primary,
              color: tokens.primary,
              fontWeight: 700,
              height: 20,
              fontSize: "0.7rem",
            }}
          />
        )}
      </Box>

      {/* Customer name (prominent) */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
          {customer?.customer_type === "individual" ? "ชื่อผู้ติดต่อ" : "ชื่อบริษัท"}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          {customerName}
        </Typography>
      </Box>

      {/* Compact key-value grid for remaining fields */}
      <Grid container rowSpacing={0.75} columnSpacing={2}>
        {customer.contact_name && (
          <KeyValueLine
            label="ผู้ติดต่อ"
            value={`${customer.contact_name}${customer.contact_nickname ? ` (${customer.contact_nickname})` : ""}`}
          />
        )}
        {customer.cus_email && <KeyValueLine label="อีเมล" value={customer.cus_email} />}
        {customer.cus_tax_id && <KeyValueLine label="เลขผู้เสียภาษี" value={customer.cus_tax_id} />}
        <KeyValueLine label="วันที่ออก" value={formatDateTH(invoice.invoice_date)} />
        {invoice.quotation_number && (
          <KeyValueLine label="ใบเสนอราคา" value={invoice.quotation_number} />
        )}
        {customer.cus_address && (
          <KeyValueLine label="ที่อยู่" value={customer.cus_address} fullWidth />
        )}
      </Grid>
    </InfoCard>
  );
};
const CustomerSection = ({
  // mode flags
  isEditing,
  // customer data source toggle (master vs invoice-override)
  customerDataSource,
  handleCustomerDataSourceChange,
  // data
  customer,
  formData,
  invoice,
  depositMode,
  editableItems,
  // editing handler
  handleFieldChange,
  // companies for company selector (edit mode only)
  companies = [],
  loadingCompanies = false,
}) => {
  const selectedCompanyId = formData?.company_id || "";
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const selectValue = selectedCompany ? selectedCompanyId : "";
  return (
    <Grid item xs={12}>
      <Section>
        <SectionHeader>
          <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
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
        <Box sx={{ p: 1.5 }}>
          {/* === Customer Info Card (Read Only) OR (Edit Form) === */}
          {isEditing ? (
            /* === โค้ด HTML ที่ 2 (Edit Form) === */
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  บริษัทที่ออกเอกสาร
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <FormControl size="small" sx={{ minWidth: 240 }} disabled={loadingCompanies}>
                    <InputLabel id={`invoice-company-select-label-${invoice?.id || "iv"}`}>
                      บริษัท
                    </InputLabel>
                    <Select
                      labelId={`invoice-company-select-label-${invoice?.id || "iv"}`}
                      value={selectValue}
                      label="บริษัท"
                      onChange={(e) => handleFieldChange("company_id", e.target.value)}
                      renderValue={(val) => {
                        const found = companies.find((c) => c.id === val);
                        return found ? found.short_code || found.name : "ไม่ระบุ";
                      }}
                    >
                      {companies.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {c.short_code || c.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {c.name}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedCompany && (
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      icon={<BusinessIcon />}
                      label={selectedCompany.short_code || selectedCompany.name}
                    />
                  )}

                  {loadingCompanies && <CircularProgress size={18} />}
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  เปลี่ยนได้เฉพาะก่อนอนุมัติ — เลขที่เอกสารจะใช้ prefix
                  ของบริษัทที่เลือกเมื่อกดอนุมัติ
                </Typography>
              </Box>

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
                    helperText={customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""}
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
                    helperText={customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""}
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
                    helperText={customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""}
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
                    helperText={customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""}
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
                    helperText={customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""}
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
                    helperText={customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""}
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
                    helperText={customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""}
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
                    helperText={customerDataSource === "master" ? "ข้อมูลจากฐานข้อมูลลูกค้า" : ""}
                  />
                </Grid>
              </Grid>
            </Box>
          ) : (
            /* === Compact Read-only — single card with both customer + invoice info === */
            <CompactReadOnlyView
              customer={customer}
              customerDataSource={customerDataSource}
              formData={formData}
              invoice={invoice}
              depositMode={depositMode}
            />
          )}

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
  );
};

export default CustomerSection;
