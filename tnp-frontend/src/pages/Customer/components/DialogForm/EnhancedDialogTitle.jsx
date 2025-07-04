import React from "react";
import { Box, Typography, DialogTitle, IconButton, Chip } from "@mui/material";
import { MdClose, MdAccessTime } from "react-icons/md";

function EnhancedDialogTitle({ title, relativeTime, onClose, isCreateMode }) {
  return (
    <DialogTitle
      sx={{
        paddingBlock: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "primary.lighter",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="h6" fontWeight="600" color="primary.main">
          {title}
        </Typography>
        {!isCreateMode && relativeTime && (
          <Chip
            size="small"
            color="info"
            icon={<MdAccessTime size={14} />}
            label={`${relativeTime} Days`}
            sx={{ ml: 1, fontWeight: 500 }}
          />
        )}
      </Box>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          color: "grey.500",
          "&:hover": {
            backgroundColor: "error.lighter",
            color: "error.main",
          },
        }}
      >
        <MdClose />
      </IconButton>
    </DialogTitle>
  );
}

export default EnhancedDialogTitle;
