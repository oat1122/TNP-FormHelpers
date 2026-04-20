import { Assignment as AssignmentIcon, Business as BusinessIcon } from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Stack,
  Typography,
  Alert,
  MenuItem,
  Avatar,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import React from "react";

import InvoiceItemsTable from "./InvoiceItemsTable";
import {
  useGetInvoiceQuery,
  useCreateDeliveryNoteMutation,
  useGetCompaniesQuery,
} from "../../../../features/Accounting/accountingApi";
import { formatTHB } from "../../Invoices/utils/format";
import LoadingState from "../../PricingIntegration/components/LoadingState";
import {
  Section,
  SectionHeader,
  InfoCard,
  tokens,
} from "../../PricingIntegration/components/styles/quotationFormStyles";
import { useDeliveryNoteForm } from "../hooks/useDeliveryNoteForm";
import { useDeliveryNoteItems } from "../hooks/useDeliveryNoteItems";
import { useSubmitDeliveryNote } from "../hooks/useSubmitDeliveryNote";

const DeliveryNoteCreateDialog = ({ open, onClose, onCreated, source }) => {
  const invoiceId = source?.invoice_id;
  const { data: invoiceData, isFetching: invoiceLoading } = useGetInvoiceQuery(invoiceId, {
    skip: !open || !invoiceId,
  });

  const invoice = React.useMemo(() => invoiceData?.data || invoiceData || null, [invoiceData]);

  // Fetch companies for sender selection
  const { data: companiesResp, isLoading: companiesLoading } = useGetCompaniesQuery(undefined, {
    skip: !open,
  });

  const companies = React.useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);

  const [createDeliveryNote, { isLoading: creating }] = useCreateDeliveryNoteMutation();

  // Normalize customer data from master_customers relationship (similar to InvoiceDetailDialog)
  const normalizeCustomer = (inv) => {
    if (!inv) return {};
    const customer = inv.customer;
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

  const customer = normalizeCustomer(invoice);

  // hooks: form, items, submit
  const { formState, handleChange, customerDataSource, handleCustomerDataSourceChange } =
    useDeliveryNoteForm(open, source, invoice, customer);
  const { editableItems, handleUpdateItems } = useDeliveryNoteItems();
  const { handleSubmit } = useSubmitDeliveryNote(
    createDeliveryNote,
    formState,
    invoice,
    customer,
    customerDataSource,
    source,
    editableItems,
    onCreated
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>สร้างใบส่งของ</DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {invoiceLoading && <LoadingState message="Loading invoice details..." />}

        {!invoiceLoading && (
          <Stack spacing={3} sx={{ p: 3 }}>
            {/* Source selection alert */}
            {source ? (
              source.invoice_item_id ? (
                <Alert severity="info">
                  รายการที่เลือก: <strong>{source.item_name}</strong> จากใบแจ้งหนี้{" "}
                  <strong>{source.invoice_number}</strong>
                </Alert>
              ) : (
                <Alert severity="info">
                  ใบแจ้งหนี้ที่เลือก: <strong>{source.invoice_number}</strong>
                </Alert>
              )
            ) : (
              <Alert severity="warning">
                ไม่ได้เลือกใบแจ้งหนี้ คุณสามารถสร้างใบส่งของแบบ manual ได้
              </Alert>
            )}

            {/* Customer Information Section */}
            <Section>
              <SectionHeader>
                <Avatar
                  sx={{
                    bgcolor: tokens.primary,
                    width: 32,
                    height: 32,
                    "& .MuiSvgIcon-root": { fontSize: "1rem" },
                  }}
                >
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">ข้อมูลลูกค้า</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ข้อมูลผู้ติดต่อและบริษัท
                  </Typography>
                </Box>
              </SectionHeader>

              <Box sx={{ p: 3 }}>
                {/* Customer data source selection */}
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
                      value="delivery"
                      control={<Radio />}
                      label="แก้ไขข้อมูลเฉพาะใบส่งของนี้"
                    />
                  </RadioGroup>
                  {customerDataSource === "master" && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      ข้อมูลจะถูกดึงมาจากฐานข้อมูลลูกค้าหลัก
                    </Typography>
                  )}
                  {customerDataSource === "delivery" && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      ข้อมูลจะถูกบันทึกเฉพาะในใบส่งของนี้เท่านั้น
                    </Typography>
                  )}
                </Box>

                {/* Customer Info Display/Edit */}
                <InfoCard sx={{ p: 2, mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        ชื่อบริษัท
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {customerDataSource === "master"
                          ? customer.cus_company || formState.customer_company || "-"
                          : formState.customer_company || "-"}
                      </Typography>
                    </Box>
                    {(customerDataSource === "master"
                      ? customer.cus_tax_id
                      : formState.customer_tax_id) && (
                      <Box>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={
                            customerDataSource === "master"
                              ? customer.cus_tax_id
                              : formState.customer_tax_id
                          }
                        />
                      </Box>
                    )}
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">
                        ผู้ติดต่อ
                      </Typography>
                      <Typography variant="body2">{customer.contact_name || "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">
                        เบอร์โทร
                      </Typography>
                      <Typography variant="body2">
                        {customerDataSource === "master"
                          ? customer.cus_tel_1 || "-"
                          : formState.customer_tel_1 || "-"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        ที่อยู่
                      </Typography>
                      <Typography variant="body2">
                        {customerDataSource === "master"
                          ? customer.cus_address || "-"
                          : formState.customer_address || "-"}
                      </Typography>
                    </Grid>
                  </Grid>
                </InfoCard>

                {/* Editable fields when delivery source is selected */}
                {customerDataSource === "delivery" && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="ชื่อบริษัท"
                        value={formState.customer_company}
                        onChange={handleChange("customer_company")}
                        fullWidth
                        required
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="เลขประจำตัวผู้เสียภาษี"
                        value={formState.customer_tax_id}
                        onChange={handleChange("customer_tax_id")}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="เบอร์โทร"
                        value={formState.customer_tel_1}
                        onChange={handleChange("customer_tel_1")}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="ที่อยู่ลูกค้า"
                        value={formState.customer_address}
                        onChange={handleChange("customer_address")}
                        fullWidth
                        multiline
                        minRows={2}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Section>

            {/* Company and Sender Information Section */}
            <Section>
              <SectionHeader>
                <Avatar
                  sx={{
                    bgcolor: tokens.primary,
                    width: 32,
                    height: 32,
                    "& .MuiSvgIcon-root": { fontSize: "1rem" },
                  }}
                >
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">ข้อมูลบริษัทและผู้ส่ง</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ข้อมูลบริษัทผู้ส่งและการจัดการ
                  </Typography>
                </Box>
              </SectionHeader>

              <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3, pb: 2, borderBottom: `1px solid ${tokens.border}` }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    ข้อมูลผู้ส่ง
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="บริษัทผู้ส่ง"
                        value={formState.sender_company_id}
                        onChange={handleChange("sender_company_id")}
                        fullWidth
                        size="small"
                        disabled={companiesLoading}
                        helperText="เลือกบริษัทที่ทำการส่งของ"
                      >
                        <MenuItem value="">
                          <em>- ไม่ระบุ -</em>
                        </MenuItem>
                        {companies.map((company) => (
                          <MenuItem key={company.id} value={company.id}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {company.short_code || company.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {company.name}
                              </Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    {formState.sender_company_id && (
                      <Grid item xs={12} md={6}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          {(() => {
                            const selectedCompany = companies.find(
                              (c) => c.id === formState.sender_company_id
                            );
                            return selectedCompany ? (
                              <Stack spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {selectedCompany.legal_name || selectedCompany.name}
                                </Typography>
                                {selectedCompany.tax_id && (
                                  <Typography variant="caption" color="text.secondary">
                                    เลขประจำตัวผู้เสียภาษี: {selectedCompany.tax_id}
                                  </Typography>
                                )}
                                {selectedCompany.address && (
                                  <Typography variant="caption" color="text.secondary">
                                    {selectedCompany.address}
                                  </Typography>
                                )}
                                {selectedCompany.phone && (
                                  <Typography variant="caption" color="text.secondary">
                                    โทร: {selectedCompany.phone}
                                  </Typography>
                                )}
                              </Stack>
                            ) : null;
                          })()}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>
            </Section>

            {/* Notes Section */}
            <Section>
              <SectionHeader>
                <Avatar
                  sx={{
                    bgcolor: tokens.primary,
                    width: 32,
                    height: 32,
                    "& .MuiSvgIcon-root": { fontSize: "1rem" },
                  }}
                >
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">หมายเหตุสำหรับใบส่งของ</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ข้อความที่จะแสดงในใบส่งของ
                  </Typography>
                </Box>
              </SectionHeader>
              <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    เลือกประเภทหมายเหตุ
                  </Typography>
                  <RadioGroup
                    value={formState.notesSource || "default"}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleChange("notesSource")({ target: { value } });
                      if (value === "default") {
                        handleChange("notes")({
                          target: {
                            value: `สินค้าเสียหายตำหนิสามารถเคลมเปลี่ยนสินค้าใหม่ภายใน 7 วัน
(โดยสินค้าชิ้นนั้นจะต้องยังไม่ถูกผ่านการใช้งาน หรือการซัก)`,
                          },
                        });
                      }
                    }}
                    row
                  >
                    <FormControlLabel
                      value="default"
                      control={<Radio />}
                      label="ใช้ข้อความมาตรฐาน"
                    />
                    <FormControlLabel value="custom" control={<Radio />} label="กำหนดข้อความเอง" />
                  </RadioGroup>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    {formState.notesSource === "custom"
                      ? "กำหนดข้อความหมายเหตุเฉพาะสำหรับใบส่งของนี้"
                      : "ใช้ข้อความเงื่อนไขการรับประกันและดูแลสินค้ามาตรฐาน"}
                  </Typography>
                </Box>

                <InfoCard sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    {formState.notesSource === "custom" ? "ข้อความที่กำหนด" : "ข้อความมาตรฐาน"}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "grey.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-line", color: "text.secondary" }}
                    >
                      {formState.notesSource === "custom"
                        ? formState.notes || "-"
                        : `สินค้าเสียหายตำหนิสามารถเคลมเปลี่ยนสินค้าใหม่ภายใน 7 วัน
(โดยสินค้าชิ้นนั้นจะต้องยังไม่ถูกผ่านการใช้งาน หรือการซัก)`}
                    </Typography>
                  </Box>
                </InfoCard>

                {formState.notesSource === "custom" && (
                  <TextField
                    label="หมายเหตุ"
                    value={formState.notes}
                    onChange={handleChange("notes")}
                    fullWidth
                    multiline
                    minRows={6}
                    size="small"
                    placeholder="ระบุข้อความหมายเหตุ..."
                    helperText="ข้อความที่จะแสดงในใบส่งของ เช่น เงื่อนไขการรับประกัน การดูแลสินค้า"
                  />
                )}
              </Box>
            </Section>

            {/* Work Items Section */}
            <Section>
              <SectionHeader>
                <Avatar
                  sx={{
                    bgcolor: tokens.primary,
                    width: 32,
                    height: 32,
                    "& .MuiSvgIcon-root": { fontSize: "1rem" },
                  }}
                >
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">รายการงาน</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ข้อมูลงานและจำนวนที่จัดส่ง
                  </Typography>
                </Box>
              </SectionHeader>

              <Box sx={{ p: 3 }}>
                {/* Manual Work Name and Quantity for non-invoice items */}
                {!invoice?.items?.length && (
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        label="ชื่องาน"
                        value={formState.work_name}
                        onChange={handleChange("work_name")}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="จำนวน"
                        value={formState.quantity}
                        onChange={handleChange("quantity")}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Invoice Items Table - Grouped by Item Type */}
                {invoice?.items?.length > 0 ? (
                  <InvoiceItemsTable invoice={invoice} onUpdateItems={handleUpdateItems} />
                ) : (
                  <InfoCard>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>รายการ</TableCell>
                          <TableCell align="center">จำนวน</TableCell>
                          <TableCell align="right">หมายเหตุ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {formState.work_name || source?.item_name || source?.work_name || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{formState.quantity || "1"}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {formState.notes || "-"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </InfoCard>
                )}
              </Box>
            </Section>

            {/* Invoice Summary (if applicable) */}
            {invoice && (
              <InfoCard sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  สรุปใบแจ้งหนี้
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoice.number} • {invoice.customer_company}
                  {invoice.final_total_amount && (
                    <> • ยอดรวม {formatTHB(invoice.final_total_amount)}</>
                  )}
                </Typography>
              </InfoCard>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={creating}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={creating}
          sx={{
            bgcolor: tokens.primary,
            "&:hover": { bgcolor: "#7A0E0E" },
          }}
        >
          {creating ? "กำลังบันทึก..." : "สร้างใบส่งของ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeliveryNoteCreateDialog;
