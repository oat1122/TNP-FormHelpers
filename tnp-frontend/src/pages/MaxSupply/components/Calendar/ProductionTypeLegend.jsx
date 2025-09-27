import React, { useMemo } from "react";
import { Box, Paper, Typography, Button, Chip, Badge, useTheme } from "@mui/material";
import { productionTypeConfig } from "../../utils/constants";
import ProductionTypeIcon from "../ProductionTypeIcon";

const ProductionTypeLegend = ({ maxSupplies, filteredEvents, filter, setFilter }) => {
  const theme = useTheme();

  const typeCounts = useMemo(() => {
    const counts = { screen: 0, dtf: 0, sublimation: 0, embroidery: 0 };
    maxSupplies.forEach((job) => {
      if (counts.hasOwnProperty(job.production_type)) {
        counts[job.production_type]++;
      }
    });
    return counts;
  }, [maxSupplies]);

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary" }}>
          ประเภทงานผลิต • รวม {filteredEvents.length} จาก {maxSupplies.length} งาน
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant={filter.type === "all" && filter.status === "all" ? "contained" : "outlined"}
            onClick={() => setFilter({ type: "all", status: "all" })}
            sx={{ fontSize: "0.75rem", height: 28 }}
          >
            ทั้งหมด
          </Button>
          <Button
            size="small"
            variant={filter.status === "in_progress" ? "contained" : "outlined"}
            onClick={() =>
              setFilter({
                ...filter,
                status: filter.status === "in_progress" ? "all" : "in_progress",
              })
            }
            sx={{
              fontSize: "0.75rem",
              height: 28,
              bgcolor: filter.status === "in_progress" ? "#B20000" : "transparent", // ใช้สีหลักของระบบ
              borderColor: filter.status === "in_progress" ? "#B20000" : "currentColor",
            }}
          >
            กำลังดำเนินการ
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {Object.entries(productionTypeConfig).map(([key, config]) => {
          const count = typeCounts[key] || 0;
          const isSelected = filter.type === key;
          return (
            <Chip
              key={key}
              clickable
              onClick={() => setFilter({ ...filter, type: isSelected ? "all" : key })}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ProductionTypeIcon
                    type={key}
                    size={16}
                    color={isSelected ? "white" : config.color}
                  />
                  <span>{config.label}</span>
                  <Badge
                    badgeContent={count}
                    color="primary"
                    sx={{
                      "& .MuiBadge-badge": {
                        bgcolor: "rgba(255,255,255,0.9)",
                        color: config.color,
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        minWidth: 18,
                        height: 18,
                      },
                    }}
                  />
                </Box>
              }
              sx={{
                background: isSelected ? config.gradient : `${config.color}20`,
                color: isSelected ? "white" : config.color,
                fontWeight: 500,
                fontSize: "0.875rem",
                height: 36,
                border: `1px solid ${config.color}`,
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: `0 4px 12px ${config.color}40`,
                  background: config.gradient,
                  color: "white",
                },
                transition: "all 0.2s ease",
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
};

export default ProductionTypeLegend;
