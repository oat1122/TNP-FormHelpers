import React, { useState } from "react";
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
} from "@mui/material";
import { MdAssignment, MdLocationOn, MdGpsFixed } from "react-icons/md";

// สี theme ของบริษัท
const PRIMARY_RED = "#B20000";

/**
 * BusinessDetailStep - ขั้นตอนที่ 2: รายละเอียดธุรกิจ (Simple Version)
 */
const BusinessDetailStepSimple = ({
  inputList = {},
  errors = {},
  handleInputChange,
  mode = "create",
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  // ฟังก์ชันสำหรับแปลง coordinates เป็นที่อยู่
  const reverseGeocode = async (lat, lng) => {
    try {
      // ใช้ OpenStreetMap Nominatim API (ฟรี)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=th,en`
      );

      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลที่อยู่ได้");

      const data = await response.json();

      if (data && data.address) {
        const address = data.address;

        // สร้างที่อยู่เต็ม
        const fullAddress = [
          address.house_number,
          address.road,
          address.suburb || address.neighbourhood,
          address.city_district || address.municipality,
        ]
          .filter(Boolean)
          .join(" ");

        return {
          fullAddress: fullAddress || data.display_name,
          province: address.state || address.province || "กรุงเทพมหานคร",
          district: address.city_district || address.municipality || "วัฒนา",
          subdistrict: address.suburb || address.neighbourhood || "ลุมพินี",
        };
      }

      throw new Error("ไม่พบข้อมูลที่อยู่");
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      throw error;
    }
  };

  // ฟังก์ชันสำหรับดึงตำแหน่งปัจจุบัน
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("เบราว์เซอร์ของคุณไม่รองรับ GPS");
      return;
    }

    setIsGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const addressData = await reverseGeocode(latitude, longitude);

          // อัปเดตฟอร์ม
          const updateEvent = (name, value) => ({
            target: { name, value },
          });

          // รวมที่อยู่ทั้งหมดไว้ในฟิลด์เดียว
          const fullAddressWithLocation = [
            addressData.fullAddress,
            addressData.subdistrict,
            addressData.district, 
            addressData.province
          ].filter(Boolean).join(" ");

          handleInputChange(
            updateEvent("cus_address", fullAddressWithLocation)
          );

          setIsGettingLocation(false);
        } catch (error) {
          setLocationError("ไม่สามารถแปลงตำแหน่งเป็นที่อยู่ได้");
          setIsGettingLocation(false);
        }
      },
      (error) => {
        let errorMessage = "ไม่สามารถเข้าถึงตำแหน่งได้";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "กรุณาอนุญาตให้เข้าถึงตำแหน่งใน browser settings";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่";
            break;
          case error.TIMEOUT:
            errorMessage = "หมดเวลาในการค้นหาตำแหน่ง กรุณาลองใหม่";
            break;
        }

        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: 2 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: `2px solid ${PRIMARY_RED}`,
          borderRadius: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <MdAssignment size={28} color={PRIMARY_RED} />
          <Typography
            variant="h5"
            fontWeight={600}
            color={PRIMARY_RED}
            fontFamily="Kanit"
          >
            รายละเอียดธุรกิจ
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" fontFamily="Kanit">
          ข้อมูลติดต่อ ที่อยู่ และช่องทางการติดต่อของธุรกิจ
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* เบอร์โทรหลัก */}
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
          placeholder="เช่น 02-123-4567, 081-234-5678"
          InputProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
          InputLabelProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
        />

        {/* อีเมล */}
        <TextField
          name="cus_email"
          label="อีเมล"
          type="email"
          value={inputList.cus_email || ""}
          onChange={handleInputChange}
          fullWidth
          error={!!errors.cus_email}
          helperText={errors.cus_email}
          disabled={mode === "view"}
          placeholder="เช่น contact@company.com"
          InputProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
          InputLabelProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
        />

        {/* ที่อยู่เต็ม */}
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <MdLocationOn color={PRIMARY_RED} />
            <Typography
              variant="body2"
              fontFamily="Kanit"
              color={PRIMARY_RED}
              fontWeight={500}
            >
              ที่อยู่ของธุรกิจ
            </Typography>
            {mode !== "view" && (
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  isGettingLocation ? (
                    <CircularProgress size={16} />
                  ) : (
                    <MdGpsFixed />
                  )
                }
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                sx={{
                  ml: "auto",
                  borderColor: PRIMARY_RED,
                  color: PRIMARY_RED,
                  fontFamily: "Kanit",
                  fontSize: 12,
                  "&:hover": {
                    borderColor: PRIMARY_RED,
                    backgroundColor: `${PRIMARY_RED}10`,
                  },
                }}
              >
                {isGettingLocation ? "กำลังหาตำแหน่ง..." : "ใช้ตำแหน่งปัจจุบัน"}
              </Button>
            )}
          </Box>

          {locationError && (
            <Alert severity="warning" sx={{ mb: 2, fontFamily: "Kanit" }}>
              {locationError}
            </Alert>
          )}

          <TextField
            name="cus_address"
            label="ที่อยู่เต็ม"
            value={inputList.cus_address || ""}
            onChange={handleInputChange}
            fullWidth
            required
            multiline
            rows={2}
            error={!!errors.cus_address}
            helperText={errors.cus_address}
            disabled={mode === "view"}
            placeholder="เช่น 123/45 ซอย ABC ถนน XYZ แขวงลุมพินี เขตปทุมวัน กรุงเทพมหานคร"
            InputProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
            }}
            InputLabelProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
            }}
          />
        </Box>

        {/* รหัสไปรษณีย์ */}
        <TextField
          name="cus_zip_code"
          label="รหัสไปรษณีย์"
          value={inputList.cus_zip_code || ""}
          onChange={handleInputChange}
          fullWidth
          disabled={mode === "view"}
          placeholder="เช่น 10330"
          inputProps={{ 
            maxLength: 5,
            pattern: "[0-9]*" 
          }}
          InputProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
          InputLabelProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
        />
      </Box>
    </Box>
  );
};

export default BusinessDetailStepSimple;
