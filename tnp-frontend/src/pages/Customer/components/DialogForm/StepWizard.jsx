import React from "react";
import { 
  Box, 
  LinearProgress, 
  Typography, 
  Button, 
  Stack, 
  styled 
} from "@mui/material";
import { 
  MdArrowBack, 
  MdArrowForward, 
  MdCheckCircle, 
  MdError, 
  MdInfo,
  MdPerson,
  MdBusiness,
  MdLocationOn,
  MdNotes
} from "react-icons/md";

const StepIndicator = styled(Box)(({ theme, active }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: active ? theme.palette.primary.main : theme.palette.grey[300],
  color: active ? theme.palette.common.white : theme.palette.grey[700],
  fontWeight: 'bold',
  marginRight: theme.spacing(1),
}));

const StepIconContainer = styled(Box)(({ theme, complete, error, optional }) => ({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  color: complete ? theme.palette.success.main : error ? theme.palette.error.main : optional ? theme.palette.info.main : 'inherit'
}));

const StepButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  textTransform: 'none',
}));

const ProgressWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
}));

function StepIcon({ step, currentStep }) {
  if (step === 1) return <MdPerson fontSize="medium" />;
  if (step === 2) return <MdBusiness fontSize="medium" />;
  if (step === 3) return <MdLocationOn fontSize="medium" />;
  if (step === 4) return <MdNotes fontSize="medium" />;
  return null;
}

const StepWizard = ({ 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrevious, 
  onSkip, 
  tabStatus,
  titles = [
    "ข้อมูลบริษัท", 
    "รายละเอียดธุรกิจ", 
    "ที่อยู่", 
    "บันทึกเพิ่มเติม"
  ]
}) => {
  // Calculate progress percentage
  const progressPercent = ((currentStep) / totalSteps) * 100;
  
  // Map tab status values to status labels in Thai
  const getStatusText = (status, step) => {
    if (status === 'complete') return "เสร็จแล้ว";
    if (status === 'incomplete') return "กำลังกรอก";
    if (status === 'optional') return "ไม่บังคับ";
    return step === currentStep ? "กำลังกรอก" : "ยังไม่เริ่ม";
  };

  // Determine if the current step is optional (address or notes)
  const isCurrentStepOptional = currentStep === 3 || currentStep === 4;

  // Determine status icon for each step
  const getStatusIcon = (step) => {
    let status;
    
    switch (step) {
      case 1:
        status = tabStatus.basicInfo;
        break;
      case 2:
        status = tabStatus.contactInfo;
        break;
      case 3:
        status = tabStatus.address;
        break;
      case 4:
        status = tabStatus.notes;
        break;
      default:
        status = "";
    }

    if (status === 'complete') return <MdCheckCircle fontSize="small" />;
    if (status === 'incomplete') return <MdError fontSize="small" />;
    if (status === 'optional') return <MdInfo fontSize="small" />;
    return null;
  };

  return (
    <ProgressWrapper>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
          ขั้นตอนที่ {currentStep} จาก {totalSteps}: {titles[currentStep - 1]}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ flexGrow: 1, mr: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={progressPercent} 
              sx={{ 
                height: 8, 
                borderRadius: 1,
                backgroundColor: 'grey.200'
              }} 
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {progressPercent}% เสร็จแล้ว
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        {/* Step summary display */}
        {[1, 2, 3, 4].map((step) => (
          <Box 
            key={step}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 0.5, 
              p: 1,
              bgcolor: currentStep === step ? 'primary.lighter' : 'transparent',
              borderRadius: 1,
            }}
          >
            <StepIndicator active={currentStep === step}>
              <StepIcon step={step} />
            </StepIndicator>
            <Box>
              <Typography 
                variant="body1" 
                fontWeight={currentStep === step ? 600 : 400}
              >
                {titles[step - 1]}
                {(step === 3 || step === 4) && 
                  <Typography 
                    component="span" 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ ml: 1 }}
                  >
                    (ไม่บังคับ)
                  </Typography>
                }
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getStatusText(
                  step === 1 ? tabStatus.basicInfo : 
                  step === 2 ? tabStatus.contactInfo :
                  step === 3 ? tabStatus.address :
                  tabStatus.notes,
                  step
                )}
              </Typography>
            </Box>
            <StepIconContainer 
              complete={
                (step === 1 && tabStatus.basicInfo === 'complete') ||
                (step === 2 && tabStatus.contactInfo === 'complete') ||
                (step === 3 && tabStatus.address === 'complete') ||
                (step === 4 && tabStatus.notes === 'complete')
              }
              error={
                (step === 1 && tabStatus.basicInfo === 'incomplete') ||
                (step === 2 && tabStatus.contactInfo === 'incomplete') ||
                (step === 3 && tabStatus.address === 'incomplete')
              }
              optional={
                (step === 3 && tabStatus.address === 'optional') ||
                (step === 4 && tabStatus.notes === 'optional')
              }
            >
              {getStatusIcon(step)}
            </StepIconContainer>
          </Box>
        ))}
      </Box>
      
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Box>
          {currentStep > 1 && (
            <StepButton
              variant="outlined"
              color="inherit"
              onClick={onPrevious}
              startIcon={<MdArrowBack />}
            >
              ย้อนกลับ
            </StepButton>
          )}
        </Box>
        
        <Box>
          {isCurrentStepOptional && (
            <StepButton
              variant="text"
              color="inherit"
              onClick={onSkip}
              sx={{ mr: 1 }}
            >
              ข้าม
            </StepButton>
          )}
          
          {currentStep < totalSteps ? (
            <StepButton
              variant="contained"
              color="primary"
              onClick={onNext}
              endIcon={<MdArrowForward />}
            >
              ถัดไป
            </StepButton>
          ) : (
            <StepButton
              variant="contained"
              color="success"
              onClick={onNext}
              endIcon={<MdCheckCircle />}
            >
              บันทึก
            </StepButton>
          )}
        </Box>
      </Stack>
    </ProgressWrapper>
  );
};

export default StepWizard;
