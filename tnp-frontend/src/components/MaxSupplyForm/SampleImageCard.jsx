import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
} from '@mui/material';
import {
  Image,
} from '@mui/icons-material';

const SampleImageCard = ({ sampleImage }) => {
  if (!sampleImage) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Image sx={{ mr: 1, verticalAlign: 'middle' }} />
          รูปตัวอย่างเสื้อ
        </Typography>
        <CardMedia
          component="img"
          height="200"
          image={sampleImage}
          alt="Sample shirt"
          sx={{ objectFit: 'contain', borderRadius: 1 }}
        />
      </CardContent>
    </Card>
  );
};

export default SampleImageCard; 