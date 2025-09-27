import React from "react";
import { Chip } from "@mui/material";

const AccuracyChip = ({ accuracy }) => {
  const roundedAccuracy = Math.round(accuracy || 9999);

  return (
    <Chip
      label={`ความแม่นยำ: ±${roundedAccuracy}m`}
      color={roundedAccuracy <= 20 ? "success" : roundedAccuracy <= 100 ? "warning" : "error"}
      size="small"
      sx={{ fontFamily: "Kanit" }}
    />
  );
};

export default AccuracyChip;
