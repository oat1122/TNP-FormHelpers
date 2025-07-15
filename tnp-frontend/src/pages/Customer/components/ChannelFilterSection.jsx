import React from "react";
import {
  Grid2 as Grid,
  Stack,
  Typography,
  Box,
  Checkbox,
  ListItemText,
  MenuItem,
  OutlinedInput,
  InputAdornment,
  Chip,
} from "@mui/material";
import { MdSignalCellularAlt } from "react-icons/md";
import {
  FilterSectionPaper,
  FilterHeaderBox,
  FilterIconBox,
  FilterTitle,
  FilterDescription,
  FilterContentBox,
  StyledFormControl,
} from "../styles/FilterStyledComponents";
import { channelOptions, filterPanelConfig } from "../constants/filterConstants";

/**
 * Channel Filter Section Component
 * Handles communication channel multi-selection
 */
const ChannelFilterSection = ({
  draftFilters,
  selectionHelpers,
}) => {
  const { handleChannelChange } = selectionHelpers;

  return (
    <Grid xs={12} md={6} lg={4}>
      <FilterSectionPaper elevation={3}>
        <Stack spacing={2.5} sx={{ height: "100%" }}>
          {/* Header */}
          <FilterHeaderBox>
            <FilterIconBox>
              <MdSignalCellularAlt style={{ fontSize: 20, color: "white" }} />
            </FilterIconBox>
            <Box>
              <FilterTitle variant="subtitle1">
                ช่องทางการติดต่อ (CHANNEL)
              </FilterTitle>
              <FilterDescription variant="caption">
                เลือกช่องทางการติดต่อที่ต้องการกรองข้อมูล
              </FilterDescription>
            </Box>
          </FilterHeaderBox>

          {/* Channel Selection */}
          <FilterContentBox>
            <StyledFormControl fullWidth size="medium">
              <Typography 
                variant="body2" 
                sx={{ 
                  color: "text.secondary",
                  mb: 1,
                  fontSize: "0.95rem"
                }}
              >
                {draftFilters.channel.length > 0
                  ? `เลือกแล้ว ${draftFilters.channel.length} ช่องทาง`
                  : "เลือกช่องทางการติดต่อ"}
              </Typography>
              
              <select
                multiple
                value={draftFilters.channel}
                onChange={handleChannelChange}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  border: "1px solid rgba(148, 12, 12, 0.3)",
                  padding: "8px 16px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "white",
                  "&:focus": {
                    borderColor: "#940c0c",
                    boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)",
                  }
                }}
              >
                {channelOptions.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </select>
              
              {/* Selected channels display */}
              {draftFilters.channel.length > 0 && (
                <Box
                  sx={{
                    mt: 1.5,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.8,
                  }}
                >
                  {draftFilters.channel.map((value) => {
                    const channel = channelOptions.find(
                      (c) => c.value === value
                    );
                    return (
                      <Chip
                        key={value}
                        label={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            {channel?.icon}
                            <span>{channel?.label}</span>
                          </Box>
                        }
                        size="small"
                        sx={{
                          bgcolor: channel?.color,
                          color: "white",
                          fontWeight: 600,
                          borderRadius: "8px",
                          height: "26px",
                          "& .MuiChip-icon": {
                            color: "white",
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            </StyledFormControl>
          </FilterContentBox>

          {/* Status Display */}
          {draftFilters.channel.length > 0 && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(148, 12, 12, 0.06)",
                border: "1px dashed rgba(148, 12, 12, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#940c0c", fontWeight: 600 }}
              >
                เลือกช่องทางแล้ว: {draftFilters.channel.length} ช่องทาง
              </Typography>
            </Box>
          )}
        </Stack>
      </FilterSectionPaper>
    </Grid>
  );
};

export default ChannelFilterSection; 