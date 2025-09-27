import React, { useState } from "react";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";

const GpsDebugLogs = ({ gpsDebugLogs }) => {
  const [showDebugLogs, setShowDebugLogs] = useState(false);

  if (!gpsDebugLogs || gpsDebugLogs.length === 0) {
    return null;
  }

  return (
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
          {showDebugLogs ? "🔽 ซ่อน Debug Logs" : "🔼 แสดง Debug Logs"}
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
              <span style={{ color: "#4CAF50" }}>[{log.timestamp}]</span>{" "}
              <span style={{ color: "#FFF" }}>{log.message}</span>
              {log.data && (
                <span style={{ color: "#81C784", fontSize: "10px" }}>
                  {" "}
                  {JSON.stringify(log.data)}
                </span>
              )}
            </Typography>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default GpsDebugLogs;
