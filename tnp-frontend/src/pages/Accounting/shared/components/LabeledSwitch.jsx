import React, { useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

export default function LabeledSwitch() {
  const [type, setType] = useState("hotels");

  const handleChange = (event, newType) => {
    if (newType !== null) {
      setType(newType);
    }
  };

  return (
    <ToggleButtonGroup
      value={type}
      exclusive
      onChange={handleChange}
      sx={{
        borderRadius: "999px", // pill shape
        overflow: "hidden",
        bgcolor: "#a333ff", // พื้นหลังม่วง
        p: "2px", // เว้นขอบเล็กน้อย
        "& .MuiToggleButton-root": {
          flex: 1,
          textTransform: "none",
          fontWeight: 500,
          color: "white",
          border: "none",
          borderRadius: "999px",
          "&.Mui-selected": {
            bgcolor: "white",
            color: "#a333ff",
            fontWeight: "bold",
            "&:hover": {
              bgcolor: "white",
            },
          },
        },
      }}
    >
      <ToggleButton value="hotels">Hotels</ToggleButton>
      <ToggleButton value="apartments">Apartments</ToggleButton>
    </ToggleButtonGroup>
  );
}
