import { Assignment as AssignmentIcon } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Chip,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
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
 * Extracted from InvoiceDetailDialog.jsx during Phase 1b of redesign refactor.
 * Zero behavior change — JSX moved verbatim, props threaded through.
 */
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
}) => {
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
            /* === โค้ด HTML ที่ 1 (Read Only) === */
            <InfoCard sx={{ p: 2, mb: 1.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {customer?.customer_type === "individual" ? "ชื่อผู้ติดต่อ" : "ชื่อบริษัท"}
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
                <Typography variant="body2">{formatDateTH(invoice.invoice_date)}</Typography>
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
  );
};

export default CustomerSection;
