import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Skeleton,
} from '@mui/material';

const LoadingState = ({ itemCount = 6 }) => {
    return (
        <Grid container spacing={3}>
            {[...Array(itemCount)].map((_, index) => (
                <Grid item xs={12} sm={6} lg={4} key={index}>
                    <Card>
                        <CardContent>
                            <Skeleton variant="text" width="60%" height={32} />
                            <Skeleton variant="text" width="80%" />
                            <Skeleton variant="text" width="40%" />
                            <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default LoadingState;
