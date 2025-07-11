import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

const ProductionTypeLegend = ({ statistics }) => {
  const productionTypes = [
    {
      key: 'screen',
      label: 'Screen Printing',
      icon: '📺',
      color: '#0ea5e9',
      count: statistics?.work_calculations?.job_count?.screen || 0,
    },
    {
      key: 'dtf',
      label: 'DTF',
      icon: '📱',
      color: '#f59e0b',
      count: statistics?.work_calculations?.job_count?.dtf || 0,
    },
    {
      key: 'sublimation',
      label: 'Sublimation',
      icon: '⚽',
      color: '#8b5cf6',
      count: statistics?.work_calculations?.job_count?.sublimation || 0,
    },
    {
      key: 'embroidery',
      label: 'Embroidery',
      icon: '🧵',
      color: '#10b981',
      count: statistics?.work_calculations?.job_count?.embroidery || 0,
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        p: 2,
        bgcolor: '#f9fafb',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mr: 1 }}>
        ประเภทงาน:
      </Typography>
      {productionTypes.map((type) => (
        <Chip
          key={type.key}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span>{type.icon}</span>
              <span>{type.label}</span>
              <span style={{ 
                backgroundColor: 'rgba(255,255,255,0.3)', 
                borderRadius: 8, 
                padding: '2px 6px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                {type.count}
              </span>
            </Box>
          }
          size="small"
          sx={{
            bgcolor: type.color,
            color: 'white',
            fontWeight: 500,
            '&:hover': {
              bgcolor: type.color,
              opacity: 0.9,
            },
          }}
        />
      ))}
    </Box>
  );
};

export default ProductionTypeLegend;
