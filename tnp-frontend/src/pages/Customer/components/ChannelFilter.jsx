import React from "react";
import {
  Grid,
  Paper,
  Stack,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  InputAdornment,
  MenuItem,
  Checkbox,
  Chip,
  ListItemText,
} from "@mui/material";
import { MdSignalCellularAlt } from "react-icons/md";

function ChannelFilter({ draftFilters, channelOptions, handleChannelChange }) {
  return (
    <Grid xs={12} md={6} lg={4}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          height: "100%",
          backgroundColor: "white",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)",
          "&:hover": {
            boxShadow: "0 8px 20px rgba(148, 12, 12, 0.15)",
            transform: "translateY(-3px)",
          },
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(148, 12, 12, 0.1)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            height: "5px",
            width: "100%",
            background: "linear-gradient(90deg, #b71c1c 0%, #940c0c 100%)",
          },
        }}
      >
        <Stack spacing={2.5} sx={{ height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #b71c1c 0%, #940c0c 100%)",
                borderRadius: "50%",
                p: 1.2,
                boxShadow: "0 3px 8px rgba(148, 12, 12, 0.3)",
              }}
            >
              <MdSignalCellularAlt style={{ fontSize: 20, color: "white" }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#940c0c",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "1.05rem",
                }}
              >
                ช่องทางการติดต่อ (CHANNEL)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                เลือกช่องทางการติดต่อที่ต้องการกรองข้อมูล
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(148, 12, 12, 0.04)",
              border: "1px solid rgba(148, 12, 12, 0.15)",
              backdropFilter: "blur(8px)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <FormControl fullWidth size="medium">
              <InputLabel sx={{ color: "text.secondary", "&.Mui-focused": { color: "#940c0c" } }}>
                {draftFilters.channel.length > 0
                  ? `เลือกแล้ว ${draftFilters.channel.length} ช่องทาง`
                  : "เลือกช่องทางการติดต่อ"}
              </InputLabel>
              <Select
                multiple
                value={draftFilters.channel}
                onChange={handleChannelChange}
                input={
                  <OutlinedInput
                    label={`เลือกแล้ว ${draftFilters.channel.length} ช่องทาง`}
                    sx={{
                      borderRadius: 1.5,
                      height: 48,
                      "&.Mui-focused": { boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#940c0c",
                        borderWidth: "1.5px",
                      },
                    }}
                  />
                }
                startAdornment={
                  <InputAdornment position="start">
                    <MdSignalCellularAlt style={{ color: "#940c0c" }} />
                  </InputAdornment>
                }
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                    {selected.map((value) => {
                      const channel = channelOptions.find((c) => c.value === value);
                      return (
                        <Chip
                          key={value}
                          icon={channel?.icon}
                          label={channel?.label}
                          size="small"
                          sx={{
                            bgcolor: channel?.color,
                            color: "white",
                            fontWeight: 600,
                            borderRadius: "8px",
                            height: "26px",
                            "& .MuiChip-icon": { color: "white" },
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
                MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
              >
                {channelOptions.map((channel) => (
                  <MenuItem key={channel.value} value={channel.value}>
                    <Checkbox
                      checked={draftFilters.channel.indexOf(channel.value) > -1}
                      sx={{ "&.Mui-checked": { color: "#940c0c" } }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          mr: 1.5,
                          p: 0.8,
                          borderRadius: "50%",
                          bgcolor: channel.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        {channel.icon}
                      </Box>
                      <ListItemText
                        primary={channel.label}
                        primaryTypographyProps={{
                          fontWeight:
                            draftFilters.channel.indexOf(channel.value) > -1 ? 600 : 400,
                        }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
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
              <Typography variant="caption" sx={{ color: "#940c0c", fontWeight: 600 }}>
                เลือกช่องทางแล้ว: {draftFilters.channel.length} ช่องทาง
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Grid>
  );
}

export default ChannelFilter;
