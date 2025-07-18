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
import { productionTypeConfig } from '../../pages/MaxSupply/utils/constants';

const WorkCapacityCard = ({ 
  statistics, 
  allData = [], 
  selectedTimePeriod: externalSelectedTimePeriod,
  setSelectedTimePeriod: externalSetSelectedTimePeriod 
}) => {
  const theme = useTheme();

  // Validate props to prevent objects being rendered in JSX
  if (typeof externalSelectedTimePeriod === 'object' && externalSelectedTimePeriod !== null) {
    console.warn('WorkCapacityCard: externalSelectedTimePeriod should be a string, not an object:', externalSelectedTimePeriod);
  }
  
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
    return (
      <Card elevation={2} sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Factory sx={{ color: theme.palette.primary.main, mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              กำลังการผลิตและการใช้งาน
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            ไม่มีข้อมูลการคำนวณกำลังการผลิต
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Safely ensure workCalc has all required properties
  const safeWorkCalc = {
    current_workload: workCalc.current_workload || {},
    capacity: workCalc.capacity || { total: {}, daily: {}, period_days: 1 },
    utilization: workCalc.utilization || {},
    remaining_capacity: workCalc.remaining_capacity || {},
    job_count: workCalc.job_count || {},
    ...workCalc
  };

  const productionTypes = [
    { 
      key: 'dtf', 
      label: 'DTF', 
      color: productionTypeConfig?.dtf?.color || '#1976d2',
      bgColor: productionTypeConfig?.dtf?.bgColor || '#e3f2fd',
    },
    { 
      key: 'screen', 
      label: 'Screen Printing', 
      color: productionTypeConfig?.screen?.color || '#388e3c',
      bgColor: productionTypeConfig?.screen?.bgColor || '#e8f5e8',
    },
    { 
      key: 'sublimation', 
      label: 'Sublimation', 
      color: productionTypeConfig?.sublimation?.color || '#f57c00',
      bgColor: productionTypeConfig?.sublimation?.bgColor || '#fff3e0',
    },
    { 
      key: 'embroidery', 
      label: 'Embroidery', 
      color: productionTypeConfig?.embroidery?.color || '#7b1fa2',
      bgColor: productionTypeConfig?.embroidery?.bgColor || '#f3e5f5',
    },
  ];
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        {(() => {
          try {
            return (
              <>
                <Box display="flex" alignItems="center" mb={2}>
                  <Factory sx={{ color: theme.palette.primary.main, mr: 1 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      กำลังการผลิตและการใช้งาน ({getCapacityDisplayLabel(selectedTimePeriod)})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      รายละเอียดการใช้กำลังผลิตแยกตามประเภท
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  {productionTypes.map((type) => (
                    <Grid item xs={12} md={6} key={type.key}>
                      <ProductionTypeCapacityCard
                        type={type}
                        workCalc={safeWorkCalc}
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
                      Selected period: {String(selectedTimePeriod)} ({String(getCapacityDisplayLabel(selectedTimePeriod))}) {externalSelectedTimePeriod ? '(External)' : '(Internal)'}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Items in period: {Number(calculationResult?.total_items || 0)}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Period days: {Number(calculationResult?.work_calculations?.capacity?.period_days || 1)}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Raw work_calculations data: {
                        (() => {
                          try {
                            return safeWorkCalc ? JSON.stringify(safeWorkCalc, null, 2) : 'null';
                          } catch (error) {
                            return `Error serializing: ${error.message}`;
                          }
                        })()
                      }
                    </Typography>
                  </Box>
                )}

                {/* Summary */}
                <CapacitySummary workCalc={safeWorkCalc} timePeriod={selectedTimePeriod} periodLabel={getCapacityDisplayLabel(selectedTimePeriod)} />
              </>
            );
          } catch (error) {
            console.error('Error rendering WorkCapacityCard:', error);
            return (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="error">
                  เกิดข้อผิดพลาดในการแสดงข้อมูลกำลังการผลิต
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Error: {error.message}
                </Typography>
              </Box>
            );
          }
        })()}
      </CardContent>
    </Card>
  );
};

export default WorkCapacityCard;