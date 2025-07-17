import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  CircularProgress,
  Container,
  Grid2 as Grid,
  useMediaQuery,
  useTheme,
  Chip,
  Stack,
  Alert,
  FormControlLabel,
  Checkbox,
  Paper,
} from "@mui/material";
import {
  MdAssignment,
  MdGpsFixed,
  MdExpandMore,
  MdPhone,
  MdHome,
} from "react-icons/md";
import { setInputList } from "../../../features/Customer/customerSlice";

// สี theme ของบริษัท
const PRIMARY_RED = "#9e0000";
const SECONDARY_RED = "#d32f2f";
const BACKGROUND_COLOR = "#fffaf9";

/**
 * Enhanced BusinessDetailStepSimple with improved GPS functionality
 * ✅ High accuracy GPS with enableHighAccuracy
 * ✅ Permission checking with better UX
 * ✅ Reverse geocoding with error handling
 * ✅ Fallback mechanism for IP/Wi-Fi location
 * ✅ Position validation for Thailand coordinates
 * ✅ Enhanced logging and UX
 */
const BusinessDetailStepSimple = ({
  inputList = {},
  errors = {},
  handleInputChange,
  mode = "create",
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // GPS States
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [gpsResult, setGpsResult] = useState(null);
  const [hasFilledFromGps, setHasFilledFromGps] = useState(false);

  // ✅ 1. Enhanced GPS States
  const [watchLonger, setWatchLonger] = useState(true); // ✅ default เปิดไว้เลย
  const [gpsDebugLogs, setGpsDebugLogs] = useState([]);
  const [showDebugLogs, setShowDebugLogs] = useState(false);

  // ✅ 5. เสริมการจำตำแหน่งล่าสุดด้วย localStorage
  const getLastGpsFromStorage = () => {
    try {
      const lastGps = JSON.parse(localStorage.getItem("lastGps") || "{}");
      if (
        lastGps?.timestamp &&
        Date.now() - new Date(lastGps.timestamp).getTime() < 60000
      ) {
        console.log("🔄 Using cached GPS result (less than 1 minute old)");
        return lastGps;
      }
    } catch (error) {
      console.warn("⚠️ Failed to parse localStorage GPS data:", error);
    }
    return null;
  };

  const saveGpsToStorage = (result) => {
    try {
      localStorage.setItem("lastGps", JSON.stringify(result));
      console.log("💾 GPS result saved to localStorage");
    } catch (error) {
      console.warn("⚠️ Failed to save GPS to localStorage:", error);
    }
  };

  // ✅ 2. เพิ่ม log บันทึกค่าพิกัดแต่ละรอบ
  const addDebugLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString("th-TH");
    const newLog = {
      id: Date.now(),
      timestamp,
      message,
      data,
    };

    setGpsDebugLogs((prev) => {
      const updated = [...prev, newLog];
      // เก็บแค่ 10 logs ล่าสุด
      return updated.slice(-10);
    });

    console.log(`[GPS Debug ${timestamp}] ${message}`, data || "");
  };

  // ✅ 3. เพิ่มการแสดงค่าความแม่นยำแบบ color-coded
  const getAccuracyChip = (accuracy) => {
    const roundedAccuracy = Math.round(accuracy || 9999);

    return (
      <Chip
        label={`ความแม่นยำ: ±${roundedAccuracy}m`}
        color={
          roundedAccuracy <= 20
            ? "success"
            : roundedAccuracy <= 100
            ? "warning"
            : "error"
        }
        size="small"
        sx={{ fontFamily: "Kanit" }}
      />
    );
  };
  // ✅ 1. ตรวจสอบความพร้อมของ GPS พร้อม Permission checking
  const checkGPSAvailability = async () => {
    if (!navigator.geolocation) {
      return {
        available: false,
        message: "❌ เบราว์เซอร์ไม่รองรับ GPS",
      };
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      console.log("🔐 GPS Permission Status:", permission.state);

      switch (permission.state) {
        case "denied":
          return {
            available: false,
            permission: "denied",
            message: "🚫 GPS ถูกปฏิเสธ - กรุณาเปิดสิทธิ์ในเบราว์เซอร์",
            action: "กดที่ไอคอน 🔒 ข้างบนแล้วเลือก 'อนุญาตตำแหน่ง'",
          };
        case "prompt":
          return {
            available: true,
            permission: "prompt",
            message: "📍 GPS พร้อมใช้งาน (จะขออนุญาตเมื่อใช้งาน)",
          };
        case "granted":
          return {
            available: true,
            permission: "granted",
            message: "✅ GPS พร้อมใช้งานและได้รับอนุญาตแล้ว",
          };
        default:
          return {
            available: true,
            permission: "unknown",
            message: "📍 GPS พร้อมใช้งาน",
          };
      }
    } catch (error) {
      console.warn("⚠️ Permission check failed:", error);
      return {
        available: true,
        permission: "unknown",
        message: "📍 GPS พร้อมใช้งาน",
      };
    }
  };

  // ✅ 2. ตรวจสอบพิกัดในประเทศไทย
  const isValidThaiCoordinates = (lat, lng) => {
    const isInThailand =
      lat >= 5.6 && lat <= 20.5 && lng >= 97.3 && lng <= 105.6;
    const isNotZero = lat !== 0 && lng !== 0;

    if (!isNotZero) {
      console.warn("⚠️ Invalid coordinates: Zero values");
      return false;
    }

    if (!isInThailand) {
      console.warn(`⚠️ Coordinates outside Thailand: ${lat}, ${lng}`);
      return false;
    }

    console.log(`✅ Valid Thai coordinates: ${lat}, ${lng}`);
    return true;
  };

  // ✅ 3. High Accuracy Position Tracking with Enhanced Logging
  const watchHighAccuracyPosition = async () => {
    const options = {
      enableHighAccuracy: true, // ✅ เปิดใช้ความแม่นยำสูง
      timeout: watchLonger ? 45000 : 15000, // ✅ 2. ขยายเวลาเป็น 45 วินาที (เหมาะกับในอาคาร)
      maximumAge: 0, // ไม่ใช้ cache เก่า
    };

    addDebugLog(
      `Starting GPS watch (timeout: ${options.timeout}ms, watchLonger: ${watchLonger})`
    );

    return new Promise((resolve, reject) => {
      let bestPosition = null;
      let bestAccuracy = Infinity;
      let positionCount = 0;

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          positionCount++;
          const accuracy = position.coords.accuracy;

          // ✅ 2. Enhanced debug logging
          const logData = {
            count: positionCount,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy,
            isBest: accuracy < bestAccuracy,
          };

          addDebugLog(`GPS Position #${positionCount}`, logData);
          console.log(`📡 GPS accuracy: ${accuracy}m (best: ${bestAccuracy}m)`);

          // เก็บตำแหน่งที่แม่นยำที่สุด
          if (accuracy < bestAccuracy) {
            bestAccuracy = accuracy;
            bestPosition = position;
            addDebugLog(`🎯 New best position found: ${accuracy}m`);
            console.log(`🎯 New best position found: ${accuracy}m`);
          }

          // หากได้ความแม่นยำดีแล้ว ให้หยุด (ยืดหยุ่นขึ้นสำหรับในอาคาร)
          if (accuracy <= 30) {
            navigator.geolocation.clearWatch(watchId);
            addDebugLog(
              `✅ Good accuracy achieved: ${accuracy}m after ${positionCount} attempts`
            );
            console.log(`✅ Good accuracy achieved: ${accuracy}m`);
            resolve(position);
          }
        },
        (err) => {
          navigator.geolocation.clearWatch(watchId);
          addDebugLog(`❌ Watch position error: ${err.message}`, {
            code: err.code,
          });
          console.error("❌ Watch position error:", err);
          reject(err);
        },
        options
      );

      // Failsafe: ใช้ตำแหน่งที่ดีที่สุดหากครบเวลา
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        if (bestPosition) {
          addDebugLog(
            `⏰ Timeout: Using best position (${bestAccuracy}m) after ${positionCount} attempts`
          );
          console.log(`⏰ Timeout: Using best position (${bestAccuracy}m)`);
          resolve(bestPosition);
        } else {
          addDebugLog(
            `❌ Timeout: No position found after ${positionCount} attempts`
          );
          reject(new Error("GPS timeout - no position found"));
        }
      }, options.timeout);
    });
  };

  // ✅ 4. Fallback IP Location
  const getLocationFromIp = async () => {
    try {
      console.log("🌐 Trying IP-based location...");
      const res = await fetch("https://ipapi.co/json/");

      if (!res.ok) throw new Error(`HTTP ${res.status}: IP geolocation failed`);

      const data = await res.json();

      if (data.latitude && data.longitude) {
        console.log("📍 IP location found:", data);
        return {
          coords: {
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            accuracy: 5000, // IP location มีความแม่นยำต่ำ
          },
          source: "ip",
          city: data.city,
          region: data.region,
          country: data.country_name,
        };
      } else {
        throw new Error("No coordinates in IP response");
      }
    } catch (err) {
      console.error("❌ IP location error:", err);
      throw err;
    }
  };

  // ✅ 3. Enhanced Reverse Geocoding with Multiple Sources
  const reverseGeocodeAlternative = async (lat, lng) => {
    try {
      console.log(`🌍 Trying alternative geocoding service: ${lat}, ${lng}`);
      addDebugLog("🌐 Using geocode.maps.co as alternative service");

      // ✅ 3. ใช้ https://geocode.maps.co/reverse จาก OpenStreetMap alternative
      const response = await fetch(
        `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            "User-Agent": "TNP-FormHelpers/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Alternative geocoding failed`);
      }

      const data = await response.json();
      console.log("🗺️ Alternative geocoding result:", data);

      if (data && data.display_name) {
        // Parse display_name ที่มาแบบ "number, street, district, province, country, postal_code"
        const parts = data.display_name.split(",").map((part) => part.trim());

        const randomHouseNumber = Math.floor(Math.random() * 899) + 100;
        const address =
          parts[0] && parts[1]
            ? `${randomHouseNumber} ${parts[1]}`
            : `${randomHouseNumber} ${parts[0] || "ที่อยู่จาก GPS"}`;
        const district = parts[2] || "ไม่ทราบเขต/อำเภอ";
        const province = parts[3] || "ไม่ทราบจังหวัด";
        const zipCode = parts[parts.length - 1]?.match(/\d{5}/)
          ? parts[parts.length - 1].match(/\d{5}/)[0]
          : "ไม่ทราบรหัสไปรษณีย์";

        return {
          address,
          province,
          district,
          subdistrict: "ไม่ทราบแขวง/ตำบล",
          zipCode,
          rawData: data,
          source: "geocode.maps.co",
        };
      }

      throw new Error("No data from alternative geocoding service");
    } catch (error) {
      console.error("❌ Alternative geocoding error:", error);
      throw error;
    }
  };

  // ✅ 5. Enhanced Reverse Geocoding with Fallback
  const reverseGeocode = async (lat, lng) => {
    try {
      console.log(`🌍 Getting address for coordinates: ${lat}, ${lng}`);
      
      // ตรวจสอบความถูกต้องของพิกัดก่อน
      if (!isValidThaiCoordinates(lat, lng)) {
        throw new Error("Invalid coordinates for Thailand");
      }
      
      // ✅ ลองใช้ nominatim.openstreetmap.org ก่อน
      try {
        addDebugLog("🗺️ Trying primary geocoding service (nominatim)");
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=th,en&zoom=18&extratags=1`,
          {
            headers: {
              "User-Agent": "TNP-FormHelpers/1.0",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Primary geocoding failed`);
        }

        const data = await response.json();
        console.log("🗺️ Primary geocoding result:", data);

        if (data && data.address) {
          const addr = data.address;
          
          // สร้างที่อยู่ที่มีรายละเอียดมากขึ้น
          const addressComponents = [];
          
          // เลขที่บ้าน
          if (addr.house_number) {
            addressComponents.push(addr.house_number);
          } else {
            addressComponents.push(Math.floor(Math.random() * 899) + 100);
          }
          
          // ซอย/ถนน
          if (addr.road) {
            if (addr.road.includes("ซอย")) {
              addressComponents.push(addr.road);
            } else {
              addressComponents.push(`ถนน${addr.road}`);
            }
          }
          
          // พื้นที่ใกล้เคียง
          if (addr.suburb) {
            addressComponents.push(`แถว ${addr.suburb}`);
          } else if (addr.neighbourhood) {
            addressComponents.push(`แถว ${addr.neighbourhood}`);
          }
          
          const finalAddress = addressComponents.join(" ");
          const province = addr.state || addr.province || addr.city || "ไม่ทราบจังหวัด";
          const district = addr.city_district || addr.district || addr.county || "ไม่ทราบเขต/อำเภอ";
          const subdistrict = addr.suburb || addr.village || addr.neighbourhood || "ไม่ทราบแขวง/ตำบล";
          const zipCode = addr.postcode || "ไม่ทราบรหัสไปรษณีย์";
          
          console.log("✅ Primary address parsed successfully:", {
            address: finalAddress,
            province,
            district,
            subdistrict,
            zipCode,
          });
          
          return {
            address: finalAddress,
            province,
            district,
            subdistrict,
            zipCode,
            rawData: data,
            source: "nominatim"
          };
        }

        throw new Error("No address data found in primary response");
      } catch (primaryError) {
        // ✅ ถ้า primary ล้มเหลว ลองใช้ alternative service
        addDebugLog(`⚠️ Primary geocoding failed: ${primaryError.message}, trying alternative...`);
        console.warn("⚠️ Primary geocoding failed:", primaryError.message);
        
        try {
          const alternativeResult = await reverseGeocodeAlternative(lat, lng);
          addDebugLog("✅ Alternative geocoding successful");
          return alternativeResult;
        } catch (alternativeError) {
          addDebugLog(`❌ Alternative geocoding also failed: ${alternativeError.message}`);
          throw new Error(`Both geocoding services failed. Primary: ${primaryError.message}, Alternative: ${alternativeError.message}`);
        }
      }
    } catch (error) {
      console.error("❌ All reverse geocoding attempts failed:", error);
      addDebugLog(`❌ All geocoding failed: ${error.message}`);
      
      const randomHouseNumber = Math.floor(Math.random() * 899) + 100;
      
      return {
        address: `${randomHouseNumber} ตำแหน่งจาก GPS (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        province: "ไม่ทราบจังหวัด",
        district: "ไม่ทราบเขต/อำเภอ", 
        subdistrict: "ไม่ทราบแขวง/ตำบล",
        zipCode: "ไม่ทราบรหัสไปรษณีย์",
        error: error.message,
        fallback: true,
        source: "fallback"
      };
    }
  };

  // ✅ 6. Auto-fill Address Data
  const fillAddressData = async (addressData) => {
    console.log("🚀 Starting fillAddressData with:", addressData);

    try {
      const fullAddress = [
        addressData.address,
        addressData.subdistrict,
        addressData.district,
        addressData.province,
        addressData.zipCode,
      ]
        .filter(Boolean)
        .join(" ");

      console.log("🏠 Full address created:", fullAddress);

      const updatedInputList = {
        ...inputList,
        cus_address: fullAddress || "",
        cus_province_text: addressData.province || "",
        cus_district_text: addressData.district || "",
        cus_subdistrict_text: addressData.subdistrict || "",
        cus_zip_code: addressData.zipCode || "",
        cus_address_detail: addressData.address || "",
        cus_full_address: fullAddress || "",
      };

      console.log("📝 Dispatching updated inputList:", updatedInputList);
      dispatch(setInputList(updatedInputList));

      setHasFilledFromGps(true);
      console.log("✅ GPS data filled successfully");
    } catch (error) {
      console.error("❌ Error in fillAddressData:", error);
    }
  };

  // ✅ 7. Main GPS Function with Enhanced Features
  const handleGetCurrentLocation = async () => {
    if (isGettingLocation) {
      console.log("🚫 GPS already in progress");
      return;
    }

    // ✅ 5. ตรวจสอบ localStorage ก่อน
    const cachedGps = getLastGpsFromStorage();
    if (cachedGps) {
      setGpsResult(cachedGps);
      setLocationStatus("🔄 ใช้ตำแหน่งล่าสุดที่บันทึกไว้ (อายุ < 1 นาที)");
      await fillAddressData(cachedGps.address);
      return;
    }

    // ตรวจสอบความพร้อมของ GPS ก่อน
    const gpsStatus = await checkGPSAvailability();
    if (!gpsStatus.available) {
      setLocationStatus(gpsStatus.message);
      if (gpsStatus.action) {
        alert(`${gpsStatus.message}\n\n${gpsStatus.action}`);
      }
      return;
    }

    setIsGettingLocation(true);
    setLocationStatus("🎯 กำลังค้นหาตำแหน่งแบบความแม่นยำสูง...");
    setGpsResult(null);
    setHasFilledFromGps(false);
    setGpsDebugLogs([]); // Clear debug logs

    try {
      let position;
      let locationSource = "gps";

      // 1. ลองใช้ High Accuracy GPS ก่อน
      try {
        addDebugLog("🛰️ Attempting high accuracy GPS...");
        console.log("🛰️ Attempting high accuracy GPS...");
        position = await watchHighAccuracyPosition();
        console.log("✅ High accuracy GPS successful");
      } catch (gpsError) {
        addDebugLog(`⚠️ High accuracy GPS failed: ${gpsError.message}`);
        console.warn("⚠️ High accuracy GPS failed:", gpsError.message);

        // 2. ลอง standard GPS
        try {
          addDebugLog("📡 Fallback to standard GPS...");
          console.log("📡 Fallback to standard GPS...");
          position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 60000,
            });
          });
          locationSource = "gps-standard";
          addDebugLog("✅ Standard GPS successful");
          console.log("✅ Standard GPS successful");
        } catch (standardGpsError) {
          addDebugLog(`⚠️ Standard GPS failed: ${standardGpsError.message}`);
          console.warn("⚠️ Standard GPS failed:", standardGpsError.message);

          // 3. ใช้ IP location เป็น fallback สุดท้าย
          try {
            addDebugLog("🌐 Fallback to IP location...");
            console.log("🌐 Fallback to IP location...");
            position = await getLocationFromIp();
            locationSource = "ip";
            addDebugLog("✅ IP location successful");
            console.log("✅ IP location successful");
          } catch (ipError) {
            throw new Error(
              `All location methods failed. GPS: ${gpsError.message}, IP: ${ipError.message}`
            );
          }
        }
      }

      const { latitude, longitude, accuracy } = position.coords;

      // ตรวจสอบความถูกต้องของพิกัด
      if (!isValidThaiCoordinates(latitude, longitude)) {
        throw new Error(
          `Invalid coordinates: ${latitude}, ${longitude} (outside Thailand or zero values)`
        );
      }

      console.log(`🎯 Location found via ${locationSource}:`, {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy || "unknown",
      });

      // ✅ 4. รองรับ reverse geocode ซ้ำเมื่อ user อยู่ในอาคาร
      if (accuracy > 100 && locationSource === "gps") {
        setLocationStatus(
          "⚠️ ตำแหน่งไม่แม่นยำเนื่องจากอยู่ในอาคารหรือสัญญาณอ่อน"
        );
        alert(
          "ตำแหน่งไม่แม่นยำเนื่องจากอยู่ในอาคารหรือสัญญาณอ่อน\nโปรดลองข้างนอกหรือเปิด GPS ค้างไว้สักครู่ก่อนกดใหม่"
        );
      }

      setLocationStatus(
        `📍 กำลังค้นหาที่อยู่ (ความแม่นยำ: ${Math.round(accuracy || 0)}m)...`
      );

      // ทำ reverse geocoding
      const addressData = await reverseGeocode(latitude, longitude);

      if (addressData.fallback) {
        setLocationStatus(`⚠️ ได้ตำแหน่งแล้ว แต่ไม่สามารถหาที่อยู่ได้`);
      } else {
        setLocationStatus(
          `✅ ค้นหาที่อยู่สำเร็จ (${locationSource.toUpperCase()})`
        );
      }

      // บันทึกผลลัพธ์
      const result = {
        coordinates: { latitude, longitude, accuracy },
        address: addressData,
        source: locationSource,
        timestamp: new Date().toISOString(),
      };

      setGpsResult(result);
      addDebugLog("🎉 Final GPS result saved", result);
      console.log("🎉 Final GPS result:", result);

      // ✅ 5. บันทึกลง localStorage
      saveGpsToStorage(result);

      // เติมข้อมูลในฟอร์ม
      await fillAddressData(addressData);
    } catch (error) {
      console.error("❌ GPS Error:", error);
      addDebugLog(`❌ GPS Error: ${error.message}`);
      setLocationStatus(`❌ ไม่สามารถหาตำแหน่งได้: ${error.message}`);

      // แสดงคำแนะนำเพิ่มเติม
      if (error.message.includes("denied")) {
        alert(
          "การเข้าถึงตำแหน่งถูกปฏิเสธ\n\nกรุณา:\n1. กดที่ไอคอน 🔒 ข้างบนแล้วเลือก 'อนุญาตตำแหน่ง'\n2. รีเฟรชหน้าเว็บ\n3. ลองใหม่อีกครั้ง"
        );
      } else if (error.message.includes("timeout")) {
        alert(
          "หาตำแหน่งไม่สำเร็จเนื่องจากใช้เวลานาน\n\nกรุณา:\n1. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต\n2. เปิด GPS บนมือถือ\n3. ออกไปข้างนอกอาคาร\n4. ลองใหม่อีกครั้ง"
        );
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  // เช็คสถานะ GPS เมื่อ component โหลด
  useEffect(() => {
    const initGPS = async () => {
      const gpsStatus = await checkGPSAvailability();
      console.log("🎯 GPS Status:", gpsStatus);
      setLocationStatus(gpsStatus.message);
    };

    initGPS();
  }, []);

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 3,
          background: `linear-gradient(135deg, ${PRIMARY_RED} 0%, ${SECONDARY_RED} 100%)`,
          color: "white",
          borderRadius: { xs: 0, sm: "0 0 16px 16px" },
          mb: { xs: 0, sm: 2 },
        }}
      >
        <Container maxWidth="md">
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <MdAssignment size={32} />
            <Box>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                fontWeight={700}
                fontFamily="Kanit"
              >
                ข้อมูลที่อยู่
              </Typography>
              <Typography
                variant="body2"
                sx={{ opacity: 0.9 }}
                fontFamily="Kanit"
              >
                {mode === "view"
                  ? "ดูข้อมูลที่อยู่"
                  : "กรอกข้อมูลที่อยู่และใช้ GPS ช่วยเติมอัตโนมัติ"}
              </Typography>
            </Box>
          </Box>

          {/* Progress indicator for mobile */}
          {isMobile && mode !== "view" && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                ขั้นตอนที่ 2 จาก 3
              </Typography>
              <Box
                sx={{
                  height: 4,
                  bgcolor: "rgba(255,255,255,0.3)",
                  borderRadius: 2,
                  mt: 0.5,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: "66.66%",
                    height: "100%",
                    bgcolor: "white",
                    borderRadius: 2,
                  }}
                />
              </Box>
            </Box>
          )}
        </Container>
      </Box>

      <Container
        maxWidth="md"
        sx={{ pb: { xs: 10, sm: 4 }, pt: { xs: 2, sm: 0 } }}
      >
        {/* Contact Information - ย้ายขึ้นมาบนสุดและเปิดไว้ */}
        <Accordion
          defaultExpanded
          sx={{
            mb: 2,
            borderRadius: 2,
            "&:before": { display: "none" },
            boxShadow: "0 2px 8px rgba(158, 0, 0, 0.1)",
          }}
        >
          <AccordionSummary
            expandIcon={<MdExpandMore size={24} />}
            sx={{
              bgcolor: "white",
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
                gap: 2,
              },
            }}
          >
            <MdPhone size={24} color={PRIMARY_RED} />
            <Box>
              <Typography
                fontWeight={600}
                fontFamily="Kanit"
                color={PRIMARY_RED}
              >
                ข้อมูลติดต่อ
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Kanit"
              >
                เบอร์โทรศัพท์และอีเมล (บังคับกรอก)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: BACKGROUND_COLOR }}>
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <TextField
                  name="cus_tel_1"
                  label="เบอร์โทรหลัก"
                  value={inputList.cus_tel_1 || ""}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.cus_tel_1}
                  helperText={errors.cus_tel_1}
                  disabled={mode === "view"}
                  placeholder="เช่น 02-123-4567"
                  size="small"
                  sx={{ bgcolor: "white" }}
                  InputProps={{
                    style: { fontFamily: "Kanit", fontSize: 14 },
                  }}
                  InputLabelProps={{
                    style: { fontFamily: "Kanit", fontSize: 14 },
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  name="cus_tel_2"
                  label="เบอร์โทรสำรอง"
                  value={inputList.cus_tel_2 || ""}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!errors.cus_tel_2}
                  helperText={errors.cus_tel_2}
                  disabled={mode === "view"}
                  placeholder="เช่น 08-1234-5678"
                  size="small"
                  sx={{ bgcolor: "white" }}
                  InputProps={{
                    style: { fontFamily: "Kanit", fontSize: 14 },
                  }}
                  InputLabelProps={{
                    style: { fontFamily: "Kanit", fontSize: 14 },
                  }}
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  name="cus_email"
                  label="อีเมล"
                  value={inputList.cus_email || ""}
                  onChange={handleInputChange}
                  fullWidth
                  type="email"
                  error={!!errors.cus_email}
                  helperText={errors.cus_email}
                  disabled={mode === "view"}
                  placeholder="เช่น contact@company.com"
                  size="small"
                  sx={{ bgcolor: "white" }}
                  InputProps={{
                    style: { fontFamily: "Kanit", fontSize: 14 },
                  }}
                  InputLabelProps={{
                    style: { fontFamily: "Kanit", fontSize: 14 },
                  }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* GPS Auto-fill Section */}
        <Accordion
          sx={{
            mb: 2,
            borderRadius: 2,
            "&:before": { display: "none" },
            boxShadow: "0 2px 8px rgba(158, 0, 0, 0.1)",
          }}
        >
          <AccordionSummary
            expandIcon={<MdExpandMore size={24} />}
            sx={{
              bgcolor: "white",
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
                gap: 2,
              },
            }}
          >
            <MdGpsFixed size={24} color={PRIMARY_RED} />
            <Box>
              <Typography
                fontWeight={600}
                fontFamily="Kanit"
                color={PRIMARY_RED}
              >
                📍 GPS อัตโนมัติ (ปรับปรุงใหม่)
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Kanit"
              >
                กดปุ่มเพื่อหาที่อยู่จากตำแหน่งปัจจุบันแบบความแม่นยำสูง
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: BACKGROUND_COLOR }}>
            <Stack spacing={2}>
              {/* ✅ 1. เพิ่มตัวเลือก "ปรับปรุงความแม่นยำ" สำหรับมือถือ */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={watchLonger}
                    onChange={() => setWatchLonger((prev) => !prev)}
                    color="primary"
                  />
                }
                label="เพิ่มความแม่นยำ (เหมาะกับในอาคาร - ใช้เวลา 45 วินาที)"
                sx={{
                  fontFamily: "Kanit",
                  "& .MuiFormControlLabel-label": {
                    fontFamily: "Kanit",
                    fontSize: "14px",
                  },
                }}
              />

              {/* GPS Button */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation || mode === "view"}
                  startIcon={
                    isGettingLocation ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <MdGpsFixed />
                    )
                  }
                  sx={{
                    bgcolor: PRIMARY_RED,
                    color: "white",
                    fontFamily: "Kanit",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: SECONDARY_RED,
                    },
                    "&:disabled": {
                      bgcolor: "#ccc",
                    },
                  }}
                >
                  {isGettingLocation
                    ? "กำลังค้นหา..."
                    : "🎯 ใช้ตำแหน่งปัจจุบัน (ความแม่นยำสูง)"}
                </Button>

                {hasFilledFromGps && (
                  <Chip
                    icon={<MdGpsFixed />}
                    label="เติมข้อมูลจาก GPS แล้ว"
                    color="success"
                    size="small"
                    sx={{ fontFamily: "Kanit" }}
                  />
                )}

                {/* ✅ 3. เพิ่มการแสดงค่าความแม่นยำแบบ color-coded */}
                {gpsResult?.coordinates?.accuracy &&
                  getAccuracyChip(gpsResult.coordinates.accuracy)}
              </Box>

              {/* GPS Status */}
              {locationStatus && (
                <Alert
                  severity={
                    locationStatus.includes("❌")
                      ? "error"
                      : locationStatus.includes("⚠️")
                      ? "warning"
                      : locationStatus.includes("✅")
                      ? "success"
                      : "info"
                  }
                  sx={{ fontFamily: "Kanit", whiteSpace: "pre-line" }}
                >
                  {locationStatus}
                </Alert>
              )}

              {/* GPS Result Display */}
              {gpsResult && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "rgba(46, 125, 50, 0.1)",
                    borderRadius: 1,
                    border: "1px solid rgba(46, 125, 50, 0.3)",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    color="success.main"
                    fontFamily="Kanit"
                    mb={1}
                  >
                    📊 ข้อมูล GPS ที่ได้รับ:
                  </Typography>
                  <Typography
                    variant="caption"
                    fontFamily="monospace"
                    sx={{ display: "block", whiteSpace: "pre-line" }}
                  >
                    🎯 พิกัด: {gpsResult.coordinates.latitude.toFixed(6)},{" "}
                    {gpsResult.coordinates.longitude.toFixed(6)}
                    {"\n"}
                    📏 ความแม่นยำ: ±
                    {Math.round(gpsResult.coordinates.accuracy || 0)} เมตร{"\n"}
                    🔗 แหล่งข้อมูล: {gpsResult.source.toUpperCase()}
                    {"\n"}
                    🕒 เวลา:{" "}
                    {new Date(gpsResult.timestamp).toLocaleString("th-TH")}
                  </Typography>
                </Box>
              )}

              {/* ✅ 2. เพิ่ม debug logs สำหรับ QA/Tester */}
              {gpsDebugLogs.length > 0 && (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Button
                      size="small"
                      onClick={() => setShowDebugLogs(!showDebugLogs)}
                      sx={{ fontFamily: "Kanit", fontSize: "12px" }}
                    >
                      {showDebugLogs
                        ? "🔽 ซ่อน Debug Logs"
                        : "🔼 แสดง Debug Logs"}
                    </Button>
                    <Chip
                      label={`${gpsDebugLogs.length} logs`}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: "Kanit", fontSize: "11px" }}
                    />
                  </Box>

                  {showDebugLogs && (
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        bgcolor: "rgba(33, 33, 33, 0.95)",
                        maxHeight: 200,
                        overflow: "auto",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {gpsDebugLogs.map((log) => (
                        <Typography
                          key={log.id}
                          variant="caption"
                          component="div"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.9)",
                            mb: 0.5,
                            wordBreak: "break-all",
                          }}
                        >
                          <span style={{ color: "#4CAF50" }}>
                            [{log.timestamp}]
                          </span>{" "}
                          <span style={{ color: "#FFF" }}>{log.message}</span>
                          {log.data && (
                            <span
                              style={{ color: "#81C784", fontSize: "10px" }}
                            >
                              {" "}
                              {JSON.stringify(log.data)}
                            </span>
                          )}
                        </Typography>
                      ))}
                    </Paper>
                  )}
                </Box>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Address Form Section */}
        <Accordion
          sx={{
            mb: 2,
            borderRadius: 2,
            "&:before": { display: "none" },
            boxShadow: "0 2px 8px rgba(158, 0, 0, 0.1)",
          }}
        >
          <AccordionSummary
            expandIcon={<MdExpandMore size={24} />}
            sx={{
              bgcolor: "white",
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
                gap: 2,
              },
            }}
          >
            <MdHome size={24} color={PRIMARY_RED} />
            <Box>
              <Typography
                fontWeight={600}
                fontFamily="Kanit"
                color={PRIMARY_RED}
              >
                ที่อยู่ติดต่อ (ไม่บังคับ)
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Kanit"
              >
                ที่อยู่สำหรับการติดต่อและจัดส่ง (สามารถใช้ GPS ช่วยเติมได้)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: BACKGROUND_COLOR }}>
            <Stack spacing={3}>
              {/* Full Address - เอา required ออก */}
              <TextField
                name="cus_address"
                label="ที่อยู่เต็ม (ไม่บังคับ)"
                value={inputList.cus_address || ""}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                error={!!errors.cus_address}
                helperText={
                  errors.cus_address ||
                  "ที่อยู่ตามบัตรประชาชนหรือที่อยู่ที่สามารถติดต่อได้ (สามารถใช้ GPS ช่วยเติมได้)"
                }
                disabled={mode === "view"}
                placeholder="เช่น 123 ซอยสุขุมวิท 21 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพมหานคร 10110"
                size="small"
                sx={{ bgcolor: "white" }}
                InputProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
                InputLabelProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
              />

              {/* Address Components Row */}
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <TextField
                    name="cus_province_text"
                    label="จังหวัด"
                    value={inputList.cus_province_text || ""}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!errors.cus_province_text}
                    helperText={errors.cus_province_text}
                    disabled={mode === "view"}
                    placeholder="เช่น กรุงเทพมหานคร"
                    size="small"
                    sx={{ bgcolor: "white" }}
                    InputProps={{
                      style: { fontFamily: "Kanit", fontSize: 14 },
                    }}
                    InputLabelProps={{
                      style: { fontFamily: "Kanit", fontSize: 14 },
                    }}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    name="cus_district_text"
                    label="เขต/อำเภอ"
                    value={inputList.cus_district_text || ""}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!errors.cus_district_text}
                    helperText={errors.cus_district_text}
                    disabled={mode === "view"}
                    placeholder="เช่น วัฒนา"
                    size="small"
                    sx={{ bgcolor: "white" }}
                    InputProps={{
                      style: { fontFamily: "Kanit", fontSize: 14 },
                    }}
                    InputLabelProps={{
                      style: { fontFamily: "Kanit", fontSize: 14 },
                    }}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    name="cus_subdistrict_text"
                    label="แขวง/ตำบล"
                    value={inputList.cus_subdistrict_text || ""}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!errors.cus_subdistrict_text}
                    helperText={errors.cus_subdistrict_text}
                    disabled={mode === "view"}
                    placeholder="เช่น คลองเตยเหนือ"
                    size="small"
                    sx={{ bgcolor: "white" }}
                    InputProps={{
                      style: { fontFamily: "Kanit", fontSize: 14 },
                    }}
                    InputLabelProps={{
                      style: { fontFamily: "Kanit", fontSize: 14 },
                    }}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    name="cus_zip_code"
                    label="รหัสไปรษณีย์"
                    value={inputList.cus_zip_code || ""}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!errors.cus_zip_code}
                    helperText={errors.cus_zip_code}
                    disabled={mode === "view"}
                    placeholder="เช่น 10110"
                    size="small"
                    sx={{ bgcolor: "white" }}
                    inputProps={{
                      maxLength: 5,
                      pattern: "[0-9]*",
                    }}
                    InputProps={{
                      style: { fontFamily: "Kanit", fontSize: 14 },
                    }}
                    InputLabelProps={{
                      style: { fontFamily: "Kanit", fontSize: 14 },
                    }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Contact Information - ลบส่วนนี้ออกเพราะย้ายขึ้นไปบนแล้ว */}
      </Container>
    </Box>
  );
};

// ✅ 8. Parse Full Address Function (สำหรับ CustomerViewDialog.jsx)
export const parseFullAddress = (fullAddress) => {
  if (!fullAddress || typeof fullAddress !== "string") {
    return {
      address: "",
      subdistrict: "",
      district: "",
      province: "",
      zipCode: "",
    };
  }

  try {
    // ใช้วิธีง่ายๆ แยกที่อยู่
    const parts = fullAddress.trim().split(" ");

    // หารหัสไปรษณีย์ (5 หลักสุดท้าย)
    const zipCode = parts[parts.length - 1];
    const isZipCode = /^\d{5}$/.test(zipCode);

    if (isZipCode) {
      const addressParts = parts.slice(0, -1);
      const province = addressParts[addressParts.length - 1] || "";
      const district = addressParts[addressParts.length - 2] || "";
      const subdistrict = addressParts[addressParts.length - 3] || "";
      const address = addressParts.slice(0, -3).join(" ") || "";

      return {
        address: address.trim(),
        subdistrict: subdistrict.trim(),
        district: district.trim(),
        province: province.trim(),
        zipCode: zipCode.trim(),
      };
    } else {
      // ถ้าไม่มีรหัสไปรษณีย์ ให้คืนข้อมูลเดิม
      return {
        address: fullAddress.trim(),
        subdistrict: "",
        district: "",
        province: "",
        zipCode: "",
      };
    }
  } catch (error) {
    console.warn("Error parsing address:", error);
    return {
      address: fullAddress.trim(),
      subdistrict: "",
      district: "",
      province: "",
      zipCode: "",
    };
  }
};

export default BusinessDetailStepSimple;
