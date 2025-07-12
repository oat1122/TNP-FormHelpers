import React, { useEffect } from 'react';
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
import TimePeriodSelector from './TimePeriodSelector';
import useProductionCapacityCalculation from '../../hooks/useProductionCapacityCalculation';

const WorkCapacityCard = ({ 
  statistics, 
  allData = [], 
  selectedTimePeriod: externalSelectedTimePeriod,
  setSelectedTimePeriod: externalSetSelectedTimePeriod 
}) => {
  const theme = useTheme();
  
  // Use the new production capacity calculation hook
  const {
    selectedTimePeriod: internalSelectedTimePeriod,
    setSelectedTimePeriod: internalSetSelectedTimePeriod,
    calculationResult,
    getCapacityDisplayLabel,
  } = useProductionCapacityCalculation(allData, externalSelectedTimePeriod);
  
  // Use external state if provided, otherwise use internal state
  const selectedTimePeriod = externalSelectedTimePeriod || internalSelectedTimePeriod;
  const setSelectedTimePeriod = externalSetSelectedTimePeriod || internalSetSelectedTimePeriod;
  
  // Sync internal state with external state
  useEffect(() => {
    if (externalSelectedTimePeriod && externalSelectedTimePeriod !== internalSelectedTimePeriod) {
      internalSetSelectedTimePeriod(externalSelectedTimePeriod);
    }
  }, [externalSelectedTimePeriod, internalSelectedTimePeriod, internalSetSelectedTimePeriod]);
  
  const workCalc = calculationResult?.work_calculations || statistics?.work_calculations;
  
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
                 <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
           <Box display="flex" alignItems="center">
             <Factory sx={{ color: theme.palette.primary.main, mr: 1 }} />
             <Box>
               <Typography variant="h6" fontWeight="bold">
                 กำลังการผลิตและการใช้งาน
               </Typography>
               {externalSelectedTimePeriod && (
                 <Typography variant="caption" color="text.secondary">
                   ควบคุมช่วงเวลาโดย Production Types ด้านบน
                 </Typography>
               )}
             </Box>
           </Box>
           {!externalSelectedTimePeriod && (
             <TimePeriodSelector
               value={selectedTimePeriod}
               onChange={setSelectedTimePeriod}
             />
           )}
         </Box>

        <Grid container spacing={2}>
          {productionTypes.map((type) => (
            <Grid item xs={12} md={6} key={type.key}>
              <ProductionTypeCapacityCard
                type={type}
                workCalc={workCalc}
                timePeriod={selectedTimePeriod}
                periodLabel={getCapacityDisplayLabel(selectedTimePeriod)}
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
               Selected period: {selectedTimePeriod} ({getCapacityDisplayLabel(selectedTimePeriod)}) {externalSelectedTimePeriod ? '(External)' : '(Internal)'}
             </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Items in period: {calculationResult?.total_items || 0}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Period days: {calculationResult?.work_calculations?.capacity?.period_days || 1}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Raw work_calculations data: {JSON.stringify(workCalc, null, 2)}
            </Typography>
          </Box>
        )}

        {/* Summary */}
        <CapacitySummary workCalc={workCalc} timePeriod={selectedTimePeriod} periodLabel={getCapacityDisplayLabel(selectedTimePeriod)} />
      </CardContent>
    </Card>
  );
};

export default WorkCapacityCard;