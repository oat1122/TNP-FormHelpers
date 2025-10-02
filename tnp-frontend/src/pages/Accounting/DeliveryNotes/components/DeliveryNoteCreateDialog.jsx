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
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import React, { useState, useEffect } from "react";

import {
  useGetInvoiceQuery,
  useCreateDeliveryNoteMutation,
  useGetCompaniesQuery,
} from "../../../../features/Accounting/accountingApi";
// toasts are handled inside useSubmitDeliveryNote hook
import LoadingState from "../../PricingIntegration/components/LoadingState";
import {
  Section,
  SectionHeader,
  InfoCard,
  tokens,
} from "../../PricingIntegration/components/quotation/styles/quotationTheme";
import { formatTHB } from "../../Invoices/utils/format";
// payload builders are handled inside useSubmitDeliveryNote hook
import { useDeliveryNoteForm } from "../hooks/useDeliveryNoteForm";
import { useDeliveryNoteItems } from "../hooks/useDeliveryNoteItems";
import { useSubmitDeliveryNote } from "../hooks/useSubmitDeliveryNote";

// removed unused helper

// Component สำหรับแสดงตาราง Invoice Items แบบจัดกลุ่ม (Editable)
const InvoiceItemsTable = ({ invoice, onUpdateItems }) => {
  const [editableGroups, setEditableGroups] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingRow, setEditingRow] = useState(null);

  // Initialize editable groups from invoice items
  useEffect(() => {
    if (!invoice?.items) return;

    const map = new Map();
    invoice.items.forEach((it, idx) => {
      const name = it.item_name || it.name || "-";
      const pattern = it.pattern || "";
      const fabric = it.fabric_type || it.material || "";
      const color = it.color || "";
      const workName = it.work_name || "-";
      const key = [name, pattern, fabric, color, workName].join("||");

      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          pattern,
          fabric,
          color,
          workName,
          description: it.item_description || "-",
          rows: [],
        });
      }

      const q =
        typeof it.quantity === "string" ? parseFloat(it.quantity || "0") : Number(it.quantity || 0);

      map.get(key).rows.push({
        id: it.id || `${idx}`,
        sequence_order: it.sequence_order || idx + 1,
        size: it.size || "",
        quantity: isNaN(q) ? 0 : q,
        unit: it.unit || "ชิ้น",
        originalItem: it,
      });
    });

    const grouped = Array.from(map.values()).map((g) => ({
      ...g,
      totalQty: g.rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
    }));

    setEditableGroups(grouped);
    // Propagate initial groups to parent so submit has items even if user doesn't edit
    onUpdateItems?.(grouped);
  }, [invoice?.items]);

  // Group header editing handlers
  const handleEditGroup = (groupIndex) => {
    setEditingGroup(groupIndex);
  };

  const handleSaveGroup = (groupIndex) => {
    setEditingGroup(null);
    // Recalculate totals and propagate latest state
    setEditableGroups((prev) => {
      const next = prev.map((g) => ({
        ...g,
        totalQty: (g.rows || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      }));
      onUpdateItems?.(next);
      return next;
    });
  };

  const handleCancelGroupEdit = () => {
    setEditingGroup(null);
    // Reset to original data
    if (invoice?.items) {
      // Re-initialize from original data
      // ... (same logic as useEffect)
    }
  };

  const handleGroupFieldChange = (groupIndex, field, value) => {
    setEditableGroups((prev) => {
      const next = prev.map((group, idx) =>
        idx === groupIndex ? { ...group, [field]: value } : group
      );
      onUpdateItems?.(next);
      return next;
    });
  };

  // Row editing handlers
  const handleEditRow = (groupIndex, rowIndex) => {
    setEditingRow({ groupIndex, rowIndex });
  };

  const handleSaveRow = () => {
    setEditingRow(null);
    // Recalculate group totals and propagate latest state
    setEditableGroups((prev) => {
      const next = prev.map((group) => ({
        ...group,
        totalQty: (group.rows || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      }));
      onUpdateItems?.(next);
      return next;
    });
  };

  const handleCancelRowEdit = () => {
    setEditingRow(null);
  };

  const handleRowFieldChange = (groupIndex, rowIndex, field, value) => {
    setEditableGroups((prev) => {
      const next = prev.map((group, gIdx) =>
        gIdx === groupIndex
          ? {
              ...group,
              rows: group.rows.map((row, rIdx) =>
                rIdx === rowIndex ? { ...row, [field]: value } : row
              ),
            }
          : group
      );
      onUpdateItems?.(next);
      return next;
    });
  };

  // Add/Delete row handlers
  const handleAddRow = (groupIndex) => {
    const newRow = {
      id: `new-${Date.now()}`,
      sequence_order: editableGroups[groupIndex].rows.length + 1,
      size: "",
      quantity: 0,
      unit: "ชิ้น",
    };

    setEditableGroups((prev) => {
      const next = prev.map((group, idx) =>
        idx === groupIndex ? { ...group, rows: [...group.rows, newRow] } : group
      );
      onUpdateItems?.(next);
      return next;
    });
  };

  const handleDeleteRow = (groupIndex, rowIndex) => {
    setEditableGroups((prev) => {
      const next = prev.map((group, gIdx) =>
        gIdx === groupIndex
          ? { ...group, rows: group.rows.filter((_, rIdx) => rIdx !== rowIndex) }
          : group
      );
      onUpdateItems?.(next);
      return next;
    });
  };

  return (
    <InfoCard>
      <Box sx={{ p: 2, borderBottom: `1px solid ${tokens.border}` }}>
        <Typography variant="subtitle2">รายการสินค้าจากใบแจ้งหนี้ {invoice.number}</Typography>
        <Typography variant="caption" color="text.secondary">
          แสดงข้อมูลจาก invoice_items ({editableGroups.length} กลุ่ม) - สามารถแก้ไขได้
        </Typography>
      </Box>

      {editableGroups.map((group, groupIndex) => (
        <Box key={group.key || groupIndex} sx={{ mb: 2 }}>
          {/* Group Header - Editable */}
          <Box sx={{ p: 2, bgcolor: "grey.50", borderBottom: `1px solid ${tokens.border}` }}>
            {editingGroup === groupIndex ? (
              // Edit mode
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="ชื่องาน"
                    value={group.name}
                    onChange={(e) => handleGroupFieldChange(groupIndex, "name", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="รายละเอียด"
                    value={group.description}
                    onChange={(e) =>
                      handleGroupFieldChange(groupIndex, "description", e.target.value)
                    }
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="แพทเทิร์น"
                    value={group.pattern}
                    onChange={(e) => handleGroupFieldChange(groupIndex, "pattern", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="ผ้า"
                    value={group.fabric}
                    onChange={(e) => handleGroupFieldChange(groupIndex, "fabric", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="สี"
                    value={group.color}
                    onChange={(e) => handleGroupFieldChange(groupIndex, "color", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSaveGroup(groupIndex)}
                    >
                      บันทึก
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancelGroupEdit}
                    >
                      ยกเลิก
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            ) : (
              // View mode
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {group.name}
                  </Typography>
                  <Tooltip title="แก้ไขข้อมูลกลุ่ม">
                    <IconButton size="small" onClick={() => handleEditGroup(groupIndex)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                  {group.pattern && (
                    <Chip size="small" label={`แพทเทิร์น: ${group.pattern}`} variant="outlined" />
                  )}
                  {group.fabric && (
                    <Chip size="small" label={`ผ้า: ${group.fabric}`} variant="outlined" />
                  )}
                  {group.color && (
                    <Chip size="small" label={`สี: ${group.color}`} variant="outlined" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  รายละเอียด: {group.description}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  รวม {group.totalQty} ชิ้น
                </Typography>
              </Box>
            )}
          </Box>

          {/* Size Details Table - Simplified and Clean */}
          <Table size="small" sx={{ mt: 1 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600, width: "30%" }}>ไซส์</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: "40%" }}>
                  จำนวน
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: "30%" }}>
                  การจัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {group.rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  sx={{
                    "&:nth-of-type(odd)": { bgcolor: "grey.50" },
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <TableCell sx={{ py: 1.5 }}>
                    {editingRow?.groupIndex === groupIndex && editingRow?.rowIndex === rowIndex ? (
                      <TextField
                        value={row.size}
                        onChange={(e) =>
                          handleRowFieldChange(groupIndex, rowIndex, "size", e.target.value)
                        }
                        size="small"
                        fullWidth
                        placeholder="ระบุไซส์..."
                        sx={{
                          "& .MuiInputBase-root": {
                            borderRadius: 1.5,
                            bgcolor: "background.paper",
                          },
                        }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.size || <em style={{ color: "#999" }}>ยังไม่ระบุไซส์</em>}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    {editingRow?.groupIndex === groupIndex && editingRow?.rowIndex === rowIndex ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <TextField
                          type="number"
                          value={row.quantity}
                          onChange={(e) =>
                            handleRowFieldChange(
                              groupIndex,
                              rowIndex,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          size="small"
                          sx={{
                            width: 100,
                            "& .MuiInputBase-root": {
                              borderRadius: 1.5,
                              bgcolor: "background.paper",
                            },
                          }}
                          inputProps={{ min: 0 }}
                        />
                        <TextField
                          value={row.unit}
                          onChange={(e) =>
                            handleRowFieldChange(groupIndex, rowIndex, "unit", e.target.value)
                          }
                          size="small"
                          sx={{
                            width: 80,
                            "& .MuiInputBase-root": {
                              borderRadius: 1.5,
                              bgcolor: "background.paper",
                            },
                          }}
                          placeholder="หน่วย"
                        />
                      </Stack>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                          {Number(row.quantity).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.unit}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    {editingRow?.groupIndex === groupIndex && editingRow?.rowIndex === rowIndex ? (
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="บันทึก">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={handleSaveRow}
                            sx={{
                              bgcolor: "primary.main",
                              color: "white",
                              "&:hover": { bgcolor: "primary.dark" },
                            }}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ยกเลิก">
                          <IconButton
                            size="small"
                            onClick={handleCancelRowEdit}
                            sx={{
                              bgcolor: "grey.200",
                              "&:hover": { bgcolor: "grey.300" },
                            }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="แก้ไข">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRow(groupIndex, rowIndex)}
                            sx={{
                              color: "primary.main",
                              "&:hover": { bgcolor: "primary.light", color: "primary.dark" },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteRow(groupIndex, rowIndex)}
                            sx={{
                              "&:hover": { bgcolor: "error.light", color: "error.dark" },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {/* Add Row Button */}
              <TableRow>
                <TableCell
                  colSpan={3}
                  align="center"
                  sx={{ py: 2, borderTop: "2px dashed", borderColor: "divider" }}
                >
                  <Button
                    size="medium"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddRow(groupIndex)}
                    sx={{
                      borderRadius: 2,
                      borderStyle: "dashed",
                      textTransform: "none",
                      fontSize: "0.875rem",
                      px: 3,
                      py: 1,
                      "&:hover": {
                        borderStyle: "solid",
                        bgcolor: "primary.light",
                        color: "primary.dark",
                      },
                    }}
                  >
                    เพิ่มไซส์ใหม่
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      ))}

      {/* Summary Row */}
      <Box sx={{ p: 2, borderTop: `1px solid ${tokens.border}`, bgcolor: "grey.50" }}>
        <Typography variant="body2">
          <strong>รวมทั้งหมด:</strong>{" "}
          {editableGroups.reduce((sum, group) => sum + group.totalQty, 0)} ชิ้น
        </Typography>
      </Box>
    </InfoCard>
  );
};

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
                {/* Sender Company Information */}
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
                  /* Fallback for manual items or selected specific item */
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
