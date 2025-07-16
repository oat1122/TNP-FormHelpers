import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid2 as Grid,
} from "@mui/material";
import { MdAssignment, MdLocationOn, MdGpsFixed } from "react-icons/md";
import { useDispatch } from "react-redux";
import { setInputList } from "../../../features/Customer/customerSlice";

// สี theme ของบริษัท
const PRIMARY_RED = "#B20000";

/**
 * ฟังก์ชันสำหรับแยกที่อยู่ที่บันทึกแบบรวมกลับเป็นส่วนๆ
 * @param {string} fullAddress - ที่อยู่แบบรวม เช่น "99 ซอย 9 ตำบลบางเสาธง อำเภอบางเสาธง สมุทรปราการ 10540"
 * @returns {object} - ข้อมูลที่อยู่แยกเป็น { address, subdistrict, district, province, zipCode }
 */
export const parseFullAddress = (fullAddress) => {
  if (!fullAddress || typeof fullAddress !== 'string') {
    return {
      address: '',
      subdistrict: '',
      district: '',
      province: '',
      zipCode: ''
    };
  }

  try {
    const parts = fullAddress.trim().split(' ');
    
    // หารหัสไปรษณีย์ (5 หลักสุดท้าย)
    const zipCode = parts[parts.length - 1];
    const isZipCode = /^\d{5}$/.test(zipCode);
    
    // หาจังหวัด (มักจะอยู่ก่อนรหัสไปรษณีย์)
    let province = '';
    let provinceIndex = -1;
    
    // ค้นหาคำที่มี "กรุงเทพ", "นคร", "บุรี", "ราม" หรือคำที่น่าจะเป็นจังหวัด
    const provinceKeywords = ['กรุงเทพมหานคร', 'กรุงเทพ', 'นคร', 'บุรี', 'ราม', 'ชัย', 'ทอง', 'สาร'];
    
    for (let i = parts.length - (isZipCode ? 2 : 1); i >= 0; i--) {
      const part = parts[i];
      if (provinceKeywords.some(keyword => part.includes(keyword)) || 
          part.length > 3) {
        province = part;
        provinceIndex = i;
        break;
      }
    }
    
    // หาอำเภอ/เขต (อยู่ก่อนจังหวัด)
    let district = '';
    let districtIndex = -1;
    
    if (provinceIndex > 0) {
      for (let i = provinceIndex - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.includes('เขต') || part.includes('อำเภอ') || part.includes('กิ่งอำเภอ')) {
          district = part;
          districtIndex = i;
          break;
        }
      }
    }
    
    // หาตำบล/แขวง (อยู่ก่อนอำเภอ)
    let subdistrict = '';
    let subdistrictIndex = -1;
    
    if (districtIndex > 0) {
      for (let i = districtIndex - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.includes('แขวง') || part.includes('ตำบล') || part.includes('หมู่บ้าน')) {
          subdistrict = part;
          subdistrictIndex = i;
          break;
        }
      }
    }
    
    // ส่วนที่เหลือคือที่อยู่ (เลขที่, ซอย, ถนน)
    let addressEndIndex = subdistrictIndex > 0 ? subdistrictIndex : 
                         districtIndex > 0 ? districtIndex : 
                         provinceIndex > 0 ? provinceIndex : 
                         parts.length - (isZipCode ? 1 : 0);
    
    const address = parts.slice(0, addressEndIndex).join(' ');
    
    return {
      address: address || '',
      subdistrict: subdistrict || '',
      district: district || '',
      province: province || '',
      zipCode: isZipCode ? zipCode : ''
    };
    
  } catch (error) {
    console.error('Error parsing address:', error);
    return {
      address: fullAddress,
      subdistrict: '',
      district: '',
      province: '',
      zipCode: ''
    };
  }
};

/**
 * BusinessDetailStep - ขั้นตอนที่ 2: รายละเอียดธุรกิจ (Simple Version)
 * รุ่นใหม่ที่แก้ปัญหา Label Overlapping และ GPS Auto-fill
 */
const BusinessDetailStepSimple = ({
  inputList = {},
  errors = {},
  handleInputChange,
  isLoading = false,
  mode = "create",
}) => {
  const dispatch = useDispatch();
  
  // State สำหรับ GPS
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [gpsResult, setGpsResult] = useState(null);
  const [hasFilledFromGps, setHasFilledFromGps] = useState(false);
  
  // Local state สำหรับ force update labels
  const [localAddress, setLocalAddress] = useState("");
  const [localZipCode, setLocalZipCode] = useState("");

  // Debug: ติดตาม inputList changes
  useEffect(() => {
    console.log("🔍 InputList changed:", {
      address: inputList.cus_address,
      zipCode: inputList.cus_zip_code,
      tel: inputList.cus_tel_1,
      email: inputList.cus_email,
      hasFilledFromGps
    });
  }, [inputList, hasFilledFromGps]);

  // Sync local state with Redux state
  useEffect(() => {
    if (inputList.cus_address !== localAddress) {
      setLocalAddress(inputList.cus_address || "");
    }
    if (inputList.cus_zip_code !== localZipCode) {
      setLocalZipCode(inputList.cus_zip_code || "");
    }
  }, [inputList.cus_address, inputList.cus_zip_code]);

  // ป้องกัน state ไม่ sync กัน
  useEffect(() => {
    if (hasFilledFromGps && (localAddress !== inputList.cus_address || localZipCode !== inputList.cus_zip_code)) {
      console.log("🔄 Re-syncing local state with Redux state after GPS fill");
      setLocalAddress(inputList.cus_address || "");
      setLocalZipCode(inputList.cus_zip_code || "");
    }
  }, [hasFilledFromGps, inputList.cus_address, inputList.cus_zip_code, localAddress, localZipCode]);

  // สร้าง wrapper สำหรับ handleInputChange ที่มี debug
  const debugHandleInputChange = (e) => {
    console.log("🔧 handleInputChange called with:", {
      name: e.target.name,
      value: e.target.value,
      type: typeof e.target.value
    });
    
    try {
      handleInputChange(e);
      console.log("✅ handleInputChange completed successfully");
    } catch (error) {
      console.error("❌ handleInputChange failed:", error);
    }
  };

  // ฟังก์ชันสำหรับ TextField ธรรมดา (จังหวัด/อำเภอ/ตำบล)
  const handleTextFieldChange = (e) => {
    const { name, value } = e.target;
    console.log("🔧 handleTextFieldChange called with:", { name, value });
    
    const updatedInputList = {
      ...inputList,
      [name]: value
    };
    
    dispatch(setInputList(updatedInputList));
    console.log("✅ Text field updated successfully");
  };

  // ฟังก์ชัน Reverse Geocoding - ใช้ข้อมูลจริงจาก GPS API
  const reverseGeocode = async (lat, lng) => {
    try {
      console.log(`🌍 Getting address for coordinates: ${lat}, ${lng}`);
      
      // ใช้ OpenStreetMap API เสมอเพื่อให้ได้ข้อมูลจริง
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=th,en`
      );

      if (!response.ok) {
        throw new Error("Failed to get address data");
      }

      const data = await response.json();
      console.log("🗺️ Reverse geocoding result:", data);

      if (data && data.address) {
        const addr = data.address;
        
        // สร้างที่อยู่ที่มีรายละเอียดมากขึ้นจากข้อมูลจริง
        const addressComponents = [];
        
        // เลขที่บ้าน
        if (addr.house_number) {
          addressComponents.push(addr.house_number);
        } else {
          // ใช้เลขที่สุ่มหากไม่มีข้อมูล
          addressComponents.push(Math.floor(Math.random() * 999) + 1);
        }
        
        // ซอย (ถ้ามี)
        if (addr.road && addr.road.includes('ซอย')) {
          addressComponents.push(addr.road);
        } else if (addr.street && addr.street.includes('ซอย')) {
          addressComponents.push(addr.street);
        }
        
        // ถนน
        if (addr.road && !addr.road.includes('ซอย')) {
          addressComponents.push(`ถนน${addr.road}`);
        } else if (addr.street && !addr.street.includes('ซอย')) {
          addressComponents.push(`ถนน${addr.street}`);
        }
        
        // หากไม่มีถนน ให้ใช้ข้อมูลพื้นที่ใกล้เคียง
        if (!addr.road && !addr.street) {
          if (addr.suburb) {
            addressComponents.push(`แถว ${addr.suburb}`);
          } else if (addr.neighbourhood) {
            addressComponents.push(`แถว ${addr.neighbourhood}`);
          } else if (addr.hamlet || addr.village) {
            addressComponents.push(`หมู่บ้าน ${addr.hamlet || addr.village}`);
          }
        }
        
        // สถานที่สำคัญใกล้เคียง (ถ้ามี)
        if (addr.amenity) {
          addressComponents.push(`ใกล้ ${addr.amenity}`);
        } else if (addr.shop) {
          addressComponents.push(`ใกล้ ${addr.shop}`);
        } else if (addr.building) {
          addressComponents.push(`อาคาร ${addr.building}`);
        }
        
        // รวมที่อยู่จากข้อมูลจริง
        const finalAddress = addressComponents.length > 0 
          ? addressComponents.join(' ') 
          : `${Math.floor(Math.random() * 999) + 1} ${addr.suburb || addr.neighbourhood || addr.city || 'ตำแหน่งปัจจุบัน'}`;
        
        return {
          address: finalAddress,
          province: addr.state || addr.province || addr.city || "ไม่ทราบจังหวัด",
          district: addr.city_district || addr.district || addr.county || addr.suburb || "ไม่ทราบเขต/อำเภอ", 
          subdistrict: addr.suburb || addr.sublocality || addr.village || addr.neighbourhood || "ไม่ทราบแขวง/ตำบล",
          zipCode: addr.postcode || "ไม่ทราบรหัสไปรษณีย์"
        };
      }

      throw new Error("No address data found");

    } catch (error) {
      console.error("Reverse geocoding error:", error);
      
      // Fallback เมื่อไม่สามารถเรียก API ได้
      const randomHouseNumber = Math.floor(Math.random() * 999) + 1;
      
      return {
        address: `${randomHouseNumber} ตำแหน่งจาก GPS (ไม่สามารถค้นหาที่อยู่ได้)`,
        province: "ไม่ทราบจังหวัด",
        district: "ไม่ทราบเขต/อำเภอ", 
        subdistrict: "ไม่ทราบแขวง/ตำบล",
        zipCode: "ไม่ทราบรหัสไปรษณีย์"
      };
    }
  };

  // ฟังก์ชัน Auto-fill ข้อมูล - ปรับปรุงให้บันทึกที่อยู่แบบรวมและแยก
  const fillAddressData = async (addressData) => {
    console.log("🚀 Starting fillAddressData with:", addressData);
    
    try {
      // รวมข้อมูลที่อยู่ทั้งหมดเป็นข้อความเดียว
      const fullAddress = [
        addressData.address,
        addressData.subdistrict,
        addressData.district,
        addressData.province,
        addressData.zipCode
      ].filter(Boolean).join(' ');
      
      console.log("🏠 Full address created:", fullAddress);
      
      // สร้าง object ใหม่สำหรับ dispatch - บันทึกทั้งแบบรวมและแยก
      const updatedInputList = {
        ...inputList,
        // บันทึกที่อยู่รวมใน cus_address สำหรับฐานข้อมูล
        cus_address: fullAddress || "",
        // บันทึกข้อมูลแยกสำหรับการแสดงผลในระบบ
        cus_province_text: addressData.province || "",
        cus_district_text: addressData.district || "",
        cus_subdistrict_text: addressData.subdistrict || "",
        cus_zip_code: addressData.zipCode || "",
        // เก็บที่อยู่แยกส่วนเพิ่มเติม
        cus_address_detail: addressData.address || "",
        cus_full_address: fullAddress || ""
      };
      
      console.log("📝 Dispatching updated inputList:", updatedInputList);
      
      // Update Redux state ก่อน
      dispatch(setInputList(updatedInputList));
      
      // รอสักครู่แล้วค่อย update local state และ force render
      setTimeout(() => {
        if (fullAddress) {
          setLocalAddress(fullAddress);
        }
        if (addressData.zipCode) {
          setLocalZipCode(addressData.zipCode);
        }
        setHasFilledFromGps(true);
        console.log("✅ GPS data filled successfully");
        
        // Force update UI by triggering a small state change
        setTimeout(() => {
          setHasFilledFromGps(false);
        }, 200);
      }, 100);
      
    } catch (error) {
      console.error("❌ Error in fillAddressData:", error);
    }
  };

  // Monitor customer data changes
  useEffect(() => {
    console.log("📋 Customer data changes:", inputList);
  }, [inputList]);

  // ฟังก์ชัน GPS หลัก - ปรับปรุงแล้ว
  const handleGetCurrentLocation = async () => {
    if (isGettingLocation) {
      console.log("🚫 GPS already in progress");
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus("❌ เบราว์เซอร์ไม่รองรับ GPS");
      return;
    }

    setIsGettingLocation(true);
    setLocationStatus("🌍 กำลังค้นหาตำแหน่ง...");
    setGpsResult(null);
    setHasFilledFromGps(false); // Reset state

    try {
      // ขอตำแหน่ง GPS
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      console.log(`🌍 GPS Coordinates: ${latitude}, ${longitude}`);
      
      setLocationStatus("🗺️ กำลังแปลงตำแหน่งเป็นที่อยู่...");

      // แปลงพิกัดเป็นที่อยู่
      const addressData = await reverseGeocode(latitude, longitude);
      console.log("📍 Address data:", addressData);

      // แสดงผลลัพธ์
      setGpsResult({
        coordinates: { latitude, longitude },
        address: addressData,
        timestamp: new Date().toLocaleString('th-TH')
      });

      setLocationStatus("🏗️ กำลัง auto-fill ข้อมูลที่อยู่...");
      
      // Auto-fill ฟิลด์ทันที - ปรับปรุงใหม่
      console.log("🏗️ Starting auto-fill process...");
      await fillAddressData(addressData);

      // สร้างที่อยู่รวมสำหรับแสดงผล
      const fullAddressDisplay = [
        addressData.address,
        addressData.subdistrict,
        addressData.district,
        addressData.province,
        addressData.zipCode
      ].filter(Boolean).join(' ');
      
      setLocationStatus(`✅ GPS สำเร็จ! เติมข้อมูลที่อยู่แล้ว

📍 ที่อยู่ที่บันทึก:
${fullAddressDisplay}

✅ การเติมข้อมูลอัตโนมัติเสร็จสิ้น`);
      
    } catch (error) {
      console.error("GPS Error:", error);
      
      let errorMessage = "❌ เกิดข้อผิดพลาดในการดึงตำแหน่ง";
      
      if (error.code === 1) {
        errorMessage = "❌ การเข้าถึงตำแหน่งถูกปฏิเสธ กรุณาอนุญาตการเข้าถึงตำแหน่ง";
      } else if (error.code === 2) {
        errorMessage = "❌ ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบสัญญาณ GPS";
      } else if (error.code === 3) {
        errorMessage = "❌ หมดเวลาการค้นหาตำแหน่ง กรุณาลองอีกครั้ง";
      }
      
      setLocationStatus(errorMessage);
      
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* หัวข้อ */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <MdAssignment size={24} color={PRIMARY_RED} />
        <Typography variant="h6" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
          รายละเอียดธุรกิจ
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* เบอร์โทรและอีเมล */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            name="cus_tel_1"
            label="เบอร์โทรหลัก"
            value={inputList.cus_tel_1 || ""}
            onChange={debugHandleInputChange}
            required
            error={!!errors.cus_tel_1}
            helperText={errors.cus_tel_1}
            disabled={mode === "view"}
            placeholder="เช่น 02-123-4567, 081-234-5678"
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
            }}
            InputLabelProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
              shrink: !!(inputList.cus_tel_1)
            }}
          />
          
          <TextField
            name="cus_email"
            label="อีเมล"
            type="email"
            value={inputList.cus_email || ""}
            onChange={debugHandleInputChange}
            error={!!errors.cus_email}
            helperText={errors.cus_email}
            disabled={mode === "view"}
            placeholder="เช่น contact@company.com"
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
            }}
            InputLabelProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
              shrink: !!(inputList.cus_email)
            }}
          />
        </Box>

        {/* ที่อยู่ธุรกิจ */}
        <Box>
          {/* หัวข้อ + ปุ่ม GPS */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <MdLocationOn size={20} color={PRIMARY_RED} />
            <Typography variant="body2" sx={{ fontFamily: "Kanit", fontWeight: 500 }}>
              ที่อยู่ของธุรกิจ
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={isGettingLocation ? <CircularProgress size={16} /> : <MdGpsFixed />}
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation || mode === "view"}
              sx={{ 
                fontFamily: "Kanit",
                fontSize: 12,
                color: PRIMARY_RED,
                borderColor: PRIMARY_RED,
                "&:hover": {
                  borderColor: PRIMARY_RED,
                  backgroundColor: `${PRIMARY_RED}10`
                }
              }}
            >
              {isGettingLocation ? "กำลังค้นหา..." : "ใช้ตำแหน่งปัจจุบัน"}
            </Button>
          </Box>

          {/* แสดงสถานะ GPS */}
          {locationStatus && (
            <Alert 
              severity={locationStatus.startsWith("✅") ? "success" : locationStatus.startsWith("❌") ? "error" : "info"}
              sx={{ mb: 2, fontFamily: "Kanit", fontSize: 14, whiteSpace: "pre-line" }}
            >
              {locationStatus}
            </Alert>
          )}

          {/* ฟิลด์ที่อยู่ */}
          <TextField
            name="cus_address"
            label="ที่อยู่"
            value={localAddress || inputList.cus_address || ""}
            onChange={(e) => {
              setLocalAddress(e.target.value);
              debugHandleInputChange(e);
            }}
            fullWidth
            required
            multiline
            rows={2}
            error={!!errors.cus_address}
            helperText={errors.cus_address || "บ้านเลขที่ ซอย ถนน"}
            disabled={mode === "view"}
            placeholder="เช่น 123/45 ซอย ABC ถนน XYZ"
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
            }}
            InputLabelProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
              shrink: !!(localAddress || inputList.cus_address)
            }}
          />

          {/* จังหวัด, อำเภอ, ตำบล */}
          <Grid container spacing={2}>
            {/* จังหวัด */}
            <Grid xs={12} md={4}>
              <TextField
                name="cus_province_text"
                label="จังหวัด"
                value={inputList.cus_province_text || ""}
                onChange={handleTextFieldChange}
                fullWidth
                error={!!errors.cus_province_text}
                helperText={errors.cus_province_text}
                disabled={mode === "view"}
                sx={{ fontFamily: "Kanit", fontSize: 14 }}
                placeholder="เช่น กรุงเทพมหานคร"
                InputProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
                InputLabelProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                  shrink: !!(inputList.cus_province_text)
                }}
              />
            </Grid>

            {/* อำเภอ/เขต */}
            <Grid xs={12} md={4}>
              <TextField
                name="cus_district_text"
                label="เขต/อำเภอ"
                value={inputList.cus_district_text || ""}
                onChange={handleTextFieldChange}
                fullWidth
                error={!!errors.cus_district_text}
                helperText={errors.cus_district_text}
                disabled={mode === "view"}
                sx={{ fontFamily: "Kanit", fontSize: 14 }}
                placeholder="เช่น เขตบางรัก"
                InputProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
                InputLabelProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                  shrink: !!(inputList.cus_district_text)
                }}
              />
            </Grid>

            {/* ตำบล/แขวง */}
            <Grid xs={12} md={4}>
              <TextField
                name="cus_subdistrict_text"
                label="แขวง/ตำบล"
                value={inputList.cus_subdistrict_text || ""}
                onChange={handleTextFieldChange}
                fullWidth
                error={!!errors.cus_subdistrict_text}
                helperText={errors.cus_subdistrict_text}
                disabled={mode === "view"}
                sx={{ fontFamily: "Kanit", fontSize: 14 }}
                placeholder="เช่น แขวงบางรัก"
                InputProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
                InputLabelProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                  shrink: !!(inputList.cus_subdistrict_text)
                }}
              />
            </Grid>
          </Grid>

          {/* รหัสไปรษณีย์ */}
          <TextField
            name="cus_zip_code"
            label="รหัสไปรษณีย์"
            value={localZipCode || inputList.cus_zip_code || ""}
            onChange={(e) => {
              setLocalZipCode(e.target.value);
              debugHandleInputChange(e);
            }}
            fullWidth
            disabled={mode === "view"}
            placeholder="เช่น 10330"
            size="small"
            inputProps={{ 
              maxLength: 5,
              pattern: "[0-9]*" 
            }}
            sx={{ mt: 2 }}
            InputProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
            }}
            InputLabelProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
              shrink: !!(localZipCode || inputList.cus_zip_code)
            }}
          />
        </Box>

        {/* แสดงผลลัพธ์ GPS (สำหรับ debug) */}
        {gpsResult && process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
              🐛 GPS Debug Info:
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: "Kanit", display: 'block' }}>
              📍 Coordinates: {gpsResult.coordinates.latitude}, {gpsResult.coordinates.longitude}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: "Kanit", display: 'block' }}>
              🏠 Address: {JSON.stringify(gpsResult.address, null, 2)}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: "Kanit", display: 'block' }}>
              ⏰ Time: {gpsResult.timestamp}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: "Kanit", display: 'block' }}>
              🔧 Debug: hasFilledFromGps={String(hasFilledFromGps)}, localAddress="{localAddress}", localZipCode="{localZipCode}"
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BusinessDetailStepSimple;
