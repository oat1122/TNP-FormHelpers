import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Grid,
} from "@mui/material";
import { MdWarning } from "react-icons/md";

// Theme constants
import { FORM_THEME } from "./ui/FormFields";
const PRIMARY_RED = FORM_THEME.PRIMARY_RED;

/**
 * DuplicatePhoneDialog - Dialog แจ้งเตือนเมื่อพบเบอร์โทรซ้ำ
 */
const DuplicatePhoneDialog = ({ open, onClose, duplicateData }) => {
  if (!duplicateData) return null;

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "#ff9800",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <MdWarning size={24} />
        <Typography variant="h6" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
          พบเบอร์โทรนี้ในระบบแล้ว
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="warning" sx={{ mb: 3, fontFamily: "Kanit" }}>
          เบอร์โทรนี้มีอยู่ในระบบแล้ว อาจเป็นลูกค้าคนเดียวกัน
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
              ชื่อลูกค้า
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
              {duplicateData.cus_name || "-"}
            </Typography>
          </Grid>

          {duplicateData.cus_company && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
                บริษัท
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: "Kanit" }}>
                {duplicateData.cus_company}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
              เบอร์โทร
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: "Kanit" }}>
              {duplicateData.cus_tel_1 || "-"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
              ผู้ดูแลลูกค้า
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontFamily: "Kanit", color: PRIMARY_RED, fontWeight: 500 }}
            >
              {duplicateData.sales_fullname || duplicateData.sales_name || "ไม่มีผู้ดูแล"}
            </Typography>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: "#f5f5f5",
            borderRadius: 1,
            borderLeft: `4px solid ${PRIMARY_RED}`,
          }}
        >
          <Typography variant="body2" sx={{ fontFamily: "Kanit", color: "text.secondary" }}>
            <strong>คำแนะนำ:</strong> หากเป็นลูกค้าคนเดียวกัน ควรติดต่อ{" "}
            <strong style={{ color: PRIMARY_RED }}>{duplicateData.sales_name || "ผู้ดูแล"}</strong>{" "}
            ก่อนดำเนินการ
            <br />
            <br />
            หากยืนยันว่าเป็นคนละคน สามารถกด "รับทราบ" และบันทึกต่อได้
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="contained"
          onClick={onClose}
          fullWidth
          size="large"
          sx={{
            fontFamily: "Kanit",
            fontWeight: 600,
            bgcolor: PRIMARY_RED,
            "&:hover": { bgcolor: "#d32f2f" },
          }}
        >
          รับทราบ (ดำเนินการต่อ)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DuplicatePhoneDialog;
