import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  Stack,
  InputAdornment,
  Slide,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import "moment/locale/th"; // Thai locale

// Icons
import { 
  MdSave, 
  MdCancel, 
  MdCalculate, 
  MdSearch,
  MdAutoAwesome,
  MdCalendarToday,
  MdUploadFile,
  MdInfo,
  MdWarning,
  MdCheckCircle,
  MdArrowForward,
  MdSkipNext,
  MdRefresh,
  MdBusinessCenter,
  MdInventory,
  MdNumbers
} from "react-icons/md";
import { FaFileUpload, FaCheck } from "react-icons/fa";

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

// Set moment locale to Thai
moment.locale('th');

// Validation schema
const maxSupplySchema = z.object({
  worksheet_id: z.string().optional(),
  production_code: z.string().min(1, "รหัสการผลิตจำเป็น"),
  customer_name: z.string().min(1, "ชื่อลูกค้าจำเป็น"),
  product_name: z.string().min(1, "ชื่อสินค้าจำเป็น"),
  quantity: z.number().min(1, "จำนวนต้องมากกว่า 0"),
  print_points: z.number().min(1, "จุดพิมพ์ต้องเป็นจำนวนเต็มมากกว่า 0").int("จุดพิมพ์ต้องเป็นจำนวนเต็ม"),
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
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [activeStep, setActiveStep] = useState(0);
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [worksheetSearchTerm, setWorksheetSearchTerm] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());

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
  const { data: worksheetData, isLoading: isLoadingWorksheet } = useWorksheetList({
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
      print_points: 1,
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
  const watchQuantity = watch("quantity");
  const watchPrintPoints = watch("print_points");

  // Set mode on mount
  useEffect(() => {
    setMode(mode);
    
    // Handle URL params for pre-filling dates
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    if (startDate) {
      setValue("start_date", moment(startDate));
    }
    if (endDate) {
      setValue("end_date", moment(endDate));
    }
  }, [mode, setMode, searchParams, setValue]);

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

  // Handle worksheet selection with auto-fill
  const handleWorksheetSelect = (worksheet) => {
    if (!worksheet) return;

    setSelectedWorksheet(worksheet);
    
    // Auto-fill form with worksheet data
    setValue("worksheet_id", worksheet.worksheet_id);
    setValue(
      "customer_name",
      worksheet.customer_name || worksheet.cus_name || ""
    );
    setValue(
      "product_name",
      worksheet.product_name || worksheet.work_name || ""
    );
    setValue(
      "quantity",
      worksheet.total_quantity || worksheet.quantity || 0
    );
    
    // Calculate print points - จำนวนเต็ม
    const printPoints = Math.max(1, Math.ceil(calculatePrintPointsFromWorksheet(worksheet)));
    setValue("print_points", printPoints);

    // Set default dates based on due date
    const startDate = moment(); // วันนี้
    setValue("start_date", startDate);
    
    if (worksheet.due_date) {
      const dueDate = moment(worksheet.due_date);
      setValue("end_date", dueDate);
    }

    // Mark step as completed and move to next
    setCompletedSteps(prev => new Set([...prev, 0]));
    toast.success(`📋 กรอกข้อมูลจากใบงาน "${worksheet.work_id}" เรียบร้อยแล้ว`);
    
    setTimeout(() => {
      setActiveStep(1);
    }, 500);
  };

  // Manual calculation trigger - คำนวณเป็น จำนวน * จุดพิมพ์
  const handleCalculatePrintPoints = async () => {
    setIsCalculating(true);
    
    // Simulate calculation with loading
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const currentValues = getValues();
    const quantity = currentValues.quantity || 0;
    const printPointsPerUnit = currentValues.print_points || 1;
    
    // คำนวณ: จำนวน * จุดพิมพ์ต่อชิ้น
    const totalPrintPoints = quantity * printPointsPerUnit;
    
    // แสดงผลลัพธ์
    toast.success(`ผลการคำนวณ: ${quantity} x ${printPointsPerUnit} = ${totalPrintPoints.toLocaleString()} จุดพิมพ์รวม`);
    
    setIsCalculating(false);
  };

  // Form submission
  const onSubmit = async (data) => {
    try {
      const submitData = {
        ...data,
        start_date: data.start_date.format('YYYY-MM-DD'),
        end_date: data.end_date.format('YYYY-MM-DD'),
        created_by: JSON.parse(localStorage.getItem("userData") || '{}')?.user_uuid,
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

  const handleStepComplete = (stepIndex) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
    if (stepIndex < steps.length - 1) {
      setActiveStep(stepIndex + 1);
    }
  };

  const handleStepSkip = () => {
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleStepBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleResetWorksheet = () => {
    setSelectedWorksheet(null);
    setValue("worksheet_id", "");
    
    // Clear auto-filled data (but keep manually entered data)
    setValue("customer_name", "");
    setValue("product_name", "");
    setValue("quantity", 0);
    setValue("print_points", 1);
    
    // Reset dates to default
    setValue("start_date", moment());
    setValue("end_date", moment().add(7, 'days'));
    
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(0); // Remove completion status for worksheet step
      return newSet;
    });
    
    setActiveStep(0); // Go back to worksheet selection step
    toast.info("🔄 ยกเลิกการเลือกใบงาน กรุณาเลือกใบงานใหม่หรือกรอกข้อมูลด้วยตนเอง");
  };

  // Steps for create mode
  const steps = [
    {
      label: "เลือกใบงาน",
      description: "ค้นหาและเลือกใบงานที่ต้องการสร้างงานผลิต (ไม่บังคับ)",
      icon: <MdSearch />,
      optional: true,
    },
    {
      label: "ข้อมูลพื้นฐาน",
      description: "กรอกรายละเอียดการผลิตและคำนวณจุดพิมพ์",
      icon: <MdBusinessCenter />,
      required: true,
    },
    {
      label: "วันที่และสถานะ",
      description: "กำหนดระยะเวลาและสถานะการผลิต",
      icon: <MdCalendarToday />,
      required: true,
    },
    {
      label: "แนบไฟล์",
      description: "แนบไฟล์เอกสารหรือรูปภาพประกอบ (ไม่บังคับ)",
      icon: <MdUploadFile />,
      optional: true,
    },
  ];

  // Loading state
  if (isLoadingMaxSupply) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="50vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress color="error" size={60} />
        <Typography variant="body1" color="text.secondary">
          กำลังโหลดข้อมูล...
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box sx={{ backgroundColor: 'grey.50', minHeight: '100vh' }}>
        <TitleBar 
          title={
            mode === "create" ? "สร้างงานผลิตใหม่" :
            mode === "edit" ? "แก้ไขงานผลิต" :
            "ดูรายละเอียดงานผลิต"
          } 
        />
        
        <Box sx={{ 
          p: { xs: 2, md: 3 },
          maxWidth: '1200px',
          mx: 'auto'
        }}>
          {/* Progress Header for Create Mode */}
          {mode === "create" && (
            <Slide direction="down" in timeout={500}>
              <Card 
                sx={{ 
                  mb: 3, 
                  overflow: 'visible',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                    ขั้นตอนการสร้างงานผลิต
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 3 }}>
                    ทำตามขั้นตอนเพื่อสร้างงานผลิตใหม่อย่างง่ายดาย
                  </Typography>
                  
                  <Stepper 
                    activeStep={activeStep} 
                    orientation={isMobile ? "vertical" : "horizontal"}
                    alternativeLabel={!isMobile}
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: 'white !important',
                        fontWeight: 'bold',
                      },
                      '& .MuiStepConnector-line': {
                        borderColor: 'rgba(255,255,255,0.3)',
                      }
                    }}
                  >
                    {steps.map((step, index) => (
                      <Step key={step.label} completed={completedSteps.has(index)}>
                        <StepLabel 
                          StepIconComponent={({ active, completed }) => (
                            <Box
                              sx={{
                                backgroundColor: completed ? '#4caf50' : active ? '#ff9800' : 'rgba(255,255,255,0.3)',
                                borderRadius: '50%',
                                width: 44,
                                height: 44,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                transition: 'all 0.3s ease',
                                border: active ? '3px solid #ff9800' : '2px solid transparent',
                                boxShadow: active ? '0 0 0 4px rgba(255, 152, 0, 0.2)' : 'none',
                              }}
                            >
                              {completed ? <FaCheck size={18} /> : step.icon}
                            </Box>
                          )}
                          optional={step.optional && (
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              ไม่บังคับ
                            </Typography>
                          )}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            {step.label}
                          </Typography>
                          {!isMobile && (
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              {step.description}
                            </Typography>
                          )}
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </CardContent>
              </Card>
            </Slide>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              {/* Step 1: Worksheet Selection (Create Mode Only) */}
              {mode === "create" && activeStep === 0 && (
                <Fade in timeout={300}>
                  <Card sx={{ overflow: 'visible' }}>
                    <CardHeader 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MdSearch size={24} />
                          เลือกใบงาน (ไม่บังคับ)
                        </Box>
                      }
                      subheader="ค้นหาและเลือกใบงานที่ต้องการสร้างงานผลิต จะช่วยกรอกข้อมูลให้อัตโนมัติ"
                      sx={{ 
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '& .MuiCardHeader-subheader': {
                          color: 'primary.contrastText',
                          opacity: 0.8
                        }
                      }}
                    />
                    <CardContent sx={{ p: 3 }}>
                      {/* Info Alert */}
                      <Alert 
                        severity="info" 
                        variant="outlined"
                        sx={{ 
                          mb: 3,
                          borderRadius: 2,
                          '& .MuiAlert-message': {
                            width: '100%'
                          }
                        }}
                      >
                        <Typography variant="body2">
                          <strong>💡 เคล็ดลับ:</strong> การเลือกใบงานจะช่วยเติมข้อมูลพื้นฐาน (ชื่อลูกค้า, สินค้า, จำนวน) ให้อัตโนมัติ และคำนวณจุดพิมพ์ตามข้อมูลใบงาน
                        </Typography>
                      </Alert>

                      <Autocomplete
                        options={worksheetData?.data || []}
                        loading={isLoadingWorksheet}
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
                            placeholder="พิมพ์รหัสงาน ชื่องาน หรือชื่อลูกค้า..."
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MdSearch />
                                </InputAdornment>
                              ),
                            }}
                            fullWidth
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                              }
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <Box component="li" {...props} sx={{ p: 2 }}>
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                {option.work_id} - {option.work_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ลูกค้า: {option.customer_name} | จำนวน: {option.total_quantity?.toLocaleString()} ชิ้น
                              </Typography>
                              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 'bold' }}>
                                กำหนดส่ง: {moment(option.due_date).format('D MMMM YYYY')}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        sx={{ mb: 3 }}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          onClick={handleStepSkip}
                          startIcon={<MdSkipNext />}
                          size="large"
                          sx={{ borderRadius: 2 }}
                        >
                          ข้ามขั้นตอน
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              )}

              {/* Step 2: Basic Information */}
              {(mode !== "create" || activeStep === 1) && (
                <Fade in timeout={500}>
                  <Card sx={{ overflow: 'visible' }}>
                    <CardHeader 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MdBusinessCenter size={24} />
                          ข้อมูลพื้นฐาน
                          {selectedWorksheet && (
                            <Chip 
                              label="ข้อมูลจากใบงาน" 
                              size="small" 
                              color="success" 
                              icon={<MdCheckCircle />}
                            />
                          )}
                        </Box>
                      }
                      subheader={
                        selectedWorksheet ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2">
                              กรอกข้อมูลพื้นฐานของงานผลิต
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: 'secondary.contrastText', 
                              fontWeight: 'bold',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              display: 'inline-block',
                              maxWidth: 'fit-content'
                            }}>
                              📋 ใบงาน: {selectedWorksheet.work_id} - {selectedWorksheet.work_name}
                            </Typography>
                          </Box>
                        ) : "กรอกข้อมูลพื้นฐานของงานผลิต"
                      }
                      sx={{ 
                        backgroundColor: 'secondary.main',
                        color: 'secondary.contrastText',
                        '& .MuiCardHeader-subheader': {
                          color: 'secondary.contrastText',
                          opacity: 0.8
                        }
                      }}
                      action={
                        mode === "create" && (
                          <IconButton 
                            color="inherit" 
                            onClick={() => setValue("production_code", generateProductionCode())}
                            title="สร้างรหัสใหม่"
                          >
                            <MdRefresh />
                          </IconButton>
                        )
                      }
                    />
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={3}>
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
                                  readOnly: mode === "edit",
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <MdNumbers />
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                  }
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
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                  }
                                }}
                              />
                            )}
                          />
                        </Grid>

                        <Grid xs={12}>
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
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                  }
                                }}
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
                                label="จำนวน (ชิ้น)"
                                type="number"
                                fullWidth
                                disabled={mode === "view"}
                                error={!!errors.quantity}
                                helperText={errors.quantity?.message}
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value) || 0);
                                }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <MdInventory />
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                  }
                                }}
                              />
                            )}
                          />
                        </Grid>

                        <Grid xs={12} md={6}>
                          <Controller
                            name="print_points"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="จุดพิมพ์ (ต่อชิ้น)"
                                type="number"
                                fullWidth
                                disabled={mode === "view"}
                                error={!!errors.print_points}
                                helperText={errors.print_points?.message || "กรอกจุดพิมพ์ต่อชิ้น (จำนวนเต็ม)"}
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value) || 1);
                                }}
                                InputProps={{
                                  inputProps: { min: 1, step: 1 },
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <Typography variant="caption" color="text.secondary">
                                        จุด/ชิ้น
                                      </Typography>
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                  }
                                }}
                              />
                            )}
                          />
                        </Grid>

                        {/* Calculation Display */}
                        {watchQuantity > 0 && watchPrintPoints > 0 && (
                          <Grid xs={12}>
                            <Alert 
                              severity="info" 
                              variant="filled"
                              sx={{ 
                                borderRadius: 2,
                                '& .MuiAlert-message': {
                                  width: '100%'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  การคำนวณ: {watchQuantity?.toLocaleString()} × {watchPrintPoints} = {(watchQuantity * watchPrintPoints)?.toLocaleString()} จุดพิมพ์รวม
                                </Typography>
                                
                                {mode !== "view" && (
                                  <Button
                                    variant="contained"
                                    color="warning"
                                    onClick={handleCalculatePrintPoints}
                                    startIcon={isCalculating ? <CircularProgress size={16} color="inherit" /> : <MdCalculate />}
                                    disabled={isCalculating || !watchQuantity || !watchPrintPoints}
                                    size="small"
                                    sx={{ borderRadius: 2 }}
                                  >
                                    {isCalculating ? "กำลังคำนวณ..." : "คำนวณ"}
                                  </Button>
                                )}
                              </Box>
                            </Alert>
                          </Grid>
                        )}

                        {mode === "create" && (
                          <Grid xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                              {/* Back to worksheet button and reset */}
                              <Box sx={{ display: 'flex', gap: 2 }}>
                                {selectedWorksheet && (
                                  <>
                                    <Button
                                      variant="outlined"
                                      onClick={() => setActiveStep(0)}
                                      startIcon={<MdArrowForward style={{ transform: 'rotate(180deg)' }} />}
                                      size="large"
                                      sx={{ borderRadius: 2 }}
                                    >
                                      ย้อนกลับ
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      color="warning"
                                      onClick={handleResetWorksheet}
                                      startIcon={<MdRefresh />}
                                      size="large"
                                      sx={{ borderRadius: 2 }}
                                    >
                                      เปลี่ยนใบงาน
                                    </Button>
                                  </>
                                )}
                              </Box>
                              
                              {/* Continue button */}
                              <Button
                                variant="contained"
                                onClick={() => handleStepComplete(1)}
                                endIcon={<MdArrowForward />}
                                disabled={!watchedValues.customer_name || !watchedValues.product_name || !watchQuantity}
                                size="large"
                                sx={{ borderRadius: 2 }}
                              >
                                ดำเนินการต่อ
                              </Button>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Fade>
              )}

              {/* Step 3: Date and Status Information */}
              {(mode !== "create" || activeStep === 2) && (
                <Fade in timeout={700}>
                  <Card sx={{ overflow: 'visible' }}>
                    <CardHeader 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MdCalendarToday size={24} />
                          วันที่และสถานะ
                        </Box>
                      }
                      subheader="กำหนดระยะเวลาและสถานะการผลิต"
                      sx={{ 
                        backgroundColor: 'warning.main',
                        color: 'warning.contrastText',
                        '& .MuiCardHeader-subheader': {
                          color: 'warning.contrastText',
                          opacity: 0.8
                        }
                      }}
                    />
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={3}>
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
                                format="D MMMM YYYY"
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    error: !!errors.start_date,
                                    helperText: errors.start_date?.message || "ระบุวันที่เริ่มผลิต",
                                    sx: {
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                      }
                                    }
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
                                format="D MMMM YYYY"
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    error: !!errors.end_date,
                                    helperText: errors.end_date?.message || "ระบุวันที่เสร็จสิ้น",
                                    sx: {
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                      }
                                    }
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
                                  sx={{
                                    borderRadius: 2,
                                  }}
                                >
                                  {statusList.map((status) => (
                                    <MenuItem key={status.value} value={status.value}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                          label={status.label}
                                          size="small"
                                          color={status.color}
                                        />
                                      </Box>
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
                                  sx={{
                                    borderRadius: 2,
                                  }}
                                >
                                  {priorityList.map((priority) => (
                                    <MenuItem key={priority.value} value={priority.value}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                          label={priority.label}
                                          size="small"
                                          color={priority.color}
                                        />
                                      </Box>
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
                                rows={4}
                                fullWidth
                                disabled={mode === "view"}
                                error={!!errors.notes}
                                helperText={errors.notes?.message}
                                placeholder="ใส่หมายเหตุเพิ่มเติม เช่น ข้อกำหนดพิเศษ หรือคำแนะนำ..."
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                  }
                                }}
                              />
                            )}
                          />
                        </Grid>

                          {mode === "create" && (
                            <Grid xs={12}>
                              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                  <Button
                                    variant="outlined"
                                    onClick={handleStepBack}
                                    startIcon={<MdArrowForward style={{ transform: 'rotate(180deg)' }} />}
                                    size="large"
                                    sx={{ borderRadius: 2 }}
                                  >
                                    ย้อนกลับ
                                  </Button>
                                  {selectedWorksheet && (
                                    <Button
                                      variant="outlined"
                                      color="warning"
                                      onClick={() => setActiveStep(0)}
                                      startIcon={<MdRefresh />}
                                      size="large"
                                      sx={{ borderRadius: 2 }}
                                    >
                                      เปลี่ยนใบงาน
                                    </Button>
                                  )}
                                </Box>
                                <Button
                                  variant="contained"
                                  onClick={() => handleStepComplete(2)}
                                  endIcon={<MdArrowForward />}
                                  disabled={!watchedValues.start_date || !watchedValues.end_date}
                                  size="large"
                                  sx={{ borderRadius: 2 }}
                                >
                                  ดำเนินการต่อ
                                </Button>
                              </Box>
                            </Grid>
                          )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Fade>
              )}

              {/* Step 4: File Upload Section */}
              {(mode === "create" && activeStep === 3) || mode === "edit" && (
                <Fade in timeout={900}>
                  <Card sx={{ overflow: 'visible' }}>
                    <CardHeader 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MdUploadFile size={24} />
                          แนบไฟล์ (ไม่บังคับ)
                        </Box>
                      }
                      subheader="แนบไฟล์เอกสารหรือรูปภาพประกอบ รองรับการถ่ายรูปและเลือกไฟล์จากเครื่อง"
                      sx={{ 
                        backgroundColor: 'info.main',
                        color: 'info.contrastText',
                        '& .MuiCardHeader-subheader': {
                          color: 'info.contrastText',
                          opacity: 0.8
                        }
                      }}
                    />
                    <CardContent sx={{ p: 3 }}>
                      <FileUpload maxSupplyId={id} />
                      
                      {mode === "create" && (
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 3 }}>
                          <Button
                            variant="outlined"
                            onClick={handleStepBack}
                            startIcon={<MdArrowForward style={{ transform: 'rotate(180deg)' }} />}
                            size="large"
                            sx={{ borderRadius: 2 }}
                          >
                            ย้อนกลับ
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => handleStepComplete(3)}
                            endIcon={<MdCheckCircle />}
                            size="large"
                            sx={{ borderRadius: 2 }}
                          >
                            เสร็จสิ้น
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Fade>
              )}

              {/* Action Buttons */}
              {(mode !== "view" && (mode !== "create" || activeStep === 3)) && (
                <Fade in timeout={1100}>
                  <Card sx={{ overflow: 'visible' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        justifyContent: 'flex-end',
                        flexDirection: { xs: 'column', sm: 'row' }
                      }}>
                        <Button
                          variant="outlined"
                          onClick={handleCancel}
                          startIcon={<MdCancel />}
                          size="large"
                          sx={{
                            borderRadius: 2,
                            minWidth: { xs: '100%', sm: 120 }
                          }}
                        >
                          ยกเลิก
                        </Button>
                        
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          startIcon={<MdSave />}
                          size="large"
                          disabled={!isValid || isAdding || isUpdating}
                          sx={{
                            borderRadius: 2,
                            minWidth: { xs: '100%', sm: 200 },
                            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                          }}
                        >
                          {isAdding || isUpdating ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={20} color="inherit" />
                              <Typography>
                                {mode === "create" ? "กำลังสร้าง..." : "กำลังบันทึก..."}
                              </Typography>
                            </Box>
                          ) : (
                            mode === "create" ? "สร้างงานผลิต" : "บันทึกการแก้ไข"
                          )}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              )}
            </Stack>
          </form>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}

export default MaxSupplyForm;