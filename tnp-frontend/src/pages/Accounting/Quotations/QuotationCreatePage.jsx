import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Stack,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { pricingIntegrationService, quotationService } from '../../../features/Accounting';

// Import step components
import PricingStep from './components/PricingStep';
import CustomerStep from './components/CustomerStep';
import QuotationStep from './components/QuotationStep';

const steps = [
  {
    label: 'ข้อมูลจากระบบ Pricing',
    description: 'เลือกหลักฐานการขอราคา'
  },
  {
    label: 'ข้อมูลลูกค้า',
    description: 'ตรวจสอบและแก้ไขข้อมูลลูกค้า'
  },
  {
    label: 'ข้อมูลใบเสนอราคา',
    description: 'กรอกรายละเอียดใบเสนอราคา'
  }
];

const QuotationCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [retryFunction, setRetryFunction] = useState(null);
  
  // Form data for each step
  const [formData, setFormData] = useState({
    // Step 1: Pricing data
    pricingRequest: null,
    pricingDetails: null,
    
    // Step 2: Customer data
    customer: null,
    customerOverrides: {},
    
    // Step 3: Quotation data
    quotationData: {
      valid_until: null,
      deposit_amount: 0,
      payment_terms: '',
      remarks: '',
      tax_rate: 7,
      items: []
    }
  });

  // Check if there's a pre-selected pricing request from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const pricingRequestId = urlParams.get('pricing_request_id');
    
    console.log('URL params:', { pricingRequestId });
    
    if (pricingRequestId) {
      // Auto-load pricing request details
      loadPricingRequestDetails(pricingRequestId);
    }
  }, [location]);

  // Test API connection on component mount
  useEffect(() => {
    const testAPIConnection = async () => {
      try {
        console.log('Testing API connection...');
        const response = await pricingIntegrationService.getCompletedPricingRequests({ per_page: 1 });
        console.log('API connection test successful:', response);
      } catch (err) {
        console.error('API connection test failed:', err);
      }
    };
    
    testAPIConnection();
  }, []);

  const loadPricingRequestDetails = async (pricingRequestId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading pricing request details for ID:', pricingRequestId);
      
      const response = await pricingIntegrationService.getPricingRequestDetails(pricingRequestId);
      
      console.log('Pricing request response:', response);
      
      if (response.data && response.data.data) {
        const pricingData = response.data.data;
        
        setFormData(prev => ({
          ...prev,
          pricingRequest: { id: pricingRequestId, ...pricingData },
          pricingDetails: pricingData,
          customer: pricingData.customer,
          quotationData: {
            ...prev.quotationData,
            items: pricingData.suggested_items || []
          }
        }));
        
        // Skip to step 2 if pricing is pre-selected
        setActiveStep(1);
      } else {
        throw new Error('Invalid response format: missing data');
      }
    } catch (err) {
      console.error('Error loading pricing request:', err);
      
      let errorMessage = 'ไม่สามารถโหลดข้อมูลการขอราคาได้';
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const responseData = err.response.data;
        
        console.error('Server response error:', {
          status,
          data: responseData,
          headers: err.response.headers
        });
        
        switch (status) {
          case 404:
            errorMessage = 'ไม่พบข้อมูลการขอราคาที่ระบุ';
            break;
          case 403:
            errorMessage = 'ไม่มีสิทธิ์เข้าถึงข้อมูลการขอราคานี้';
            break;
          case 500:
            errorMessage = `เกิดข้อผิดพลาดในระบบเซิร์ฟเวอร์ (${responseData?.message || 'Internal Server Error'})`;
            break;
          default:
            errorMessage = `เกิดข้อผิดพลาด (${status}): ${responseData?.message || err.message}`;
        }
      } else if (err.request) {
        // Network error
        console.error('Network error:', err.request);
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      } else {
        // Other error
        console.error('Unknown error:', err.message);
        errorMessage = `เกิดข้อผิดพลาด: ${err.message}`;
      }
      
      setError(errorMessage);
      
      // Set retry function for this specific operation
      setRetryFunction(() => () => loadPricingRequestDetails(pricingRequestId));
      
      // Don't auto-advance to step 2 on error
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setError(null);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleStepDataChange = (stepIndex, data) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      switch (stepIndex) {
        case 0: // Pricing step
          newData.pricingRequest = data.pricingRequest;
          newData.pricingDetails = data.pricingDetails;
          // Auto-fill customer data if available
          if (data.pricingDetails && data.pricingDetails.customer) {
            newData.customer = data.pricingDetails.customer;
          }
          // Auto-fill quotation items if available
          if (data.pricingDetails && data.pricingDetails.suggested_items) {
            newData.quotationData.items = data.pricingDetails.suggested_items;
          }
          break;
          
        case 1: // Customer step
          newData.customer = data.customer;
          newData.customerOverrides = data.customerOverrides || {};
          break;
          
        case 2: // Quotation step
          newData.quotationData = { ...newData.quotationData, ...data };
          break;
          
        default:
          break;
      }
      
      return newData;
    });
  };

  const validateCurrentStep = () => {
    switch (activeStep) {
      case 0:
        if (!formData.pricingRequest) {
          setError('กรุณาเลือกหลักฐานการขอราคา');
          return false;
        }
        break;
        
      case 1:
        if (!formData.customer) {
          setError('กรุณาตรวจสอบข้อมูลลูกค้า');
          return false;
        }
        break;
        
      case 2:
        if (!formData.quotationData.valid_until) {
          setError('กรุณาระบุวันที่ใช้ได้ถึง');
          return false;
        }
        if (!formData.quotationData.items || formData.quotationData.items.length === 0) {
          setError('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
          return false;
        }
        break;
        
      default:
        break;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare data for quotation creation
      const submitData = {
        pricing_request_id: formData.pricingRequest.id,
        valid_until: formData.quotationData.valid_until,
        deposit_amount: formData.quotationData.deposit_amount,
        payment_terms: formData.quotationData.payment_terms,
        remarks: formData.quotationData.remarks,
        tax_rate: formData.quotationData.tax_rate,
        items: formData.quotationData.items,
        // Customer overrides if any
        ...(Object.keys(formData.customerOverrides).length > 0 && {
          customer_overrides: formData.customerOverrides
        })
      };

      console.log('Submitting quotation data:', submitData);

      const response = await pricingIntegrationService.createQuotationFromPricing(submitData);
      
      console.log('Quotation creation response:', response);
      
      if (response.data && response.data.status === 'success') {
        setSuccessMessage('สร้างใบเสนอราคาเรียบร้อยแล้ว');
        
        // Redirect to quotation detail page after a short delay
        setTimeout(() => {
          navigate(`/accounting/quotations/${response.data.data.id}`);
        }, 2000);
      } else {
        throw new Error(response.data?.message || 'ไม่สามารถสร้างใบเสนอราคาได้');
      }
      
    } catch (err) {
      console.error('Error creating quotation:', err);
      
      let errorMessage = 'ไม่สามารถสร้างใบเสนอราคาได้';
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const responseData = err.response.data;
        
        console.error('Server response error:', {
          status,
          data: responseData,
          headers: err.response.headers
        });
        
        switch (status) {
          case 400:
            errorMessage = `ข้อมูลไม่ถูกต้อง: ${responseData?.message || 'Bad Request'}`;
            break;
          case 401:
            errorMessage = 'ไม่มีสิทธิ์ในการสร้างใบเสนอราคา กรุณาเข้าสู่ระบบใหม่';
            break;
          case 403:
            errorMessage = 'ไม่มีสิทธิ์ในการดำเนินการนี้';
            break;
          case 422:
            // Validation errors
            if (responseData?.errors) {
              const errors = Object.values(responseData.errors).flat();
              errorMessage = `ข้อมูลไม่ถูกต้อง: ${errors.join(', ')}`;
            } else {
              errorMessage = `ข้อมูลไม่ถูกต้อง: ${responseData?.message || 'Validation Error'}`;
            }
            break;
          case 500:
            errorMessage = `เกิดข้อผิดพลาดในระบบเซิร์ฟเวอร์: ${responseData?.message || 'Internal Server Error'}`;
            break;
          default:
            errorMessage = `เกิดข้อผิดพลาด (${status}): ${responseData?.message || err.message}`;
        }
      } else if (err.request) {
        // Network error
        console.error('Network error:', err.request);
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      } else {
        // Other error
        console.error('Unknown error:', err.message);
        errorMessage = `เกิดข้อผิดพลาด: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isStepCompleted = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return formData.pricingRequest !== null;
      case 1:
        return formData.customer !== null;
      case 2:
        return formData.quotationData.valid_until !== null && 
               formData.quotationData.items.length > 0;
      default:
        return false;
    }
  };

  const getStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return (
          <PricingStep
            data={{
              pricingRequest: formData.pricingRequest,
              pricingDetails: formData.pricingDetails
            }}
            onChange={(data) => handleStepDataChange(0, data)}
            loading={loading}
          />
        );
        
      case 1:
        return (
          <CustomerStep
            data={{
              customer: formData.customer,
              customerOverrides: formData.customerOverrides,
              pricingDetails: formData.pricingDetails
            }}
            onChange={(data) => handleStepDataChange(1, data)}
            loading={loading}
          />
        );
        
      case 2:
        return (
          <QuotationStep
            data={{
              quotationData: formData.quotationData,
              customer: formData.customer,
              pricingDetails: formData.pricingDetails
            }}
            onChange={(data) => handleStepDataChange(2, data)}
            loading={loading}
          />
        );
        
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg">
        <Box py={3}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/accounting/quotations')}
              variant="outlined"
            >
              กลับไปรายการ
            </Button>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              สร้างใบเสนอราคาใหม่
            </Typography>
          </Stack>

          {/* Debug Information (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Debug Info:</strong><br />
                Current Step: {activeStep}<br />
                Pricing Request: {formData.pricingRequest ? 'Selected' : 'Not Selected'}<br />
                Customer: {formData.customer ? 'Available' : 'Not Available'}<br />
                API Base URL: {window.axios?.defaults?.baseURL || 'Not configured'}
              </Typography>
            </Alert>
          )}

          {/* Success Message */}
          {successMessage && (
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
              icon={<CheckCircleIcon />}
            >
              {successMessage}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }} 
              onClose={() => {
                setError(null);
                setRetryFunction(null);
              }}
              action={
                retryFunction && (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => {
                      setError(null);
                      setRetryFunction(null);
                      retryFunction();
                    }}
                    disabled={loading}
                  >
                    ลองใหม่
                  </Button>
                )
              }
            >
              {error}
            </Alert>
          )}

          {/* Main Form */}
          <Paper sx={{ p: 3 }}>
            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((step, index) => (
                <Step key={step.label} completed={isStepCompleted(index)}>
                  <StepLabel>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {step.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Divider sx={{ mb: 3 }} />

            {/* Step Content */}
            <Box sx={{ minHeight: 400 }}>
              {getStepContent(activeStep)}
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                variant="outlined"
                size="large"
              >
                ย้อนกลับ
              </Button>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !validateCurrentStep()}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    variant="contained"
                    size="large"
                    color="primary"
                  >
                    {loading ? 'กำลังสร้าง...' : 'สร้างใบเสนอราคา'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (validateCurrentStep()) {
                        handleNext();
                      }
                    }}
                    endIcon={<ArrowForwardIcon />}
                    variant="contained"
                    size="large"
                  >
                    ถัดไป
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default QuotationCreatePage; 