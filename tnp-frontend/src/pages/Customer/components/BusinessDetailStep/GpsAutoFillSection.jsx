import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Alert,
  FormControlLabel,
  Checkbox,
  Box,
  Chip,
} from "@mui/material";
import { MdExpandMore, MdGpsFixed } from "react-icons/md";
import AccuracyChip from "./AccuracyChip";
import GpsDebugLogs from "./GpsDebugLogs";

const GpsAutoFillSection = ({
  mode = "create",
  PRIMARY_RED,
  BACKGROUND_COLOR,
  // GPS Hook values
  isGettingLocation,
  locationStatus,
  gpsResult,
  hasFilledFromGps,
  watchLonger,
  gpsDebugLogs,
  setWatchLonger,
  handleGetCurrentLocation,
}) => {
  return (
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
          {/* Enhanced Accuracy Option */}
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
                  bgcolor: "#d32f2f",
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

            {/* Accuracy Chip */}
            {gpsResult?.coordinates?.accuracy && (
              <AccuracyChip accuracy={gpsResult.coordinates.accuracy} />
            )}
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

          {/* Debug Logs */}
          <GpsDebugLogs gpsDebugLogs={gpsDebugLogs} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default GpsAutoFillSection;
