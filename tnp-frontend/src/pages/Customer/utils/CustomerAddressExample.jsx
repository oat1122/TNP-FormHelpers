import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { parseFullAddress } from './addressParser';

/**
 * ตัวอย่างการใช้งานฟังก์ชัน parseFullAddress 
 * สำหรับแสดงที่อยู่ที่บันทึกแบบรวมให้แยกเป็นส่วนๆ
 */
const CustomerAddressExample = ({ customerData }) => {
  // ใช้ parseFullAddress เพื่อแยกที่อยู่รวมเป็นส่วนๆ
  const parsedAddress = customerData?.cus_address 
    ? parseFullAddress(customerData.cus_address)
    : {
        address: '',
        subdistrict: '',
        district: '',
        province: '',
        zipCode: ''
      };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: '#B20000' }}>
        📍 ตัวอย่างการแสดงที่อยู่แยกส่วน
      </Typography>
      
      {/* แสดงที่อยู่ต้นฉบับ */}
      <Box sx={{ mb: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          📄 ที่อยู่ต้นฉบับ (จากฐานข้อมูล):
        </Typography>
        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
          {customerData?.cus_address || 'ไม่มีข้อมูลที่อยู่'}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* แสดงที่อยู่แยกส่วน */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        🔍 ที่อยู่แยกส่วน (ผลจาก parseFullAddress):
      </Typography>
      
      <Box sx={{ display: 'grid', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120, color: '#333' }}>
            🏠 ที่อยู่:
          </Typography>
          <Typography variant="body2">
            {parsedAddress.address || '-'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120, color: '#333' }}>
            🏛️ ตำบล/แขวง:
          </Typography>
          <Typography variant="body2">
            {parsedAddress.subdistrict || '-'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120, color: '#333' }}>
            🏘️ อำเภอ/เขต:
          </Typography>
          <Typography variant="body2">
            {parsedAddress.district || '-'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120, color: '#333' }}>
            🗺️ จังหวัด:
          </Typography>
          <Typography variant="body2">
            {parsedAddress.province || '-'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120, color: '#333' }}>
            📮 รหัสไปรษณีย์:
          </Typography>
          <Typography variant="body2">
            {parsedAddress.zipCode || '-'}
          </Typography>
        </Box>
      </Box>

      {/* แสดง Debug Information */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ p: 1, backgroundColor: '#fff3cd', borderRadius: 1, border: '1px solid #ffeaa7' }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#856404' }}>
          🐛 Debug Info:
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: '#856404', mt: 1 }}>
          {JSON.stringify(parsedAddress, null, 2)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default CustomerAddressExample;

/**
 * วิธีใช้งาน:
 * 
 * 1. Import ฟังก์ชัน parseFullAddress:
 *    import { parseFullAddress } from './addressParser';
 * 
 * 2. ใช้ในการแสดงผลที่อยู่:
 *    const parsedAddress = parseFullAddress(customerData.cus_address);
 * 
 * 3. เข้าถึงข้อมูลแยกส่วน:
 *    - parsedAddress.address     // ที่อยู่ (เลขที่, ซอย, ถนน)
 *    - parsedAddress.subdistrict // ตำบล/แขวง
 *    - parsedAddress.district    // อำเภอ/เขต
 *    - parsedAddress.province    // จังหวัด
 *    - parsedAddress.zipCode     // รหัสไปรษณีย์
 * 
 * 4. ตัวอย่างการใช้ใน view component:
 *    <Typography>{parsedAddress.province || customerData.cus_province_text || '-'}</Typography>
 */
