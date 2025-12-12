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
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import React from "react";
import { MdSignalCellularAlt } from "react-icons/md";

// Constants (relative path from sections/)
import { channelOptions, filterPanelConfig } from "../../../constants/filterConstants";
// Styled components (relative path from sections/)
import {
  FilterSectionPaper,
  FilterHeaderBox,
  FilterIconBox,
  FilterTitle,
  FilterDescription,
  FilterContentBox,
  StyledFormControl,
} from "../../../styles/FilterStyledComponents";

/**
 * Channel Filter Section Component
 * Handles communication channel multi-selection
 */
const ChannelFilterSection = ({ draftFilters, selectionHelpers }) => {
  const { handleChannelChange } = selectionHelpers;

  return (
    <Grid xs={12} md={6} lg={4}>
      <FilterSectionPaper elevation={3}>
        <Stack spacing={{ xs: 2, sm: 2.5 }} sx={{ height: "100%" }}>
          {/* Header with enhanced mobile layout */}
          <FilterHeaderBox>
            <FilterIconBox>
              <MdSignalCellularAlt style={{ fontSize: 20, color: "white" }} />
            </FilterIconBox>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <FilterTitle variant="subtitle1">ช่องทางการติดต่อ (CHANNEL)</FilterTitle>
              <FilterDescription variant="caption">
                เลือกช่องทางการติดต่อที่ต้องการกรองข้อมูล
              </FilterDescription>
            </Box>
          </FilterHeaderBox>

          {/* Channel Selection with improved mobile UX */}
          <FilterContentBox>
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

              <Select
                multiple
                value={draftFilters.channel}
                onChange={handleChannelChange}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return (
                      <Typography sx={{ color: "text.secondary" }}>
                        เลือกช่องทางการติดต่อ
                      </Typography>
                    );
                  }
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const channel = channelOptions.find((c) => c.value === value);
                        const ChannelIcon = channel?.icon;
                        return (
                          <Chip
                            key={value}
                            icon={
                              ChannelIcon ? (
                                <ChannelIcon style={{ fontSize: "0.8rem" }} />
                              ) : undefined
                            }
                            label={channel?.label}
                            size="small"
                            sx={{
                              bgcolor: channel?.color || "rgba(148, 12, 12, 0.1)",
                              color: "white",
                              fontWeight: 600,
                              borderRadius: "6px",
                              height: "24px",
                              fontSize: "0.75rem",
                              "& .MuiChip-icon": {
                                color: "white",
                                fontSize: "0.8rem",
                              },
                            }}
                          />
                        );
                      })}
                    </Box>
                  );
                }}
                displayEmpty
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 48 * 4.5 + 8,
                      width: 280,
                      borderRadius: 12,
                      marginTop: 8,
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                    },
                  },
                  MenuListProps: {
                    sx: {
                      padding: 1,
                    },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    border: "1px solid rgba(148, 12, 12, 0.3)",
                    minHeight: "48px",
                    fontFamily: "'Kanit', sans-serif",
                    "&:hover": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(148, 12, 12, 0.5)",
                      },
                    },
                    "&.Mui-focused": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#940c0c",
                        borderWidth: "2px",
                      },
                    },
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                  "& .MuiSelect-select": {
                    padding: "10px 16px",
                    fontSize: "14px",
                  },
                }}
              >
                {channelOptions.map((channel) => {
                  const ChannelIcon = channel.icon;
                  return (
                    <MenuItem
                      key={channel.value}
                      value={channel.value}
                      sx={{
                        borderRadius: 1.5,
                        margin: "2px 0",
                        minHeight: "44px",
                        padding: "8px 12px",
                        "&:hover": {
                          bgcolor: "rgba(148, 12, 12, 0.08)",
                        },
                        "&.Mui-selected": {
                          bgcolor: "rgba(148, 12, 12, 0.12)",
                          "&:hover": {
                            bgcolor: "rgba(148, 12, 12, 0.15)",
                          },
                        },
                      }}
                    >
                      <Checkbox
                        checked={draftFilters.channel.indexOf(channel.value) > -1}
                        size="small"
                        sx={{
                          color: "rgba(148, 12, 12, 0.6)",
                          "&.Mui-checked": {
                            color: "#940c0c",
                          },
                          marginRight: 1,
                        }}
                      />
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                        <ChannelIcon
                          style={{
                            fontSize: "16px",
                            color:
                              draftFilters.channel.indexOf(channel.value) > -1
                                ? "#940c0c"
                                : "text.secondary",
                          }}
                        />
                        <ListItemText
                          primary={channel.label}
                          sx={{
                            "& .MuiTypography-root": {
                              fontFamily: "'Kanit', sans-serif",
                              fontSize: "14px",
                              fontWeight:
                                draftFilters.channel.indexOf(channel.value) > -1 ? 600 : 400,
                              color:
                                draftFilters.channel.indexOf(channel.value) > -1
                                  ? "#940c0c"
                                  : "text.primary",
                            },
                          }}
                        />
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>

              {/* Selected channels display with improved design */}
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
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.8,
                    }}
                  >
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
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            "&:hover": {
                              transform: "scale(1.05)",
                              boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
                            },
                            "& .MuiChip-icon": {
                              color: "white",
                              fontSize: "0.9rem",
                            },
                            "& .MuiChip-label": {
                              px: 1,
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </StyledFormControl>
          </FilterContentBox>

          {/* Quick guide for channel selection */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "rgba(0, 0, 0, 0.02)",
              border: "1px solid rgba(0, 0, 0, 0.05)",
              mt: "auto", // Push to bottom in flex container
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
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
                      transition: "all 0.2s ease",
                    }}
                  >
                    <ChannelIcon style={{ fontSize: "0.8rem" }} />
                    <span>{channel.label}</span>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Status Display with enhanced design */}
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
              transition: "all 0.2s ease",
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
        </Stack>
      </FilterSectionPaper>
    </Grid>
  );
};

export default ChannelFilterSection;
