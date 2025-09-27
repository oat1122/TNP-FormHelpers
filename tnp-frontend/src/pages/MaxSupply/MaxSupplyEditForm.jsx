import React, { useState, useEffect } from "react";
import "./MaxSupplyEditForm.css";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Print as PrintIcon,
  Notes as NotesIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/th";
import toast from "react-hot-toast";
import { useGetWorksheetQuery } from "../../features/Worksheet/worksheetApi";

const MaxSupplyEditForm = ({ open, onClose, item, onSave, loading = false }) => {
  console.log("🔧 MaxSupplyEditForm props:", { open, item, loading });
  const [formData, setFormData] = useState({
    title: "",
    customer_name: "",
    start_date: null,
    expected_completion_date: null,
    production_type: "",
    shirt_type: "",
    notes: "",
    special_instructions: "",
    priority: "",
  });

  const [errors, setErrors] = useState({});

  // Fetch worksheet data if available
  const { data: worksheetData } = useGetWorksheetQuery(item?.worksheet_id, {
    skip: !item?.worksheet_id,
  });

  // ประเภทการพิมพ์
  const productionTypes = [
    { value: "screen", label: "Screen Printing", icon: "🖨️" },
    { value: "dtf", label: "DTF (Direct to Film)", icon: "📄" },
    { value: "sublimation", label: "Sublimation", icon: "🌈" },
    { value: "embroidery", label: "Embroidery", icon: "🧵" },
  ];

  // ประเภทเสื้อ
  const shirtTypes = [
    { value: "t-shirt", label: "เสื้อยืด (T-Shirt)" },
    { value: "polo", label: "เสื้อโปโล (Polo Shirt)" },
    { value: "tank-top", label: "เสื้อกล้าม (Tank Top)" },
    { value: "hoodie", label: "เสื้อฮู้ด (Hoodie)" },
    { value: "long-sleeve", label: "เสื้อแขนยาว (Long Sleeve)" },
  ];

  // ระดับความสำคัญ
  const priorities = [
    { value: "low", label: "ต่ำ", color: "#10b981" },
    { value: "normal", label: "ปกติ", color: "#3b82f6" },
    { value: "high", label: "สูง", color: "#f59e0b" },
    { value: "urgent", label: "ด่วน", color: "#ef4444" },
  ];

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || "",
        customer_name: item.customer_name || "",
        start_date: item.start_date ? dayjs(item.start_date) : null,
        expected_completion_date: item.expected_completion_date
          ? dayjs(item.expected_completion_date)
          : null,
        production_type: item.production_type || "",
        shirt_type: item.shirt_type || "",
        notes: item.notes || "",
        special_instructions: item.special_instructions || "",
        priority: item.priority || "normal",
      });
      setErrors({});
    }
  }, [item]);

  // Update customer_name from worksheet data when available
  useEffect(() => {
    if (worksheetData?.data?.customer_name) {
      setFormData((prev) => ({
        ...prev,
        customer_name: worksheetData.data.customer_name,
      }));
    }
  }, [worksheetData]);

  // Fallback function to ensure customer_name is available
  const getCustomerName = () => {
    if (formData.customer_name?.trim()) {
      return formData.customer_name;
    }
    if (worksheetData?.data?.customer_name?.trim()) {
      return worksheetData.data.customer_name;
    }
    if (item?.customer_name?.trim()) {
      return item.customer_name;
    }
    return "";
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "กรุณากรอกชื่องาน";
    }

    const customerName = getCustomerName();
    if (!customerName.trim()) {
      newErrors.customer_name = "กรุณากรอกชื่อลูกค้า";
    }

    if (!formData.start_date) {
      newErrors.start_date = "กรุณาเลือกวันที่เริ่มงาน";
    }

    if (!formData.expected_completion_date) {
      newErrors.expected_completion_date = "กรุณาเลือกวันที่คาดว่าจะเสร็จ";
    }

    if (formData.start_date && formData.expected_completion_date) {
      if (formData.expected_completion_date.isBefore(formData.start_date)) {
        newErrors.expected_completion_date = "วันที่คาดว่าจะเสร็จต้องมาหลังวันที่เริ่มงาน";
      }
    }

    if (!formData.production_type) {
      newErrors.production_type = "กรุณาเลือกประเภทการพิมพ์";
    }

    if (!formData.shirt_type) {
      newErrors.shirt_type = "กรุณาเลือกประเภทเสื้อ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      // Only send fields that the backend expects and format them properly
      const updatedData = {};

      // Add fields only if they have values
      if (formData.title && formData.title.trim()) {
        updatedData.title = formData.title.trim();
      }

      // Always send customer_name using fallback
      const customerName = getCustomerName();
      if (customerName && customerName.trim()) {
        updatedData.customer_name = customerName.trim();
      }

      if (formData.production_type) {
        updatedData.production_type = formData.production_type;
      }

      if (formData.start_date) {
        updatedData.start_date = formData.start_date.format("YYYY-MM-DD");
      }

      if (formData.expected_completion_date) {
        updatedData.expected_completion_date =
          formData.expected_completion_date.format("YYYY-MM-DD");
      }

      if (formData.priority) {
        updatedData.priority = formData.priority;
      }

      if (formData.shirt_type) {
        updatedData.shirt_type = formData.shirt_type;
      }

      if (formData.notes) {
        updatedData.notes = formData.notes.trim();
      }

      if (formData.special_instructions) {
        updatedData.special_instructions = formData.special_instructions.trim();
      }

      console.log("Sending update data:", updatedData);
      await onSave(updatedData);
      toast.success("แก้ไขข้อมูลสำเร็จ");
      onClose();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
  };

  // Handle form reset
  const handleReset = () => {
    if (item) {
      const resetCustomerName = item.customer_name || worksheetData?.data?.customer_name || "";

      setFormData({
        title: item.title || "",
        customer_name: resetCustomerName,
        start_date: item.start_date ? dayjs(item.start_date) : null,
        expected_completion_date: item.expected_completion_date
          ? dayjs(item.expected_completion_date)
          : null,
        production_type: item.production_type || "",
        shirt_type: item.shirt_type || "",
        notes: item.notes || "",
        special_instructions: item.special_instructions || "",
        priority: item.priority || "normal",
      });
      setErrors({});
    }
  };

  if (!item) {
    console.log("🔧 MaxSupplyEditForm: No item provided, returning null");
    return null;
  }

  console.log("🔧 MaxSupplyEditForm: Rendering dialog with open =", open);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        className="edit-form-dialog"
        PaperProps={{
          sx: { borderRadius: 2 },
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
            <EditIcon color="primary" />
            <Typography variant="h6">แก้ไขข้อมูลงาน</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* ข้อมูลพื้นฐาน */}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "primary.main",
                  borderBottom: 1,
                  borderColor: "divider",
                  pb: 1,
                }}
              >
                <AssignmentIcon /> ข้อมูลพื้นฐาน
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ชื่องาน"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                error={!!errors.title}
                helperText={errors.title}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ชื่อลูกค้า"
                value={getCustomerName()}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer_name: e.target.value,
                  }))
                }
                error={!!errors.customer_name}
                helperText={
                  errors.customer_name || "สามารถแก้ไขได้อย่างอิสระ หากไม่มีข้อมูลจาก worksheet"
                }
                required
                placeholder="กรอกชื่อลูกค้า"
              />
            </Grid>

            {/* กำหนดเวลา */}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "primary.main",
                  borderBottom: 1,
                  borderColor: "divider",
                  pb: 1,
                  mt: 2,
                }}
              >
                <ScheduleIcon /> กำหนดเวลา
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="วันที่เริ่มงาน"
                value={formData.start_date}
                onChange={(date) => setFormData((prev) => ({ ...prev, start_date: date }))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.start_date,
                    helperText: errors.start_date,
                    required: true,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="วันที่คาดว่าจะเสร็จ"
                value={formData.expected_completion_date}
                onChange={(date) =>
                  setFormData((prev) => ({
                    ...prev,
                    expected_completion_date: date,
                  }))
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.expected_completion_date,
                    helperText: errors.expected_completion_date,
                    required: true,
                  },
                }}
              />
            </Grid>

            {/* ประเภทการพิมพ์ */}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "primary.main",
                  borderBottom: 1,
                  borderColor: "divider",
                  pb: 1,
                  mt: 2,
                }}
              >
                <PrintIcon /> ประเภทการพิมพ์
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.production_type} required>
                <InputLabel>ประเภทการพิมพ์</InputLabel>
                <Select
                  value={formData.production_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      production_type: e.target.value,
                    }))
                  }
                  label="ประเภทการพิมพ์"
                >
                  {productionTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <span>{type.icon}</span>
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.production_type && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.production_type}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.shirt_type} required>
                <InputLabel>ประเภทเสื้อ</InputLabel>
                <Select
                  value={formData.shirt_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shirt_type: e.target.value,
                    }))
                  }
                  label="ประเภทเสื้อ"
                >
                  {shirtTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.shirt_type && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.shirt_type}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* ระดับความสำคัญ */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>ระดับความสำคัญ</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  label="ระดับความสำคัญ"
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: priority.color,
                          }}
                        />
                        {priority.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* หมายเหตุและข้อมูลเพิ่มเติม */}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "primary.main",
                  borderBottom: 1,
                  borderColor: "divider",
                  pb: 1,
                  mt: 2,
                }}
              >
                <NotesIcon /> หมายเหตุและข้อมูลเพิ่มเติม
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="คำแนะนำพิเศษ"
                multiline
                rows={3}
                value={formData.special_instructions}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    special_instructions: e.target.value,
                  }))
                }
                placeholder="ระบุคำแนะนำพิเศษสำหรับการผลิต เช่น สี, ขนาด, ตำแหน่งการพิมพ์..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="หมายเหตุเพิ่มเติม"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="หมายเหตุเพิ่มเติมสำหรับงานนี้..."
              />
            </Grid>

            {/* Preview Section */}
            <Grid item xs={12}>
              {item?.worksheet_id && (
                <Alert severity={worksheetData ? "success" : "info"} sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {worksheetData
                      ? `✅ ข้อมูลลูกค้าได้รับการอัปเดตจาก Worksheet ID: ${item.worksheet_id}`
                      : `🔄 กำลังโหลดข้อมูลลูกค้าจาก Worksheet ID: ${item.worksheet_id}...`}
                  </Typography>
                </Alert>
              )}

              <Alert severity="info">
                <Typography variant="body2">
                  <strong>หมายเหตุ:</strong> คุณสามารถแก้ไขได้เฉพาะข้อมูลที่แสดงในฟอร์มนี้เท่านั้น
                  ข้อมูลอื่นๆ เช่น จำนวนสินค้า, การคำนวณงาน, และสถานะจะไม่สามารถแก้ไขได้
                  <br />
                  <strong>ชื่อลูกค้า:</strong> สามารถแก้ไขได้อย่างอิสระ ระบบจะอัปเดตจาก Worksheet
                  หากมีข้อมูล
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleReset}
            startIcon={<CancelIcon />}
            variant="outlined"
            color="warning"
          >
            รีเซ็ต
          </Button>
          <Button onClick={onClose} variant="outlined" color="inherit">
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            startIcon={<SaveIcon />}
            variant="contained"
            disabled={loading}
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default MaxSupplyEditForm;
