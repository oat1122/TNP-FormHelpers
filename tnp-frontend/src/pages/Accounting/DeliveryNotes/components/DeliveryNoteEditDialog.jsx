import React from "react";
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
  MenuItem,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import {
  useGetDeliveryNoteQuery,
  useUpdateDeliveryNoteMutation,
  useGetCompaniesQuery,
} from "../../../../features/Accounting/accountingApi";
import { formatTHB } from "../../Invoices/utils/format";
import {
  Section,
  SectionHeader,
  InfoCard,
  tokens,
} from "../../PricingIntegration/components/quotation/styles/quotationTheme";
import { useSubmitUpdateDeliveryNote } from "../hooks/useSubmitUpdateDeliveryNote";

// Group existing delivery note items for display/editing
function useGroupedNoteItems(note) {
  const [groups, setGroups] = React.useState([]);

  React.useEffect(() => {
    const items = Array.isArray(note?.items)
      ? note.items
      : Array.isArray(note?.delivery_note_items)
        ? note.delivery_note_items
        : [];
    const map = new Map();
    items.forEach((it, idx) => {
      const name = it.item_name || "-";
      const pattern = it.pattern || "";
      const fabric = it.fabric_type || "";
      const color = it.color || "";
      const workName = name;
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
      const qty =
        Number(
          typeof it.delivered_quantity === "string"
            ? parseFloat(it.delivered_quantity || "0")
            : it.delivered_quantity || 0
        ) || 0;
      map.get(key).rows.push({
        id: it.id || `${idx}`,
        size: it.size || "",
        quantity: qty,
        unit: it.unit || "ชิ้น",
      });
    });
    const grouped = Array.from(map.values()).map((g) => ({
      ...g,
      totalQty: (g.rows || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0),
    }));
    setGroups(grouped);
  }, [note?.items, note?.delivery_note_items]);

  return {
    groups,
    setGroups,
  };
}

// Editable table similar to create dialog (local-only edit for now)
function NoteItemsTable({ groups, setGroups, invoiceNumber }) {
  const [editingGroup, setEditingGroup] = React.useState(null);
  const [editingRow, setEditingRow] = React.useState(null);

  const handleGroupFieldChange = (groupIndex, field, value) => {
    setGroups((prev) => prev.map((g, i) => (i === groupIndex ? { ...g, [field]: value } : g)));
  };

  const handleSaveGroup = () => {
    setEditingGroup(null);
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        totalQty: (g.rows || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      }))
    );
  };

  const handleEditRow = (groupIndex, rowIndex) => setEditingRow({ groupIndex, rowIndex });
  const handleCancelRow = () => setEditingRow(null);
  const handleSaveRow = () => {
    setEditingRow(null);
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        totalQty: (g.rows || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      }))
    );
  };
  const handleRowFieldChange = (groupIndex, rowIndex, field, value) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex
          ? { ...g, rows: g.rows.map((r, ri) => (ri === rowIndex ? { ...r, [field]: value } : r)) }
          : g
      )
    );
  };
  const handleAddRow = (groupIndex) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? {
              ...g,
              rows: [...g.rows, { id: `tmp-${Date.now()}`, size: "", quantity: 0, unit: "ชิ้น" }],
            }
          : g
      )
    );
  };
  const handleDeleteRow = (groupIndex, rowIndex) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex ? { ...g, rows: g.rows.filter((_, ri) => ri !== rowIndex) } : g
      )
    );
  };

  return (
    <InfoCard>
      <Box sx={{ p: 2, borderBottom: `1px solid ${tokens.border}` }}>
        <Typography variant="subtitle2">
          รายการสินค้าจากใบแจ้งหนี้ {invoiceNumber || "-"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          แสดงข้อมูลจาก delivery_note_items ({groups.length} กลุ่ม) - สามารถแก้ไขได้
        </Typography>
      </Box>

      {groups.map((group, groupIndex) => (
        <Box key={group.key || groupIndex} sx={{ mb: 2 }}>
          <Box sx={{ p: 2, bgcolor: "grey.50", borderBottom: `1px solid ${tokens.border}` }}>
            {editingGroup === groupIndex ? (
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
                      onClick={handleSaveGroup}
                    >
                      บันทึก
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setEditingGroup(null)}
                    >
                      ยกเลิก
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            ) : (
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
                    <IconButton size="small" onClick={() => setEditingGroup(groupIndex)}>
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
                <TableRow key={row.id}>
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
                          sx={{ width: 100 }}
                          inputProps={{ min: 0 }}
                        />
                        <TextField
                          value={row.unit}
                          onChange={(e) =>
                            handleRowFieldChange(groupIndex, rowIndex, "unit", e.target.value)
                          }
                          size="small"
                          sx={{ width: 80 }}
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
                          <IconButton size="small" color="primary" onClick={handleSaveRow}>
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ยกเลิก">
                          <IconButton size="small" onClick={handleCancelRow}>
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
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteRow(groupIndex, rowIndex)}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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
                  >
                    เพิ่มไซส์ใหม่
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      ))}

      <Box sx={{ p: 2, borderTop: `1px solid ${tokens.border}`, bgcolor: "grey.50" }}>
        <Typography variant="body2">
          <strong>รวมทั้งหมด:</strong> {groups.reduce((sum, g) => sum + (g.totalQty || 0), 0)} ชิ้น
        </Typography>
        <Typography variant="caption" color="text.secondary">
          หมายเหตุ: การแก้ไขรายการงานจะถูกบันทึกเมื่อกดปุ่ม "บันทึก"
        </Typography>
      </Box>
    </InfoCard>
  );
}

const DeliveryNoteEditDialog = ({ open, onClose, deliveryNoteId, onUpdated }) => {
  const { data: noteResp, isLoading } = useGetDeliveryNoteQuery(deliveryNoteId, {
    skip: !open || !deliveryNoteId,
  });
  const note = React.useMemo(() => noteResp?.data || noteResp || null, [noteResp]);

  const { data: companiesResp, isLoading: companiesLoading } = useGetCompaniesQuery(undefined, {
    skip: !open,
  });
  const companies = React.useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);

  const [updateDeliveryNote, { isLoading: saving }] = useUpdateDeliveryNoteMutation();

  const [customerDataSource, setCustomerDataSource] = React.useState("delivery");
  const [formState, setFormState] = React.useState({
    customer_company: "",
    customer_tax_id: "",
    customer_firstname: "",
    customer_lastname: "",
    customer_tel_1: "",
    customer_address: "",
    work_name: "",
    quantity: "",
    notes: "",
    sender_company_id: "",
  });

  React.useEffect(() => {
    if (!note) return;
    setFormState({
      customer_company: note.customer_company || "",
      customer_tax_id: note.customer_tax_id || "",
      customer_firstname: note.customer_firstname || "",
      customer_lastname: note.customer_lastname || "",
      customer_tel_1: note.customer_tel_1 || "",
      customer_address: note.customer_address || "",
      work_name: note.work_name || "",
      quantity: note.quantity || "",
      notes: note.notes || "",
      sender_company_id: note.sender_company_id || "",
    });
    setCustomerDataSource(note.customer_data_source || "delivery");
  }, [note]);

  const handleChange = (field) => (e) => setFormState((s) => ({ ...s, [field]: e.target.value }));

  const { groups, setGroups } = useGroupedNoteItems(note);

  // Normalize customer values from master_customers relation for display/prefill
  const masterCustomer = React.useMemo(() => {
    const c = note?.customer;
    if (!c) return null;
    return {
      company: c.cus_company || "",
      taxId: c.cus_tax_id || "",
      firstName: c.cus_firstname || "",
      lastName: c.cus_lastname || "",
      phone: c.cus_tel_1 || "",
      address: c.cus_address || "",
      nickName: c.cus_name || "",
    };
  }, [note?.customer]);

  const masterContactName = React.useMemo(() => {
    const clean = (v) => {
      const t = String(v ?? "").trim();
      if (!t) return "";
      // Normalize dash variants and treat sequences of dashes as empty (e.g., "-", "--")
      const n = t.replace(/[—–]/g, "-");
      if (/^-+$/.test(n)) return "";
      return n;
    };

    const first = clean(note?.customer?.cus_firstname);
    const last = clean(note?.customer?.cus_lastname);
    const nick = clean(note?.customer?.cus_name);
    const full = [first, last].filter(Boolean).join(" ");
    return full || nick || "";
  }, [note?.customer]);

  // When switching data source, if switching to 'delivery' prefill fields from master
  const handleCustomerDataSourceChange = (e) => {
    const next = e.target.value;
    if (next === "delivery" && masterCustomer) {
      setFormState((s) => ({
        ...s,
        customer_company: masterCustomer.company,
        customer_tax_id: masterCustomer.taxId,
        customer_firstname: masterCustomer.firstName,
        customer_lastname: masterCustomer.lastName,
        customer_tel_1: masterCustomer.phone,
        customer_address: masterCustomer.address,
      }));
    }
    setCustomerDataSource(next);
  };

  const { handleUpdate } = useSubmitUpdateDeliveryNote(
    updateDeliveryNote,
    note,
    formState,
    groups,
    customerDataSource
  );
  const handleSave = async () => {
    const ok = await handleUpdate();
    if (ok) {
      onUpdated?.();
      onClose?.();
    }
  };

  const invoiceNumber = note?.invoice_number || note?.invoice?.number;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>ดู / แก้ไข ใบส่งของ</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ p: 3 }}>กำลังโหลดข้อมูล...</Box>
        ) : !note ? (
          <Box sx={{ p: 3 }}>ไม่พบข้อมูลใบส่งของ</Box>
        ) : (
          <Stack spacing={3} sx={{ p: 3 }}>
            {note.status !== "preparing" && (
              <Alert severity="info">
                ใบส่งของอยู่ในสถานะ <strong>{note.status}</strong> จะแก้ไขไม่ได้
              </Alert>
            )}
            {invoiceNumber ? (
              <Alert severity="info">
                ใบแจ้งหนี้ที่เกี่ยวข้อง: <strong>{invoiceNumber}</strong>
              </Alert>
            ) : null}

            <Section>
              <SectionHeader>
                <Avatar sx={{ bgcolor: tokens.primary, width: 32, height: 32 }}>
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
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    {customerDataSource === "master"
                      ? "ข้อมูลจะถูกดึงมาจากฐานข้อมูลลูกค้าหลัก"
                      : "ข้อมูลจะถูกบันทึกเฉพาะในใบส่งของนี้เท่านั้น"}
                  </Typography>
                </Box>

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
                          ? masterCustomer?.company || "-"
                          : formState.customer_company || "-"}
                      </Typography>
                    </Box>
                    {(
                      customerDataSource === "master"
                        ? masterCustomer?.taxId
                        : formState.customer_tax_id
                    ) ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={
                          customerDataSource === "master"
                            ? masterCustomer?.taxId
                            : formState.customer_tax_id
                        }
                      />
                    ) : null}
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">
                        ผู้ติดต่อ
                      </Typography>
                      <Typography variant="body2">{masterContactName || "-"}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">
                        ผู้ดูแล
                      </Typography>
                      <Typography variant="body2">
                        {(() => {
                          const m = note?.manager;
                          if (!m) return "-";
                          const a = (m.user_firstname || "").trim();
                          const b = (m.user_lastname || "").trim();
                          const full = `${a} ${b}`.trim();
                          return full || m.username || "-";
                        })()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary">
                        เบอร์โทร
                      </Typography>
                      <Typography variant="body2">
                        {customerDataSource === "master"
                          ? masterCustomer?.phone || "-"
                          : formState.customer_tel_1 || "-"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        ที่อยู่
                      </Typography>
                      <Typography variant="body2">
                        {customerDataSource === "master"
                          ? masterCustomer?.address || "-"
                          : formState.customer_address || "-"}
                      </Typography>
                    </Grid>
                  </Grid>
                </InfoCard>

                {customerDataSource === "delivery" && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="ชื่อบริษัท"
                        value={formState.customer_company}
                        onChange={handleChange("customer_company")}
                        fullWidth
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

            <Section>
              <SectionHeader>
                <Avatar sx={{ bgcolor: tokens.primary, width: 32, height: 32 }}>
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

            <Section>
              <SectionHeader>
                <Avatar sx={{ bgcolor: tokens.primary, width: 32, height: 32 }}>
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
                <NoteItemsTable
                  groups={groups}
                  setGroups={setGroups}
                  invoiceNumber={invoiceNumber}
                />
              </Box>
            </Section>

            {note?.invoice && (
              <InfoCard sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  สรุปใบแจ้งหนี้
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {note.invoice.number} • {note.invoice.customer_company}
                  {note.invoice.final_total_amount && (
                    <> • ยอดรวม {formatTHB(note.invoice.final_total_amount)}</>
                  )}
                </Typography>
              </InfoCard>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || (note && note.status !== "preparing")}
          sx={{ bgcolor: tokens.primary, "&:hover": { bgcolor: "#7A0E0E" } }}
        >
          {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeliveryNoteEditDialog;
