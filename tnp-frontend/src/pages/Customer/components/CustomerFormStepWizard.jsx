import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import './CustomerFormStepWizard.css';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Slide,
  Alert,
  AlertTitle,
  Tooltip
} from "@mui/material";
import {
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdSave,
  MdDrafts,
  MdBusiness,
  MdPerson,
  MdLocationOn,
  MdNotes,
  MdCheckCircle,
  MdError,
  MdInfo,
  MdAccessTime,
  MdAdd
} from "react-icons/md";

// Import existing field components
import BasicInfoFields from "./DialogForm/BasicInfoFields";
import ContactInfoFields from "./DialogForm/ContactInfoFields"; 
import AddressFields from "./DialogForm/AddressFields";
import AdditionalNotesFields from "./DialogForm/AdditionalNotesFields";

// Step configurations
const steps = [
  {
    id: 'company-info',
    label: 'ข้อมูลบริษัท',
    title: 'ข้อมูลบริษัท',
    description: 'กรอกชื่อบริษัทและผู้ติดต่อหลัก',
    icon: <MdBusiness />,
    required: true,
    fields: ['cus_company', 'cus_firstname', 'cus_lastname', 'cus_name']
  },
  {
    id: 'business-details',
    label: 'รายละเอียดธุรกิจ',
    title: 'รายละเอียดธุรกิจ',
    description: 'ระบุประเภทธุรกิจและช่องทางติดต่อ',
    icon: <MdPerson />,
    required: true,
    fields: ['cus_tel_1', 'cus_bt_id', 'cus_channel', 'cus_manage_by']
  },
  {
    id: 'address',
    label: 'ที่อยู่',
    title: 'ที่อยู่ (ไม่บังคับ)',
    description: 'กรอกที่อยู่สำหรับติดต่อและจัดส่ง',
    icon: <MdLocationOn />,
    required: false,
    fields: ['cus_address', 'cus_pro_id', 'cus_dis_id', 'cus_sub_id', 'cus_zip_code']
  },
  {
    id: 'notes',
    label: 'บันทึกเพิ่มเติม',
    title: 'บันทึกเพิ่มเติม (ไม่บังคับ)',
    description: 'เพิ่มหมายเหตุหรือข้อมูลสำคัญ',
    icon: <MdNotes />,
    required: false,
    fields: ['cd_note', 'cd_remark']
  }
];

function CustomerFormStepWizard({ 
  openDialog = true, 
  handleCloseDialog = () => {},
  inputList = {},
  errors = {},
  mode = "create",
  handleInputChange = () => {},
  handleSelectLocation = () => {},
  handleSubmit = () => {},
  isLoading = false,
  provincesList = [],
  districtList = [],
  subDistrictList = [],
  isFetching = false,
  businessTypeList = [],
  userList = [],
  formatPhoneNumber = (value) => value,
  lastUpdated = "",
  onAddBusinessType = () => {}
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState('left');
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [autosavedStep, setAutosavedStep] = useState(-1);
  const [hasDraft, setHasDraft] = useState(false);
  
  // Check for saved draft on component mount
  useEffect(() => {
    if (mode === 'create') {
      const savedDraft = localStorage.getItem("customerFormDraft");
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          if (parsedDraft && parsedDraft.timestamp) {
            // Check if draft is less than 24 hours old
            const draftTime = new Date(parsedDraft.timestamp);
            const now = new Date();
            const hoursDiff = (now - draftTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
              setHasDraft(true);
            } else {
              // Draft is too old, remove it
              localStorage.removeItem("customerFormDraft");
            }
          }
        } catch (e) {
          console.error("Error parsing draft:", e);
        }
      }
    }
  }, [mode]);

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    const currentStepConfig = steps[currentStep];
    if (!currentStepConfig.required) return true;
    
    return currentStepConfig.fields.every(field => {
      const value = inputList[field];
      
      // Empty check for objects like user selection
      if (typeof value === 'object' && value !== null) {
        return value.user_id || Object.keys(value).some(key => value[key]);
      }
      
      // Email validation
      if (field === 'cus_email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      }
      
      // Phone number validation
      if ((field === 'cus_tel_1' || field === 'cus_tel_2') && value) {
        // Allow formats like 081-234-5678, 0812345678
        const phoneRegex = /^[0-9\-+\s()]{9,15}$/;
        return phoneRegex.test(value);
      }
      
      // Tax ID validation
      if (field === 'cus_tax_id' && value) {
        return value.length === 13 && /^\d+$/.test(value);
      }
      
      // Default check for non-empty value
      return value && String(value).trim() !== '';
    });
  }, [currentStep, inputList]);

  // Improved validation with field-specific checks
  const validateField = useCallback((field, value) => {
    if (!value) return false;
    
    // Email validation
    if (field === 'cus_email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }
    
    // Phone validation
    if (field === 'cus_tel_1' || field === 'cus_tel_2') {
      const phoneRegex = /^[0-9\-+\s()]{9,15}$/;
      return phoneRegex.test(value);
    }
    
    // Tax ID validation
    if (field === 'cus_tax_id') {
      return value.length === 13 && /^\d+$/.test(value);
    }
    
    // Default validation - just check if not empty
    return String(value).trim() !== '';
  }, []);
  
  // Detect device type for responsive UI adjustments
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Check step completion status
  const getStepStatus = useCallback((stepIndex) => {
    const stepConfig = steps[stepIndex];
    
    if (stepIndex < currentStep) {
      return completedSteps.has(stepIndex) ? 'completed' : 'error';
    }
    
    if (stepIndex === currentStep) {
      return validateCurrentStep() ? 'completed' : 'active';
    }
    
    return 'pending';
  }, [currentStep, completedSteps, validateCurrentStep]);

  // Auto-save function with localStorage
  const autoSave = useCallback(() => {
    if (mode === 'create' && validateCurrentStep() && currentStep !== autosavedStep) {
      setAutosavedStep(currentStep);
      // Save to localStorage
      const draft = {
        inputList,
        timestamp: new Date().toISOString(),
        currentStep
      };
      localStorage.setItem("customerFormDraft", JSON.stringify(draft));
      console.log('Auto-saving step:', currentStep);
    }
  }, [currentStep, validateCurrentStep, autosavedStep, inputList, mode]);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(autoSave, 2000);
    return () => clearTimeout(timer);
  }, [inputList, autoSave]);

  // Update completed steps
  useEffect(() => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    } else {
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentStep);
        return newSet;
      });
    }
  }, [currentStep, validateCurrentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1 && validateCurrentStep()) {
      setSlideDirection('left');
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setSlideDirection('right');
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    // Allow navigation to previous steps or current step
    if (stepIndex <= currentStep) {
      setSlideDirection(stepIndex > currentStep ? 'left' : 'right');
      setCurrentStep(stepIndex);
    }
  };

  const handleSaveDraft = () => {
    // Save draft logic
    console.log('Saving draft manually...');
    
    const draft = {
      inputList,
      timestamp: new Date().toISOString(),
      currentStep
    };
    
    localStorage.setItem("customerFormDraft", JSON.stringify(draft));
    setAutosavedStep(currentStep);
    
    // Show feedback to user
    const autosaveElement = document.querySelector('.autosave-indicator');
    if (autosaveElement) {
      autosaveElement.classList.add('highlight');
      setTimeout(() => {
        autosaveElement.classList.remove('highlight');
      }, 2000);
    }
  };

  const renderStepContent = () => {
    const stepProps = {
      inputList,
      handleInputChange,
      errors,
      mode,
      handleSelectLocation,
      provincesList,
      districtList, 
      subDistrictList,
      isFetching,
      businessTypeList,
      userList,
      formatPhoneNumber,
      onAddBusinessType
    };

    switch (currentStep) {
      case 0:
        return (
          <Box>
            <BasicInfoFields {...stepProps} />
          </Box>
        );
      case 1:
        return (
          <Box>
            <ContactInfoFields {...stepProps} />
            
            {/* Business Type Management Button */}
            {mode !== 'view' && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  size="small" 
                  startIcon={<MdAdd />} 
                  onClick={onAddBusinessType}
                  variant="outlined"
                  color="secondary"
                >
                  เพิ่มประเภทธุรกิจใหม่
                </Button>
              </Box>
            )}
          </Box>
        );
      case 2:
        return <AddressFields {...stepProps} />;
      case 3:
        return <AdditionalNotesFields {...stepProps} />;
      default:
        return null;
    }
  };

  // Return mobile-optimized step navigation
  const renderMobileStepNav = () => (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      mb: 2,
      width: '100%',
      className: 'step-chips-container'
    }}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isActive = index === currentStep;
        const isClickable = index <= currentStep;
        
        return (
          <Box
            key={step.id}
            onClick={() => isClickable && handleStepClick(index)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              borderRadius: 1,
              cursor: isClickable ? 'pointer' : 'default',
              backgroundColor: isActive ? 'primary.lighter' : 'background.paper',
              border: '1px solid',
              borderColor: isActive ? 'primary.main' : 'divider',
              '&:hover': isClickable ? {
                backgroundColor: 'primary.lighter',
                borderColor: 'primary.main',
              } : {},
              opacity: isClickable ? 1 : 0.7,
              width: '100%'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 1,
              borderRadius: '50%',
              mr: 2,
              backgroundColor: isActive ? 'primary.main' : 'grey.200',
              color: isActive ? 'white' : 'text.secondary',
            }}>
              {status === 'completed' ? (
                <MdCheckCircle style={{ color: '#4caf50' }} />
              ) : status === 'error' ? (
                <MdError style={{ color: '#f44336' }} />
              ) : (
                step.icon
              )}
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body1"
                fontWeight={isActive ? 600 : 400}
                color={isActive ? 'primary.main' : 'text.primary'}
              >
                {index + 1}. {step.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {!step.required && "(ไม่บังคับ)"}
              </Typography>
            </Box>
            
            {status === 'completed' && (
              <Box sx={{ ml: 'auto', color: 'success.main' }}>
                <MdCheckCircle />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const currentStepValid = validateCurrentStep();

  return (
    <Dialog
      open={openDialog}
      fullWidth
      maxWidth="md"
      disableEscapeKeyDown
      PaperProps={{ 
        elevation: 3,
        sx: { borderRadius: 2, minHeight: '70vh' }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'primary.lighter',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="600" color="primary.main">
            {mode === 'create' ? 'เพิ่ม' : mode === 'edit' ? 'แก้ไข' : 'ดู'}ข้อมูลลูกค้า
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ขั้นตอนที่ {currentStep + 1} จาก {steps.length}: {steps[currentStep].title}
          </Typography>
          
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              อัพเดทล่าสุด: {lastUpdated}
            </Typography>
          )}
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleCloseDialog}
          sx={{
            color: "grey.500",
            "&:hover": {
              backgroundColor: "error.lighter",
              color: "error.main",
            },
          }}
        >
          <MdClose />
        </IconButton>
      </DialogTitle>

      {/* Progress Section */}
      <Box sx={{ p: 3, backgroundColor: '#fafafa', borderBottom: '1px solid', borderColor: 'divider' }}>
        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ความคืบหน้า
            </Typography>
            <Typography variant="body2" color="primary.main" fontWeight="500">
              {Math.round(progressPercentage)}% เสร็จแล้ว
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)'
              }
            }}
          />
        </Box>

        {/* Step Navigation */}
        {isMobile ? renderMobileStepNav() : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isActive = index === currentStep;
              const isClickable = index <= currentStep;
              
              return (
                <Chip
                  key={step.id}
                  icon={
                    status === 'completed' ? (
                      <MdCheckCircle style={{ color: 'green' }} />
                    ) : status === 'error' ? (
                      <MdError style={{ color: 'red' }} />
                    ) : status === 'active' ? (
                      step.icon
                    ) : (
                      <MdInfo style={{ color: '#999' }} />
                    )
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" fontWeight={isActive ? 600 : 400}>
                        {index + 1}. {step.label}
                      </Typography>
                      {!step.required && (
                        <Typography variant="caption" color="text.secondary">
                          (ไม่บังคับ)
                        </Typography>
                      )}
                    </Box>
                  }
                  onClick={() => isClickable && handleStepClick(index)}
                  variant={isActive ? "filled" : "outlined"}
                  color={
                    status === 'completed' ? 'success' : 
                    status === 'error' ? 'error' :
                    status === 'active' ? 'primary' : 'default'
                  }
                  sx={{
                    cursor: isClickable ? 'pointer' : 'default',
                    opacity: isClickable ? 1 : 0.6,
                    '&:hover': isClickable ? { backgroundColor: 'primary.lighter' } : {}
                  }}
                />
              );
            })}
          </Box>
        )}

        {/* Auto-save indicator */}
        {autosavedStep === currentStep && (
          <Fade in={true}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }} className="autosave-indicator">
              <MdDrafts style={{ color: '#4caf50', fontSize: '16px' }} />
              <Typography variant="caption" color="success.main">
                บันทึกร่างอัตโนมัติแล้ว
              </Typography>
            </Box>
          </Fade>
        )}
        
        {/* Draft restore notification */}
        {hasDraft && (
          <Alert 
            severity="info" 
            sx={{ mt: 2 }}
            onClose={() => setHasDraft(false)}
            className="fade-in"
          >
            <AlertTitle>พบข้อมูลร่างที่บันทึกไว้</AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              คุณมีข้อมูลลูกค้าที่บันทึกไว้ก่อนหน้านี้
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => {
                  const savedDraft = localStorage.getItem("customerFormDraft");
                  if (savedDraft) {
                    try {
                      const parsedDraft = JSON.parse(savedDraft);
                      // Here we would normally dispatch to set inputList
                      // But for now, we'll just simulate
                      console.log("Restoring draft:", parsedDraft);
                      setHasDraft(false);
                    } catch (e) {
                      console.error("Error restoring draft:", e);
                    }
                  }
                }}
              >
                โหลดข้อมูล
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => {
                  localStorage.removeItem("customerFormDraft");
                  setHasDraft(false);
                }}
              >
                ลบร่าง
              </Button>
            </Box>
          </Alert>
        )}
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 0, backgroundColor: '#fafafa', minHeight: '400px' }}>
        <Box sx={{ p: 3 }}>
          {/* Step Description */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'white', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: '50%', 
                backgroundColor: 'primary.lighter',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {steps[currentStep].icon}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="600" color="primary.main">
                  {steps[currentStep].title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {steps[currentStep].description}
                </Typography>
              </Box>
            </Box>

            {/* Validation Status */}
            {steps[currentStep].required && (
              <Alert 
                severity={currentStepValid ? "success" : "warning"}
                sx={{ mt: 2 }}
              >
                {currentStepValid ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdCheckCircle />
                    <Typography variant="body2">
                      ข้อมูลครบถ้วน พร้อมดำเนินการต่อ
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ฟิลด์ที่มี * คือข้อมูลที่จำเป็น
                    </Typography>
                  </Box>
                )}
              </Alert>
            )}
          </Paper>

          {/* Step Content with Slide Transition */}
          <Slide 
            direction={slideDirection} 
            in={true} 
            key={currentStep}
            timeout={300}
          >
            <Box>
              {renderStepContent()}
            </Box>
          </Slide>
        </Box>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions 
        sx={{ 
          p: 3, 
          borderTop: '1px solid', 
          borderColor: 'divider',
          backgroundColor: 'white',
          gap: 2,
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Save Draft Button */}
          {mode !== 'view' && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<MdDrafts />}
              onClick={handleSaveDraft}
              disabled={isLoading}
              sx={{ fontWeight: 500 }}
            >
              บันทึกร่าง
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Previous Button */}
          <Button
            variant="outlined"
            startIcon={<MdChevronLeft />}
            onClick={handlePrevious}
            disabled={isFirstStep || isLoading}
            sx={{ fontWeight: 500 }}
          >
            ย้อนกลับ
          </Button>

          {/* Next/Submit Button */}
          {isLastStep ? (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<MdSave />}
              onClick={handleSubmit}
              disabled={isLoading || (steps[currentStep].required && !currentStepValid)}
              sx={{ 
                fontWeight: 600,
                px: 3,
                boxShadow: 2
              }}
            >
              บันทึกข้อมูล
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<MdChevronRight />}
              onClick={handleNext}
              disabled={steps[currentStep].required && !currentStepValid}
              sx={{ 
                fontWeight: 600,
                px: 3,
                background: currentStepValid ? 
                  'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)' : 
                  undefined
              }}
            >
              ถัดไป
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default CustomerFormStepWizard;
