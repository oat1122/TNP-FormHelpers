/**
 * ตัวอย่างการใช้งาน QuotationStep Component ที่ปรับปรุงแล้ว
 * 
 * Features ใหม่:
 * - React Hook Form + Yup validation
 * - WHT (Withholding Tax) calculation
 * - Deposit percentage และ amount auto-calculation  
 * - Discount percentage และ amount
 * - Quantity remaining tracking สำหรับ partial delivery
 * - Backend schema mapping ตาม DATABASE_SCHEMA_ALIGNMENT.md
 * - Real-time validation และ error display
 * - Advanced UX improvements
 */

import React, { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import QuotationStep from './QuotationStep';

const QuotationStepExample = () => {
  const [stepData, setStepData] = useState({
    customer: {
      cus_id: 'customer-uuid-123',
      name: 'บริษัท ทดสอบ จำกัด',
      company_name: 'บริษัท ทดสอบ จำกัด',
      cus_email: 'test@company.com'
    },
    pricingDetails: {
      pr_id: 'pricing-uuid-456',
      pr_no: 'PR202501-001',
      pr_work_name: 'ผลิตเสื้อโปโล 1000 ตัว'
    },
    quotationData: {
      valid_until: null,
      payment_terms: '',
      deposit_amount: 0,
      deposit_percent: 0,
      tax_rate: 7,
      wht_rate: 3,
      remarks: '',
      items: []
    }
  });

  const [formValid, setFormValid] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const handleQuotationChange = (quotationData) => {
    console.log('Quotation data changed:', quotationData);
    setStepData(prev => ({
      ...prev,
      quotationData
    }));
    
    // Check if form is valid (has items and valid dates)
    const isValid = quotationData.items && 
                   quotationData.items.length > 0 && 
                   quotationData.valid_until &&
                   quotationData.payment_terms;
    setFormValid(isValid);
  };

  const handleSubmit = () => {
    if (formValid) {
      // This would be the data sent to backend API
      setSubmittedData(stepData.quotationData);
      console.log('Submitting to backend:', stepData.quotationData);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        ตัวอย่างการใช้งาน QuotationStep
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Component นี้ได้รับการปรับปรุงแล้วตามมาตรฐาน FlowAccount และรองรับฟีเจอร์ครบถ้วน
      </Typography>

      {/* QuotationStep Component */}
      <QuotationStep
        data={stepData}
        onChange={handleQuotationChange}
        loading={false}
      />

      {/* Submit Section */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!formValid}
          size="large"
        >
          สร้างใบเสนอราคา
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => console.log('Current state:', stepData)}
        >
          ดูข้อมูลปัจจุบัน
        </Button>
      </Box>

      {/* Debug Info */}
      {submittedData && (
        <Paper sx={{ mt: 3, p: 2, bgcolor: 'success.light' }}>
          <Typography variant="h6" color="success.dark">
            ข้อมูลที่ส่งไปยัง Backend:
          </Typography>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </Paper>
      )}

      {/* Feature List */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          ฟีเจอร์ที่ปรับปรุงแล้ว:
        </Typography>
        <ul>
          <li>✅ React Hook Form + Yup validation แทน useState</li>
          <li>✅ การคำนวณ VAT ที่ถูกต้อง (จาก subtotal หลังหักส่วนลด)</li>
          <li>✅ รองรับ WHT (หัก ณ ที่จ่าย) calculation</li>
          <li>✅ มัดจำแบบเปอร์เซ็นต์และจำนวนเงิน auto-sync</li>
          <li>✅ ส่วนลดแบบเปอร์เซ็นต์และจำนวนเงิน auto-sync</li>
          <li>✅ quantity_remaining สำหรับ partial delivery</li>
          <li>✅ VAT type selection (รวม/แยก/ยกเว้น)</li>
          <li>✅ Real-time validation และ error display</li>
          <li>✅ Backend schema mapping ตาม DATABASE_SCHEMA_ALIGNMENT.md</li>
          <li>✅ UX improvements: alerts, success messages, loading states</li>
          <li>✅ Auto-calculate deposit จาก payment terms</li>
          <li>✅ Validation ป้องกันมัดจำเกินยอดรวม</li>
          <li>✅ Responsive design สำหรับ mobile</li>
        </ul>
      </Paper>

      {/* Usage Instructions */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: 'info.light' }}>
        <Typography variant="h6" gutterBottom color="info.dark">
          วิธีการใช้งาน:
        </Typography>
        <ol>
          <li>กรอกวันที่ใช้ได้ถึง (ต้องเป็นอนาคต)</li>
          <li>เลือกเงื่อนไขการชำระเงิน (auto-set มัดจำถ้ามี)</li>
          <li>เพิ่มรายการสินค้าอย่างน้อย 1 รายการ</li>
          <li>ระบบจะคำนวณยอดรวมแบบ real-time</li>
          <li>ตรวจสอบ validation errors ก่อนส่ง</li>
          <li>กดสร้างใบเสนอราคาเมื่อข้อมูลครบถ้วน</li>
        </ol>
      </Paper>
    </Box>
  );
};

export default QuotationStepExample;