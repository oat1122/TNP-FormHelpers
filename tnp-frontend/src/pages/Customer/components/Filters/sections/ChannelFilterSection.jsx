import { Chip, Stack } from "@mui/material";
import React from "react";

// Constants
import { channelOptions, filterColors } from "../../../constants/filterConstants";

/**
 * Channel Filter Section Component
 * Compact chip-based channel selection
 */
const ChannelFilterSection = ({ draftFilters, selectionHelpers, compact = false }) => {
  const { handleChannelChange } = selectionHelpers;

  // Toggle channel selection
  const toggleChannel = (value) => {
    const current = draftFilters.channel || [];
    const newSelection = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    handleChannelChange({ target: { value: newSelection } });
  };

  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      {channelOptions.map((channel) => {
        const isSelected = draftFilters.channel?.includes(channel.value);
        const ChannelIcon = channel.icon;
        return (
          <Chip
            key={channel.value}
            icon={<ChannelIcon />}
            label={channel.label}
            size="small"
            onClick={() => toggleChannel(channel.value)}
            sx={{
              height: 28,
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              bgcolor: isSelected ? channel.color : "grey.100",
              color: isSelected ? "white" : "text.primary",
              borderRadius: 1.5,
              transition: "all 0.15s ease",
              "& .MuiChip-icon": {
                color: isSelected ? "white" : channel.color,
                fontSize: "1rem",
              },
              "&:hover": {
                bgcolor: isSelected ? channel.color : filterColors.primaryLight,
                transform: "scale(1.02)",
              },
            }}
          />
        );
      })}
    </Stack>
  );
};

export default ChannelFilterSection;
