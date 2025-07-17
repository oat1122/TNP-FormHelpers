import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setInputList } from "../../../../features/Customer/customerSlice";

export const useGpsHelper = (inputList) => {
  const dispatch = useDispatch();

  // GPS States
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [gpsResult, setGpsResult] = useState(null);
  const [hasFilledFromGps, setHasFilledFromGps] = useState(false);
  const [watchLonger, setWatchLonger] = useState(true);
  const [gpsDebugLogs, setGpsDebugLogs] = useState([]);

  // Helper Functions
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
      return updated.slice(-10);
    });

    console.log(`[GPS Debug ${timestamp}] ${message}`, data || "");
  };

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

  const watchHighAccuracyPosition = async () => {
    const options = {
      enableHighAccuracy: true,
      timeout: watchLonger ? 45000 : 15000,
      maximumAge: 0,
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

          const logData = {
            count: positionCount,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy,
            isBest: accuracy < bestAccuracy,
          };

          addDebugLog(`GPS Position #${positionCount}`, logData);
          console.log(`📡 GPS accuracy: ${accuracy}m (best: ${bestAccuracy}m)`);

          if (accuracy < bestAccuracy) {
            bestAccuracy = accuracy;
            bestPosition = position;
            addDebugLog(`🎯 New best position found: ${accuracy}m`);
            console.log(`🎯 New best position found: ${accuracy}m`);
          }

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
            accuracy: 5000,
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

  const reverseGeocodeAlternative = async (lat, lng) => {
    try {
      console.log(`🌍 Trying alternative geocoding service: ${lat}, ${lng}`);
      addDebugLog("🌐 Using geocode.maps.co as alternative service");

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

  const reverseGeocode = async (lat, lng) => {
    try {
      console.log(`🌍 Getting address for coordinates: ${lat}, ${lng}`);
      
      if (!isValidThaiCoordinates(lat, lng)) {
        throw new Error("Invalid coordinates for Thailand");
      }
      
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
          
          const addressComponents = [];
          
          if (addr.house_number) {
            addressComponents.push(addr.house_number);
          } else {
            addressComponents.push(Math.floor(Math.random() * 899) + 100);
          }
          
          if (addr.road) {
            if (addr.road.includes("ซอย")) {
              addressComponents.push(addr.road);
            } else {
              addressComponents.push(`ถนน${addr.road}`);
            }
          }
          
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

  const handleGetCurrentLocation = async () => {
    if (isGettingLocation) {
      console.log("🚫 GPS already in progress");
      return;
    }

    const cachedGps = getLastGpsFromStorage();
    if (cachedGps) {
      setGpsResult(cachedGps);
      setLocationStatus("🔄 ใช้ตำแหน่งล่าสุดที่บันทึกไว้ (อายุ < 1 นาที)");
      await fillAddressData(cachedGps.address);
      return;
    }

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
    setGpsDebugLogs([]);

    try {
      let position;
      let locationSource = "gps";

      try {
        addDebugLog("🛰️ Attempting high accuracy GPS...");
        console.log("🛰️ Attempting high accuracy GPS...");
        position = await watchHighAccuracyPosition();
        console.log("✅ High accuracy GPS successful");
      } catch (gpsError) {
        addDebugLog(`⚠️ High accuracy GPS failed: ${gpsError.message}`);
        console.warn("⚠️ High accuracy GPS failed:", gpsError.message);

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

      const addressData = await reverseGeocode(latitude, longitude);

      if (addressData.fallback) {
        setLocationStatus(`⚠️ ได้ตำแหน่งแล้ว แต่ไม่สามารถหาที่อยู่ได้`);
      } else {
        setLocationStatus(
          `✅ ค้นหาที่อยู่สำเร็จ (${locationSource.toUpperCase()})`
        );
      }

      const result = {
        coordinates: { latitude, longitude, accuracy },
        address: addressData,
        source: locationSource,
        timestamp: new Date().toISOString(),
      };

      setGpsResult(result);
      addDebugLog("🎉 Final GPS result saved", result);
      console.log("🎉 Final GPS result:", result);

      saveGpsToStorage(result);
      await fillAddressData(addressData);
    } catch (error) {
      console.error("❌ GPS Error:", error);
      addDebugLog(`❌ GPS Error: ${error.message}`);
      setLocationStatus(`❌ ไม่สามารถหาตำแหน่งได้: ${error.message}`);

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

  // Initialize GPS status on mount
  useEffect(() => {
    const initGPS = async () => {
      const gpsStatus = await checkGPSAvailability();
      console.log("🎯 GPS Status:", gpsStatus);
      setLocationStatus(gpsStatus.message);
    };

    initGPS();
  }, []);

  return {
    // States
    isGettingLocation,
    locationStatus,
    gpsResult,
    hasFilledFromGps,
    watchLonger,
    gpsDebugLogs,
    
    // Actions
    setWatchLonger,
    handleGetCurrentLocation,
  };
};
