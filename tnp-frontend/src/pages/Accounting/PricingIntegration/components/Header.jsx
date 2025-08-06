import React from 'react';
import {
    Box,
    Container,
    Typography,
} from '@mui/material';

const Header = () => {
    return (
        <Box sx={{
            bgcolor: 'primary.main',
            color: 'white',
            py: 3,
            background: 'linear-gradient(135deg, #900F0F 0%, #B20000 100%)',
        }}>
            <Container maxWidth="xl">
                <Typography variant="h4" component="h1" gutterBottom>
                    📊 งานใหม่จากระบบ Pricing
                </Typography>
                <Typography variant="subtitle1">
                    เลือกงานที่เสร็จสมบูรณ์แล้วเพื่อสร้างใบเสนอราคา
                </Typography>
            </Container>
        </Box>
    );
};

export default Header;
