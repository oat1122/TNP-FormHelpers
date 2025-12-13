import { Typography, Box, Chip } from "@mui/material";
import React from "react";
import { MdSignalCellularAlt } from "react-icons/md";

// Constants
import { channelOptions } from "../../../constants/filterConstants";
// Styled components
import { StyledFormControl } from "../../../styles/FilterStyledComponents";
// UI Components
import { FilterSectionFrame, FilterMultiSelect } from "../ui";

/**
 * Channel Filter Section Component
 * Handles communication channel multi-selection
 */
const ChannelFilterSection = ({ draftFilters, selectionHelpers }) => {
  const { handleChannelChange } = selectionHelpers;

  return (
    <FilterSectionFrame
      icon={<MdSignalCellularAlt style={{ fontSize: 20, color: "white" }} />}
      title="ช่องทางการติดต่อ (CHANNEL)"
      description="เลือกช่องทางการติดต่อที่ต้องการกรองข้อมูล"
    >
      {/* Header with count */}
      <StyledFormControl fullWidth>
        <Typography
          variant="body2"
          sx={{
            color: "text.primary",
            mb: { xs: 1.5, sm: 1 },
            fontSize: { xs: "0.9rem", sm: "0.95rem" },
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {draftFilters.channel.length > 0
            ? `เลือกแล้ว ${draftFilters.channel.length} ช่องทาง`
            : "เลือกช่องทางการติดต่อ"}
          {draftFilters.channel.length > 0 && (
            <Chip
              label={`${draftFilters.channel.length}/${channelOptions.length}`}
              size="small"
              sx={{
                bgcolor: "rgba(148, 12, 12, 0.1)",
                color: "#940c0c",
                fontWeight: 600,
                fontSize: "0.75rem",
                height: "20px",
              }}
            />
          )}
        </Typography>

        {/* Multi-select dropdown using reusable component */}
        <FilterMultiSelect
          options={channelOptions}
          value={draftFilters.channel}
          onChange={handleChannelChange}
          placeholder="เลือกช่องทางการติดต่อ"
          maxChipsDisplay={4}
          moreLabel="ช่องทาง"
        />

        {/* Selected channels display */}
        {draftFilters.channel.length > 0 && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "rgba(148, 12, 12, 0.05)",
              border: "1px solid rgba(148, 12, 12, 0.15)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                fontSize: "0.8rem",
                mb: 1,
                display: "block",
              }}
            >
              ช่องทางที่เลือก:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
              {draftFilters.channel.map((value) => {
                const channel = channelOptions.find((c) => c.value === value);
                const ChannelIcon = channel?.icon;
                return (
                  <Chip
                    key={value}
                    icon={ChannelIcon ? <ChannelIcon /> : undefined}
                    label={channel?.label}
                    size="small"
                    sx={{
                      bgcolor: channel?.color || "rgba(148, 12, 12, 0.1)",
                      color: "white",
                      fontWeight: 600,
                      borderRadius: "8px",
                      height: { xs: "26px", sm: "28px" },
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      "& .MuiChip-icon": { color: "white", fontSize: "0.9rem" },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}
      </StyledFormControl>

      {/* Quick guide */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          backgroundColor: "rgba(0, 0, 0, 0.02)",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          mt: "auto",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontSize: "0.75rem",
            display: "block",
            textAlign: "center",
            mb: 1,
          }}
        >
          💡 ช่องทางที่มีอยู่:
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
          {channelOptions.map((channel) => {
            const ChannelIcon = channel.icon;
            const isSelected = draftFilters.channel.includes(channel.value);
            return (
              <Box
                key={channel.value}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: isSelected ? "rgba(148, 12, 12, 0.1)" : "transparent",
                  color: isSelected ? "primary.main" : "text.secondary",
                  fontSize: "0.7rem",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <ChannelIcon style={{ fontSize: "0.8rem" }} />
                <span>{channel.label}</span>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Status Display */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 1.5 },
          borderRadius: 2,
          bgcolor:
            draftFilters.channel.length > 0 ? "rgba(148, 12, 12, 0.06)" : "rgba(0, 0, 0, 0.04)",
          border:
            draftFilters.channel.length > 0
              ? "1px dashed rgba(148, 12, 12, 0.3)"
              : "1px dashed rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: draftFilters.channel.length > 0 ? "#940c0c" : "text.secondary",
            fontWeight: 600,
            fontSize: { xs: "0.75rem", sm: "0.8rem" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
          }}
        >
          {draftFilters.channel.length > 0 ? "📡" : "ℹ️"}
          {draftFilters.channel.length > 0
            ? `เลือกช่องทางแล้ว: ${draftFilters.channel.length} ช่องทาง`
            : "ยังไม่ได้เลือกช่องทางการติดต่อ"}
        </Typography>
      </Box>
    </FilterSectionFrame>
  );
};

export default ChannelFilterSection;
