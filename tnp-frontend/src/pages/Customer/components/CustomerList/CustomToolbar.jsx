import React from "react";
import { GridToolbarContainer } from "@mui/x-data-grid";
import { Box, CircularProgress, Typography } from "@mui/material";
import SortInfoDisplay from "./SortInfoDisplay";

function CustomToolbar({ isFetching, serverSortModel }) {
  return (
    <GridToolbarContainer>
      <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: "common.white",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            mr: 2,
          }}
        >
          รายการลูกค้า
        </Typography>
        <SortInfoDisplay sortModel={serverSortModel} />
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {isFetching && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              marginRight: 1,
              color: "white",
              fontSize: "0.75rem",
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: "4px 8px",
              borderRadius: "4px",
              gap: 1,
            }}
          >
            <CircularProgress size={16} thickness={5} color="inherit" />
            <Typography variant="caption">กำลังโหลด...</Typography>
          </Box>
        )}
      </Box>
    </GridToolbarContainer>
  );
}

export default CustomToolbar;
