import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  AlertTitle,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Error as ErrorIcon,
  Close as CloseIcon,
  Receipt as InvoiceIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

/**
 * PermissionErrorDialog Component
 *
 * แสดง Dialog แจ้งเตือนเมื่อผู้ใช้ไม่มีสิทธิ์แก้ไข Quotation
 * พร้อมแสดงรายการ Invoice ที่เชื่อมโยงและลิงก์ไปยังหน้ารายละเอียด
 *
 * @param {Object} props
 * @param {boolean} props.open - สถานะการเปิด Dialog
 * @param {Function} props.onClose - ฟังก์ชันปิด Dialog
 * @param {string} props.message - ข้อความแจ้งเตือน
 * @param {Array} props.invoices - รายการ Invoice ที่เชื่อมโยง [{ id, number, status }]
 * @param {string} props.quotationNumber - เลขที่ใบเสนอราคา
 * @param {string} props.userRole - role ของผู้ใช้ปัจจุบัน
 */
const PermissionErrorDialog = ({
  open,
  onClose,
  message,
  invoices = [],
  quotationNumber = "",
  userRole = "",
}) => {
  const navigate = useNavigate();

  const statusColors = {
    draft: "default",
    approved: "success",
    sent: "info",
    partial_paid: "warning",
    fully_paid: "success",
    cancelled: "error",
  };

  const statusLabels = {
    draft: "แบบร่าง",
    approved: "อนุมัติแล้ว",
    sent: "ส่งแล้ว",
    partial_paid: "ชำระบางส่วน",
    fully_paid: "ชำระครบ",
    cancelled: "ยกเลิก",
  };

  const handleViewInvoice = (invoiceId) => {
    navigate(`/accounting/invoices?selected=${invoiceId}`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ErrorIcon color="error" />
          <Typography variant="h6" component="span">
            ไม่มีสิทธิ์แก้ไข
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>ไม่สามารถแก้ไขใบเสนอราคาได้</AlertTitle>
          {message || "คุณไม่มีสิทธิ์ในการแก้ไขใบเสนอราคานี้"}
        </Alert>

        {quotationNumber && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              เลขที่ใบเสนอราคา
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {quotationNumber}
            </Typography>
          </Box>
        )}

        {invoices.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ใบแจ้งหนี้ที่เชื่อมโยง ({invoices.length} ใบ)
            </Typography>
            <List
              sx={{
                bgcolor: "background.paper",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
              }}
            >
              {invoices.map((invoice, index) => (
                <React.Fragment key={invoice.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <InvoiceIcon color="primary" fontSize="small" />
                    <ListItemText
                      primary={invoice.number}
                      secondary={
                        <Chip
                          label={statusLabels[invoice.status] || invoice.status}
                          color={statusColors[invoice.status] || "default"}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      }
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<OpenInNewIcon />}
                      onClick={() => handleViewInvoice(invoice.id)}
                    >
                      ดูรายละเอียด
                    </Button>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>คำแนะนำ:</strong>{" "}
            {userRole === "sale" ? (
              <>
                ใบเสนอราคานี้ได้ถูกสร้างใบแจ้งหนี้แล้ว หากต้องการแก้ไขข้อมูล
                กรุณาติดต่อฝ่ายบัญชีเพื่อดำเนินการ
              </>
            ) : (
              <>กรุณาตรวจสอบสิทธิ์การใช้งานของคุณ หรือติดต่อผู้ดูแลระบบ</>
            )}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          เข้าใจแล้ว
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionErrorDialog;
