import React from "react";
import { Grid2 as Grid, Box, Stack } from "@mui/material";
import {
  FilterSectionPaper,
  FilterHeaderBox,
  FilterIconBox,
  FilterTitle,
  FilterDescription,
  FilterContentBox,
} from "../../../styles/FilterStyledComponents";

/**
 * FilterSectionFrame - โครงสร้างมาตรฐานของ Filter Card
 * ลด Boilerplate ที่ซ้ำกันในทุก Filter Section
 *
 * @param {React.ReactNode} icon - Icon component
 * @param {string} title - Section title
 * @param {string} description - Section description
 * @param {React.ReactNode} children - Content inside the section
 */
export const FilterSectionFrame = ({ icon, title, description, children }) => {
  return (
    <Grid xs={12} md={6} lg={4}>
      <FilterSectionPaper elevation={3}>
        <Stack spacing={{ xs: 2, sm: 2.5 }} sx={{ height: "100%" }}>
          {/* Header */}
          <FilterHeaderBox>
            <FilterIconBox>{icon}</FilterIconBox>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <FilterTitle variant="subtitle1">{title}</FilterTitle>
              <FilterDescription variant="caption">{description}</FilterDescription>
            </Box>
          </FilterHeaderBox>

          {/* Content */}
          <FilterContentBox sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </FilterContentBox>
        </Stack>
      </FilterSectionPaper>
    </Grid>
  );
};

export default FilterSectionFrame;
