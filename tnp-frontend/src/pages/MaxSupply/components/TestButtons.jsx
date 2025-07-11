import React from 'react';
import { Button, Box } from '@mui/material';

const TestButtons = ({ statistics }) => {
  const handleTestCalculation = () => {
    // Simple inline test calculation
    const testData = {
      screen: { total_work: 60 },
      dtf: { total_work: 120 }
    };
    
    const screenUtilization = Math.round((testData.screen.total_work / 3000) * 100);
    const dtfUtilization = Math.round((testData.dtf.total_work / 2500) * 100);
    const screenRemaining = 3000 - testData.screen.total_work;
    const dtfRemaining = 2500 - testData.dtf.total_work;
    
    console.log('=== Inline Test Calculation Results ===');
    console.log('Screen - Current Workload:', testData.screen.total_work);
    console.log('Screen - Utilization:', screenUtilization + '%');
    console.log('Screen - Remaining Daily:', screenRemaining);
    console.log('DTF - Current Workload:', testData.dtf.total_work);
    console.log('DTF - Utilization:', dtfUtilization + '%');
    console.log('DTF - Remaining Daily:', dtfRemaining);
    console.log('===============================');
    
    // Also check the current statistics state
    console.log('Current statistics from hook:', statistics);
    
    // Show results in an alert for easy viewing
    alert(`Calculation Test Results:
    
Screen Printing:
- Current Workload: ${testData.screen.total_work} งาน
- Utilization: ${screenUtilization}%
- Remaining Daily: ${screenRemaining} งาน

DTF:
- Current Workload: ${testData.dtf.total_work} งาน
- Utilization: ${dtfUtilization}%
- Remaining Daily: ${dtfRemaining} งาน

Current Hook Statistics:
- Screen Workload: ${statistics?.work_calculations?.current_workload?.screen || 0}
- DTF Workload: ${statistics?.work_calculations?.current_workload?.dtf || 0}
- Screen Utilization: ${statistics?.work_calculations?.utilization?.screen || 0}%
- DTF Utilization: ${statistics?.work_calculations?.utilization?.dtf || 0}%`);
  };

  const handleTestWithSampleData = () => {
    // Create sample data and force recalculation
    const sampleData = [
      {
        id: 'manual-test-1',
        title: 'Manual Test Job 1',
        status: 'in_progress',
        production_type: 'screen',
        work_calculations: {
          "screen": {
            "points": 1,
            "total_quantity": 60,
            "total_work": 60,
            "description": "Screen Printing 1 จุด เสื้อทั้งหมด 60 ตัว (1×60=60) งาน Screen Printing มีงาน 60"
          }
        }
      },
      {
        id: 'manual-test-2',
        title: 'Manual Test Job 2',
        status: 'in_progress',
        production_type: 'dtf',
        work_calculations: {
          "dtf": {
            "points": 2,
            "total_quantity": 60,
            "total_work": 120,
            "description": "DTF (Direct Film Transfer) 2 จุด เสื้อทั้งหมด 60 ตัว (2×60=120) งาน DTF มีงาน 120"
          }
        }
      }
    ];

    console.log('Manually setting sample data:', sampleData);
    
    // This would simulate receiving data with work_calculations
    // In practice, this should come from the API
    alert('Sample data with work_calculations set in console. Check the logs and refresh the page to see if the API includes this data.');
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Button 
        variant="outlined" 
        color="secondary" 
        onClick={handleTestCalculation}
        size="small"
        sx={{ mr: 1 }}
      >
        Test Calculation Logic
      </Button>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleTestWithSampleData}
        size="small"
      >
        Force Sample Data
      </Button>
    </Box>
  );
};

export default TestButtons; 