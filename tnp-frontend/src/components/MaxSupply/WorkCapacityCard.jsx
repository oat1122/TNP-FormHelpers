import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Factory,
} from '@mui/icons-material';
import ProductionTypeCapacityCard from './ProductionTypeCapacityCard';
import CapacitySummary from './CapacitySummary';

const WorkCapacityCard = ({ statistics }) => {
  const theme = useTheme();
  
  const workCalc = statistics?.work_calculations;
  
  if (!workCalc) {
    return null;
  }

  const productionTypes = [
    { 
      key: 'dtf', 
      label: 'DTF', 
      icon: '📱', 
      color: theme.palette.info.main,
      bgColor: theme.palette.info.light + '20',
    },
    { 
      key: 'screen', 
      label: 'Screen', 
      icon: '📺', 
      color: theme.palette.primary.main,
      bgColor: theme.palette.primary.light + '20',
    },
    { 
      key: 'sublimation', 
      label: 'Sublimation', 
      icon: '⚽', 
      color: theme.palette.success.main,
      bgColor: theme.palette.success.light + '20',
    },
    { 
      key: 'embroidery', 
      label: 'Embroidery', 
      icon: '🧵', 
      color: theme.palette.warning.main,
      bgColor: theme.palette.warning.light + '20',
    },
  ];

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Factory sx={{ color: theme.palette.primary.main, mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            กำลังการผลิตและการใช้งาน
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {productionTypes.map((type) => (
            <Grid item xs={12} md={6} key={type.key}>
              <ProductionTypeCapacityCard
                type={type}
                workCalc={workCalc}
              />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Debug Information (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Debug Info (Development Only):
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Raw work_calculations data: {JSON.stringify(workCalc, null, 2)}
            </Typography>
          </Box>
        )}

        {/* Summary */}
        <CapacitySummary workCalc={workCalc} />
      </CardContent>
    </Card>
  );
};

export default WorkCapacityCard;