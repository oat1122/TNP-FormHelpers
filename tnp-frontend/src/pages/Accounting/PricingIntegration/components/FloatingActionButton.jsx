import React from "react";
import { Fab } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

const FloatingActionButton = ({ onRefresh }) => {
  return (
    <Fab
      color="primary"
      aria-label="refresh"
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
      }}
      onClick={onRefresh}
    >
      <RefreshIcon />
    </Fab>
  );
};

export default FloatingActionButton;
