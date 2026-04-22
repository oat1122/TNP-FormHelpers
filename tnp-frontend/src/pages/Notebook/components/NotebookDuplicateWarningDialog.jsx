import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { MdClose, MdWarningAmber } from "react-icons/md";

const TYPE_META = {
  phone: { label: "เบอร์โทรซ้ำ" },
  email: { label: "อีเมลซ้ำ" },
  customer_name: { label: "ชื่อลูกค้า / บริษัทคล้ายกัน" },
  contact_person: { label: "ผู้ติดต่อคล้ายกัน" },
};

const buildContactLine = (customer) => {
  const parts = [];
  if (customer.cus_tel_1) parts.push(customer.cus_tel_1);
  if (customer.cus_tel_2) parts.push(customer.cus_tel_2);
  if (customer.cus_email) parts.push(customer.cus_email);
  return parts.join(" · ");
};

const buildNotebookLine = (notebook) => {
  const parts = [];
  if (notebook.nb_contact_person) parts.push(`ผู้ติดต่อ: ${notebook.nb_contact_person}`);
  if (notebook.nb_contact_number) parts.push(notebook.nb_contact_number);
  if (notebook.nb_email) parts.push(notebook.nb_email);
  return parts.join(" · ");
};

const MatchSection = ({ section }) => {
  const hasCustomers = section.customers.length > 0;
  const hasNotebooks = section.notebooks.length > 0;

  if (!hasCustomers && !hasNotebooks) {
    return null;
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {TYPE_META[section.type]?.label || section.type}
        </Typography>
        {section.value ? (
          <Chip
            size="small"
            variant="outlined"
            label={`"${section.value}"`}
            sx={{ maxWidth: 260 }}
          />
        ) : null}
      </Stack>

      <Stack spacing={1}>
        {section.customers.map((customer) => (
          <Box
            key={`customer-${customer.cus_id}`}
            sx={{
              p: 1.25,
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: "secondary.light",
              bgcolor: "rgba(156, 39, 176, 0.04)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip
                label="ลูกค้าในระบบ"
                size="small"
                color="secondary"
                sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }}
              />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {customer.cus_company || customer.cus_name || "-"}
              </Typography>
            </Stack>
            {customer.cus_company && customer.cus_name ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                ชื่อติดต่อ: {customer.cus_name}
              </Typography>
            ) : null}
            {buildContactLine(customer) ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {buildContactLine(customer)}
              </Typography>
            ) : null}
            {customer.sales_name ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                ดูแลโดย: {customer.sales_name}
              </Typography>
            ) : null}
          </Box>
        ))}

        {section.notebooks.map((notebook) => (
          <Box
            key={`notebook-${notebook.id}`}
            sx={{
              p: 1.25,
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: "info.light",
              bgcolor: "rgba(2, 136, 209, 0.04)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip
                label="Notebook อื่น"
                size="small"
                color="info"
                sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }}
              />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {notebook.nb_customer_name || "-"}
              </Typography>
              {notebook.nb_workflow === "lead_queue" && !notebook.nb_manage_by ? (
                <Chip
                  label="คิวกลาง"
                  size="small"
                  variant="outlined"
                  color="warning"
                  sx={{ height: 20, fontSize: "0.68rem" }}
                />
              ) : null}
            </Stack>
            {buildNotebookLine(notebook) ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {buildNotebookLine(notebook)}
              </Typography>
            ) : null}
            {notebook.nb_manage_by_name ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                ดูแลโดย: {notebook.nb_manage_by_name}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const NotebookDuplicateWarningDialog = ({
  open,
  matches,
  mode = "field",
  activeType = null,
  onClose,
  onContinue,
  onCancel,
}) => {
  const sections = useMemo(() => {
    if (!matches) {
      return [];
    }

    if (mode === "field" && activeType) {
      const single = matches[activeType];
      return single ? [single] : [];
    }

    return ["phone", "email", "customer_name", "contact_person"]
      .map((type) => matches[type])
      .filter(Boolean)
      .filter(
        (section) => (section.customers || []).length > 0 || (section.notebooks || []).length > 0
      );
  }, [activeType, matches, mode]);

  const isSaveMode = mode === "save";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <MdWarningAmber size={24} color="#ed6c02" />
          <Typography variant="h6" fontWeight={700}>
            พบข้อมูลที่อาจซ้ำกับระบบ
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: 1.5 }}>
            {isSaveMode
              ? "ตรวจพบว่าข้อมูลนี้อาจซ้ำกับรายการเดิมในระบบ กรุณาตรวจสอบก่อนบันทึก"
              : "ข้อมูลที่กรอกอาจซ้ำกับรายการที่มีอยู่ในระบบ"}
          </Alert>

          {sections.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              ไม่มีข้อมูลซ้ำแล้ว
            </Typography>
          ) : (
            sections.map((section, index) => (
              <Box key={section.type}>
                {index > 0 ? <Divider sx={{ mb: 2 }} /> : null}
                <MatchSection section={section} />
              </Box>
            ))
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {isSaveMode ? (
          <>
            <Button onClick={onCancel} color="inherit" startIcon={<MdClose />}>
              ยกเลิก
            </Button>
            <Button onClick={onContinue} variant="contained" color="warning">
              เข้าใจแล้ว บันทึกต่อ
            </Button>
          </>
        ) : (
          <Button onClick={onClose} variant="contained">
            รับทราบ
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NotebookDuplicateWarningDialog;
