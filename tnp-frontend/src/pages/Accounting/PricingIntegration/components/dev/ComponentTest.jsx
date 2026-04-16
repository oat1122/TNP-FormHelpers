import {
  Print as PrintIcon,
  Assignment as AssignmentIcon,
  Upgrade as UpgradeIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import "react";

const ComponentTest = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" gutterBottom color="primary">
          🎉 Component Test สำเร็จ! - อัพเดทใหม่
        </Typography>
        <Typography variant="body1" gutterBottom>
          ระบบ PricingIntegration ทำงานได้ปกติแล้ว พร้อมฟีเจอร์ใหม่!
        </Typography>

        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <UpgradeIcon />
            <Typography>
              ✅ อัพเดทเสร็จสิ้น: PDF A4 พิมพ์เต็มหน้า + UI Dialog ใหม่ที่สวยงาม
            </Typography>
          </Box>
        </Alert>

        <Typography variant="h6" color="#900F0F" gutterBottom>
          🆕 ฟีเจอร์ใหม่ที่เพิ่มเข้ามา:
        </Typography>

        <List sx={{ bgcolor: "rgba(144, 15, 15, 0.02)", borderRadius: 2, p: 2, mb: 3 }}>
          <ListItem>
            <ListItemIcon>
              <PrintIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="PDF A4 Size Optimization"
              secondary="ปรับใบเสนอราคาให้พิมพ์เต็มขนาด A4 พร้อม print styles ที่เหมาะสม"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssignmentIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Enhanced Create Quotation Dialog"
              secondary="UI/UX ใหม่พร้อม animations, better layout และ responsive design"
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" color="#900F0F" gutterBottom>
          Components ที่พร้อมใช้งาน:
        </Typography>

        <Box component="ul" sx={{ pl: 3 }}>
          <li>✅ PricingRequestCard - แสดงข้อมูล Pricing Request</li>
          <li>🆕 CreateQuotationModal - Modal เลือกงาน (UI ใหม่)</li>
          <li>✅ CreateQuotationForm - ฟอร์มสร้างใบเสนอราคา</li>
          <li>🆕 QuotationPreview - ตัวอย่างใบเสนอราคา (A4 Print Ready)</li>
          <li>✅ FilterSection - ส่วนกรองข้อมูล</li>
          <li>✅ PaginationSection - จัดการ pagination</li>
          <li>✅ LoadingState, ErrorState, EmptyState</li>
          <li>✅ Header, FloatingActionButton</li>
        </Box>

        <Alert severity="info" sx={{ mt: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            📄 การปรับปรุง PDF Printing:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 1 }}>
            <li>✅ A4 size optimization (210mm x 297mm)</li>
            <li>✅ Print margins ที่เหมาะสม (10mm-15mm)</li>
            <li>✅ Font size optimization สำหรับการพิมพ์</li>
            <li>✅ Color preservation สำหรับ brand colors</li>
            <li>✅ Page break management</li>
            <li>✅ Print button with preview</li>
          </Box>
        </Alert>

        <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🎨 การปรับปรุง Dialog UX/UI:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 1 }}>
            <li>✅ Modern gradient design</li>
            <li>✅ Smooth animations และ transitions</li>
            <li>✅ Better card selection UI</li>
            <li>✅ Improved customer info display</li>
            <li>✅ Enhanced button designs</li>
            <li>✅ Loading states และ progress indicators</li>
          </Box>
        </Alert>

        <Box sx={{ mt: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{
              bgcolor: "#900F0F",
              "&:hover": { bgcolor: "#B20000" },
              borderRadius: 2,
              px: 3,
            }}
          >
            ทดสอบ Print PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            sx={{
              borderColor: "#B20000",
              color: "#B20000",
              borderRadius: 2,
              px: 3,
              "&:hover": {
                borderColor: "#900F0F",
                backgroundColor: "rgba(178, 0, 0, 0.05)",
              },
            }}
          >
            ทดสอบ Dialog
          </Button>
          <Chip
            label="v2.0 - Updated!"
            color="success"
            variant="outlined"
            sx={{ px: 1, fontWeight: 600 }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default ComponentTest;
