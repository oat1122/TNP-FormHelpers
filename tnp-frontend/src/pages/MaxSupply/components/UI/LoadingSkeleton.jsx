import React from "react";
import { Grid, Card, CardContent, CardActions, Box, Skeleton } from "@mui/material";

const LoadingSkeleton = () => (
  <Grid container spacing={2}>
    {[...Array(6)].map((_, index) => (
      <Grid item xs={12} key={index}>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" height={32} />
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="30%" height={20} />
              </Box>
              <Skeleton variant="rounded" width={80} height={28} />
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <Skeleton variant="rounded" width={100} height={28} />
              <Skeleton variant="rounded" width={120} height={28} />
            </Box>
            <Skeleton variant="rectangular" width="100%" height={6} sx={{ mb: 1 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="65%" />
              <Skeleton variant="text" width="60%" />
            </Box>
          </CardContent>
          <CardActions>
            <Skeleton variant="rounded" width={80} height={32} />
            <Skeleton variant="rounded" width={60} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </CardActions>
        </Card>
      </Grid>
    ))}
  </Grid>
);

export default LoadingSkeleton;
