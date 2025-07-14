import React from 'react';
import { Grid2 as Grid, Card, CardHeader, CardContent, Skeleton, Box } from '@mui/material';

const WorksheetCardSkeleton = () => (
  <Card className="worksheet-card" style={{ padding: 0 }}>
    <CardHeader 
      style={{ paddingBottom: 5 }} 
      title={
        <Box>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="80%" height={28} />
          <Skeleton variant="text" width="70%" height={20} />
        </Box>
      } 
    />
    <CardContent style={{ paddingBlock: 0, paddingInline: 5 }}>
      {/* Image skeleton */}
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1 }} />
      </Box>
      
      {/* Due Date */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Skeleton variant="text" width="40%" height={24} />
        <Skeleton variant="text" width="35%" height={24} />
      </Box>
      
      {/* Ex Date */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Skeleton variant="text" width="35%" height={24} />
        <Skeleton variant="text" width="40%" height={24} />
      </Box>
      
      {/* Quantity */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Skeleton variant="text" width="40%" height={24} />
        <Skeleton variant="text" width="25%" height={24} />
      </Box>
      
      {/* Status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Skeleton variant="text" width="30%" height={24} />
        <Skeleton variant="text" width="45%" height={24} />
      </Box>
      
      {/* Order button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Skeleton variant="text" width="30%" height={24} />
        <Skeleton variant="circular" width={24} height={24} />
      </Box>
      
      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Skeleton variant="rectangular" width="48%" height={32} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="48%" height={32} sx={{ borderRadius: 1 }} />
      </Box>
    </CardContent>
  </Card>
);

const WorksheetListSkeleton = ({ count = 10 }) => {
  return (
    <Grid container spacing={3} marginTop={1} marginBottom={4} columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid key={`skeleton-${index}`} size={1}>
          <WorksheetCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
};

export default WorksheetListSkeleton;
