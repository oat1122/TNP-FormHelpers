import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  TextField,
  Button,
  IconButton,
  Typography,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import {
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
} from "../../../../features/Accounting/accountingApi";

const emptyForm = {
  name: "",
  legal_name: "",
  branch: "",
  address: "",
  tax_id: "",
  phone: "",
  short_code: "",
  is_active: true,
  account_name: "",
  bank_name: "",
  account_number: "",
};

const CompanyManagerDialog = ({ open, onClose }) => {
  const { data: companiesResp, isFetching, refetch } = useGetCompaniesQuery();
  const [createCompany, { isLoading: creating }] = useCreateCompanyMutation();
  const [updateCompany, { isLoading: updating }] = useUpdateCompanyMutation();

  const companies = React.useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);

  const [form, setForm] = React.useState(emptyForm);
  const [editingId, setEditingId] = React.useState(null);

  const handleClose = () => {
    setForm(emptyForm);
    setEditingId(null);
    onClose?.();
  };

  const handleSubmit = async () => {
    const payload = { ...form };
    try {
      if (editingId) {
        await updateCompany({ id: editingId, ...payload }).unwrap();
      } else {
        await createCompany(payload).unwrap();
      }
      setForm(emptyForm);
      setEditingId(null);
      refetch();
    } catch (e) {
      console.error("Save company failed", e);
    }
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      legal_name: c.legal_name || "",
      branch: c.branch || "",
      address: c.address || "",
      tax_id: c.tax_id || "",
      phone: c.phone || "",
      short_code: c.short_code || "",
      is_active: Boolean(c.is_active),
      account_name: c.account_name || "",
      bank_name: c.bank_name || "",
      account_number: c.account_number || "",
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        จัดการบริษัท
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              ฟอร์ม
            </Typography>
            <Stack spacing={1.25}>
              <TextField
                size="small"
                label="ชื่อ (ย่อ/แสดง)"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="ชื่อจดทะเบียน"
                value={form.legal_name}
                onChange={(e) => setForm((f) => ({ ...f, legal_name: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="สาขา"
                value={form.branch}
                onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="ที่อยู่"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <TextField
                  size="small"
                  label="เลขผู้เสียภาษี"
                  value={form.tax_id}
                  onChange={(e) => setForm((f) => ({ ...f, tax_id: e.target.value }))}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="โทรศัพท์"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems="center">
                <TextField
                  size="small"
                  label="โค้ดสั้น (เช่น TNP)"
                  value={form.short_code}
                  onChange={(e) => setForm((f) => ({ ...f, short_code: e.target.value }))}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    />
                  }
                  label="ใช้งานอยู่"
                />
              </Stack>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", color: "primary.main", mt: 1.5, mb: 0.5 }}
              >
                ข้อมูลการชำระเงิน
              </Typography>
              <TextField
                size="small"
                label="ชื่อเจ้าของบัญชี"
                value={form.account_name || ""}
                onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
                placeholder="เช่น นายสมชาย ใจดี"
                fullWidth
              />
              <TextField
                size="small"
                label="ชื่อธนาคาร"
                value={form.bank_name || ""}
                onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                placeholder="เช่น ธนาคารกสิกรไทย"
                fullWidth
              />
              <TextField
                size="small"
                label="หมายเลขบัญชี"
                value={form.account_number || ""}
                onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                placeholder="เช่น 123-4-56789-0"
                fullWidth
              />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={editingId ? <SaveIcon /> : <AddIcon />}
                  onClick={handleSubmit}
                  disabled={creating || updating}
                >
                  {editingId ? "บันทึกการแก้ไข" : "เพิ่มบริษัท"}
                </Button>
                {editingId && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                  >
                    ยกเลิก
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              รายการบริษัท
            </Typography>
            <List dense sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              {(companies || []).map((c) => (
                <ListItem key={c.id} divider>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {c.short_code || c.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {c.name}
                        {c.is_active === false ? " • ปิดใช้งาน" : ""}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" onClick={() => handleEdit(c)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {(!companies || companies.length === 0) && (
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    ไม่มีข้อมูลบริษัท
                  </Typography>
                </Box>
              )}
            </List>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompanyManagerDialog;
