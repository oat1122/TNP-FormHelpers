import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";

function JobTitle({ text }) {
  const items = (text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const main = items[0] || "-";
  const extra = items.length > 1 ? items.length - 1 : 0;
  const full = items.join(", ");

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Tooltip title={full}>
        <Typography variant="body1" noWrap sx={{ fontWeight: 600, flex: "1 1 auto", minWidth: 0 }}>
          {main}
        </Typography>
      </Tooltip>

      {extra > 0 && (
        <Tooltip title={full}>
          <Box
            component="span"
            sx={{
              fontSize: 12,
              color: "text.secondary",
              bgcolor: "action.selected",
              borderRadius: 2,
              px: 1,
              py: 0.25,
              flex: "0 0 auto",
              lineHeight: 1.6,
            }}
          >
            +{extra} รายการ
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}

export default JobTitle;
