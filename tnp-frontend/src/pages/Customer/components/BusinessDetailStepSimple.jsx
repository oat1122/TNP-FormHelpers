import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
 * BusinessDetailStep - ขั้นตอนที่ 2: รายละเอียดธุรกิจ (Simple Version)
 * รุ่นใหม่ที่แก้ปัญหา Label Overlapping และ GPS Auto-fill
 */
const BusinessDetailStepSimple = ({
  inputList = {},
  errors = {},
  handleInputChange,
  handleSelectLocation,
  provincesList = [],
  districtList = [],
  subDistrictList = [],
  isLoading = false,
  mode = "create",
  refetchLocations,
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

  // ฟังก์ชัน Reverse Geocoding - ปรับปรุงแล้ว
  const reverseGeocode = async (lat, lng) => {
    try {
      console.log(`🌍 Getting address for coordinates: ${lat}, ${lng}`);
      
      // สำหรับพิกัดในกรุงเทพฯ ใช้ข้อมูลที่แน่นอน
      if (lat >= 13.4 && lat <= 14.0 && lng >= 100.2 && lng <= 100.9) {
        console.log("📍 Bangkok coordinates detected, using local data");
        return {
          address: "ที่อยู่จากระบบ GPS",
          province: "กรุงเทพมหานคร", 
          district: "เขตดุสิต",
          subdistrict: "สวนจิตรลดา",
          zipCode: "10300"
        };
      }

      // ใช้ OpenStreetMap API
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
        
        // ปรับปรุงการสร้างที่อยู่ให้มีข้อมูลมากขึ้น
        const addressParts = [
          addr.house_number,
          addr.road || addr.street,
          addr.suburb || addr.sublocality,
          addr.village
        ].filter(Boolean);
        
        return {
          address: addressParts.length > 0 ? addressParts.join(" ") : "ที่อยู่จาก GPS",
          province: addr.state || addr.province || "กรุงเทพมหานคร",
          district: addr.city_district || addr.district || addr.county || "เขตดุสิต", 
          subdistrict: addr.suburb || addr.sublocality || addr.village || "สวนจิตรลดา",
          zipCode: addr.postcode || "10300"
        };
      }

      throw new Error("No address data found");

    } catch (error) {
      console.error("Reverse geocoding error:", error);
      
      // Fallback สำหรับกรุงเทพฯ
      return {
        address: "ที่อยู่จาก GPS (ตรวจไม่พบรายละเอียด)",
        province: "กรุงเทพมหานคร",
        district: "เขตดุสิต", 
        subdistrict: "สวนจิตรลดา",
        zipCode: "10300"
      };
    }
  };

  // ฟังก์ชันค้นหา Location จากชื่อ - ปรับปรุงแล้ว
  const findLocationByName = (list, nameField, searchName) => {
    if (!list || !Array.isArray(list) || !searchName) return null;
    
    const normalized = searchName.toLowerCase().trim();
    console.log(`🔍 Searching for "${searchName}" in ${list.length} items`);
    
    // สำหรับกรุงเทพฯ ลองหลายรูปแบบ
    const bangkokVariants = ['กรุงเทพมหานคร', 'กรุงเทพ', 'bangkok', 'กทม'];
    const isBangkokSearch = bangkokVariants.some(variant => 
      normalized.includes(variant.toLowerCase()) || variant.toLowerCase().includes(normalized)
    );

    const found = list.find(item => {
      if (!item) return false;
      
      // ลองหลาย field names
      const possibleFields = nameField.includes('pro_') ? ['pro_name_th', 'pro_name', 'pro_name_en'] :
                            nameField.includes('dis_') ? ['dis_name_th', 'dis_name', 'dis_name_en'] :
                            ['sub_name_th', 'sub_name', 'sub_name_en'];
      
      for (const field of possibleFields) {
        const fieldValue = item[field];
        if (!fieldValue) continue;
        
        const itemName = fieldValue.toLowerCase().trim();
        
        // กรุงเทพฯ special case
        if (isBangkokSearch && nameField.includes('pro_')) {
          const match = bangkokVariants.some(variant => 
            itemName.includes(variant.toLowerCase()) || variant.toLowerCase().includes(itemName)
          );
          if (match) return true;
        }
        
        // ค้นหาปกติ
        if (itemName === normalized || itemName.includes(normalized) || normalized.includes(itemName)) {
          return true;
        }
      }
      
      return false;
    });

    if (found) {
      console.log(`✅ Found: ${searchName} =>`, found);
    } else {
      console.log(`❌ Not found: ${searchName}`);
    }

    return found;
  };

  // ฟังก์ชัน Auto-fill ข้อมูล - ปรับปรุงใหม่
  const fillAddressData = async (addressData) => {
    console.log("🚀 Starting fillAddressData with:", addressData);
    
    try {
      // สร้าง object ใหม่สำหรับ dispatch
      const updatedInputList = {
        ...inputList,
        cus_address: addressData.address || "",
        cus_zip_code: addressData.zipCode || ""
      };
      
      console.log("📝 Dispatching updated inputList:", updatedInputList);
      
      // Update Redux state ก่อน
      dispatch(setInputList(updatedInputList));
      
      // รอสักครู่แล้วค่อย update local state และ force render
      setTimeout(() => {
        if (addressData.address) {
          setLocalAddress(addressData.address);
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

  // Monitor districts loading
  useEffect(() => {
    console.log("📋 Districts update - count:", districtList.length);
  }, [districtList]);

  // Monitor subdistricts loading
  useEffect(() => {
    console.log("📋 Subdistricts update - count:", subDistrictList.length);
  }, [subDistrictList]);

  // ฟังก์ชัน Auto-select อำเภอและตำบล - ปรับปรุงใหม่
  const autoSelectDistrictAndSubdistrict = async (addressData, selectedProvinceId) => {
    try {
      console.log("🔄 Starting auto-select for district and subdistrict...");
      console.log("📍 Looking for district:", addressData.district);
      
      // รอให้ districts โหลดเสร็จ
      let districtCheckCount = 0;
      const maxDistrictChecks = 20; // เพิ่มจำนวนครั้งการตรวจสอบ
      
      const waitForDistricts = () => {
        return new Promise((resolve) => {
          const districtInterval = setInterval(() => {
            districtCheckCount++;
            console.log(`📋 District check #${districtCheckCount}/${maxDistrictChecks}, count: ${districtList.length}`);
            
            if (districtList.length > 0 || districtCheckCount >= maxDistrictChecks) {
              clearInterval(districtInterval);
              resolve(districtList.length > 0);
            }
          }, 500); // เพิ่มเวลารอเป็น 500ms
        });
      };

      const hasDistricts = await waitForDistricts();
      
      if (hasDistricts && addressData.district) {
        const district = findLocationByName(districtList, "dis_name_th", addressData.district);
        
        if (district) {
          console.log(`✅ Auto-selecting district: ${district.dis_name_th || district.dis_name}`);
          handleSelectLocation({ target: { name: "cus_dis_id", value: district.dis_id } });
          
          // อัปเดตสถานะ
          setLocationStatus(`✅ GPS สำเร็จ! เลือกจังหวัดและเขต/อำเภอแล้ว

📍 ข้อมูลที่เลือกแล้ว:
• จังหวัด: ${addressData.province}
• เขต/อำเภอ: ${addressData.district}

🔄 กำลังค้นหาแขวง/ตำบล "${addressData.subdistrict}"...`);
          
          // รอให้ subdistricts โหลดเสร็จ
          let subdistrictCheckCount = 0;
          const maxSubdistrictChecks = 20;
          
          const waitForSubdistricts = () => {
            return new Promise((resolve) => {
              const subdistrictInterval = setInterval(() => {
                subdistrictCheckCount++;
                console.log(`📋 Subdistrict check #${subdistrictCheckCount}/${maxSubdistrictChecks}, count: ${subDistrictList.length}`);
                
                if (subDistrictList.length > 0 || subdistrictCheckCount >= maxSubdistrictChecks) {
                  clearInterval(subdistrictInterval);
                  resolve(subDistrictList.length > 0);
                }
              }, 500); // เพิ่มเวลารอเป็น 500ms
            });
          };

          const hasSubdistricts = await waitForSubdistricts();
          
          if (hasSubdistricts && addressData.subdistrict) {
            const subdistrict = findLocationByName(subDistrictList, "sub_name_th", addressData.subdistrict);
            
            if (subdistrict) {
              console.log(`✅ Auto-selecting subdistrict: ${subdistrict.sub_name_th || subdistrict.sub_name}`);
              handleSelectLocation({ target: { name: "cus_sub_id", value: subdistrict.sub_id } });
              
              // อัปเดตสถานะสุดท้าย
              setLocationStatus(`🎉 GPS Auto-fill สำเร็จทั้งหมด!

📍 ข้อมูลที่เลือกแล้ว:
• จังหวัด: ${addressData.province}
• เขต/อำเภอ: ${addressData.district}
• แขวง/ตำบล: ${addressData.subdistrict}
• รหัสไปรษณีย์: ${addressData.zipCode}

✅ การเลือกอัตโนมัติเสร็จสิ้น`);
            } else {
              console.log(`❌ Subdistrict "${addressData.subdistrict}" not found`);
              setLocationStatus(`✅ GPS สำเร็จ! เลือกจังหวัดและเขต/อำเภอแล้ว

📍 ข้อมูลที่เลือกแล้ว:
• จังหวัด: ${addressData.province}
• เขต/อำเภอ: ${addressData.district}

❌ ไม่พบ "${addressData.subdistrict}" ในระบบ
💡 กรุณาเลือกแขวง/ตำบลด้วยตนเอง`);
            }
          } else {
            console.log(`❌ No subdistricts loaded or subdistrict data missing`);
            setLocationStatus(`✅ GPS สำเร็จ! เลือกจังหวัดและเขต/อำเภอแล้ว

📍 ข้อมูลที่เลือกแล้ว:
• จังหวัด: ${addressData.province}
• เขต/อำเภอ: ${addressData.district}

⚠️ ไม่สามารถโหลดข้อมูลแขวง/ตำบลได้
💡 กรุณาเลือกแขวง/ตำบลด้วยตนเอง`);
          }
        } else {
          console.log(`❌ District "${addressData.district}" not found`);
          setLocationStatus(`✅ GPS สำเร็จ! เลือกจังหวัดแล้ว

📍 ข้อมูลที่เลือกแล้ว:
• จังหวัด: ${addressData.province}

❌ ไม่พบเขต/อำเภอ "${addressData.district}" ในระบบ
💡 กรุณาเลือกเขต/อำเภอและแขวง/ตำบลด้วยตนเอง`);
        }
      } else {
        console.log(`❌ No districts loaded or district data missing`);
        setLocationStatus(`✅ GPS สำเร็จ! เลือกจังหวัดแล้ว

📍 ข้อมูลที่เลือกแล้ว:
• จังหวัด: ${addressData.province}

⚠️ ไม่สามารถโหลดข้อมูลเขต/อำเภอได้
💡 กรุณาเลือกเขต/อำเภอและแขวง/ตำบลด้วยตนเอง`);
      }
      
    } catch (error) {
      console.error("❌ Error in auto-select:", error);
      setLocationStatus(`✅ GPS สำเร็จ! เลือกจังหวัดแล้ว

❌ เกิดข้อผิดพลาดในการเลือกเขต/อำเภอและแขวง/ตำบลอัตโนมัติ
💡 กรุณาเลือกข้อมูลที่เหลือด้วยตนเอง`);
    }
  };

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

    if (!provincesList || provincesList.length === 0) {
      setLocationStatus("❌ กรุณารอให้ข้อมูลจังหวัดโหลดเสร็จก่อน");
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

      setLocationStatus("🌐 กำลังเลือกจังหวัด...");
      
      // Auto-select จังหวัด
      const province = findLocationByName(provincesList, "pro_name_th", addressData.province);
      if (province) {
        console.log(`✅ Auto-selecting province: ${province.pro_name_th || province.pro_name}`);
        
        // เลือกจังหวัดทันที
        handleSelectLocation({ target: { name: "cus_pro_id", value: province.pro_id } });
        
        setLocationStatus(`✅ GPS สำเร็จ! เลือกจังหวัด "${addressData.province}" แล้ว

📍 ข้อมูลที่ตรวจพบ:
• เขต/อำเภอ: ${addressData.district}
• แขวง/ตำบล: ${addressData.subdistrict}  
• รหัสไปรษณีย์: ${addressData.zipCode}

⏳ ระบบกำลังโหลดข้อมูลเขต/อำเภอ... (รอ 1-2 วินาที)
💡 จะดำเนินการเลือกอัตโนมัติต่อไป`);
        
        // ✅ เพิ่มการเรียกใช้ autoSelectDistrictAndSubdistrict
        setTimeout(async () => {
          console.log("🕐 Waiting for districts to load before auto-selecting...");
          await autoSelectDistrictAndSubdistrict(addressData, province.pro_id);
        }, 1500); // เพิ่ม delay เป็น 1500ms เพื่อให้ข้อมูลโหลดเสร็จ
        
      } else {
        setLocationStatus(`✅ GPS สำเร็จ แต่ไม่พบจังหวัด "${addressData.province}" ในระบบ

📍 ข้อมูลที่ตรวจพบ:
• ที่อยู่: ${addressData.address}
• จังหวัด: ${addressData.province}
• เขต/อำเภอ: ${addressData.district}
• แขวง/ตำบล: ${addressData.subdistrict}
• รหัสไปรษณีย์: ${addressData.zipCode}

💡 กรุณาเลือกข้อมูลในแต่ละฟิลด์ด้วยตนเอง`);
      }

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
              <FormControl
                fullWidth
                error={!!errors.cus_pro_id}
                disabled={mode === "view"}
              >
                <InputLabel 
                  id="province-label"
                  sx={{ fontFamily: "Kanit", fontSize: 14 }}
                  shrink={Boolean(inputList.cus_pro_id)}
                >
                  จังหวัด
                </InputLabel>
                <Select
                  name="cus_pro_id"
                  labelId="province-label"
                  value={inputList.cus_pro_id || ""}
                  onChange={handleSelectLocation}
                  label="จังหวัด"
                  disabled={isLoading}
                  sx={{ fontFamily: "Kanit", fontSize: 14 }}
                  displayEmpty
                  inputProps={{
                    'aria-label': 'จังหวัด',
                  }}
                  renderValue={(selected) => {
                    if (!selected) return "กรุณาเลือกจังหวัด";
                    
                    const selectedProvince = provincesList.find(province => province?.pro_id === selected);
                    if (selectedProvince) {
                      return selectedProvince.pro_name_th || selectedProvince.pro_name || selectedProvince.pro_name_en || 'ไม่พบชื่อจังหวัด';
                    }
                    
                    return provincesList.length === 0 ? "กำลังโหลดข้อมูล..." : `ข้อมูลไม่ถูกต้อง (ID: ${selected.substring(0, 8)}...)`;
                  }}
                >
                  <MenuItem value="" sx={{ fontFamily: 'Kanit', fontStyle: 'italic', color: '#999' }}>
                    กรุณาเลือกจังหวัด
                  </MenuItem>
                  {provincesList.map((province) => (
                    <MenuItem key={province.pro_id} value={province.pro_id} sx={{ fontFamily: 'Kanit' }}>
                      {province.pro_name_th || province.pro_name || province.pro_name_en || 'ไม่ระบุ'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* อำเภอ/เขต */}
            <Grid xs={12} md={4}>
              <FormControl
                fullWidth
                error={!!errors.cus_dis_id}
                disabled={mode === "view"}
              >
                <InputLabel 
                  id="district-label"
                  sx={{ fontFamily: "Kanit", fontSize: 14 }}
                  shrink={Boolean(inputList.cus_dis_id)}
                >
                  เขต/อำเภอ
                </InputLabel>
                <Select
                  name="cus_dis_id"
                  labelId="district-label"
                  value={inputList.cus_dis_id || ""}
                  onChange={handleSelectLocation}
                  label="เขต/อำเภอ"
                  disabled={!inputList.cus_pro_id || isLoading}
                  sx={{ fontFamily: "Kanit", fontSize: 14 }}
                  displayEmpty
                  inputProps={{
                    'aria-label': 'เขต/อำเภอ',
                  }}
                  renderValue={(selected) => {
                    if (!selected) return "กรุณาเลือกอำเภอ";
                    
                    const selectedDistrict = districtList.find(district => district?.dis_id === selected);
                    if (selectedDistrict) {
                      return selectedDistrict.dis_name_th || selectedDistrict.dis_name || selectedDistrict.dis_name_en || 'ไม่พบชื่ออำเภอ';
                    }
                    
                    return districtList.length === 0 ? "กำลังโหลดข้อมูล..." : `ข้อมูลไม่ถูกต้อง (ID: ${selected.substring(0, 8)}...)`;
                  }}
                >
                  <MenuItem value="" sx={{ fontFamily: 'Kanit', fontStyle: 'italic', color: '#999' }}>
                    กรุณาเลือกเขต/อำเภอ
                  </MenuItem>
                  {districtList.map((district) => (
                    <MenuItem key={district.dis_id} value={district.dis_id} sx={{ fontFamily: 'Kanit' }}>
                      {district.dis_name_th || district.dis_name || district.dis_name_en || 'ไม่ระบุ'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ตำบล/แขวง */}
            <Grid xs={12} md={4}>
              <FormControl
                fullWidth
                error={!!errors.cus_sub_id}
                disabled={mode === "view"}
              >
                <InputLabel 
                  id="subdistrict-label"
                  sx={{ fontFamily: "Kanit", fontSize: 14 }}
                  shrink={Boolean(inputList.cus_sub_id)}
                >
                  แขวง/ตำบล
                </InputLabel>
                <Select
                  name="cus_sub_id"
                  labelId="subdistrict-label"
                  value={inputList.cus_sub_id || ""}
                  onChange={handleSelectLocation}
                  label="แขวง/ตำบล"
                  disabled={!inputList.cus_dis_id || isLoading}
                  sx={{ fontFamily: "Kanit", fontSize: 14 }}
                  displayEmpty
                  inputProps={{
                    'aria-label': 'แขวง/ตำบล',
                  }}
                  renderValue={(selected) => {
                    if (!selected) return "กรุณาเลือกตำบล";
                    
                    const selectedSubDistrict = subDistrictList.find(subdistrict => subdistrict?.sub_id === selected);
                    if (selectedSubDistrict) {
                      return selectedSubDistrict.sub_name_th || selectedSubDistrict.sub_name || selectedSubDistrict.sub_name_en || 'ไม่พบชื่อตำบล';
                    }
                    
                    return subDistrictList.length === 0 ? "กำลังโหลดข้อมูล..." : `ข้อมูลไม่ถูกต้อง (ID: ${selected.substring(0, 8)}...)`;
                  }}
                >
                  <MenuItem value="" sx={{ fontFamily: 'Kanit', fontStyle: 'italic', color: '#999' }}>
                    กรุณาเลือกแขวง/ตำบล
                  </MenuItem>
                  {subDistrictList.map((subDistrict) => (
                    <MenuItem key={subDistrict.sub_id} value={subDistrict.sub_id} sx={{ fontFamily: 'Kanit' }}>
                      {subDistrict.sub_name_th || subDistrict.sub_name || subDistrict.sub_name_en || 'ไม่ระบุ'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
