import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from 'react-hot-toast';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid2 as Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Chip,
  Autocomplete,
  Paper,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";

// Icons
import { MdSave, MdCancel, MdCalculate, MdSearch } from "react-icons/md";
import { FaFileUpload } from "react-icons/fa";

// API and State
import {
  useMaxSupplyDetail,
  useCreateMaxSupply,
  useUpdateMaxSupply,
} from "../../features/MaxSupply/maxSupplyApi";
import { useWorksheetList } from "../../features/Worksheet/worksheetApi";
import { useMaxSupplyStore } from "../../features/MaxSupply/maxSupplySlice";
import {
  calculatePrintPointsFromWorksheet,
  generateProductionCode,
  getStatusConfig,
  getPriorityConfig,
} from "../../features/MaxSupply/maxSupplyUtils";

// Components
import TitleBar from "../../components/TitleBar";
import FileUpload from "./components/FileUpload";

// Utils
import {
  open_dialog_ok_timer,
  open_dialog_error,
  open_dialog_loading,
  dismiss_loading_toast,
} from "../../utils/import_lib";

// Validation schema
const maxSupplySchema = z.object({
  worksheet_id: z.string().optional(),
  production_code: z.string().min(1, "รหัสการผลิตจำเป็น"),
  customer_name: z.string().min(1, "ชื่อลูกค้าจำเป็น"),
  product_name: z.string().min(1, "ชื่อสินค้าจำเป็น"),
  quantity: z.number().min(1, "จำนวนต้องมากกว่า 0"),
  print_points: z.number().min(0, "จุดพิมพ์ต้องไม่น้อยกว่า 0"),
  start_date: z.any().refine((val) => moment.isMoment(val) && val.isValid(), {
    message: "วันที่เริ่มต้นจำเป็น",
  }),
  end_date: z.any().refine((val) => moment.isMoment(val) && val.isValid(), {
    message: "วันที่สิ้นสุดจำเป็น",
  }),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  notes: z.string().optional(),
}).refine((data) => {
  return data.end_date.isAfter(data.start_date);
}, {
  message: "วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น",
  path: ["end_date"],
});

function MaxSupplyForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [worksheetSearchTerm, setWorksheetSearchTerm] = useState("");

  // Zustand store
  const {
    statusList,
    priorityList,
    formData,
    setFormData,
    resetFormData,
    setMode,
    calculatePrintPoints,
  } = useMaxSupplyStore();

  // API hooks - Tanstack Query
  const { data: worksheetData } = useWorksheetList({
    search: worksheetSearchTerm,
    per_page: 50,
  });

  const { data: maxSupplyData, isLoading: isLoadingMaxSupply } = useMaxSupplyDetail(
    mode !== "create" && id ? id : null
  );

  const createMaxSupplyMutation = useCreateMaxSupply();
  const updateMaxSupplyMutation = useUpdateMaxSupply();

  const isAdding = createMaxSupplyMutation.isPending;
  const isUpdating = updateMaxSupplyMutation.isPending;

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(maxSupplySchema),
    defaultValues: {
      worksheet_id: "",
      production_code: mode === "create" ? generateProductionCode() : "",
      customer_name: "",
      product_name: "",
      quantity: 0,
      print_points: 0,
      start_date: moment(),
      end_date: moment().add(7, 'days'),
      status: "pending",
      priority: "medium",
      notes: "",
    },
    mode: "onChange",
  });

  // Watch form values for calculations
  const watchedValues = watch();

  // Set mode on mount
  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  // Load data for edit/view mode
  useEffect(() => {
    if ((mode === "edit" || mode === "view") && maxSupplyData?.success) {
      const data = maxSupplyData.data;
      reset({
        worksheet_id: data.worksheet_id || "",
        production_code: data.production_code,
        customer_name: data.customer_name,
        product_name: data.product_name,
        quantity: data.quantity,
        print_points: data.print_points,
        start_date: moment(data.start_date),
        end_date: moment(data.end_date),
        status: data.status,
        priority: data.priority,
        notes: data.notes || "",
      });
    }
  }, [maxSupplyData, mode, reset]);

  // Handle worksheet selection
  const handleWorksheetSelect = (worksheet) => {
    if (!worksheet) return;

    setSelectedWorksheet(worksheet);
    
    // Auto-fill form with worksheet data
    setValue("worksheet_id", worksheet.worksheet_id);
    setValue("customer_name", worksheet.customer_name || "");
    setValue("product_name", worksheet.product_name || "");
    setValue("quantity", worksheet.total_quantity || 0);
    
    // Calculate print points
    const printPoints = calculatePrintPointsFromWorksheet(worksheet);
    setValue("print_points", printPoints);

    // Set default dates based on due date
    if (worksheet.due_date) {
      const dueDate = moment(worksheet.due_date);
      const startDate = dueDate.clone().subtract(7, 'days');
      setValue("start_date", startDate);
      setValue("end_date", dueDate);
    }

    setActiveStep(1); // Move to next step
  };

  // Manual calculation trigger
  const handleCalculatePrintPoints = () => {
    const currentValues = getValues();
    const calculatedPoints = currentValues.quantity * 0.1; // Simple calculation
    setValue("print_points", Math.round(calculatedPoints * 100) / 100);
  };

  // Form submission
  const onSubmit = async (data) => {
    try {
      const submitData = {
        ...data,
        start_date: data.start_date.format('YYYY-MM-DD'),
        end_date: data.end_date.format('YYYY-MM-DD'),
        created_by: JSON.parse(localStorage.getItem("userData"))?.user_uuid,
      };

      if (mode === "create") {
        await createMaxSupplyMutation.mutateAsync(submitData);
        toast.success("สร้างงานผลิตเรียบร้อยแล้ว");
      } else if (mode === "edit") {
        await updateMaxSupplyMutation.mutateAsync({ id, ...submitData });
        toast.success("อัปเดตข้อมูลเรียบร้อยแล้ว");
      }

      navigate("/max-supply");
    } catch (error) {
      toast.error(error?.message || "ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  const handleCancel = () => {
    navigate("/max-supply");
  };

  // Steps for create mode
  const steps = [
    {
      label: "เลือกใบงาน",
      description: "ค้นหาและเลือกใบงานที่ต้องการสร้างงานผลิต",
    },
    {
      label: "กรอกข้อมูล",
      description: "กรอกรายละเอียดการผลิตและคำนวณจุดพิมพ์",
    },
    {
      label: "แนบไฟล์",
      description: "แนบไฟล์เอกสารหรือรูปภาพประกอบ (ถ้ามี)",
    },
  ];

  // Loading state
  if (isLoadingMaxSupply) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress color="error" size={60} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box>
        <TitleBar 
          title={
            mode === "create" ? "สร้างงานผลิตใหม่" :
            mode === "edit" ? "แก้ไขงานผลิต" :
            "ดูรายละเอียดงานผลิต"
          } 
        />
        
        <Box sx={{ p: 3 }}>
          {mode === "create" && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel>{step.label}</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {step.description}
                      </Typography>
                      
                      {index === 0 && (
                        <Box>
                          <Autocomplete
                            options={worksheetData?.data || []}
                            getOptionLabel={(option) => 
                              `${option.work_id} - ${option.work_name} (${option.customer_name})`
                            }
                            onInputChange={(event, newInputValue) => {
                              setWorksheetSearchTerm(newInputValue);
                            }}
                            onChange={(event, newValue) => {
                              handleWorksheetSelect(newValue);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="ค้นหาใบงาน"
                                placeholder="พิมพ์รหัสงาน หรือชื่อลูกค้า..."
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: <MdSearch />,
                                }}
                              />
                            )}
                            renderOption={(props, option) => (
                              <Box component="li" {...props}>
                                <Box>
                                  <Typography variant="subtitle2">
                                    {option.work_id} - {option.work_name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    ลูกค้า: {option.customer_name} | จำนวน: {option.total_quantity}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    กำหนดส่ง: {moment(option.due_date).format('DD/MM/YYYY')}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            sx={{ mb: 2 }}
                          />
                          
                          <Button
                            variant="outlined"
                            onClick={() => setActiveStep(1)}
                            disabled={!selectedWorksheet}
                          >
                            ข้ามขั้นตอนนี้
                          </Button>
                        </Box>
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid xs={12}>
                <Card>
                  <CardHeader 
                    title="ข้อมูลพื้นฐาน"
                    sx={{ 
                      backgroundColor: 'error.main',
                      color: 'error.contrastText',
                    }}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid xs={12} md={6}>
                        <Controller
                          name="production_code"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="รหัสการผลิต"
                              fullWidth
                              disabled={mode === "view"}
                              error={!!errors.production_code}
                              helperText={errors.production_code?.message}
                              InputProps={{
                                readOnly: mode === "edit", // Don't allow editing production code
                              }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid xs={12} md={6}>
                        <Controller
                          name="customer_name"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="ชื่อลูกค้า"
                              fullWidth
                              disabled={mode === "view"}
                              error={!!errors.customer_name}
                              helperText={errors.customer_name?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid xs={12} md={6}>
                        <Controller
                          name="product_name"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="ชื่อสินค้า"
                              fullWidth
                              disabled={mode === "view"}
                              error={!!errors.product_name}
                              helperText={errors.product_name?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid xs={12} md={6}>
                        <Controller
                          name="quantity"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="จำนวน"
                              type="number"
                              fullWidth
                              disabled={mode === "view"}
                              error={!!errors.quantity}
                              helperText={errors.quantity?.message}
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 0);
                              }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                          <Controller
                            name="print_points"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="จุดพิมพ์"
                                type="number"
                                fullWidth
                                disabled={mode === "view"}
                                error={!!errors.print_points}
                                helperText={errors.print_points?.message}
                                onChange={(e) => {
                                  field.onChange(parseFloat(e.target.value) || 0);
                                }}
                                InputProps={{
                                  inputProps: { step: 0.01 }
                                }}
                              />
                            )}
                          />
                          {mode !== "view" && (
                            <Button
                              variant="outlined"
                              onClick={handleCalculatePrintPoints}
                              startIcon={<MdCalculate />}
                              sx={{ mb: errors.print_points ? 2.5 : 0 }}
                            >
                              คำนวณ
                            </Button>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Date and Status Information */}
              <Grid xs={12}>
                <Card>
                  <CardHeader 
                    title="วันที่และสถานะ"
                    sx={{ 
                      backgroundColor: 'error.main',
                      color: 'error.contrastText',
                    }}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid xs={12} md={6}>
                        <Controller
                          name="start_date"
                          control={control}
                          render={({ field: { value, onChange, ...field } }) => (
                            <DatePicker
                              {...field}
                              value={value}
                              onChange={(newValue) => {
                                onChange(newValue);
                              }}
                              label="วันที่เริ่มต้น"
                              disabled={mode === "view"}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.start_date,
                                  helperText: errors.start_date?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid xs={12} md={6}>
                        <Controller
                          name="end_date"
                          control={control}
                          render={({ field: { value, onChange, ...field } }) => (
                            <DatePicker
                              {...field}
                              value={value}
                              onChange={(newValue) => {
                                onChange(newValue);
                              }}
                              label="วันที่สิ้นสุด"
                              disabled={mode === "view"}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.end_date,
                                  helperText: errors.end_date?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid xs={12} md={6}>
                        <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.status}>
                              <InputLabel>สถานะ</InputLabel>
                              <Select
                                {...field}
                                label="สถานะ"
                                disabled={mode === "view"}
                              >
                                {statusList.map((status) => (
                                  <MenuItem key={status.value} value={status.value}>
                                    <Chip
                                      label={status.label}
                                      size="small"
                                      color={status.color}
                                      sx={{ mr: 1 }}
                                    />
                                    {status.label}
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.status && (
                                <FormHelperText>{errors.status.message}</FormHelperText>
                              )}
                            </FormControl>
                          )}
                        />
                      </Grid>

                      <Grid xs={12} md={6}>
                        <Controller
                          name="priority"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.priority}>
                              <InputLabel>ความสำคัญ</InputLabel>
                              <Select
                                {...field}
                                label="ความสำคัญ"
                                disabled={mode === "view"}
                              >
                                {priorityList.map((priority) => (
                                  <MenuItem key={priority.value} value={priority.value}>
                                    <Chip
                                      label={priority.label}
                                      size="small"
                                      color={priority.color}
                                      sx={{ mr: 1 }}
                                    />
                                    {priority.label}
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.priority && (
                                <FormHelperText>{errors.priority.message}</FormHelperText>
                              )}
                            </FormControl>
                          )}
                        />
                      </Grid>

                      <Grid xs={12}>
                        <Controller
                          name="notes"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="หมายเหตุ"
                              multiline
                              rows={3}
                              fullWidth
                              disabled={mode === "view"}
                              error={!!errors.notes}
                              helperText={errors.notes?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* File Upload Section */}
              {(mode === "create" || mode === "edit") && (
                <Grid xs={12}>
                  <Card>
                    <CardHeader 
                      title="แนบไฟล์"
                      sx={{ 
                        backgroundColor: 'error.main',
                        color: 'error.contrastText',
                      }}
                    />
                    <CardContent>
                      <FileUpload maxSupplyId={id} />
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Action Buttons */}
              {mode !== "view" && (
                <Grid xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      startIcon={<MdCancel />}
                      size="large"
                    >
                      ยกเลิก
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="contained"
                      color="error"
                      startIcon={<MdSave />}
                      size="large"
                      disabled={!isValid || isAdding || isUpdating}
                    >
                      {isAdding || isUpdating ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        mode === "create" ? "สร้างงานผลิต" : "บันทึกการแก้ไข"
                      )}
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </form>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}

export default MaxSupplyForm;
